import dz from '@d-zero/eslint-config';

/**
 * @type {import('eslint').Linter.Config[]}
 */
export default [
	...dz.configs.node,
	...dz.configs.frontend.map((config) => ({
		files: ['__assets/**/*'],
		...config,
	})),
	{
		files: ['**/*.cjs', '**/.textlintrc.js'],
		...dz.configs.commonjs,
	},
	{
		ignores: ['htdocs/**/*'],
	},
];
