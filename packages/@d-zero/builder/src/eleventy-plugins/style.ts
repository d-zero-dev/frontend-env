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
					alias: pluginConfig.alias,
				});

				if (!cssMinify) {
					content = await prettifyCss(content);
				}

				return `${pluginConfig.banner}\n${content}`;
			};
		},
	});
};

/**
 *
 * @param content
 */
async function prettifyCss(content: string) {
	const prettier = await import('prettier');
	return await prettier.format(content, {
		parser: 'css',
		tabWidth: 2,
		useTabs: false,
	});
}
