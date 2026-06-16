#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { migrate } from './migrate.js';

const USAGE = `Usage:
  dz-migrate <archive.nitpicker> -o <htdocs-dir> [--limit <n>]

Options:
  -o, --output <htdocs-dir>   Resource download destination. URL pathnames are mirrored verbatim.
  --limit <n>                 Concurrent download limit (default: 10).
  -h, --help                  Show this help message.
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
				limit: { type: 'string' },
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

	let downloadLimit: number | undefined;
	if (parsed.values.limit !== undefined) {
		// Reject decimals, trailing garbage ("10abc"), scientific notation,
		// and signs — parseInt is too lenient for CLI input.
		if (!/^\d+$/.test(parsed.values.limit)) {
			process.stderr.write(`Error: --limit must be a positive integer\n`);
			return 2;
		}
		downloadLimit = Number.parseInt(parsed.values.limit, 10);
		if (downloadLimit < 1) {
			process.stderr.write(`Error: --limit must be a positive integer\n`);
			return 2;
		}
	}

	const controller = new AbortController();
	const onSigint = () => controller.abort();
	process.on('SIGINT', onSigint);
	process.on('SIGTERM', onSigint);
	try {
		const report = await migrate({
			archivePath,
			outputDir,
			downloadLimit,
			signal: controller.signal,
			onResult: (event) => {
				if (event.outcome === 'failed') {
					process.stderr.write(`fail: ${event.url} — ${event.error.message}\n`);
				} else {
					process.stdout.write(`save: ${event.url}\n`);
				}
			},
		});

		const handled = report.saved + report.failed;
		const skipped = report.totalResources - handled;
		process.stdout.write(
			`\nDone. ${report.saved} saved, ${report.failed} failed, ${skipped} skipped (out of ${report.totalResources}).\n`,
		);
		if (skipped > 0 || controller.signal.aborted) {
			return 130;
		}
		return report.failed === 0 ? 0 : 1;
	} finally {
		process.off('SIGINT', onSigint);
		process.off('SIGTERM', onSigint);
	}
}

try {
	const code = await main(process.argv.slice(2));
	process.exit(code);
} catch (error) {
	process.stderr.write(`Fatal: ${(error as Error).stack ?? (error as Error).message}\n`);
	process.exit(3);
}
