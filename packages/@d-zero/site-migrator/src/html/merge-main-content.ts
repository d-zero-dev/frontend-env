import type { DefaultTreeAdapterMap } from 'parse5';

import { parseFragment, serializeOuter } from 'parse5';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['childNode'];

export interface MergeMainContentOptions {
	/** `extractMainContent`が返した、マッチした要素の`outerHTML`（単一要素）。 */
	mainHtml: string;
	/** `renderBlocks`が返した、`<div class="...">...</div>`形のラッパー要素HTML。 */
	wrapperHtml: string;
	/** `main`要素自身の`classList`に追加するクラス名（`--content-class`の値）。 */
	contentClass: string;
}

/**
 * `renderBlocks`が生成したラッパー`<div>`の中身だけを取り出し、既存`main`要素（実際には
 * `extractMainContent`が判定したいずれかの要素）の子要素をそれで置き換え、`contentClass`を
 * `main`要素自身の`classList`に追加する。ラッパー`<div>`自体は使い捨てる — 新規ラッパー要素を
 * 追加で挟まず、BurgerEditorの`editableArea`セレクタが既存の`main`要素自身に一致する設計。
 * @param options
 * @example
 * ```ts
 * mergeMainContent({
 *   mainHtml: '<main class="l-main"><p>old</p></main>',
 *   wrapperHtml: '<div class="js-bge-content"><div data-bge-name="a">new</div></div>',
 *   contentClass: 'js-bge-content',
 * });
 * // => '<main class="l-main js-bge-content"><div data-bge-name="a">new</div></main>'
 * ```
 */
export function mergeMainContent(options: MergeMainContentOptions): string {
	const { mainHtml, wrapperHtml, contentClass } = options;

	const mainElement = parseSingleElement(mainHtml, 'mainHtml');
	const wrapperElement = parseSingleElement(wrapperHtml, 'wrapperHtml');

	// Replace by assigning a fresh copy of the array, not by detaching nodes
	// one at a time in a for-of over a live array — `childNodes` mutates on
	// every detach, which silently skips every other element mid-iteration.
	mainElement.childNodes = [...wrapperElement.childNodes];
	for (const child of mainElement.childNodes) {
		child.parentNode = mainElement;
	}

	addClassToken(mainElement, contentClass);

	return serializeOuter(mainElement);
}

/**
 * @param html
 * @param label
 */
function parseSingleElement(html: string, label: string): Element {
	const fragment = parseFragment(html);
	const element = fragment.childNodes.find((node): node is Element => isElement(node));
	if (!element) {
		throw new Error(`${label} did not parse to a single element: ${html}`);
	}
	return element;
}

/**
 * @param node
 */
function isElement(node: Node): node is Element {
	return 'tagName' in node && Array.isArray((node as Element).attrs);
}

/**
 * `class`属性に`token`をトークンとして追加する（既に含まれていれば何もしない）。属性自体が
 * 無ければ新規に追加する。
 * @param element
 * @param token
 */
function addClassToken(element: Element, token: string): void {
	const classAttr = element.attrs.find((attribute) => attribute.name === 'class');
	if (!classAttr) {
		element.attrs.push({ name: 'class', value: token });
		return;
	}
	const tokens = classAttr.value.split(/\s+/u).filter((value) => value.length > 0);
	if (!tokens.includes(token)) {
		classAttr.value = [...tokens, token].join(' ');
	}
}
