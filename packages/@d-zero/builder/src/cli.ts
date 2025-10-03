// @ts-ignore
import Eleventy from '@11ty/eleventy';

import { build } from './build.js';
import { clearAllContentCache } from './content-cache.js';

/**
 *
 */
export async function cli() {
	const clearOptions = process.argv.includes('--clear-cache');

	if (clearOptions) {
		await clearAllContentCache();
	}

	const elev = new Eleventy(
		undefined, // inputDir is set from the Eleventy config file
		undefined, // outputDir is set from the Eleventy config file
		{
			quietMode: true,
		},
	);

	// Generate the site
	await build(elev);
}
