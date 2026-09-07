/**
 * Single `--include` pattern parsed from a CLI-style raw value.
 */
export interface IncludePattern {
	/** Normalised pathname (run through the URL parser, so percent-encoding matches page URLs). */
	readonly pathname: string;
	/** `true` when `raw` ended with `/` — pathname prefix match; `false` — exact match. */
	readonly isPrefix: boolean;
	/** The original CLI value, kept for error messages. */
	readonly raw: string;
}

/**
 * Thrown by {@link parseIncludePattern} when a raw `--include` value cannot be
 * interpreted as a pathname or `http(s)://` URL, or carries a query/fragment.
 */
export class InvalidIncludeValueError extends Error {
	/**
	 *
	 * @param message
	 */
	constructor(message: string) {
		super(message);
		this.name = 'InvalidIncludeValueError';
	}
}

/**
 * Thrown by {@link filterUrlsByInclude} when one or more `--include` values
 * matched zero pages. Thrown before any download or write so a typo fails
 * loudly instead of silently migrating nothing for that value.
 */
export class IncludeNoMatchError extends Error {
	/** Raw `--include` values (input order, not deduplicated) that matched no page. */
	readonly unmatched: readonly string[];

	/**
	 *
	 * @param unmatched
	 */
	constructor(unmatched: readonly string[]) {
		super(
			`--include matched no pages: ${unmatched.map((v) => JSON.stringify(v)).join(', ')}`,
		);
		this.name = 'IncludeNoMatchError';
		this.unmatched = unmatched;
	}
}

/**
 * Parses a single `--include` raw value into an {@link IncludePattern}.
 *
 * `raw` must start with `/` (a pathname) or `http://` / `https://` (a full
 * URL, whose host is ignored — only the pathname is used). Either form is run
 * through `URL` so that non-ASCII segments percent-encode the same way page
 * URLs do (both sides of the eventual comparison go through the same
 * parser), and `.` / `..` segments resolve the same way a browser would.
 *
 * A trailing `/` marks the pattern as a directory-subtree prefix match
 * (`isPrefix: true`); any other value is an exact-match single page. This
 * rule has no exception for the root pattern: `--include /` or
 * `--include https://example.com` both normalise to pathname `/`, which
 * prefix-matches every page — i.e. equivalent to omitting `--include`
 * entirely. That is intentional, not an error, so the rule stays uniform.
 *
 * Query strings and fragments are rejected rather than silently dropped:
 * `--include /news/?p=1` looks like it targets one query variant, but
 * pathname-only matching would make it match the entire `/news/` subtree.
 *
 * A value starting with `//` (protocol-relative, e.g. `//news/index.html`)
 * is rejected rather than parsed as a pathname: per the URL spec, `new
 * URL('//news/index.html', base)` treats `news` as a hostname and yields
 * pathname `/index.html`, silently matching the wrong page instead of
 * erroring.
 * @param raw
 * @example
 * parseIncludePattern('/news/');
 * // → { pathname: '/news/', isPrefix: true, raw: '/news/' }
 * parseIncludePattern('https://example.com/about/index.html');
 * // → { pathname: '/about/index.html', isPrefix: false, raw: '...' }
 */
export function parseIncludePattern(raw: string): IncludePattern {
	let url: URL;
	if (raw.startsWith('/') && !raw.startsWith('//')) {
		url = new URL(raw, 'http://placeholder.invalid');
	} else if (/^https?:\/\//.test(raw)) {
		try {
			url = new URL(raw);
		} catch {
			throw new InvalidIncludeValueError(
				`--include value must start with "/" or "http(s)://": ${raw}`,
			);
		}
	} else {
		throw new InvalidIncludeValueError(
			`--include value must start with "/" or "http(s)://": ${raw}`,
		);
	}

	if (url.search !== '' || url.hash !== '') {
		throw new InvalidIncludeValueError(
			`--include does not support query/fragment: ${raw}`,
		);
	}

	return { pathname: url.pathname, isPrefix: url.pathname.endsWith('/'), raw };
}

/**
 * Returns whether `pathname` is selected by `pattern`. Prefix patterns always
 * end with `/` (guaranteed by {@link parseIncludePattern}), so a plain
 * `startsWith` cannot false-positive on a sibling directory (`/news/` never
 * matches `/newsroom/`) and the directory's own index page (`/news/` itself)
 * is included.
 * @param pattern
 * @param pathname
 */
function matchesPattern(pattern: IncludePattern, pathname: string): boolean {
	return pattern.isPrefix
		? pathname.startsWith(pattern.pathname)
		: pathname === pattern.pathname;
}

/**
 * Filters `urls` down to those selected by any of the `include` patterns
 * (union). Every `include` value must match at least one URL — if any value
 * matches zero pages, this throws {@link IncludeNoMatchError} listing every
 * such value (not just the first) before the caller does any download or
 * write. Values that fail to parse throw {@link InvalidIncludeValueError}
 * first, ahead of matching.
 *
 * URLs in `urls` that fail to parse are treated as matching nothing (they are
 * not filter-worthy, and this mirrors how they would already be reported as
 * `failed` downstream when no filter is applied at all).
 *
 * An empty `include` selects every URL unchanged (no patterns to fail to
 * match, so nothing is unmatched either) — the primitive itself encodes the
 * "no filter" contract described on {@link import('./migrate.js').MigrateOptions.include},
 * rather than relying on every caller to special-case it.
 *
 * The returned array preserves the input order of `urls` and contains no
 * duplicates, even when a URL is selected by more than one pattern.
 * @param include
 * @param urls
 * @example
 * filterUrlsByInclude(
 *   ['/news/'],
 *   ['https://example.com/news/', 'https://example.com/news/a.html', 'https://example.com/about/'],
 * );
 * // → ['https://example.com/news/', 'https://example.com/news/a.html']
 */
export function filterUrlsByInclude(
	include: readonly string[],
	urls: readonly string[],
): string[] {
	if (include.length === 0) {
		return [...urls];
	}

	const patterns = include.map((raw) => parseIncludePattern(raw));

	const pathnameByUrl = new Map<string, string>();
	for (const url of urls) {
		try {
			pathnameByUrl.set(url, new URL(url).pathname);
		} catch {
			// Unparsable URLs match nothing — see JSDoc above.
		}
	}

	const matchCounts = new Map<IncludePattern, number>(
		patterns.map((pattern) => [pattern, 0]),
	);
	const selected = new Set<string>();
	for (const url of urls) {
		const pathname = pathnameByUrl.get(url);
		if (pathname === undefined) {
			continue;
		}
		for (const pattern of patterns) {
			if (matchesPattern(pattern, pathname)) {
				matchCounts.set(pattern, matchCounts.get(pattern)! + 1);
				selected.add(url);
			}
		}
	}

	const unmatched = patterns
		.filter((pattern) => matchCounts.get(pattern) === 0)
		.map((pattern) => pattern.raw);
	if (unmatched.length > 0) {
		throw new IncludeNoMatchError(unmatched);
	}

	return urls.filter((url) => selected.has(url));
}
