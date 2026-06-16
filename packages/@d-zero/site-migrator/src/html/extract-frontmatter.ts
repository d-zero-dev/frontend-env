import type { Frontmatter, OgFrontmatter, TwitterFrontmatter } from '../types.js';
import type { DefaultTreeAdapterMap } from 'parse5';

import { parseFragment } from 'parse5';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['childNode'];

const TITLE_SEPARATORS = /[｜|]/;
const TRIMMABLE_WHITESPACE = /^\s+|\s+$/g;

/**
 *
 * @param value
 */
function trimAll(value: string): string {
	return value.replaceAll(TRIMMABLE_WHITESPACE, '');
}

/**
 * Extracts frontmatter-shaped metadata from an HTML document by parsing the
 * `<head>` section only with parse5. parse5 decodes entities and handles
 * quoting/attribute-order variations natively, so we lean on it for accuracy
 * while keeping the cost low by skipping the `<body>` entirely (≈10× faster
 * than parsing the whole document at 10⁵-page scale).
 *
 * Behaviour:
 *
 * - `title` / `og.title` / `twitter.title` are split on `｜` `|` and the first
 *   non-empty segment is kept. When the split differs from the raw value, the
 *   raw is preserved on the sibling `rawTitle` key.
 * - Empty-string attribute values are preserved (`description: ""`).
 * - When a tag appears multiple times, the first occurrence wins.
 * - Also captures `lang` (from `<html lang>`), `robots` (from
 *   `<meta name="robots">`), and `charset` (from `<meta charset>` or
 *   `<meta http-equiv="content-type">`).
 * @param html
 */
export function extractFrontmatter(html: string): Frontmatter {
	const headSource = extractHeadText(html);
	const lang = extractHtmlLang(html);
	const fragment = parseFragment(headSource);

	const meta = collectFromHead(fragment.childNodes);

	const result: Frontmatter = {};

	const titlePair = splitTitle(meta.title);
	if (titlePair) {
		result.title = titlePair.title;
		if (titlePair.rawTitle !== undefined) {
			result.rawTitle = titlePair.rawTitle;
		}
	}
	if (meta.description !== undefined) {
		result.description = meta.description;
	}
	if (meta.keywords !== undefined) {
		result.keywords = meta.keywords;
	}

	const og = buildOg(meta);
	if (og) {
		result.og = og;
	}

	const twitter = buildTwitter(meta);
	if (twitter) {
		result.twitter = twitter;
	}

	if (meta.canonical !== undefined) {
		result.canonical = meta.canonical;
	}
	if (lang !== undefined) {
		result.lang = lang;
	}
	if (meta.robots !== undefined) {
		result.robots = meta.robots;
	}
	if (meta.charset !== undefined) {
		result.charset = meta.charset;
	}

	return result;
}

interface CollectedMeta {
	title?: string;
	description?: string;
	keywords?: string;
	robots?: string;
	charset?: string;
	canonical?: string;
	ogTitle?: string;
	ogDescription?: string;
	ogImage?: string;
	ogUrl?: string;
	ogType?: string;
	ogSiteName?: string;
	twitterCard?: string;
	twitterTitle?: string;
	twitterDescription?: string;
	twitterImage?: string;
	twitterUrl?: string;
}

/**
 *
 * @param nodes
 */
function collectFromHead(nodes: readonly Node[]): CollectedMeta {
	const meta: CollectedMeta = {};
	walk(nodes, meta);
	return meta;
}

/**
 *
 * @param nodes
 * @param meta
 */
function walk(nodes: readonly Node[], meta: CollectedMeta): void {
	for (const node of nodes) {
		if (!isElement(node)) {
			continue;
		}
		switch (node.tagName) {
			case 'title': {
				if (meta.title === undefined) {
					meta.title = readTextContent(node);
				}
				break;
			}
			case 'meta': {
				readMeta(node, meta);
				break;
			}
			case 'link': {
				readLink(node, meta);
				break;
			}
			default: {
				// Recurse: head children are usually flat, but be safe for nested
				// <noscript> wrappers some CMSes emit.
				walk(node.childNodes, meta);
			}
		}
	}
}

const META_NAME_TO_KEY: Readonly<Record<string, keyof CollectedMeta>> = {
	description: 'description',
	keywords: 'keywords',
	robots: 'robots',
	'twitter:card': 'twitterCard',
	'twitter:title': 'twitterTitle',
	'twitter:description': 'twitterDescription',
	'twitter:image': 'twitterImage',
	'twitter:url': 'twitterUrl',
};

const META_PROPERTY_TO_KEY: Readonly<Record<string, keyof CollectedMeta>> = {
	'og:title': 'ogTitle',
	'og:description': 'ogDescription',
	'og:image': 'ogImage',
	'og:url': 'ogUrl',
	'og:type': 'ogType',
	'og:site_name': 'ogSiteName',
};

/**
 *
 * @param element
 * @param meta
 */
