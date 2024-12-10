import type { EleventyResult } from './eleventy.types.js';

import { pathComparator } from '@d-zero/shared/sort/path';

/**
 *
 * @param results
 */
export function getHtmlFiles(results: EleventyResult[][]) {
	return results
		.flatMap((result) =>
			result
				.map((file) => {
					if ('outputPath' in file && file.outputPath.endsWith('.html')) {
						return file;
					}
					return null;
				})
				.filter<EleventyResult>((file): file is EleventyResult => file !== null),
		)
		.toSorted((a, b) => pathComparator(a.inputPath, b.inputPath));
}
