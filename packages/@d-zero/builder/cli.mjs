#!/usr/bin/env node

import { rmSync } from 'node:fs';

import Eleventy from '@11ty/eleventy';

import { build } from './fn/build.mjs';

/**
 * Serve and watch mode
 */
const isServe = process.env.NODE_ENV === 'serve';

cleanUp();

const elev = new Eleventy(
	undefined, // inputDir is set from the Eleventy config file
	undefined, // outputDir is set from the Eleventy config file
	isServe
		? {
				runMode: 'serve',
				incremental: true,
			}
		: {
				quietMode: true,
			},
);

if (!isServe) {
	// Generate the site
	await build(elev);
	process.exit(0);
}

// Serve the site in watch mode
await elev.watch();
elev.serve();

// Clean up after the process is aborted
process.stdin.resume();
process.on('SIGINT', cleanUp);
process.on('SIGTERM', cleanUp);
process.on('exit', cleanUp);

/**
 * Clean up
 *
 * Remove the `.serve` and `.11ty-vite` directories
 * Before starting the build process.
 * Also, After aborting the process.
 */
function cleanUp() {
	process.stdout.write('🧹 Clean up');
	rmSync('.serve', { recursive: true, force: true });
	rmSync('.11ty-vite', { recursive: true, force: true });
}
