#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { migrate } from './migrate.js';

const USAGE = `Usage:
  dz-migrate <archive.nitpicker> -o <htdocs-dir> --content-class <name> [--layout-json <path>] [--limit <n>] [--extract-limit <n>]

Downloads sub-resources from the archive and, for each internal page, strips
the shared layout, assigns a stable integer id, prepends a YAML frontmatter
block (id + DB-sourced meta), converts the page's layout into BurgerEditor
blocks (data-bge-* markup embedded into the existing main element — see
--content-class), and rewrites same-origin URL references inside the body
(asset URLs → root-relative paths; <a href> / <form action> → the {{<id>}}
template token consumed by the downstream scaffold pipeline). Output files are
intermediate artifacts, not for direct browser rendering.

Options:
  -o, --output <htdocs-dir>      Output destination. URL pathnames are mirrored verbatim
                                 for both downloaded resources and extracted page HTML.
  --content-class <name>          Required. Class name added to each page's existing main
                                 element (matching BurgerEditor's editableArea selector for
                                 this project). No default — a wrong guess would silently
                                 produce output BurgerEditor cannot recognise.
  --layout-json <path>            Pre-generated anatomist layout analysis JSONL (one file for
                                 every URL). URLs absent from it fall back to live analysis.
  --limit <n>                    Concurrent resource download limit (default: 10).
  --extract-limit <n>            Concurrent page extraction limit (default: 10). Also shared
                                 by live layout analysis concurrency.
  -h, --help                     Show this help message.
`;

/**
 *
 * @param argv
 */
async function main(argv: readonly string[]): Promise<number> {
	let parsed;
	try {
		parsed = parseArgs({
			args: [...argv],
			allowPositionals: true,
			strict: true,
			options: {
				output: { type: 'string', short: 'o' },
				'content-class': { type: 'string' },
				'layout-json': { type: 'string' },
				limit: { type: 'string' },
				'extract-limit': { type: 'string' },
				help: { type: 'boolean', short: 'h', default: false },
			},
		});
	} catch (error) {
		process.stderr.write(`Error: ${(error as Error).message}\n\n${USAGE}`);
		return 2;
	}

	if (parsed.values.help) {
		process.stdout.write(USAGE);
		return 0;
	}

	const [archivePath, ...extra] = parsed.positionals;
	if (archivePath === undefined) {
		process.stderr.write(`Error: <archive.nitpicker> is required\n\n${USAGE}`);
		return 2;
	}
	if (extra.length > 0) {
		process.stderr.write(
			`Error: unexpected positional arguments: ${extra.join(' ')}\n\n${USAGE}`,
		);
		return 2;
	}

	const outputDir = parsed.values.output;
	if (outputDir === undefined) {
		process.stderr.write(`Error: --output is required\n\n${USAGE}`);
		return 2;
	}

	const contentClass = parsed.values['content-class'];
	if (contentClass === undefined) {
		process.stderr.write(`Error: --content-class is required\n\n${USAGE}`);
		return 2;
	}
	const layoutJsonPath = parsed.values['layout-json'];

	const downloadLimit = parsePositiveInt(parsed.values.limit, '--limit');
	if (downloadLimit instanceof Error) {
		process.stderr.write(`Error: ${downloadLimit.message}\n`);
		return 2;
	}
	const extractLimit = parsePositiveInt(
		parsed.values['extract-limit'],
		'--extract-limit',
	);
	if (extractLimit instanceof Error) {
		process.stderr.write(`Error: ${extractLimit.message}\n`);
		return 2;
	}

	const controller = new AbortController();
	const onSigint = () => controller.abort();
	process.on('SIGINT', onSigint);
	process.on('SIGTERM', onSigint);
	try {
		const report = await migrate({
			archivePath,
			outputDir,
			contentClass,
			layoutJsonPath,
			downloadLimit,
			extractLimit,
			signal: controller.signal,
			onResource: (event) => {
				if (event.outcome === 'failed') {
					process.stderr.write(`fail: ${event.url} — ${event.error.message}\n`);
				} else {
					process.stdout.write(`save: ${event.url}\n`);
				}
			},
			onPage: (event) => {
				switch (event.outcome) {
					case 'extracted': {
						const blockNote =
							event.blockConversion === 'fallback'
								? `fallback — ${event.blockConversionError?.message ?? 'unknown error'}`
								: event.blockConversion;
						process.stdout.write(
							`page: ${event.url} (${event.matchedBy}, blocks: ${blockNote})\n`,
						);
						break;
					}
					case 'fallback': {
						process.stdout.write(`page: ${event.url} (full document — no main found)\n`);
						break;
					}
					case 'missing': {
						process.stderr.write(`miss: ${event.url} — archive has no snapshot\n`);
						return;
					}
					case 'failed': {
						process.stderr.write(`fail: ${event.url} — ${event.error.message}\n`);
						return;
					}
				}
				// Soft-error warnings sit outside the outcome switch because they
				// can fire on both extracted and fallback events without changing
				// the success classification.
				if (event.rewriteError) {
					process.stderr.write(
						`warn: ${event.url} — rewrite failed, raw HTML kept: ${event.rewriteError.message}\n`,
					);
				}
				if (event.metaError) {
					process.stderr.write(
						`warn: ${event.url} — meta read failed, id-only frontmatter kept: ${event.metaError.message}\n`,
					);
				}
			},
		});

		const resourcesHandled = report.resourcesSaved + report.resourcesFailed;
		const resourcesSkipped = report.totalResources - resourcesHandled;
		const pagesHandled =
			report.pagesExtracted +
			report.pagesFallback +
			report.pagesMissing +
			report.pagesFailed;
		const pagesSkipped = report.totalPages - pagesHandled;
		process.stdout.write(
			`\nResources: ${report.resourcesSaved} saved, ${report.resourcesFailed} failed, ${resourcesSkipped} skipped (out of ${report.totalResources}).\n` +
				`Pages: ${report.pagesExtracted} extracted, ${report.pagesFallback} fallback, ${report.pagesMissing} missing, ${report.pagesFailed} failed, ${pagesSkipped} skipped (out of ${report.totalPages}).\n` +
				`Blocks: ${report.pagesBlockConverted} converted, ${report.pagesBlockPartial} partial, ${report.pagesBlockConversionFailed} fallback (out of ${report.pagesExtracted} extracted).\n` +
				`Soft errors (body still written): ${report.pagesRewriteFailed} rewrite, ${report.pagesMetaFailed} meta.\n`,
		);
		if (controller.signal.aborted || resourcesSkipped > 0 || pagesSkipped > 0) {
			return 130;
		}
		return report.resourcesFailed === 0 && report.pagesFailed === 0 ? 0 : 1;
	} finally {
		process.off('SIGINT', onSigint);
		process.off('SIGTERM', onSigint);
	}
}

/**
 *
 * @param raw
 * @param flag
 */
function parsePositiveInt(
	raw: string | undefined,
	flag: string,
): number | undefined | Error {
	if (raw === undefined) {
		return undefined;
	}
	// Reject decimals, trailing garbage ("10abc"), scientific notation,
	// and signs — parseInt is too lenient for CLI input.
	if (!/^\d+$/.test(raw)) {
		return new Error(`${flag} must be a positive integer`);
	}
	const value = Number.parseInt(raw, 10);
	if (value < 1) {
		return new Error(`${flag} must be a positive integer`);
	}
	return value;
}

try {
	const code = await main(process.argv.slice(2));
	process.exit(code);
} catch (error) {
	process.stderr.write(`Fatal: ${(error as Error).stack ?? (error as Error).message}\n`);
	process.exit(3);
}
