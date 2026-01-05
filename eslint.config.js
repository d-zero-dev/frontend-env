import path from 'node:path';

import dz from '@d-zero/eslint-config';

import scaffold from './packages/@d-zero/scaffold/eslint.config.js';

/**
 * @type {import('eslint').Linter.Config[]}
 */
export default [
	...dz.configs.node,
	...scaffold,
	{
		files: ['**/{*.{config,spec}.{js,mjs,ts},*.*rc,*.*rc.{js,mjs}}'],
		rules: {
			'import-x/no-extraneous-dependencies': 0,
		},
	},
	{
		files: ['**/.storybook/**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: [path.resolve('packages/@d-zero/custom-components/tsconfig.json')],
			},
		},
	},
	{
		ignores: [
			...scaffold.flatMap(
				(config) =>
					config.ignores?.map((ignorePath) =>
						path.join('packages', '@d-zero', 'scaffold', ignorePath),
					) ?? [],
			),
			'**/dist/**/*',
			'**/storybook-static/**/*',
		],
	},
];
