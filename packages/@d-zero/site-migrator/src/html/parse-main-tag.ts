import type { DefaultTreeAdapterMap } from 'parse5';

import { parseFragment } from 'parse5';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['childNode'];

/** `tagName`/`id`/`classList` extracted from a single element's opening tag. */
export interface MainTagInfo {
	tagName: string;
	id: string | null;
	classList: readonly string[];
}

const WHITESPACE = /\s+/;

/**
 * Parses the opening tag of a single element's `outerHTML` (as returned by
 * {@link import('./extract-main-content.js').extractMainContent}) into its
 * `tagName`/`id`/`classList`.
 *
 * Shared by two #978 call sites that both need the exact same three fields
 * off the exact same matched element: building a CSS selector to pass into
 * anatomist's `mainContentSelector` (live analysis), and comparing against
 * anatomist's `LayoutBlock` shape (pre-generated JSON path, see
 * {@link import('../page-extractor/check-main-consistency.js').isMainConsistent}).
 * @param outerHtml A single element's `outerHTML`.
 */
export function parseMainTag(outerHtml: string): MainTagInfo {
	const fragment = parseFragment(outerHtml);
	const element = fragment.childNodes.find(isElement);
	if (!element) {
		throw new Error('parseMainTag: outerHTML に要素が見つかりません');
	}
	const id = getAttr(element, 'id') ?? null;
	const classAttr = getAttr(element, 'class');
	const classList =
		classAttr === undefined
			? []
			: classAttr.split(WHITESPACE).filter((token) => token.length > 0);
	return { tagName: element.tagName, id, classList };
}

/**
 * @param node
 */
function isElement(node: Node): node is Element {
	return 'tagName' in node && Array.isArray((node as Element).attrs);
}

/**
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
