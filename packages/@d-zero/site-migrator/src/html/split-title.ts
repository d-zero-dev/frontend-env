const TITLE_SEPARATORS = /[｜|]/;
const TRIMMABLE_WHITESPACE = /^\s+|\s+$/g;

export interface TitlePair {
	title: string;
	/**
	 * Original (un-split) title. Only set when `splitTitle` actually trimmed
	 * something off — callers use the presence of this field as the signal to
	 * emit `rawTitle` in the frontmatter output.
	 */
	rawTitle?: string;
}

/**
 * Splits a `title` / `og:title` / `twitter:title` string on `｜` or `|` and
 * returns the first non-empty segment as the canonical title, with the
 * original string preserved as `rawTitle` whenever splitting actually changed
 * the value.
 *
 * Pure string operation; no HTML parsing. Used by the DB-sourced
 * `getFrontmatter` because `pages.title` in the `.nitpicker` DB is the full
 * `<title>` text — there is no pre-split column.
 * @param raw
 * @example
 * splitTitle('ニュース｜製品｜会社')
 * // → { title: 'ニュース', rawTitle: 'ニュース｜製品｜会社' }
 *
 * splitTitle('Solo')
 * // → { title: 'Solo' }   // no separator, no rawTitle
 *
 * splitTitle('   ')
 * // → undefined            // whitespace-only and null/undefined map to undefined
 */
export function splitTitle(raw: string | undefined | null): TitlePair | undefined {
	if (raw === undefined || raw === null) {
		return undefined;
	}
	const trimmed = raw.replaceAll(TRIMMABLE_WHITESPACE, '');
	if (trimmed.length === 0) {
		return undefined;
	}
	if (!TITLE_SEPARATORS.test(trimmed)) {
		return { title: trimmed };
	}
	const segments = trimmed
		.split(TITLE_SEPARATORS)
		.map((segment) => segment.replaceAll(TRIMMABLE_WHITESPACE, ''));
	const first = segments.find((segment) => segment.length > 0) ?? trimmed;
	return first === raw ? { title: first } : { title: first, rawTitle: raw };
}
