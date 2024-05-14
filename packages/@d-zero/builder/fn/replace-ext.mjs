import { JSDOM } from 'jsdom';

/**
 *
 * @param {string} html
 */
export function replaceExt(html) {
	const jsdom = new JSDOM(html);

	const scripts = jsdom.window.document.querySelectorAll('script');
	for (const script of scripts) {
		const src = script.getAttribute('src');
		if (src?.endsWith('.ts')) {
			script.src = src.replace('.ts', '.js');
		}
	}

	const styles = jsdom.window.document.querySelectorAll('link[rel="stylesheet"]');
	for (const style of styles) {
		const href = style.getAttribute('href');
		if (href?.endsWith('.scss')) {
			style.href = href.replace('.scss', '.css');
		}
	}

	return jsdom.serialize();
}
