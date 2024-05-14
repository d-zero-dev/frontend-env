import path from 'node:path';

import { changeCharset } from './charset.mjs';
import { lineBreak } from './line-break.mjs';
import { minifier } from './minifier.mjs';
import { prettier } from './prettier.mjs';
import { replaceExt } from './replace-ext.mjs';

/**
 * @typedef {Object} HtmlFile
 * @property {string} inputPath
 * @property {string} outputPath
 * @property {string} url
 * @property {string} content
 */

/**
 * @typedef {Object} Options
 * @property {import("html-minifier-terser").Options} minifier
 * @property {boolean} prettier
 * @property {"\n" | "\r\n"} lineBreak
 * @property {string} charset
 */

/**
 * @param {HtmlFile} htmlFile
 * @param {Options} options
 */
export async function convert(htmlFile, options) {
	const inputName = path.basename(htmlFile.inputPath, path.extname(htmlFile.inputPath));
	const outDir = path.dirname(htmlFile.outputPath);

	let newOutputPath = htmlFile.outputPath;

	if (inputName !== 'index') {
		const outExt = path.extname(htmlFile.outputPath);
		newOutputPath = outDir + outExt;
	}

	let content = htmlFile.content;

	content = replaceExt(content);

	if (options.prettier) {
		content = await prettier(content);
	}

	if (options.minifier) {
		content = await minifier(content, options.minifier);
	}

	if (options.lineBreak) {
		content = lineBreak(content, options.lineBreak);
	}

	if (options.charset) {
		content = await changeCharset(content, options.charset);
	}

	return {
		content,
		outputPath: newOutputPath,
	};
}
