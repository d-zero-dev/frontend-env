import type { AssetResolver } from '../types.js';

import { rewriteAssetRefs } from '../html/rewrite-asset-refs.js';

/**
 * Tags whose URL attribute targets a page (not a sub-resource). Same-origin
 * URLs in these attributes are rewritten to the `{{<id>}}` template token so
 * the downstream scaffold pipeline can resolve the link through its page
 * registry instead of the migrator hard-coding a file path.
 *
 * `<link>` is conditional — `rel` decides whether the href targets a page
 * (`canonical`, `alternate`, `prev`, `next`) or an asset (`stylesheet`,
 * `icon`, …). See {@link isPageRef}.
 */
const PAGE_REF_TAGS: ReadonlySet<string> = new Set(['a', 'form', 'iframe', 'link']);

/**
 * `<link rel>` values that name a page reference rather than an asset.
 * Case-insensitive (the spec normalises tokens).
 */
const PAGE_REF_LINK_REL_TOKENS: ReadonlySet<string> = new Set([
	'canonical',
	'alternate',
	'prev',
	'next',
]);

/**
 * URL schemes the resolver refuses to touch — they either point outside the
 * site (`mailto:`, `tel:`, `sms:`) or are unsafe to interpolate into HTML
 * (`javascript:`, `data:`, `blob:`, `vbscript:`, `file:`).
 */
const SKIPPED_SCHEMES: ReadonlySet<string> = new Set([
	'mailto:',
	'tel:',
	'sms:',
	'javascript:',
	'data:',
	'blob:',
	'vbscript:',
	'file:',
]);

/**
 * Pre-computed lookup table for `rewritePageRefs`. Built once from a
 * `pageIds` map via {@link buildPageIdLookup}, then reused across every page
 * in a migration run — avoids re-parsing every URL on every call. Keys are
 * normalised (`origin + pathname` with trailing-slash equivalence absorbed),
 * so an `<a href="/about">` matches a `pageIds` entry stored as
 * `https://example.com/about/` and vice versa.
 *
 * Two maps are exposed so the resolver can prefer an exact `?query` match
 * before falling back to the pathname-only key — this preserves
 * disambiguation between URLs that differ only by query string (e.g.
 * `/list?p=1` vs `/list?p=2`) when both are in `pageIds`.
 */
export interface PageIdLookup {
	/** Keyed by `origin + pathname + search` for exact-query lookups. */
	readonly byExact: ReadonlyMap<string, number>;
	/** Keyed by `origin + pathname` (trailing slash absorbed) for fallback lookups. */
	readonly byPathname: ReadonlyMap<string, number>;
}

export interface RewritePageRefsOptions {
	/** The page's HTML (full document or fragment). */
	readonly html: string;
	/** The URL of the page itself. Used as the base for resolving relative URLs. */
	readonly baseUrl: string;
	/**
	 * Pre-built page-id lookup table produced by {@link buildPageIdLookup}.
	 * Build it once at the orchestrator level and pass the same instance to
	 * every per-page call — building per-page is O(N²) in archive size.
	 */
	readonly pageIdLookup: PageIdLookup;
}

/**
 * Rewrites in-page URL references using a resolver that:
 *
 * 1. Resolves the raw attribute against `baseUrl`. Unparsable / non-http(s)
 *    schemes (`mailto:`, `javascript:`, `data:`, …) and bare fragments (`#x`)
 *    are left untouched. Whitespace-padded values are trimmed before classifying.
 * 2. For URLs whose origin matches the page's, builds a root-relative path
 *    (`/img/a.png`) so the output is portable across deployment paths.
 * 3. When the attribute belongs to a page-reference tag (`<a href>`,
 *    `<form action>`, `<iframe src>`, or `<link href>` with `rel` in
 *    `canonical`/`alternate`/`prev`/`next`) AND the resolved URL maps to a
 *    known page, swaps the path for `{{<id>}}` while preserving the query and
 *    fragment (`{{42}}#team`). Exact `?query` matches are preferred over the
 *    pathname-only fallback.
 *
 * Cross-origin URLs are returned untouched so external links keep working
 * verbatim.
 *
 * Asset references and same-origin page references with no id mapping fall
 * through to the root-relative form.
 * @param options
 * @example
 * const lookup = buildPageIdLookup(new Map([
 *   ['https://example.com/about/', 42],
 * ]));
 * await rewritePageRefs({
 *   html: '<a href="/about/">about</a><img src="/img/a.png">',
 *   baseUrl: 'https://example.com/',
 *   pageIdLookup: lookup,
 * });
 * // → '<a href="{{42}}">about</a><img src="/img/a.png">'
 */
