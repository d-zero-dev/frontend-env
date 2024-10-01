import fs from 'node:fs/promises';
import path from 'node:path';

import { glob } from 'glob';

import Const from '../const.cjs';

import { buildCss } from './build-css.mjs';
import { convert } from './convert.mjs';
import { getHtmlFiles } from './get-html-files.mjs';
import { log } from './log.mjs';

const { INLINE_SCRIPT_FILE_DELETE_ID } = Const;

/**
 *
 * @param {import('@11ty/eleventy')} elev
 */
export async function build(elev) {
	const results = await elev.write();

	const options = elev.config?.globalData ?? {};
	const inputDir = elev.config.dir.input;
	const outDir = elev.config.dir.output;

	const cssFiles = await glob(
		path.resolve(elev.config.dir.input, elev.config.dir.outputCss, '**', '*.scss'),
	);
	for (const file of cssFiles) {
		const name = path.basename(file, path.extname(file));
		const out = await buildCss(
			file,
			path.resolve(elev.config.dir.output, elev.config.dir.outputCss, `${name}.css`),
			options,
		);
	}

	const htmlFiles = getHtmlFiles(results);

	/**
	 * @type {string[][]}
	 */
	const outputLogTable = [['From', 'To', ...Object.keys(options)]];

	for (const htmlFile of htmlFiles) {
		const { outputPath, content } = await convert(
			{
				...htmlFile,
				inputRoot: inputDir,
				outputRoot: outDir,
			},
			options,
		);

		await fs.writeFile(outputPath, content, 'utf8');

		if (outputPath !== htmlFile.outputPath) {
			await fs.unlink(htmlFile.outputPath);
			const outDir = path.dirname(htmlFile.outputPath);
			const dirFiles = await fs.readdir(outDir);
			if (dirFiles.length === 0) {
				await fs.rmdir(outDir);
			}
		}

		outputLogTable.push([
			//
			path.relative(outDir, outputPath),
			path.relative(inputDir, htmlFile.inputPath),
			...Object.values(options),
		]);
	}

	const files = await fs.readdir(outDir);

	for (const file of files) {
		if (file.startsWith(INLINE_SCRIPT_FILE_DELETE_ID)) {
			await fs.unlink(path.resolve(outDir, file));
		}
	}

	log(outputLogTable);
}
