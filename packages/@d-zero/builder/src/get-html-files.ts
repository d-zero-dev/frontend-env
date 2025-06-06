import type { EleventyResult } from './eleventy.types.js';

import { pathComparator } from '@d-zero/shared/sort/path';

/**
 *
 * @param results
 */
export function getHtmlFiles(results: EleventyResult[][]) {
        return results
                .flatMap((result) =>
                        result.filter(
                                (file): file is EleventyResult =>
                                        'outputPath' in file && file.outputPath.endsWith('.html'),
                        ),
                )
                .toSorted((a, b) => pathComparator(a.inputPath, b.inputPath));
}
