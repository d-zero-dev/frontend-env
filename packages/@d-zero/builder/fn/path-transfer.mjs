import path from 'node:path';

/**
 * @typedef {Object} HtmlFile
 * @property {string} inputPath
 * @property {string} inputRoot
 * @property {string} outputRoot
 */

/**
 * @typedef {"file" | "directory" | "preserve"} PathFormat
 */

/**
 * @param {HtmlFile} htmlFile
 * @param {PathFormat} pathFormat
 */
export function pathTransfer(htmlFile, pathFormat) {
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
