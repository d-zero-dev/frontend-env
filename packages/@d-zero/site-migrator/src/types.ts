import type { ArchiveAccessor } from '@nitpicker/crawler';

/**
 * Handle to an opened `.nitpicker` archive. The caller MUST call {@link ArchiveSession.close}
 * once the archive is no longer needed; otherwise the underlying tmpDir is left on disk.
 */
export interface ArchiveSession {
	readonly archiveId: string;
	readonly accessor: ArchiveAccessor;
	close(): Promise<void>;
}

/**
 * Single internal page entry yielded by {@link listInternalPages}. Only the URL is exposed
 * here because callers either fetch the HTML on demand via {@link getPageHtml} or look up
 * structured metadata via `@nitpicker/query` directly.
 */
export interface InternalPage {
	url: string;
}

/**
 * Single internal resource entry yielded by {@link listInternalResources}.
 */
export interface InternalResource {
	url: string;
	contentType: string | null;
}

/**
 * Structured frontmatter extracted from an HTML `<head>` section. See the package
 * README for the title-splitting rule and key naming conventions.
 */
export interface Frontmatter {
	title?: string;
	rawTitle?: string;
	description?: string;
	keywords?: string;
	og?: OgFrontmatter;
	twitter?: TwitterFrontmatter;
	canonical?: string;
	lang?: string;
	robots?: string;
	charset?: string;
}

export interface OgFrontmatter {
	title?: string;
	rawTitle?: string;
	description?: string;
	image?: string;
	url?: string;
	type?: string;
	siteName?: string;
}

export interface TwitterFrontmatter {
	card?: string;
	title?: string;
	rawTitle?: string;
	description?: string;
	image?: string;
	url?: string;
}

/**
 * Resolver callback used by {@link rewriteAssetRefs}. Return a replacement URL or `null`
 * to leave the attribute value as-is.
 */
export type AssetResolver = (
	url: string,
	attribute: string,
	tagName: string,
) => string | null;
