import type { EleventyPlugin } from '../eleventy.types.js';
import type { EleventyGlobalData } from '../types.js';
import type { Options as HMTOptions } from 'html-minifier-terser';
import type { Options as PrettierOptions } from 'prettier';

import fs from 'node:fs/promises';
import path from 'node:path';

import { compileCss } from '../compiler/css.js';
import { compileSass } from '../compiler/sass.js';

type StylePluginConfig = {
	banner: string;
	minify?: HMTOptions['minifyCSS'];
	alias: Record<string, string>;
	prettier?: PrettierOptions | boolean;
	tmpDir: string;
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
					const prettierOptions = pluginConfig.prettier ?? false;
					content = await prettifyCss(content, inputPath, prettierOptions);
				}

				return `${pluginConfig.banner}\n${content}`;
			};
		},
	});

	eleventyConfig.addTemplateFormats('scss');
	eleventyConfig.addExtension('scss', {
		outputFileExtension: 'css',
		compile(_, inputPath) {
			return async () => {
				const absInputPath = path.resolve(inputPath);
				const cssMinify = !!(pluginConfig.minify ?? true);

				let content = await compileSass(absInputPath, {
					minify: cssMinify,
					alias: pluginConfig.alias,
					tmpDir: pluginConfig.tmpDir,
				});

				if (!cssMinify) {
					const prettierOptions = pluginConfig.prettier ?? false;
					content = await prettifyCss(content, inputPath, prettierOptions);
				}

				return `${pluginConfig.banner}\n${content}`;
			};
		},
	});

	eleventyConfig.on('eleventy.after', async () => {
		await fs.rm(pluginConfig.tmpDir, {
			recursive: true,
			force: true,
		});
	});
};

/**
 *
 * @param content
 * @param inputPath
 * @param prettierOptions
 */
async function prettifyCss(
	content: string,
	inputPath: string,
	prettierOptions: PrettierOptions | boolean,
) {
	const prettier = await import('prettier');
	const options = typeof prettierOptions === 'object' ? prettierOptions : {};
	const config = await prettier.resolveConfig(inputPath);
	return await prettier.format(content, {
		parser: 'css',
		tabWidth: 2,
		useTabs: false,
		...options,
		...config,
	});
}
