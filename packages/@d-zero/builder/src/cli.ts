// @ts-ignore
import Eleventy from '@11ty/eleventy';

import { build } from './build.js';

export async function cli() {
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
