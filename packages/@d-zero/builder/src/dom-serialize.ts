import { JSDOM } from 'jsdom';

import { getContentCache, setContentCache } from './content-cache.js';

/**
 *
 * @param html
 * @param hook
 */
export async function domSerialize(
	html: string,
	hook: (elements: Element[], window: Window) => Promise<void> | void,
) {
	const { hash, output } = await getContentCache(html);
	if (output) {
		return output;
	}
	const dom = getDOM(html);
	await hook(dom.elements, dom.window);
	const serialized = dom.elements.map((node) => node.outerHTML).join('');
	await setContentCache(hash, serialized);
	return serialized;
}

/**
 *
 * @param html
 */
function getDOM(html: string): {
	elements: Element[];
	document: Document;
	window: Window;
	isFragment: boolean;
} {
	const isFragment = !/^<html(?:\s|>)|^<!doctype\s/i.test(html.trim());

	if (isFragment) {
		const window = new JSDOM('').window;
		const document = window.document;
		const tmpContainer = document.createElement('div');
		tmpContainer.insertAdjacentHTML('beforeend', html);

		return {
			elements: [...tmpContainer.children],
			document,
			window: window as unknown as Window,
			isFragment: true,
		};
	}

	const dom = new JSDOM(html);

	return {
		elements: [dom.window.document.documentElement],
		document: dom.window.document,
		window: dom.window as unknown as Window,
		isFragment: false,
	};
}
