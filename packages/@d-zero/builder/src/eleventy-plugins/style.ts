import type { EleventyPlugin } from '../eleventy.types.js';
import type { EleventyGlobalData } from '../types.js';
import type { Options as HMTOptions } from 'html-minifier-terser';
import type { Options as PrettierOptions } from 'prettier';

import path from 'node:path';

import { compileCss } from '../compiler/css.js';

type StylePluginConfig = {
	banner: string;
	minify?: HMTOptions['minifyCSS'];
	alias: Record<string, string>;
	prettier?: PrettierOptions | boolean;
};

export const stylePlugin: EleventyPlugin<StylePluginConfig, EleventyGlobalData> = (
	eleventyConfig,
	pluginConfig,
) => {
	eleventyConfig.addTemplateFormats('css');

	eleventyConfig.addExtension('css', {
		outputFileExtension: 'css',
		compile(css, inputPath) {
			return async () => {
				const absInputPath = path.resolve(inputPath);
				const cssMinify = !!(pluginConfig.minify ?? true);

				let content = await compileCss(css, absInputPath, {
					banner: pluginConfig.banner,
					minify: cssMinify,
					alias: pluginConfig.alias,
				});

				if (!cssMinify) {
					const prettier = await import('prettier');
					content = await prettier.format(content, {
						parser: 'css',
						tabWidth: 2,
						useTabs: false,
					});
				}

				return `${pluginConfig.banner}\n${content}`;
			};
		},
	});
};
