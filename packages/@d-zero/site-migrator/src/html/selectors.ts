/**
 * Per-element list of attributes whose value is treated as an asset URL by
 * the rewriter. Covers the attributes most likely to point at site-local
 * resources during a migration sweep.
 *
 * `srcset` is special-cased downstream because it carries a comma-separated
 * list of URLs (with optional descriptors), not a single URL.
 */
export const ASSET_ATTRIBUTES: ReadonlyMap<string, ReadonlySet<string>> = new Map([
	['a', new Set(['href'])],
	['link', new Set(['href'])],
	['script', new Set(['src'])],
	['img', new Set(['src', 'srcset'])],
	['source', new Set(['src', 'srcset'])],
	['iframe', new Set(['src'])],
	['embed', new Set(['src'])],
	['video', new Set(['src', 'poster'])],
	['audio', new Set(['src'])],
	['track', new Set(['src'])],
	['form', new Set(['action'])],
]);

/**
 * Returns the attribute names that should be inspected for the given tag.
 * Returns an empty iterable for tags we do not rewrite.
 * @param tagName
 */
export function assetAttributesFor(tagName: string): ReadonlySet<string> {
	return ASSET_ATTRIBUTES.get(tagName) ?? EMPTY_SET;
}

const EMPTY_SET: ReadonlySet<string> = new Set();

/**
 * Splits the value of a `srcset` attribute into its constituent candidates.
 * Each candidate is a `{ url, descriptor }` pair where `descriptor` is the
 * original size / density hint (e.g. `2x`, `768w`) without leading whitespace.
 *
 * Example:
 *   `"a.jpg 1x, b.jpg 2x, c.jpg"` →
 *   `[{ url: "a.jpg", descriptor: "1x" }, { url: "b.jpg", descriptor: "2x" }, { url: "c.jpg", descriptor: "" }]`
 *
 * **Known limitation**: the parser splits on the first comma, so `data:` URLs
 * and URLs containing commas in query strings are corrupted. The WHATWG srcset
 * algorithm requires a stateful tokenizer; if migration sources start producing
 * such srcsets, switch to a dedicated parser before relying on the round-trip.
 * @param value
 */
export function parseSrcset(value: string): { url: string; descriptor: string }[] {
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0)
		.map((entry) => {
			const firstSpace = entry.search(/\s/);
			if (firstSpace === -1) {
				return { url: entry, descriptor: '' };
			}
			return {
				url: entry.slice(0, firstSpace),
				descriptor: entry.slice(firstSpace + 1).trim(),
			};
		});
}

/**
 * Re-serializes a list of candidates produced by {@link parseSrcset} back into
 * a `srcset` attribute value. Pairs that have no descriptor are emitted as the
 * URL alone.
 * @param candidates
 */
export function serializeSrcset(
	candidates: readonly { url: string; descriptor: string }[],
): string {
	return candidates
		.map(({ url, descriptor }) => (descriptor === '' ? url : `${url} ${descriptor}`))
		.join(', ');
}
