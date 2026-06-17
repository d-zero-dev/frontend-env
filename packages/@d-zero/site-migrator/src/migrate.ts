import type { DownloadItem, DownloadResult } from './downloader/download-resources.js';
import type {
	ExtractPageItem,
	ExtractPageResult,
} from './page-extractor/extract-pages.js';

import { listInternalPages } from './archive/list-internal-pages.js';
import { listInternalResources } from './archive/list-internal-resources.js';
import { openArchive } from './archive/open-archive.js';
import { downloadResources } from './downloader/download-resources.js';
import { extractPages } from './page-extractor/extract-pages.js';

export interface MigrateOptions {
	archivePath: string;
	outputDir: string;
	/** Maximum concurrent downloads. Defaults to 10. */
	downloadLimit?: number;
	/** Maximum concurrent page extractions. Defaults to 10. */
	extractLimit?: number;
	/** Forwarded to {@link downloadResources}; useful for CLI progress logging. */
	onResource?: (event: DownloadResult) => void;
	/** Per-page extraction progress callback. */
	onPage?: (event: ExtractPageResult) => void;
	/** Forwarded to the download / extraction loops. */
	signal?: AbortSignal;
}

export interface MigrateReport {
	totalResources: number;
	resourcesSaved: number;
	resourcesFailed: number;
	totalPages: number;
	pagesExtracted: number;
	pagesFallback: number;
	pagesMissing: number;
	pagesFailed: number;
}

/**
 * Reads every internal page and resource URL from the `.nitpicker` archive.
 * Resources are downloaded over the network into `outputDir`, mirroring the
 * URL pathname structure. Pages are read from the archive snapshot, stripped
 * of their shared layout by {@link import('./html/extract-main-content.js').extractMainContent}, and written under the same
 * `outputDir` as `.html` files (URL pathnames are mirrored — `/about/` ⇒
 * `<outputDir>/about/index.html`).
 *
 * Failures in either pipeline are reported through the `onResource` /
 * `onPage` callbacks; they never throw, so one bad page or 404 does not
 * abort the whole migration.
 * @param options
 */
export async function migrate(options: MigrateOptions): Promise<MigrateReport> {
	const {
		archivePath,
		outputDir,
		downloadLimit,
		extractLimit,
		onResource,
		onPage,
		signal,
	} = options;

	const session = await openArchive(archivePath);
	try {
		const resourceItems: DownloadItem[] = [];
		for await (const resource of listInternalResources(session)) {
			resourceItems.push({ url: resource.url, contentType: resource.contentType });
		}

		const pageItems: ExtractPageItem[] = [];
		for await (const page of listInternalPages(session)) {
			pageItems.push({ url: page.url });
		}

		let resourcesSaved = 0;
		let resourcesFailed = 0;
		await downloadResources({
			items: resourceItems,
			outputDir,
			limit: downloadLimit,
			signal,
			onResult: (event) => {
				if (event.outcome === 'saved') {
					resourcesSaved += 1;
				} else {
					resourcesFailed += 1;
				}
				onResource?.(event);
			},
		});

		// Pages run AFTER resources by design: when a URL appears in both lists
		// (rare — typically a stand-alone `.html` referenced as a sub-resource),
		// the layout-stripped page output is the canonical version and should
		// win over the raw network body.
		let pagesExtracted = 0;
		let pagesFallback = 0;
		let pagesMissing = 0;
		let pagesFailed = 0;
		await extractPages({
			session,
			items: pageItems,
			outputDir,
			limit: extractLimit,
			signal,
			onResult: (event) => {
				switch (event.outcome) {
					case 'extracted': {
						pagesExtracted += 1;
						break;
					}
					case 'fallback': {
						pagesFallback += 1;
						break;
					}
					case 'missing': {
						pagesMissing += 1;
						break;
					}
					case 'failed': {
						pagesFailed += 1;
						break;
					}
				}
				onPage?.(event);
			},
		});

		return {
			totalResources: resourceItems.length,
			resourcesSaved,
			resourcesFailed,
			totalPages: pageItems.length,
			pagesExtracted,
			pagesFallback,
			pagesMissing,
			pagesFailed,
		};
	} finally {
		await session.close();
	}
}
