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
 * Single internal page entry yielded by `listInternalPages`. Only the URL is
 * exposed here because callers either fetch the HTML on demand via
 * `getPageHtml` or look up structured metadata via `@nitpicker/query`
 * directly.
 */
export interface InternalPage {
	url: string;
}

/**
 * Single internal resource entry yielded by `listInternalResources`.
 */
export interface InternalResource {
	url: string;
	contentType: string | null;
}

/**
 * Structured frontmatter sourced from the `.nitpicker` DB (per page row). See
 * the package README for the title-splitting rule and key naming conventions.
 * Fields are optional because empty / null DB columns are dropped at the
 * mapping layer (so the consumer never sees `description: ""`).
 */
export interface Frontmatter {
	/**
	 * Stable integer id assigned by `assignPageIds`. Emitted at the top of the
	 * YAML block so the downstream scaffold pipeline can route a `{{<id>}}`
	 * template token back to this page without parsing the rest of the meta.
	 */
	id?: number;
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

/**
 * Twitter Card fields. `url` is omitted because nitpicker DB does not store a
 * dedicated `twitter:url` column — sites that need a Twitter-specific URL
 * conventionally reuse `og:url`, so consumers should read `og.url` instead.
 */
export interface TwitterFrontmatter {
	card?: string;
	title?: string;
	rawTitle?: string;
	description?: string;
	image?: string;
}

/**
 * One `name`/`value` pair from the current start-tag, surfaced to
 * {@link AssetResolver} so resolvers can branch on other attributes (e.g. gate
 * `<link href>` on the `rel` attribute).
 */
export interface AssetResolverTagAttribute {
	readonly name: string;
	readonly value: string;
}

/**
 * Resolver callback used by `rewriteAssetRefs`. Return a replacement URL or
 * `null` to leave the attribute value as-is.
 *
 * `tagAttrs` is the start-tag's full attribute list (the rewriter forwards
 * parse5's tokens unchanged) so a resolver can read sibling attributes — e.g.
 * to gate `<link>` href rewriting on the `rel` attribute. Treat it as
 * read-only; mutations are not surfaced to the rewriter.
 */
export type AssetResolver = (
	url: string,
	attribute: string,
	tagName: string,
	tagAttrs: readonly AssetResolverTagAttribute[],
) => string | null;
