import type { Eleventy } from './eleventy.types.js';
import type { EleventyGlobalData, OutputTableRow } from './types.js';

import fs from 'node:fs/promises';
import path from 'node:path';

import { getHtmlFiles } from './get-html-files.js';
import { log } from './log.js';
import { pathTransfer } from './path-transfer.js';

/**
 *
 * @param elev
 */
export async function build(elev: Eleventy<EleventyGlobalData>) {
	const results = await elev.write();

	const pathFormat = elev.config.globalData?.pathFormat ?? 'preserve';
	const inputDir = elev.config.dir.input;
	const outDir = elev.config.dir.output;

	const htmlFiles = getHtmlFiles(results);

	const outputLogTable: OutputTableRow[] = [];

	for (const htmlFile of htmlFiles) {
		const outputPath = pathTransfer(
			{
				...htmlFile,
				inputRoot: inputDir,
				outputRoot: outDir,
			},
			pathFormat,
		);

		if (path.resolve(htmlFile.outputPath) !== path.resolve(outputPath)) {
			await fs.copyFile(htmlFile.outputPath, outputPath);
			await fs.unlink(htmlFile.outputPath);
			const outDir = path.dirname(htmlFile.outputPath);
			const dirFiles = await fs.readdir(outDir);
			if (dirFiles.length === 0) {
				await fs.rmdir(outDir);
			}
		}

		outputLogTable.push([
			path.relative(inputDir, htmlFile.inputPath),
			path.relative(outDir, htmlFile.outputPath),
			path.relative(outDir, outputPath),
		]);
	}

	log(outputLogTable, pathFormat);
}
