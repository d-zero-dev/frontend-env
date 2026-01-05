import { extendsConfig } from '@d-zero/markuplint-config';

const extended = extendsConfig({
	// classNaming: ['/^splide(?:__[a-z]+)?$/'],
});

/**
 * @type {import('@markuplint/ml-config').Config}
 */
export default {
	...extended,
	parserOptions: {
		...extended.parserOptions,
		ignoreFrontMatter: true,
	},
	nodeRules: [
		...extended.nodeRules,
		{
			// Revert requiring `width` and `height` attributes from the preset config.
			// @see https://github.com/markuplint/markuplint/blob/dev/packages/%40markuplint/config-presets/src/preset.performance.json
			// Due to assigning them automatically by the build process.
			selector: 'img[src]',
			rules: {
				'required-attr': false,
			},
		},
		{
			selector: '.c-pagination a',
			rules: {
				'required-attr': false,
			},
		},
	],
	// overrides: {
	// 	...extended.overrides,
	// 	'**/*.pug': {
	// 		...
	// 	},
	// },
};
