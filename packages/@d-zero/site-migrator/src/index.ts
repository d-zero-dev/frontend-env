export { openArchive } from './archive/open-archive.js';
export { listInternalPages } from './archive/list-internal-pages.js';
export { listInternalResources } from './archive/list-internal-resources.js';
export { getPageHtml } from './archive/get-page-html.js';

export { downloadResources } from './downloader/download-resources.js';
export type {
	DownloadItem,
	DownloadResult,
	DownloadResourcesOptions,
} from './downloader/download-resources.js';
export { urlToOutputPath } from './downloader/url-to-output-path.js';

export { extractFrontmatter } from './html/extract-frontmatter.js';
export { extractMainContent } from './html/extract-main-content.js';
export type {
	ExtractMainCriterion,
	ExtractMainResult,
} from './html/extract-main-content.js';
export { rewriteAssetRefs } from './html/rewrite-asset-refs.js';
export {
	ASSET_ATTRIBUTES,
	assetAttributesFor,
	parseSrcset,
	serializeSrcset,
} from './html/selectors.js';

export { extractPages } from './page-extractor/extract-pages.js';
export type {
	ExtractPageItem,
	ExtractPageResult,
	ExtractPagesOptions,
} from './page-extractor/extract-pages.js';

export { migrate } from './migrate.js';
export type { MigrateOptions, MigrateReport } from './migrate.js';

export type {
	ArchiveSession,
	AssetResolver,
	Frontmatter,
	InternalPage,
	InternalResource,
	OgFrontmatter,
	TwitterFrontmatter,
} from './types.js';
