import type { DownloadItem, DownloadResult } from './downloader/download-resources.js';

import { listInternalResources } from './archive/list-internal-resources.js';
import { openArchive } from './archive/open-archive.js';
import { downloadResources } from './downloader/download-resources.js';

export interface MigrateOptions {
	archivePath: string;
	outputDir: string;
	/** Maximum concurrent downloads. Defaults to 10. */
	downloadLimit?: number;
	/** Forwarded to {@link downloadResources}; useful for CLI progress logging. */
	onResult?: (event: DownloadResult) => void;
	/** Forwarded to the download loop. `@nitpicker/query` does not yet expose an abort hook for archive open. */
	signal?: AbortSignal;
}

export interface MigrateReport {
	totalResources: number;
	saved: number;
	failed: number;
}

/**
 * Reads every internal resource URL from the `.nitpicker` archive and downloads
 * the bodies into `outputDir`, mirroring the URL pathname structure. HTML
 * snapshots stay inside the archive — consumers fetch them on demand via the
 * archive-reader API.
 * @param options
 */
export async function migrate(options: MigrateOptions): Promise<MigrateReport> {
	const { archivePath, outputDir, downloadLimit, onResult, signal } = options;

	const session = await openArchive(archivePath);
	try {
		const items: DownloadItem[] = [];
		for await (const resource of listInternalResources(session)) {
			items.push({ url: resource.url, contentType: resource.contentType });
		}

		let saved = 0;
		let failed = 0;
		await downloadResources({
			items,
			outputDir,
			limit: downloadLimit,
			signal,
			onResult: (event) => {
				if (event.outcome === 'saved') {
					saved += 1;
				} else {
					failed += 1;
				}
				onResult?.(event);
			},
		});

		return { totalResources: items.length, saved, failed };
	} finally {
		await session.close();
	}
}
