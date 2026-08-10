export { openArchive } from './archive/open-archive.js';
export { listInternalPages } from './archive/list-internal-pages.js';
export { listInternalResources } from './archive/list-internal-resources.js';
export { getPageHtml } from './archive/get-page-html.js';
export { getFrontmatter } from './archive/get-frontmatter.js';

export { downloadResources } from './downloader/download-resources.js';
export type {
	DownloadItem,
	DownloadResult,
	DownloadResourcesOptions,
} from './downloader/download-resources.js';
export { urlToOutputPath } from './downloader/url-to-output-path.js';

export { extractMainContent } from './html/extract-main-content.js';
export type {
	ExtractMainCriterion,
	ExtractMainResult,
} from './html/extract-main-content.js';
export { formatFrontmatter } from './html/format-frontmatter.js';
export { rewriteAssetRefs } from './html/rewrite-asset-refs.js';
export {
	ASSET_ATTRIBUTES,
	assetAttributesFor,
	parseSrcset,
	serializeSrcset,
} from './html/selectors.js';
export { splitTitle } from './html/split-title.js';
export type { TitlePair } from './html/split-title.js';

export { extractPages } from './page-extractor/extract-pages.js';
export type {
	ExtractPageItem,
	ExtractPageResult,
	ExtractPagesOptions,
} from './page-extractor/extract-pages.js';
export { assignPageIds } from './page-extractor/assign-page-ids.js';
export {
	buildPageIdLookup,
	rewritePageRefs,
} from './page-extractor/rewrite-page-refs.js';
export type {
	PageIdLookup,
	RewritePageRefsOptions,
} from './page-extractor/rewrite-page-refs.js';
export { resolveIdTemplate } from './page-extractor/resolve-id-template.js';
export type { ResolveIdTemplateOptions } from './page-extractor/resolve-id-template.js';

export { migrate } from './migrate.js';
export type { MigrateOptions, MigrateReport } from './migrate.js';

export type {
	ArchiveSession,
	AssetResolver,
	AssetResolverTagAttribute,
	Frontmatter,
	InternalPage,
	InternalResource,
	OgFrontmatter,
	TwitterFrontmatter,
} from './types.js';
