import path from 'node:path';

import pugPlugin from '@11ty/eleventy-plugin-pug';
import dayjs from 'dayjs';
import { load as yamlLoad } from 'js-yaml';

import { banner } from './defines.mjs';
import { htmlPlugin } from './eleventy-plugins/html.mjs';
import { scssPlugin } from './eleventy-plugins/scss.mjs';
import { tsPlugin } from './eleventy-plugins/ts.mjs';

const tempFolderName = path.resolve(process.cwd(), '.11ty');

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @returns
 */
export default function (eleventyConfig) {
	const isServe = process.env.NODE_ENV === 'serve';
	const outputCssDir = eleventyConfig.globalData.outputCssDir ?? 'css';
	const outputJsDir = eleventyConfig.globalData.outputJsDir ?? 'js';
	const outputImgDir = eleventyConfig.globalData.outputImgDir ?? 'img';

	const charset = isServe ? 'utf8' : (eleventyConfig.globalData.charset ?? 'utf8');

	const input = '__assets/htdocs';
	const output = isServe ? '.serve' : 'htdocs';
	const absInput = path.resolve(input);
	const alias = eleventyConfig.globalData?.alias?.['@'] ?? absInput;
	const relAlias = path.relative(absInput, alias);

	eleventyConfig.addFilter('date', (date, format) => {
		return dayjs(date).format(format);
	});

	/**
	 * @see https://github.com/terser/html-minifier-terser?tab=readme-ov-file#options-quick-reference
	 */
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

	eleventyConfig.addDataExtension('yml', (contents) => yamlLoad(contents));

	eleventyConfig.addPlugin(pugPlugin, {
		pretty: true,
		doctype: 'html',
		filters: eleventyConfig.javascript.filters,
	});

	eleventyConfig.addPlugin(htmlPlugin, {
		minifier: eleventyConfig.globalData.minifier,
		prettier: eleventyConfig.globalData.prettier ?? true,
		lineBreak: eleventyConfig.globalData.lineBreak,
		charset,
	});

	eleventyConfig.addPlugin(scssPlugin, {
		tmpDir: tempFolderName,
		banner: banner(),
		minify: eleventyConfig.globalData?.minifier?.minifyCSS ?? true,
		alias: eleventyConfig.globalData?.alias ?? {},
	});

	eleventyConfig.addPlugin(tsPlugin, {
		tmpDir: tempFolderName,
		banner: banner(),
	});

	return {
		passthroughFileCopy: true,
		dir: {
			input,
			output,
			layouts: '../_libs/component',
			data: '../_libs/data',
			outputCss: outputCssDir,
			outputJs: outputJsDir,
			outputImg: outputImgDir,
			includes: relAlias,
		},
	};
}
