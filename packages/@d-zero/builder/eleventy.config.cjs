const EleventyVitePlugin = require('@11ty/eleventy-plugin-vite');
const dayjs = require('dayjs');
const yaml = require('js-yaml');

const { INLINE_SCRIPT_FILE_DELETE_ID } = require('./const.cjs');

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @returns
 */
module.exports = function (eleventyConfig) {
	const isServe = process.env.NODE_ENV === 'serve';

	global.filters = eleventyConfig.javascriptFunctions;

	eleventyConfig.addFilter('date', (date, format) => {
		return dayjs(date).format(format);
	});

	eleventyConfig.addGlobalData('minifier', {
		collapseWhitespace: false,
		collapseBooleanAttributes: true,
		removeComments: false,
		removeRedundantAttributes: true,
		removeScriptTypeAttributes: true,
		removeStyleLinkTypeAttributes: true,
		useShortDoctype: false,
		minifyCSS: true,
		minifyJS: true,
		...eleventyConfig.globalData.minifier,
	});

	eleventyConfig.setPugOptions({
		pretty: true,
		doctype: 'html',
		filters: global.filters,
		...eleventyConfig.getMergingConfigObject().pugOptions,
	});

	eleventyConfig.addDataExtension('yml', (contents) => yaml.load(contents));

	eleventyConfig.addPassthroughCopy('__assets/htdocs', {
		dot: false,
	});

	eleventyConfig.addPlugin(EleventyVitePlugin, {
		tempFolderName: '.11ty-vite',
		viteOptions: {
			root: '__assets/htdocs',
			publicDir: '@static',
			clearScreen: false,
			server: {
				mode: 'development',
				middlewareMode: true,
			},
			build: {
				target: 'modules',
				polyfillModulePreload: false,
				mode: 'production',
				sourcemap: false,
				cssCodeSplit: false,
				rollupOptions: {
					output: {
						assetFileNames: ({ name }) => {
							if (name.endsWith('.css')) {
								return `css/${name}`;
							}
							return `img/${name}`;
						},
						chunkFileNames: () => 'js/[name].js',
						entryFileNames: () => INLINE_SCRIPT_FILE_DELETE_ID,
					},
				},
			},
			resolve: {
				alias: eleventyConfig.globalData.alias,
			},
		},
	});

	return {
		templateFormats: ['pug', 'html'],
		htmlTemplateEngine: 'pug',
		passthroughFileCopy: true,
		dir: {
			input: '__assets/htdocs',
			output: isServe ? '.serve' : 'htdocs',
			layouts: '../_libs/component',
			data: '../_libs/data',
		},
	};
};
