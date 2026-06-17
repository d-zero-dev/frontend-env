import type { DefaultTreeAdapterMap } from 'parse5';

import { parse, serializeOuter } from 'parse5';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['childNode'];

export type ExtractMainCriterion =
	| 'class:main'
	| 'class:content'
	| 'tag:main'
	| 'role:main'
	| 'id:main'
	| 'id:content';

export interface ExtractMainResult {
	/**
	 * `outerHTML` of the matched element when `matched` is `true`. When no
	 * criterion produces exactly one match, the original `html` is returned
	 * unchanged so callers can fall back to the full document.
	 */
	html: string;
	matched: boolean;
	matchedBy?: ExtractMainCriterion;
}

interface Criterion {
	criterion: ExtractMainCriterion;
	predicate: (element: Element) => boolean;
}

const CRITERIA: readonly Criterion[] = [
	{ criterion: 'class:main', predicate: (element) => hasClassToken(element, 'main') },
	{
		criterion: 'class:content',
		predicate: (element) => hasClassToken(element, 'content'),
	},
	{ criterion: 'tag:main', predicate: (element) => element.tagName === 'main' },
	{
		criterion: 'role:main',
		predicate: (element) => hasRoleToken(element, 'main'),
	},
	{ criterion: 'id:main', predicate: (element) => idIncludes(element, 'main') },
	{ criterion: 'id:content', predicate: (element) => idIncludes(element, 'content') },
];

/**
 * Heuristic layout stripper: walks the parsed document and returns the
 * `outerHTML` of the single element that best matches a hand-tuned priority
 * list. Falls back to the original HTML when no criterion picks out exactly
 * one element.
 *
 * Priority order (each rung requires exactly one element to satisfy):
 *
 * 1. class attribute has a whitespace-separated token containing `main`
 * 2. class attribute has a whitespace-separated token containing `content`
 * 3. `<main>` element
 * 4. element with `role="main"`
 * 5. `id` attribute contains `main` (substring, case-insensitive)
 * 6. `id` attribute contains `content` (substring, case-insensitive)
 *
 * When a rung finds zero or two-plus candidates, processing falls through to
 * the next rung. The matching is intentionally crude — refinement is the job
 * of a later, structurally-aware extractor.
 * @param html The full HTML document text.
 * @returns
 */
export function extractMainContent(html: string): ExtractMainResult {
	const document = parse(html);
	const elements: Element[] = [];
	collectElements(document.childNodes, elements);

	for (const { criterion, predicate } of CRITERIA) {
		let only: Element | undefined;
		let duplicate = false;
		for (const element of elements) {
			if (!predicate(element)) {
				continue;
			}
			if (only !== undefined) {
				duplicate = true;
				break;
			}
			only = element;
		}
		if (!duplicate && only !== undefined) {
			return {
				html: serializeOuter(only),
				matched: true,
				matchedBy: criterion,
			};
		}
	}

	return { html, matched: false };
}

const STRUCTURAL_TAGS = new Set(['html', 'head', 'body']);

/**
 * Walks the parse5 tree and collects every element that could be a candidate
 * for the heuristic — i.e. everything except the document's structural
 * wrappers. Including `<html>` / `<head>` / `<body>` would let a page-level
 * `class="main"` swallow the entire document and defeat the strip.
 * @param nodes
 * @param out
 */
function collectElements(nodes: readonly Node[], out: Element[]): void {
	for (const node of nodes) {
		if (!isElement(node)) {
			continue;
		}
		if (!STRUCTURAL_TAGS.has(node.tagName)) {
			out.push(node);
		}
		collectElements(node.childNodes, out);
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

const WHITESPACE = /\s+/;

/**
 *
 * @param element
 * @param needle
 */
function hasClassToken(element: Element, needle: string): boolean {
	const className = getAttr(element, 'class');
	if (className === undefined) {
		return false;
	}
	for (const token of className.split(WHITESPACE)) {
		if (token.length > 0 && token.toLowerCase().includes(needle)) {
			return true;
		}
	}
	return false;
}

/**
 *
 * @param element
 * @param needle
 */
function idIncludes(element: Element, needle: string): boolean {
	const id = getAttr(element, 'id');
	return id !== undefined && id.toLowerCase().includes(needle);
}

/**
 * ARIA `role` is a space-separated token list — a node with
 * `role="main banner"` should still count as a `main` landmark.
 * @param element
 * @param needle
 */
function hasRoleToken(element: Element, needle: string): boolean {
	const role = getAttr(element, 'role');
	if (role === undefined) {
		return false;
	}
	for (const token of role.split(WHITESPACE)) {
		if (token.length > 0 && token.toLowerCase() === needle) {
			return true;
		}
	}
	return false;
}
