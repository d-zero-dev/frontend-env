import { minify } from 'html-minifier-terser';

/**
 *
 * @param {string} content
 * @param {import("html-minifier-terser").Options} options
 */
export async function minifier(content, options) {
	return await minify(content, options);
}
