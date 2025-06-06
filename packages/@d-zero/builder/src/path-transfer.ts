import type { HtmlFile, PathFormat } from './types.js';

import path from 'node:path';

/**
 *
 * @param htmlFile
 * @param pathFormat
 */
export function pathTransfer(htmlFile: HtmlFile, pathFormat: PathFormat) {
        const inputRoot = htmlFile.inputRoot ?? process.cwd();
        const outputRoot = htmlFile.outputRoot ?? inputRoot;

        const inputName = path.basename(htmlFile.inputPath, path.extname(htmlFile.inputPath));
        const inputDir = path.relative(inputRoot, path.dirname(htmlFile.inputPath));
        const outputDir = path.join(outputRoot, inputDir);
        const isRoot = outputDir === outputRoot;

        const defaultOutput = path.join(outputDir, inputName + '.html');

        if (pathFormat === 'file') {
                return inputName === 'index' && !isRoot ? path.join(outputDir, 'index.html') : defaultOutput;
        }

        if (pathFormat === 'directory' && inputName !== 'index') {
                return path.join(outputDir, inputName, 'index.html');
        }

        return defaultOutput;
}
