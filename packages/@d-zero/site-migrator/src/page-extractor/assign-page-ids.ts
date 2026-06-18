import { alphabeticalComparator } from '@d-zero/shared/sort/alphabetical';
import { pathComparator } from '@d-zero/shared/sort/path';

/**
 * Maximum number of pages allowed in a single section before its id range
 * overlaps the next section. `sectionIndex * SECTION_STEP + pageIndex *
 * PAGE_STEP` overflows when `pageIndex * PAGE_STEP >= SECTION_STEP`, so the
 * safe upper bound is `SECTION_STEP / PAGE_STEP`.
 */
const SECTION_STEP = 10_000;
const PAGE_STEP = 5;
const MAX_PAGES_PER_SECTION = SECTION_STEP / PAGE_STEP;

/**
 * Build a deterministic URL → integer-id map following the directory-grouped
 * numbering scheme used by the downstream scaffold pipeline.
 *
 * Why this scheme: ids are sparse (step 5) so editors can insert pages without
 * renumbering, and grouping by first-level directory keeps related pages
 * visually clustered when sorted by id. The exact step values match the
 * scaffold's expectations so the migrator's output can be ingested without an
 * adapter layer.
 *
 * Sectioning:
 *
 * - Root section — URLs whose pathname has no implied subdirectory (`/`,
 *   `/foo.html`, `/foo`). Receives ids `5, 10, 15, …`.
 * - N-th first-level subdirectory section — URLs whose pathname's first segment
 *   names a directory (`/about/`, `/foo/bar.html`). Subdirectories are sorted
 *   case-insensitively by name to produce the section index `N` (starting at
 *   1). Pages inside the section receive ids `N×10000, N×10000+5, …`.
 *
 * Within each section, URLs are sorted with {@link pathComparator} (the same
 * comparator nitpicker / kamado use for natural URL ordering) so the ids stay
 * stable across runs.
 *
 * Duplicate URLs are deduped by exact string equality before assignment;
 * unparsable URLs are silently dropped (they would not survive the rest of the
 * pipeline either).
 * @param urls
 * @example
 * assignPageIds([
 *   'https://example.com/',
 *   'https://example.com/about/',
 *   'https://example.com/news/2024.html',
 * ])
 * // Map(3) {
 * //   'https://example.com/' => 5,
 * //   'https://example.com/about/' => 10000,
 * //   'https://example.com/news/2024.html' => 20000,
 * // }
 */
export function assignPageIds(urls: readonly string[]): Map<string, number> {
	const sections = new Map<string, string[]>();
	const seen = new Set<string>();

	for (const url of urls) {
		if (seen.has(url)) {
			continue;
		}
		seen.add(url);

		const section = sectionFor(url);
		if (section === null) {
			continue;
		}
		const bucket = sections.get(section) ?? [];
		bucket.push(url);
		sections.set(section, bucket);
	}

	for (const [section, bucket] of sections) {
		sections.set(section, bucket.toSorted(pathComparator));
	}

	// Section keys are already lowercased by `sectionFor`, so the comparator
	// reduces to plain alphabetical ordering. Use `alphabeticalComparator`
	// (decodeURI-aware, locale-independent) rather than `localeCompare`, which
	// depends on the host's ICU build and would shuffle non-ASCII section
	// names between dev/CI environments — breaking the docstring's
	// "same archive always produces the same ids" guarantee.
	const subdirectoryNames = [...sections.keys()]
		.filter((name) => name !== '')
		.toSorted(alphabeticalComparator);

	const ids = new Map<string, number>();

	const rootBucket = sections.get('');
	if (rootBucket) {
		assertSectionFits('root', rootBucket.length);
		for (const [index, url] of rootBucket.entries()) {
			ids.set(url, (index + 1) * PAGE_STEP);
		}
	}

	for (const [subdirectoryIndex, name] of subdirectoryNames.entries()) {
		const sectionIndex = subdirectoryIndex + 1;
		const bucket = sections.get(name) ?? [];
		assertSectionFits(name, bucket.length);
		for (const [pageIndex, url] of bucket.entries()) {
			ids.set(url, sectionIndex * SECTION_STEP + pageIndex * PAGE_STEP);
		}
	}

	return ids;
}

/**
 * Throws when a section would exceed `MAX_PAGES_PER_SECTION` pages — at which
 * point the last page's id collides with the next section's first id. We
 * prefer a loud failure to silent aliasing because the only way to recover the
 * full URL → id map after a collision is to re-run with a larger SECTION_STEP.
 * @param sectionName
 * @param size
 */
function assertSectionFits(sectionName: string, size: number): void {
	if (size > MAX_PAGES_PER_SECTION) {
		throw new Error(
			`assignPageIds: section ${JSON.stringify(sectionName)} has ${size} pages, ` +
				`exceeding the ${MAX_PAGES_PER_SECTION}-page limit imposed by ` +
				`SECTION_STEP=${SECTION_STEP} / PAGE_STEP=${PAGE_STEP}; ids would collide ` +
				`with the next section. Reduce the section, or widen the step constants.`,
		);
	}
}

/**
 * Returns the section key for `url`:
 * - `''` for the root section (pathname has no implied subdirectory).
 * - The first pathname segment (lowercased) for a subdirectory section.
 * - `null` when the URL cannot be parsed.
 *
 * Implied-subdirectory rule: a URL is treated as living inside a subdirectory
 * when its pathname has more than one non-empty segment OR ends with `/` after
 * a single segment (so `/about/` groups under `about`, while `/about.html` and
 * `/about` stay at root).
 * @param url
 */
function sectionFor(url: string): string | null {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}
	const segments = parsed.pathname.split('/').filter((segment) => segment !== '');
	if (segments.length === 0) {
		return '';
	}
	if (segments.length === 1 && !parsed.pathname.endsWith('/')) {
		return '';
	}
	return segments[0]!.toLowerCase();
}
