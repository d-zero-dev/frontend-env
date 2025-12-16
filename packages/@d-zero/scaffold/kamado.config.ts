import type { UserConfig } from 'kamado/config';

import path from 'node:path';

import { pageCompiler } from '@kamado-io/page-compiler';
import { createCompileHooks } from '@kamado-io/pug-compiler';
import { scriptCompiler } from '@kamado-io/script-compiler';
import { styleCompiler } from '@kamado-io/style-compiler';

/**
 * @type {import('kamado/config').UserConfig}
 */
export default {
	dir: {
		root: import.meta.dirname,
		input: path.resolve(import.meta.dirname, '__assets', 'htdocs'),
		output: path.resolve(import.meta.dirname, 'htdocs'),
	},
	devServer: {
		open: true,
		port: 8000,
	},
	compilers: {
		page: pageCompiler({
			globalData: {
				dir: path.resolve(import.meta.dirname, '__assets', '_libs', 'data'),
			},
			layouts: {
				dir: path.resolve(import.meta.dirname, '__assets', '_libs', 'layouts'),
			},
			compileHooks: createCompileHooks({
				pathAlias: path.resolve(import.meta.dirname, '__assets', '_libs'),
			}),
		}),
		style: styleCompiler({
			alias: {
				'@': path.resolve(import.meta.dirname, '__assets', '_libs'),
			},
		}),
		script: scriptCompiler({
			minifier: true,
			alias: {
				'@': path.resolve(import.meta.dirname, '__assets', '_libs'),
			},
		}),
	},
} as const satisfies UserConfig;
