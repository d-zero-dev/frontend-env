import type { HtmlFile, PathFormat } from './types.js';

import path from 'node:path';

export function pathTransfer(htmlFile: HtmlFile, pathFormat: PathFormat) {
	const inputRoot = htmlFile.inputRoot ?? process.cwd();
	const outputRoot = htmlFile.outputRoot ?? inputRoot ?? process.cwd();

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

	return newOutputPath;
}
