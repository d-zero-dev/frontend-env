import type { EleventyConfig } from './eleventy.types.js';
import type { DZBuilderConfig, EleventyGlobalData } from './types.js';

import path from 'node:path';

import dayjs from 'dayjs';
import { load as yamlLoad } from 'js-yaml';

import { createBanner, defaultBanner } from './banner.js';
import { decode } from './decode.js';
import { htmlPlugin } from './eleventy-plugins/html.js';
import { pugPlugin } from './eleventy-plugins/pug.js';
import { reportPlugin } from './eleventy-plugins/report.js';
import { scriptPlugin } from './eleventy-plugins/script.js';
import { stylePlugin } from './eleventy-plugins/style.js';
import { insertReloadClient } from './insert-reload-client.js';
import { pathTransformRouter } from './path-transform-router.js';
import { ssi } from './ssi.js';

const tempFolderName = path.resolve(process.cwd(), '.11ty');

/**
 *
 * @param eleventyConfig
 * @param options
 */
export default function (
	eleventyConfig: EleventyConfig<EleventyGlobalData>,
	options: DZBuilderConfig,
) {
	const isServe = process.env.ELEVENTY_RUN_MODE === 'serve';
	const outputCssDir = options.outputCssDir ?? 'css';
	const outputJsDir = options.outputJsDir ?? 'js';
	const outputImgDir = options.outputImgDir ?? 'img';

	const input = '__assets/htdocs';
	const output = 'htdocs';
	const absInput = path.resolve(input);
	const alias = options?.alias?.['@'] ?? absInput;
	const relAlias = path.relative(absInput, alias);

	const banner =
		typeof options.banner === 'string'
			? options.banner
			: createBanner(options.banner?.() ?? defaultBanner());

	eleventyConfig.addGlobalData('alias', options.alias);
	eleventyConfig.addGlobalData('pathFormat', options.pathFormat);
	eleventyConfig.addGlobalData('minifier', options.minifier);

	eleventyConfig.addFilter('date', (date, format) => {
		return dayjs(date).format(format);
	});

	eleventyConfig.addDataExtension('yml', (contents) => yamlLoad(contents) as string);

	eleventyConfig.addPlugin(pugPlugin, {
		pretty: true,
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
		prettier: options.prettier,
		lineBreak: options.lineBreak,
		imageSizes: options.imageSizes,
		charset: options.charset,
		characterEntities: options.characterEntities,
		isServe,
	});

	eleventyConfig.addPlugin(stylePlugin, {
		tmpDir: tempFolderName,
		banner,
		minify: options?.minifier?.minifyCSS ?? true,
		alias: options?.alias ?? {},
	});

	eleventyConfig.addPlugin(scriptPlugin, {
		tmpDir: tempFolderName,
		banner,
	});

	eleventyConfig.addPlugin(reportPlugin);

	eleventyConfig.setServerOptions(
		{
			liveReload: true,
			domDiff: options.ssi ? false : true,
			port: 8080,
			showAllHosts: false,
			encoding: 'utf8',
			onRequest: {
				'/*': async ({ url }) => {
					const content = await pathTransformRouter({ output })({ url });
					if (!content) {
						return;
					}

					if (content.body instanceof Buffer) {
						content.body = insertReloadClient(content.body);
					}

					/**
					 * This is guaranteed to be UTF-8 encoded.
					 */
					const html = decode(content.body, options.autoDecode ?? false);

					if (options.ssi) {
						return await ssi(html, {
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
