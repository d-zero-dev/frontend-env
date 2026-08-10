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
	/**
	 * BurgerEditorの`editableArea`セレクタに対応させるクラス名。生成したブロック群を
	 * 埋め込む既存main要素自身の`classList`に追加する。移行先サイトのBurgerEditor設定に
	 * 依存する値であり、決め打ちのデフォルトを持たせると気づかれないまま不整合な出力を
	 * 生成しうるため必須（{@link import('./page-extractor/extract-pages.js').ExtractPagesOptions.contentClass}参照）。
	 */
	contentClass: string;
	/**
	 * 事前生成済みのanatomistレイアウト解析JSONL（1ファイルで全URL分）。
	 * {@link import('./page-extractor/extract-pages.js').extractPages}にそのまま転送される。
	 * 省略時は全ページをライブ解析する。
	 */
	layoutJsonPath?: string;
	/** Maximum concurrent downloads. Defaults to 10. */
	downloadLimit?: number;
	/** Maximum concurrent page extractions. Defaults to 10. */
	extractLimit?: number;
	/**
	 * Forwarded to both {@link downloadResources}（通常のリソースDL）と`extractPages`の
	 * block内`download-file`アイテムの追加DL。後者は`MigrateReport`の`totalResources`/
	 * `resourcesSaved`/`resourcesFailed`には含まれない（`totalResources`は中断時の
	 * skip検出に使う既知の総数であり、実行中に動的発見される追加DL分を混ぜると
	 * その計算が壊れるため）。ログ等での可視化のみこのコールバックで行う。
	 */
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
	/**
	 * Subset of `pagesExtracted` + `pagesFallback` whose `rewritePageRefs`
	 * threw. The body was still written; surfaced here so programmatic
	 * consumers can audit fail-soft rewrites without subscribing to `onPage`.
	 */
	pagesRewriteFailed: number;
	/**
	 * Subset of `pagesExtracted` + `pagesFallback` whose `getFrontmatter` read
	 * threw. The id-only frontmatter was still written; surfaced for the same
	 * reason as `pagesRewriteFailed`.
	 */
	pagesMetaFailed: number;
	/** Subset of `pagesExtracted` whose ブロック変換が全ブロック成功した（`blockConversion: 'converted'`）。 */
	pagesBlockConverted: number;
	/**
	 * Subset of `pagesExtracted` whose 一部ブロックのみ低信頼度でwysiwygフォールバックされたが
	 * 致命的ではなかった（`blockConversion: 'partial'`）。
	 */
	pagesBlockPartial: number;
	/**
	 * Subset of `pagesExtracted` whose 致命的エラーによりページ全体がプレーンHTML
	 * （`data-bge-*`マーカー無し）で出力された（`blockConversion: 'fallback'`）。
	 */
	pagesBlockConversionFailed: number;
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
		contentClass,
		layoutJsonPath,
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

		// `totalResources`/`resourcesSaved`/`resourcesFailed` cover only this
		// upfront, fully-enumerated pass — `resourcesSkipped` in the CLI is
		// derived as `totalResources - (resourcesSaved + resourcesFailed)`, so
		// `totalResources` must stay the fixed, known-upfront count for that
		// arithmetic to mean anything (e.g. after a SIGINT abort). The block
		// conversion pipeline's own `download-file` dedupe pass (see below)
		// discovers extra URLs *during* page extraction — those still reach
		// the caller's `onResource` for visibility, but are intentionally left
		// out of these three counters rather than corrupting the skip count.
		const totalResources = resourceItems.length;
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
		const knownResourceUrls = new Set(resourceItems.map((item) => item.url));
		let pagesExtracted = 0;
		let pagesFallback = 0;
		let pagesMissing = 0;
		let pagesFailed = 0;
		let pagesRewriteFailed = 0;
		let pagesMetaFailed = 0;
		let pagesBlockConverted = 0;
		let pagesBlockPartial = 0;
		let pagesBlockConversionFailed = 0;
		await extractPages({
			session,
			items: pageItems,
			outputDir,
			contentClass,
			layoutJsonPath,
			knownResourceUrls,
			limit: extractLimit,
			signal,
			onResource,
			onResult: (event) => {
				switch (event.outcome) {
					case 'extracted': {
						pagesExtracted += 1;
						switch (event.blockConversion) {
							case 'converted': {
								pagesBlockConverted += 1;
								break;
							}
							case 'partial': {
								pagesBlockPartial += 1;
								break;
							}
							case 'fallback': {
								pagesBlockConversionFailed += 1;
								break;
							}
						}
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
				if (
					(event.outcome === 'extracted' || event.outcome === 'fallback') &&
					event.rewriteError
				) {
					pagesRewriteFailed += 1;
				}
				if (
					(event.outcome === 'extracted' || event.outcome === 'fallback') &&
					event.metaError
				) {
					pagesMetaFailed += 1;
				}
				onPage?.(event);
			},
		});

		return {
			totalResources,
			resourcesSaved,
			resourcesFailed,
			totalPages: pageItems.length,
			pagesExtracted,
			pagesFallback,
			pagesMissing,
			pagesFailed,
			pagesRewriteFailed,
			pagesMetaFailed,
			pagesBlockConverted,
			pagesBlockPartial,
			pagesBlockConversionFailed,
		};
	} finally {
		await session.close();
	}
}
