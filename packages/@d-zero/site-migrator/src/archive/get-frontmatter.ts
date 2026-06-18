import type {
	ArchiveSession,
	Frontmatter,
	OgFrontmatter,
	TwitterFrontmatter,
} from '../types.js';

import { getPageDetail } from '@nitpicker/query';

import { splitTitle } from '../html/split-title.js';

/**
 * Reads the per-page metadata for `url` directly from the `.nitpicker` DB and
 * shapes it as a {@link Frontmatter}. Replaces the previous parse5-based
 * `extractFrontmatter(html)` now that `@nitpicker/query` exposes the flat
 * meta column schema directly.
 *
 * Behaviour:
 *
 * - Returns `null` when the DB has no row for the URL (caller decides whether
 *   to skip prepending or write the body alone).
 * - Empty / null / whitespace-only columns are dropped — downstream consumers
 *   never see placeholder values like `description: "   "`.
 * - Title-shaped fields go through {@link splitTitle} because the DB stores
 *   the full `<title>` text and has no pre-split column. `rawTitle` is only
 *   set when the split actually trims something.
 * - URL-shaped fields (`canonical`, `og.url`, `og.image`, `twitter.image`)
 *   come pre-absolutised from the DB.
 * @param session
 * @param url
 * @example
 * const session = await openArchive('/path/to/site.nitpicker');
 * try {
 *   const meta = await getFrontmatter(session, 'https://example.com/about/');
 *   if (meta) {
 *     const yaml = formatFrontmatter(meta);
 *     // → '---\ntitle: "About"\n…\n---\n'
 *   }
 * } finally {
 *   await session.close();
 * }
 */
export async function getFrontmatter(
	session: ArchiveSession,
	url: string,
): Promise<Frontmatter | null> {
	const detail = await getPageDetail(session.accessor, url);
	if (!detail) {
		return null;
	}

	const result: Frontmatter = {};

	const titlePair = splitTitle(detail.title);
	if (titlePair) {
		result.title = titlePair.title;
		if (titlePair.rawTitle !== undefined) {
			result.rawTitle = titlePair.rawTitle;
		}
	}

	assignNonEmpty(result, 'description', detail.description);
	assignNonEmpty(result, 'keywords', detail.keywords);

	const og = buildOg(detail);
	if (og) {
		result.og = og;
	}

	const twitter = buildTwitter(detail);
	if (twitter) {
		result.twitter = twitter;
	}

	assignNonEmpty(result, 'canonical', detail.canonical);
	assignNonEmpty(result, 'lang', detail.lang);
	assignNonEmpty(result, 'robots', detail.robotsRaw);
	assignNonEmpty(result, 'charset', detail.charset);

	return result;
}

/**
 *
 * @param detail
 * @param detail.ogTitle
 * @param detail.ogDescription
 * @param detail.ogImage
 * @param detail.ogUrl
 * @param detail.ogType
 * @param detail.ogSiteName
 */
function buildOg(detail: {
	ogTitle: string | null;
	ogDescription: string | null;
	ogImage: string | null;
	ogUrl: string | null;
	ogType: string | null;
	ogSiteName: string | null;
}): OgFrontmatter | undefined {
	const og: OgFrontmatter = {};
	const titlePair = splitTitle(detail.ogTitle);
	if (titlePair) {
		og.title = titlePair.title;
		if (titlePair.rawTitle !== undefined) {
			og.rawTitle = titlePair.rawTitle;
		}
	}
	assignNonEmpty(og, 'description', detail.ogDescription);
	assignNonEmpty(og, 'image', detail.ogImage);
	assignNonEmpty(og, 'url', detail.ogUrl);
	assignNonEmpty(og, 'type', detail.ogType);
	assignNonEmpty(og, 'siteName', detail.ogSiteName);
	return Object.keys(og).length > 0 ? og : undefined;
}

/**
 *
 * @param detail
 * @param detail.twitterCard
 * @param detail.twitterTitle
 * @param detail.twitterDescription
 * @param detail.twitterImage
 */
function buildTwitter(detail: {
	twitterCard: string | null;
	twitterTitle: string | null;
	twitterDescription: string | null;
	twitterImage: string | null;
}): TwitterFrontmatter | undefined {
	const twitter: TwitterFrontmatter = {};
	assignNonEmpty(twitter, 'card', detail.twitterCard);
	const titlePair = splitTitle(detail.twitterTitle);
	if (titlePair) {
		twitter.title = titlePair.title;
		if (titlePair.rawTitle !== undefined) {
			twitter.rawTitle = titlePair.rawTitle;
		}
	}
	assignNonEmpty(twitter, 'description', detail.twitterDescription);
	assignNonEmpty(twitter, 'image', detail.twitterImage);
	return Object.keys(twitter).length > 0 ? twitter : undefined;
}

/**
 *
 * @param target
 * @param key
 * @param value
 */
function assignNonEmpty<T extends object, K extends keyof T>(
	target: T,
	key: K,
	value: string | null | undefined,
): void {
	// Match the title path: whitespace-only DB columns are treated as empty so
	// downstream consumers never see `description: "   "` placeholders.
	if (value === null || value === undefined) {
		return;
	}
	if (value.trim().length === 0) {
		return;
	}
	target[key] = value as T[K];
}
