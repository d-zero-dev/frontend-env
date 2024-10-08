import fs from 'node:fs/promises';
import path from 'node:path';

import { getHtmlFiles } from './get-html-files.mjs';
import { log } from './log.mjs';
import { pathTransfer } from './path-transfer.mjs';

/**
 *
 * @param {import('@11ty/eleventy')} elev
 */
export async function build(elev) {
	const results = await elev.write();

	const options = elev.config?.globalData ?? {};
	const inputDir = elev.config.dir.input;
	const outDir = elev.config.dir.output;

	const htmlFiles = getHtmlFiles(results);

	/**
	 * @type {string[][]}
	 */
	const outputLogTable = [['From', 'To', ...Object.keys(options)]];

	for (const htmlFile of htmlFiles) {
		const { outputPath, content } = await pathTransfer(
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

	log(outputLogTable);
}
