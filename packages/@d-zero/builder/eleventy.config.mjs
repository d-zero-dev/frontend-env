import path from 'node:path';

import pugPlugin from '@11ty/eleventy-plugin-pug';
import dayjs from 'dayjs';
import { load as yamlLoad } from 'js-yaml';

import { decode } from './decode.mjs';
import { banner } from './defines.mjs';
import { htmlPlugin } from './eleventy-plugins/html.mjs';
import { reportPlugin } from './eleventy-plugins/report.mjs';
import { scriptPlugin } from './eleventy-plugins/script.mjs';
import { stylePlugin } from './eleventy-plugins/style.mjs';
import { pathTransformRouter } from './path-transform-router.mjs';
import { ssi } from './ssi.mjs';

const tempFolderName = path.resolve(process.cwd(), '.11ty');

/**
 * @typedef {Object} DZBuilderConfig
 * @property {Record<string, string>} [alias] Alias for the path to the directory containing the components.
 * @property {string} [outputCssDir='css'] Output directory for CSS files.
 * @property {string} [outputJsDir='js'] Output directory for JavaScript files.
 * @property {string} [outputImgDir='img'] Output directory for image files.
 * @property {boolean | import("prettier").Config} [prettier=true] Prettier options.
 * @property {Record<string, boolean>} [minifier] Minifier options.
 * @property {"\n" | "\r\n"} [lineBreak] Line break.
 * @property {string} [charset='utf8'] Character encoding.
 * @property {import("./fn/path-transfer.mjs").PathFormat} [pathFormat] Path format.
 * @property {boolean} [autoDecode] Automatically decode the content on the dev server.
 * @property {Record<string, import("./ssi.mjs").SSIOptions>} [ssi] Server Side Include options on the dev server.
 */

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @param {DZBuilderConfig} options
 * @returns
 */
export default function (eleventyConfig, options) {
	const isServe = process.env.ELEVENTY_RUN_MODE === 'serve';
	const outputCssDir = options.outputCssDir ?? 'css';
	const outputJsDir = options.outputJsDir ?? 'js';
	const outputImgDir = options.outputImgDir ?? 'img';

	const charset = isServe ? 'utf8' : (options.charset ?? 'utf8');

	const input = '__assets/htdocs';
	const output = 'htdocs';
	const absInput = path.resolve(input);
	const alias = options?.alias?.['@'] ?? absInput;
	const relAlias = path.relative(absInput, alias);

	/**
	 * Use `pathFormat` in build process
	 * @see file://./fn/build.mjs
	 */
	eleventyConfig.addGlobalData('pathFormat', options.pathFormat);

	eleventyConfig.addFilter('date', (date, format) => {
		return dayjs(date).format(format);
	});

	eleventyConfig.addDataExtension('yml', (contents) => yamlLoad(contents));

	eleventyConfig.addPlugin(pugPlugin, {
		pretty: true,
		doctype: 'html',
		filters: eleventyConfig.javascript.filters,
	});

	eleventyConfig.addPlugin(htmlPlugin, {
		/**
		 * @see https://github.com/terser/html-minifier-terser?tab=readme-ov-file#options-quick-reference
		 */
		minifier: {
			collapseWhitespace: false,
			collapseBooleanAttributes: true,
			removeComments: false,
			removeRedundantAttributes: true,
			removeScriptTypeAttributes: true,
			removeStyleLinkTypeAttributes: true,
			useShortDoctype: false,
			minifyCSS: true,
			minifyJS: true,
			...options.minifier,
		},
		prettier: options.prettier ?? true,
		lineBreak: options.lineBreak,
		charset,
	});

	eleventyConfig.addPlugin(stylePlugin, {
		tmpDir: tempFolderName,
		banner: banner(),
		minify: options?.minifier?.minifyCSS ?? true,
		alias: options?.alias ?? {},
	});

	eleventyConfig.addPlugin(scriptPlugin, {
		tmpDir: tempFolderName,
		banner: banner(),
	});

	eleventyConfig.addPlugin(reportPlugin);

	eleventyConfig.setServerOptions(
		{
			liveReload: true,
			domDiff: true,
			port: 8080,
			showAllHosts: false,
			encoding: 'utf8',
			onRequest: {
				'/*': async ({ url }) => {
					const content = await pathTransformRouter({ output })({ url });
					if (!content) {
						return;
					}

					/**
					 * This is guaranteed to be UTF-8 encoded.
					 */
					let html = decode(content.body, options.autoDecode);

					if (options.ssi) {
						html = await ssi(html, {
							url,
							output,
							ssi: options.ssi,
						});
					}

					return html;
				},
			},
		},
		true,
	);

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
