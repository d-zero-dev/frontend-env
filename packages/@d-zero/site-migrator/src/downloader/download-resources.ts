import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { deal } from '@d-zero/dealer';

import { urlToOutputPath } from './url-to-output-path.js';

/**
 * Single resource to download. Wrapped as an object because `@d-zero/dealer`
 * requires `T extends WeakKey` for its progress bookkeeping.
 */
export interface DownloadItem {
	url: string;
	contentType?: string | null;
}

export interface DownloadResourcesOptions {
	items: readonly DownloadItem[];
	outputDir: string;
	/** Maximum concurrent downloads. Defaults to 10. */
	limit?: number;
	/**
	 * Progress callback fired once per item with the outcome. Use this to surface
	 * per-URL status to the caller (CLI logs, test assertions). Not invoked for
	 * items that the dealer aborts mid-flight via `signal`.
	 */
	onResult?: (event: DownloadResult) => void;
	/** Optional abort signal forwarded to both fetch and dealer scheduling. */
	signal?: AbortSignal;
}

export type DownloadResult =
	| { url: string; outcome: 'saved'; outputPath: string }
	| { url: string; outcome: 'failed'; error: Error };

/**
 * Downloads every URL in `items` in parallel and writes the body to disk under
 * `outputDir`, mirroring the URL pathname (see {@link urlToOutputPath}).
 *
 * Failures are reported through `onResult` but do not throw — downloading 10k
 * resources should not abort because one URL returns 404. The caller decides
 * how to surface aggregated failures.
 * @param options
 */
export async function downloadResources(
	options: DownloadResourcesOptions,
): Promise<void> {
	const { items, outputDir, limit = 10, onResult, signal } = options;
	if (items.length === 0) {
		return;
	}

	// Pre-resolve the output path for every item and pre-create the unique
	// parent directories in parallel. A 10k-item archive typically shares ~10²
	// directories, so this turns 10k mkdir syscalls into ~10². Path-resolution
	// errors (e.g. URL escapes outputDir) are surfaced as a `failed` result
	// rather than aborting the whole run.
	interface PreparedItem {
		readonly url: string;
		readonly outputPath: string;
		readonly resolveError: Error | null;
	}
	const prepared: PreparedItem[] = items.map((item) => {
		try {
			return {
				url: item.url,
				outputPath: urlToOutputPath(item.url, outputDir, item.contentType),
				resolveError: null,
			};
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
				onResult?.({ url: entry.url, outcome: 'failed', error: entry.resolveError });
				return;
			}
			try {
				const body = await fetchBody(entry.url, signal);
				await writeFile(entry.outputPath, body);
				onResult?.({
					url: entry.url,
					outcome: 'saved',
					outputPath: entry.outputPath,
				});
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

/**
 *
 * @param url
 * @param signal
 */
async function fetchBody(url: string, signal?: AbortSignal): Promise<Uint8Array> {
	const response = await fetch(url, { signal });
	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText} — ${url}`);
	}
	const buffer = await response.arrayBuffer();
	return new Uint8Array(buffer);
}