function readMeta(element: Element, meta: CollectedMeta): void {
	const charset = getAttr(element, 'charset');
	if (charset !== undefined && meta.charset === undefined) {
		meta.charset = charset;
		return;
	}

	const content = getAttr(element, 'content');
	const httpEquiv = lowerAttr(element, 'http-equiv');
	if (
		httpEquiv === 'content-type' &&
		content !== undefined &&
		meta.charset === undefined
	) {
		const match = content.match(/charset\s*=\s*([^\s;]+)/i);
		if (match?.[1] !== undefined) {
			meta.charset = match[1];
			return;
		}
	}

	if (content === undefined) {
		return;
	}

	const name = lowerAttr(element, 'name');
	const nameKey = name === undefined ? undefined : META_NAME_TO_KEY[name];
	if (nameKey !== undefined) {
		assignFirst(meta, nameKey, content);
		return;
	}

	const property = lowerAttr(element, 'property');
	const propertyKey = property === undefined ? undefined : META_PROPERTY_TO_KEY[property];
	if (propertyKey !== undefined) {
		assignFirst(meta, propertyKey, content);
	}
}

/**
 *
 * @param element
 * @param meta
 */
function readLink(element: Element, meta: CollectedMeta): void {
	const rel = lowerAttr(element, 'rel');
	const href = getAttr(element, 'href');
	if (rel === 'canonical' && href !== undefined) {
		assignFirst(meta, 'canonical', href);
	}
}

/**
 *
 * @param meta
 */
function buildOg(meta: CollectedMeta): OgFrontmatter | undefined {
	const og: OgFrontmatter = {};
	const titlePair = splitTitle(meta.ogTitle);
	if (titlePair) {
		og.title = titlePair.title;
		if (titlePair.rawTitle !== undefined) {
			og.rawTitle = titlePair.rawTitle;
		}
	}
	if (meta.ogDescription !== undefined) {
		og.description = meta.ogDescription;
	}
	if (meta.ogImage !== undefined) {
		og.image = meta.ogImage;
	}
	if (meta.ogUrl !== undefined) {
		og.url = meta.ogUrl;
	}
	if (meta.ogType !== undefined) {
		og.type = meta.ogType;
	}
	if (meta.ogSiteName !== undefined) {
		og.siteName = meta.ogSiteName;
	}
	return Object.keys(og).length > 0 ? og : undefined;
}

/**
 *
 * @param meta
 */
function buildTwitter(meta: CollectedMeta): TwitterFrontmatter | undefined {
	const twitter: TwitterFrontmatter = {};
	if (meta.twitterCard !== undefined) {
		twitter.card = meta.twitterCard;
	}
	const titlePair = splitTitle(meta.twitterTitle);
	if (titlePair) {
		twitter.title = titlePair.title;
		if (titlePair.rawTitle !== undefined) {
			twitter.rawTitle = titlePair.rawTitle;
		}
	}
	if (meta.twitterDescription !== undefined) {
		twitter.description = meta.twitterDescription;
	}
	if (meta.twitterImage !== undefined) {
		twitter.image = meta.twitterImage;
	}
	if (meta.twitterUrl !== undefined) {
		twitter.url = meta.twitterUrl;
	}
	return Object.keys(twitter).length > 0 ? twitter : undefined;
}

interface TitlePair {
	title: string;
	rawTitle?: string;
}

/**
 *
 * @param raw
 */
function splitTitle(raw: string | undefined): TitlePair | undefined {
	if (raw === undefined) {
		return undefined;
	}
	const trimmed = trimAll(raw);
	if (!TITLE_SEPARATORS.test(trimmed)) {
		return { title: trimmed };
	}
	const segments = trimmed.split(TITLE_SEPARATORS).map((segment) => trimAll(segment));
	const first = segments.find((segment) => segment.length > 0) ?? trimmed;
	return first === raw ? { title: first } : { title: first, rawTitle: raw };
}

/**
 *
 * @param meta
 * @param key
 * @param value
 */
function assignFirst<K extends keyof CollectedMeta>(
	meta: CollectedMeta,
	key: K,
	value: string,
): void {
	if (meta[key] === undefined) {
		meta[key] = value as CollectedMeta[K];
	}
}

/**
 *
 * @param node
 */
function isElement(node: Node): node is Element {
	return 'tagName' in node && Array.isArray((node as Element).attrs);
}

/**
 *
 * @param element
 * @param name
 */
function getAttr(element: Element, name: string): string | undefined {
	for (const attribute of element.attrs) {
		if (attribute.name === name) {
			return attribute.value;
		}
	}
	return undefined;
}

/**
 *
 * @param element
 * @param name
 */
function lowerAttr(element: Element, name: string): string | undefined {
	const value = getAttr(element, name);
	return value === undefined ? undefined : value.toLowerCase();
}

/**
 *
 * @param element
 */
function readTextContent(element: Element): string {
	let result = '';
	for (const child of element.childNodes) {
		if ('value' in child && typeof child.value === 'string') {
			result += child.value;
		}
	}
	return trimAll(result);
}

/**
 *
 * @param html
 */
function extractHeadText(html: string): string {
	return html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1] ?? '';
}

/**
 *
 * @param html
 */
function extractHtmlLang(html: string): string | undefined {
	// Require whitespace immediately before `lang=` so xml:lang / data-lang etc.
	// can never be mistaken for the bare `lang` attribute.
	const match = html.match(
		/<html\b[^>]*?\slang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i,
	);
	return match?.[1] ?? match?.[2] ?? match?.[3];
}
