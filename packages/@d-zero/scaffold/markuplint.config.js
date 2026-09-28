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
	overrides: {
		...extended.overrides,
		'__assets/_libs/component/c-form-input-select.pug': {
			rules: {
				// options が動的なため静的解析で判定できない。プレースホルダーは呼び出し側が先頭に渡すこと
				'placeholder-label-option': false,
			},
		},
	},
};
