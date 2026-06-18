import type { ExtractMainCriterion } from '../html/extract-main-content.js';
import type { ArchiveSession } from '../types.js';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { deal } from '@d-zero/dealer';

import { getPageHtml } from '../archive/get-page-html.js';
import { urlToOutputPath } from '../downloader/url-to-output-path.js';
import { extractMainContent } from '../html/extract-main-content.js';

/**
 * Single page to extract. Wrapped as an object so `@d-zero/dealer` (which
 * requires `T extends WeakKey`) can track progress against it.
 */
export interface ExtractPageItem {
	url: string;
}

export interface ExtractPagesOptions {
	session: ArchiveSession;
	items: readonly ExtractPageItem[];
	outputDir: string;
	/** Maximum concurrent page extractions. Defaults to 10. */
	limit?: number;
	onResult?: (event: ExtractPageResult) => void;
	signal?: AbortSignal;
}

export type ExtractPageResult =
	| {
			url: string;
			outcome: 'extracted';
			outputPath: string;
			matchedBy: ExtractMainCriterion;
	  }
	| {
			url: string;
			outcome: 'fallback';
			outputPath: string;
	  }
	| {
			url: string;
			outcome: 'missing';
	  }
	| {
			url: string;
			outcome: 'failed';
			error: Error;
	  };

/**
 * For each page URL, reads the HTML snapshot from the archive, strips the
 * shared layout via {@link extractMainContent}, and writes the result to disk
 * under `outputDir` mirroring the URL pathname.
 *
 * Mirrors {@link import('../downloader/download-resources.js').downloadResources}
 * in shape: failures (including pages absent from the archive) are surfaced via
 * `onResult`, never thrown, so a single bad page does not abort the run.
 *
 * Output shapes intentionally differ by outcome:
 *
 * - `extracted` — the matched element's `outerHTML` fragment is written
 *   verbatim (no `<!doctype>` / `<html>` wrapper).
 * - `fallback` — the entire original document, including its DOCTYPE, is
 *   written as-is so downstream tooling never sees an empty file.
 * @param options
 */
export async function extractPages(options: ExtractPagesOptions): Promise<void> {
	const { session, items, outputDir, limit = 10, onResult, signal } = options;
	if (items.length === 0 || signal?.aborted) {
		// Short-circuit when the signal is already aborted (e.g. SIGINT during
		// the preceding download phase) so we don't litter outputDir with
		// pre-created directories for work that will never run.
		return;
	}

	interface PreparedPage {
		readonly url: string;
		readonly outputPath: string;
		readonly resolveError: Error | null;
	}
	// Resolve every page URL to a disk path. Detect intra-page outputPath
	// collisions (e.g. `/about/` and `/about/index.html` both map to
	// `about/index.html`): the first winner runs normally, every subsequent
	// duplicate is reported as `failed` so two workers never race writeFile()
	// against the same path.
	const seenPaths = new Set<string>();
	const prepared: PreparedPage[] = items.map((item) => {
		try {
			const outputPath = urlToOutputPath(item.url, outputDir, 'text/html');
			if (seenPaths.has(outputPath)) {
				return {
					url: item.url,
					outputPath: '',
					resolveError: new Error(
						`Duplicate output path for page URL: ${item.url} → ${outputPath}`,
					),
				};
			}
			seenPaths.add(outputPath);
			return { url: item.url, outputPath, resolveError: null };
		} catch (error) {
			return {
				url: item.url,
				outputPath: '',
				resolveError: error instanceof Error ? error : new Error(String(error)),
			};
		}
	});

	const directories = new Set<string>();
	for (const entry of prepared) {
		if (entry.resolveError === null) {
			directories.add(path.dirname(entry.outputPath));
		}
	}
	await Promise.all([...directories].map((dir) => mkdir(dir, { recursive: true })));

	await deal(
		prepared,
		(entry) => async () => {
			if (entry.resolveError !== null) {
				onResult?.({
					url: entry.url,
					outcome: 'failed',
					error: entry.resolveError,
				});
				return;
			}
			try {
				const html = await getPageHtml(session, entry.url);
				if (html === null) {
					onResult?.({ url: entry.url, outcome: 'missing' });
					return;
				}
				const result = extractMainContent(html);
				await writeFile(entry.outputPath, result.html, 'utf8');
				if (result.matched && result.matchedBy !== undefined) {
					onResult?.({
						url: entry.url,
						outcome: 'extracted',
						outputPath: entry.outputPath,
						matchedBy: result.matchedBy,
					});
				} else {
					onResult?.({
						url: entry.url,
						outcome: 'fallback',
						outputPath: entry.outputPath,
					});
				}
			} catch (error) {
				onResult?.({
					url: entry.url,
					outcome: 'failed',
					error: error instanceof Error ? error : new Error(String(error)),
				});
			}
		},
		{ limit, signal },
	);
}
