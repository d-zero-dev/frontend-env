import path from 'node:path';

import { changeCharset } from './charset.mjs';
import { lineBreak } from './line-break.mjs';
import { minifier } from './minifier.mjs';
import { prettier } from './prettier.mjs';
import { replaceExt } from './replace-ext.mjs';

/**
 * @typedef {Object} HtmlFile
 * @property {string} inputPath
 * @property {string} inputRoot
 * @property {string} outputRoot
 * @property {string} url
 * @property {string} content
 */

/**
 * @typedef {Object} Options
 * @property {import("html-minifier-terser").Options} minifier
 * @property {boolean} prettier
 * @property {"\n" | "\r\n"} lineBreak
 * @property {string} charset
 * @property {"file" | "directory" | "preserve"} pathFormat
 */

/**
 * @param {HtmlFile} htmlFile
 * @param {Options} options
 */
export async function convert(htmlFile, options = {}) {
	const inputRoot = htmlFile.inputRoot ?? process.cwd();
	const outputRoot = htmlFile.outputRoot ?? inputRoot ?? process.cwd();
	const pathFormat = options.pathFormat ?? 'preserve';

	const inputName = path.basename(htmlFile.inputPath, path.extname(htmlFile.inputPath));
	const inputDir = path.relative(inputRoot, path.dirname(htmlFile.inputPath));
	const outputDir = path.join(outputRoot, inputDir);
	const isRoot = outputDir === outputRoot;

	let newOutputPath = path.join(outputDir, inputName + '.html');

	switch (pathFormat) {
		case 'file': {
			if (inputName === 'index' && !isRoot) {
				newOutputPath = outputDir + '.html';
				break;
			}
			break;
		}
		case 'directory': {
			if (inputName !== 'index') {
				newOutputPath = path.join(outputDir, inputName, 'index.html');
			}
			break;
		}
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
