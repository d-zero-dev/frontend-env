import type { Frontmatter, OgFrontmatter, TwitterFrontmatter } from '../types.js';

import { dump } from 'js-yaml';

/**
 * Serialises a {@link Frontmatter} to the `---\n…\n---\n` YAML frontmatter
 * block consumed by the downstream scaffold pipeline.
 *
 * Output conventions are pinned so the downstream scaffold pipeline can ingest
 * these files without adapter code: stable key order, nested `og:` / `twitter:`
 * maps, double-quoted scalars, no line wrapping, no anchors, empty values
 * dropped.
 *
 * Returns the empty string when nothing meaningful would be emitted, so the
 * caller can prepend unconditionally without producing a stray `---\n---\n`.
 * @param meta
 * @example
 * formatFrontmatter({ title: 'ニュース', og: { title: 'OG' } })
 * // → '---\ntitle: "ニュース"\nog:\n  title: "OG"\n---\n'
 *
 * formatFrontmatter({})
 * // → ''   (caller can safely concat with body)
 */
export function formatFrontmatter(meta: Frontmatter): string {
	const ordered = buildOrderedFrontmatter(meta);
	if (Object.keys(ordered).length === 0) {
		return '';
	}
	const yaml = dump(ordered, {
		forceQuotes: true,
		// js-yaml picks single quotes by default; pin to double to match the
		// downstream scaffold pipeline's serialisation expectations.
		quotingType: '"',
		lineWidth: -1,
		indent: 2,
		// `noRefs` avoids `*ref0` / `&ref0` anchors when the same string instance
		// appears in two slots (rawTitle / title etc.).
		noRefs: true,
	});
	return `---\n${yaml}---\n`;
}

const TOP_LEVEL_KEYS = [
	'id',
	'title',
	'rawTitle',
	'description',
	'keywords',
] as const satisfies readonly (keyof Frontmatter)[];
const OG_KEYS = [
	'title',
	'rawTitle',
	'description',
	'image',
	'url',
	'type',
	'siteName',
] as const satisfies readonly (keyof OgFrontmatter)[];
const TWITTER_KEYS = [
	'card',
	'title',
	'rawTitle',
	'description',
	'image',
] as const satisfies readonly (keyof TwitterFrontmatter)[];
const TAIL_KEYS = [
	'canonical',
	'lang',
	'robots',
	'charset',
] as const satisfies readonly (keyof Frontmatter)[];

/**
 *
 * @param meta
 */
function buildOrderedFrontmatter(meta: Frontmatter): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	pickOrdered(out, meta, TOP_LEVEL_KEYS);

	const og = meta.og ? pickOrdered({}, meta.og, OG_KEYS) : {};
	if (Object.keys(og).length > 0) {
		out.og = og;
	}

	const twitter = meta.twitter ? pickOrdered({}, meta.twitter, TWITTER_KEYS) : {};
	if (Object.keys(twitter).length > 0) {
		out.twitter = twitter;
	}

	pickOrdered(out, meta, TAIL_KEYS);
	return out;
}

/**
 * Copies each `key` from `source` to `target` in the supplied order, skipping
 * `undefined` values. The single source-of-truth for the YAML key order — to
 * add a new field, append it to the matching tuple above.
 * @param target
 * @param source
 * @param keys
 */
function pickOrdered<T extends object>(
	target: Record<string, unknown>,
	source: T,
	keys: readonly (keyof T)[],
): Record<string, unknown> {
	for (const key of keys) {
		const value = source[key];
		if (value !== undefined) {
			target[key as string] = value;
		}
	}
	return target;
}
