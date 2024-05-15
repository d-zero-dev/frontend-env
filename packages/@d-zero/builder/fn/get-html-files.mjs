import { pathComparator } from '@d-zero/shared/sort/path';

/**
 * @typedef {Object} EleventyResultFile
 * @property {string} inputPath
 * @property {string} outputPath
 * @property {string} url
 * @property {string} content
 */

/**
 * @param {EleventyResultFile[][]} results - Eleventyの結果
 * @returns {EleventyResultFile[]}
 */
export function getHtmlFiles(results) {
	return results
		.flatMap((result) =>
			result
				.map((file) => {
					if ('outputPath' in file && file.outputPath.endsWith('.html')) {
						return file;
					}
				})
				.filter(Boolean),
		)
		.toSorted(
			/**
			 *
			 * @param {EleventyResultFile} a
			 * @param {EleventyResultFile} b
			 * @returns
			 */
			(a, b) => pathComparator(a.inputPath, b.inputPath),
		);
}
