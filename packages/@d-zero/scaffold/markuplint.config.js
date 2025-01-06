import { extendsConfig } from '@d-zero/markuplint-config';

const extended = extendsConfig({
	// classNaming: ['/^splide(?:__[a-z]+)?$/'],
});

export default {
	...extended,
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
};
