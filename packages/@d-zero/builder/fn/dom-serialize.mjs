import { JSDOM } from 'jsdom';

/**
 *
 * @param {string} html
 * @param {(element: HTMLElement) => Promise<void> | void} hook
 * @returns {Promise<string>}
 */
export async function domSerialize(html, hook) {
	const dom = getDOM(html);

	await hook(dom.element);

	if (dom.isFragment) {
		return dom.element.outerHTML;
	}

	return dom.element.outerHTML;
}

function getDOM(html) {
	const isFragment = !/^<html(?:\s|>)|^<!doctype\s/i.test(html.trim());

	if (isFragment) {
		const fragment = JSDOM.fragment(html);
		const document = fragment.ownerDocument;
		const tmpContainer = document.createElement('div');
		tmpContainer.append(fragment);
		const element = tmpContainer.firstChild;

		return {
			element,
			document,
			dom: null,
			isFragment: true,
		};
	}

	const dom = new JSDOM(html);

	return {
		element: dom.window.document.documentElement,
		document: dom.window.document,
		dom,
		isFragment: false,
	};
}
