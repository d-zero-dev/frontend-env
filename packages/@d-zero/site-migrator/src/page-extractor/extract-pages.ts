import type { ExtractMainCriterion } from '../html/extract-main-content.js';
import type { ArchiveSession } from '../types.js';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { deal } from '@d-zero/dealer';

import { getFrontmatter } from '../archive/get-frontmatter.js';
import { getPageHtml } from '../archive/get-page-html.js';
import { urlToOutputPath } from '../downloader/url-to-output-path.js';
import { extractMainContent } from '../html/extract-main-content.js';
import { formatFrontmatter } from '../html/format-frontmatter.js';

import { assignPageIds } from './assign-page-ids.js';
import { buildPageIdLookup, rewritePageRefs } from './rewrite-page-refs.js';

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
			/**
			 * Present only when {@link rewritePageRefs} threw. The page body was
			 * still written (fail-soft), but with original asset / page references
			 * instead of the rewritten ones.
			 */
			rewriteError?: Error;
			/**
			 * Present only when {@link getFrontmatter} threw. The page body was
			 * still written and the id-only frontmatter still prepended, but the
			 * DB-sourced meta (title / description / og / …) is missing.
			 */
			metaError?: Error;
	  }
	| {
			url: string;
			outcome: 'fallback';
			outputPath: string;
			/** See `extracted.rewriteError`. */
			rewriteError?: Error;
			/** See `extracted.metaError`. */
			metaError?: Error;
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
 * shared layout via {@link extractMainContent}, reads the per-page metadata
 * from the `.nitpicker` DB via {@link getFrontmatter}, rewrites same-origin
 * URL references via {@link rewritePageRefs}, and writes the result to disk
 * under `outputDir` mirroring the URL pathname.
 *
 * Mirrors {@link import('../downloader/download-resources.js').downloadResources}
 * in shape: failures (including pages absent from the archive) are surfaced via
 * `onResult`, never thrown, so a single bad page does not abort the run.
 *
 * Output layout per file:
 *
 * - A `---\n…\n---\n` YAML frontmatter block is prepended. It always carries
 *   the page's integer `id` assigned by {@link assignPageIds}, plus any
 *   non-empty meta from the DB. The id is the only mandatory field.
 * - The body that follows depends on the outcome:
 *   - `extracted` — the matched element's `outerHTML` fragment.
 *   - `fallback` — the entire original document, DOCTYPE included.
 * - In both cases same-origin URLs are rewritten: `<a href>` / `<form action>`
 *   pointing at a known page → `{{<id>}}<query><fragment>`; other same-origin
 *   asset references → root-relative paths. Cross-origin URLs are left
 *   untouched.
 *
 * Rewrite failure is fail-soft: the original HTML body is written and
 * `rewriteError` is set on the result so the caller can log a warning without
 * losing the page.
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

	// Build the URL → id map up front from the full items list. Each page's id
	// stays stable even when only a subset of pages succeeds, because the map
	// is computed before any page worker runs. Build the pre-keyed lookup once
	// alongside it so per-page rewritePageRefs calls don't pay an O(N²)
	// rebuild.
	const pageIds = assignPageIds(items.map((item) => item.url));
	const pageIdLookup = buildPageIdLookup(pageIds);

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
				// Parallelise the two SQLite reads — they're independent and the
				// page worker is the loop hot-path. Use `allSettled` so a flaky
				// meta read doesn't lose the HTML body: we already paid the cost
				// of fetching the page, write what we have and surface the meta
				// failure separately rather than dropping the page.
				const [htmlSettled, metaSettled] = await Promise.allSettled([
					getPageHtml(session, entry.url),
					getFrontmatter(session, entry.url),
				]);
				if (htmlSettled.status === 'rejected') {
					throw htmlSettled.reason;
				}
				const html = htmlSettled.value;
				if (html === null) {
					onResult?.({ url: entry.url, outcome: 'missing' });
					return;
				}
				const extracted = extractMainContent(html);
				const id = pageIds.get(entry.url);

				let bodyHtml = extracted.html;
				let rewriteError: Error | undefined;
				try {
					bodyHtml = await rewritePageRefs({
						html: extracted.html,
						baseUrl: entry.url,
						pageIdLookup,
					});
				} catch (error) {
					rewriteError = error instanceof Error ? error : new Error(String(error));
				}

				const meta = metaSettled.status === 'fulfilled' ? metaSettled.value : null;
				const metaError =
					metaSettled.status === 'rejected'
						? metaSettled.reason instanceof Error
							? metaSettled.reason
							: new Error(String(metaSettled.reason))
						: undefined;
				// Spread `meta` first so the computed integer id always wins over a
				// stray `id` field the DB might one day surface — keeping the
				// frontmatter id consistent with the {{<id>}} tokens rewritePageRefs
				// emits on peer pages.
				const frontmatterMeta = id === undefined ? meta : { ...meta, id };
				// `frontmatterMeta === null` only happens when assignPageIds dropped
				// the URL (unparsable) AND getFrontmatter returned no row; the page
				// is still written body-only so downstream callers can decide what
				// to do with the orphan.
				const frontmatterBlock =
					frontmatterMeta === null ? '' : formatFrontmatter(frontmatterMeta);

				await writeFile(entry.outputPath, frontmatterBlock + bodyHtml, 'utf8');
				const softErrors: { rewriteError?: Error; metaError?: Error } = {};
				if (rewriteError) softErrors.rewriteError = rewriteError;
				if (metaError) softErrors.metaError = metaError;
				if (extracted.matched && extracted.matchedBy !== undefined) {
					onResult?.({
						url: entry.url,
						outcome: 'extracted',
						outputPath: entry.outputPath,
						matchedBy: extracted.matchedBy,
						...softErrors,
					});
				} else {
					onResult?.({
						url: entry.url,
						outcome: 'fallback',
						outputPath: entry.outputPath,
						...softErrors,
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
