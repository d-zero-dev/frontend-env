import { extendsConfig } from '@d-zero/markuplint-config';

const extended = extendsConfig({
	// classNaming: ['/^splide(?:__[a-z]+)?$/'],
});

/**
 * @type {import('@markuplint/ml-config').Config}
 */
export default {
	...extended,
	extends: [...extended.extends, '@d-zero/markuplint-config/jsx'],
	parserOptions: {
		...extended.parserOptions,
		ignoreFrontMatter: true,
	},
	nodeRules: [
		...extended.nodeRules,
		{
			// The JSX parser does not expand components, so it cannot see the `title` and
			// `meta[charset]` that the `Meta` component writes into the `head`.
			selector: 'head:has(> Meta)',
			rules: {
				'html-standard/permitted-contents': false,
				'html-standard/head-charset-utf8': false,
				'performance/head-charset-utf8': false,
			},
		},
		{
			// Revert requiring `width` and `height` attributes from the preset config.
			// @see https://github.com/markuplint/markuplint/blob/dev/packages/%40markuplint/config-presets/src/preset.performance.json
			// Due to assigning them automatically by the build process.
			selector: 'img[src]',
			rules: {
				'require-attr': false,
			},
		},
		{
			selector: '.c-pagination a',
			rules: {
				'require-attr': false,
			},
		},
	],
};