export async function rewritePageRefs(options: RewritePageRefsOptions): Promise<string> {
	const { html, baseUrl, pageIdLookup } = options;

	let basePageOrigin: string;
	try {
		basePageOrigin = new URL(baseUrl).origin;
	} catch {
		return html;
	}

	const resolver: AssetResolver = (rawUrl, _attribute, tagName, tagAttrs) => {
		// Trim before classifying so legacy hand-written HTML with leading
		// whitespace (e.g. `href=" #section"`) is still recognised as a
		// bare-fragment anchor and left alone.
		const trimmed = rawUrl.trim();
		if (trimmed === '' || trimmed.startsWith('#')) {
			return null;
		}
		let resolved: URL;
		try {
			resolved = new URL(trimmed, baseUrl);
		} catch {
			return null;
		}
		if (SKIPPED_SCHEMES.has(resolved.protocol)) {
			return null;
		}
		if (resolved.origin !== basePageOrigin) {
			return null;
		}
		if (isPageRef(tagName, tagAttrs)) {
			const id = lookupPageId(resolved, pageIdLookup);
			if (id !== undefined) {
				return `{{${id}}}${resolved.search}${resolved.hash}`;
			}
		}
		return `${resolved.pathname}${resolved.search}${resolved.hash}`;
	};

	return await rewriteAssetRefs(html, resolver);
}

/**
 * Builds the pre-keyed lookup tables consumed by {@link rewritePageRefs}.
 * Run this once per migration (e.g. in `extractPages`) and pass the result to
 * every per-page invocation — building it inside the per-page hot path is
 * O(N²) in the archive size and re-derives an invariant value.
 *
 * Trailing-slash normalisation: each entry is registered under both the
 * trailing-slash and trailing-slash-stripped pathname so an `<a href="/about">`
 * can match a `pageIds` key of `https://example.com/about/` (and vice versa).
 * When two entries collide on the normalised key, the last write wins — this
 * mirrors the original Map's semantics and is documented so callers can avoid
 * intentional collisions.
 * @param pageIds
 * @example
 * const lookup = buildPageIdLookup(new Map([
 *   ['https://example.com/about/', 10_000],
 *   ['https://example.com/list?p=1', 5],
 *   ['https://example.com/list?p=2', 10],
 * ]));
 * // lookup.byExact has the `?p=1` / `?p=2` distinction; lookup.byPathname
 * // has the trailing-slash-absorbed `/about` ↔ `/about/` mappings.
 */
export function buildPageIdLookup(pageIds: ReadonlyMap<string, number>): PageIdLookup {
	const byExact = new Map<string, number>();
	const byPathname = new Map<string, number>();
	for (const [url, id] of pageIds) {
		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			// assignPageIds already drops unparsable entries; defensive only.
			continue;
		}
		byExact.set(`${parsed.origin}${parsed.pathname}${parsed.search}`, id);
		registerPathnameKey(byPathname, parsed.origin, parsed.pathname, id);
	}
	return { byExact, byPathname };
}

/**
 * Stores `id` under both `origin + pathname` and the trailing-slash variant
 * (added or stripped) so the resolver hits regardless of which form the source
 * HTML used.
 * @param target
 * @param origin
 * @param pathname
 * @param id
 */
function registerPathnameKey(
	target: Map<string, number>,
	origin: string,
	pathname: string,
	id: number,
): void {
	target.set(`${origin}${pathname}`, id);
	if (pathname === '/') {
		return;
	}
	const sibling = pathname.endsWith('/') ? pathname.slice(0, -1) : `${pathname}/`;
	// Only register the sibling key if no other URL has already claimed it —
	// otherwise an explicit `/about` entry would silently shadow `/about/`.
	const siblingKey = `${origin}${sibling}`;
	if (!target.has(siblingKey)) {
		target.set(siblingKey, id);
	}
}

/**
 * Resolves a same-origin URL to its page id, preferring an exact-query match
 * before the pathname-only fallback so URLs that differ only by query string
 * each route to their own id when both are mapped.
 * @param resolved
 * @param lookup
 */
function lookupPageId(resolved: URL, lookup: PageIdLookup): number | undefined {
	const exact = lookup.byExact.get(
		`${resolved.origin}${resolved.pathname}${resolved.search}`,
	);
	if (exact !== undefined) {
		return exact;
	}
	return lookup.byPathname.get(`${resolved.origin}${resolved.pathname}`);
}

/**
 * Classifies a start tag's URL attribute as page-reference vs. sub-resource.
 *
 * `<a>`, `<form>`, and `<iframe>` are unconditional page references. `<link>`
 * is gated on `rel` — only `canonical` / `alternate` / `prev` / `next` (the
 * `rel` tokens that name another document) are page references; the dominant
 * `<link rel="stylesheet"/"icon"/"preload">` cases are assets and fall
 * through to the root-relative branch.
 * @param tagName
 * @param tagAttrs
 */
function isPageRef(
	tagName: string,
	tagAttrs: readonly { name: string; value: string }[],
): boolean {
	if (!PAGE_REF_TAGS.has(tagName)) {
		return false;
	}
	if (tagName !== 'link') {
		return true;
	}
	const rel = tagAttrs.find((attribute) => attribute.name === 'rel')?.value;
	if (rel === undefined) {
		return false;
	}
	// `rel` is a whitespace-separated token list per the HTML spec; treat it
	// case-insensitively because authors sometimes write `Canonical`.
	return rel
		.toLowerCase()
		.split(/\s+/)
		.some((token) => PAGE_REF_LINK_REL_TOKENS.has(token));
}
