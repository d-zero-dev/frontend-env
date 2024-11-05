import { JSDOM } from 'jsdom';

export async function domSerialize(
	html: string,
	hook: (element: HTMLElement) => Promise<void> | void,
) {
	const dom = getDOM(html);

	await hook(dom.element);

	if (dom.isFragment) {
		return dom.element.outerHTML;
	}

	return dom.element.outerHTML;
}

function getDOM(html: string): {
	element: HTMLElement;
	document: Document;
	dom: JSDOM | null;
	isFragment: boolean;
} {
	const isFragment = !/^<html(?:\s|>)|^<!doctype\s/i.test(html.trim());

	if (isFragment) {
		const fragment = JSDOM.fragment(html);
		const document = fragment.ownerDocument;
		const tmpContainer = document.createElement('div');
		tmpContainer.append(fragment);
		const element = [...tmpContainer.children].find((el) => el instanceof HTMLElement);

		if (!element) {
			throw new Error('No HTMLElement in the fragment.');
		}

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
