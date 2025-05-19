import { JSDOM } from 'jsdom';

/**
 *
 * @param html
 * @param hook
 */
export async function domSerialize(
	html: string,
	hook: (element: HTMLElement, window: Window) => Promise<void> | void,
) {
	const dom = getDOM(html);
	await hook(dom.element, dom.window);
	return dom.element.outerHTML;
}

/**
 *
 * @param html
 */
function getDOM(html: string): {
	element: HTMLElement;
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
		const element = [...tmpContainer.children].find(
			(el) => el instanceof window.HTMLElement,
		);

		if (!element) {
			throw new Error('No HTMLElement in the fragment.');
		}

		return {
			element,
			document,
			window: window as unknown as Window,
			isFragment: true,
		};
	}

	const dom = new JSDOM(html);

	return {
		element: dom.window.document.documentElement,
		document: dom.window.document,
		window: dom.window as unknown as Window,
		isFragment: false,
	};
}
