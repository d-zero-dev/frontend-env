import type { EleventyPlugin } from '../eleventy.types.js';
import type {
	Charset,
	CharsetOptions,
	EleventyGlobalData,
	HtmlHooks,
	ImageSizesOptions,
} from '../types.js';
import type { Options as HMTOptions } from 'html-minifier-terser';
import type { Options as PrettierOptions } from 'prettier';

import path from 'node:path';

import { characterEntities } from 'character-entities';
import { minify } from 'html-minifier-terser';
import iconv from 'iconv-lite';
import { minimatch } from 'minimatch';

import { isShiftJIS } from '../charset.js';
import { getContentCache, setContentCache } from '../content-cache.js';
import { domSerialize } from '../dom-serialize.js';
import { imageSizes } from '../image-sizes.js';
import { pathTransfer } from '../path-transfer.js';

type HtmlPluginOptions = {
	minifier?: HMTOptions;
	imageSizes?: ImageSizesOptions | boolean;
	prettier?: PrettierOptions | boolean;
	lineBreak?: '\n' | '\r\n';
	charset?: Charset | CharsetOptions;
	characterEntities?: boolean;
	isServe?: boolean;
	hooks?: HtmlHooks;
};

export const htmlPlugin: EleventyPlugin<HtmlPluginOptions, EleventyGlobalData> = (
	eleventyConfig,
	pluginConfig,
) => {
	eleventyConfig.addTransform('html', async function (content) {
		if (!this.page.inputPath || !(this.page.outputPath ?? '').endsWith('.html')) {
			return content;
		}

		const pathFormat = eleventyConfig.globalData.pathFormat ?? 'preserve';

		const transferred =
			pathFormat === 'preserve'
				? this.page.inputPath
				: pathTransfer({ inputPath: this.page.inputPath }, pathFormat);

		const outputPath =
			'/' +
			path
				.relative(
					path.join(process.cwd(), eleventyConfig.dir.input),
					path.format({ ...path.parse(transferred), base: '', ext: '.html' }),
				)
				.replaceAll(path.sep, '/');

		const imageSizesOptions = pluginConfig?.imageSizes ?? true;
		const afterSerialize = pluginConfig?.hooks?.afterSerialize ?? false;
		const characterEntitiesOptions = pluginConfig?.characterEntities ?? false;

		const prettierOptions = pluginConfig?.prettier ?? false;
		const minifierOptions = pluginConfig?.minifier ?? false;
		const lineBreakOptions = pluginConfig?.lineBreak ?? '\n';

		const isServe = pluginConfig.isServe ?? false;

		const replaceHook = pluginConfig?.hooks?.replace ?? false;

		const key = (
			[
				this.page.inputPath,
				this.page.outputPath,
				isServe.toString(),
				pathFormat,
				transferred,
				(!!pluginConfig?.hooks?.beforeSerialize).toString(),
				imageSizesOptions.toString(),
				(!!afterSerialize).toString(),
				characterEntitiesOptions.toString(),
				JSON.stringify(prettierOptions),
				minifierOptions.toString(),
				lineBreakOptions,
				(!!replaceHook).toString(),
				content,
			] as const satisfies string[]
		).join('');

		const { hash, output } = await getContentCache(key);
		if (output) {
			return output;
		}

		if (pluginConfig?.hooks?.beforeSerialize) {
			content = await pluginConfig.hooks.beforeSerialize(content, isServe);
		}

		if (imageSizesOptions || afterSerialize) {
			content = await domSerialize(content, async (elements, window) => {
				// Hooks
				if (imageSizesOptions) {
					const options = typeof imageSizesOptions === 'object' ? imageSizesOptions : {};
					const rootDir = path.resolve(eleventyConfig.dir.output);
					await imageSizes(elements, {
						rootDir,
						...options,
					});
				}

				if (afterSerialize) {
					await afterSerialize(elements, window, isServe);
				}
			});
		}

		if (characterEntitiesOptions) {
			for (const [entity, char] of Object.entries(characterEntities)) {
				let _entity = entity;
				const codePoint = char.codePointAt(0);
				if (codePoint != null && codePoint < 127) {
					continue;
				}
				if (
					/^[A-Z]+$/i.test(entity) &&
					characterEntities[entity.toLowerCase()] === char
				) {
					_entity = entity.toLowerCase();
				}
				content = content.replaceAll(char, `&${_entity};`);
			}
		}

		if (
			// Start with `<html` (For partial HTML)
			/^<html(?:\s|>)/i.test(content.trim()) &&
			// Not start with `<!doctype html`
			!/^<!doctype html/i.test(content.trim())
		) {
			// eleventy-pug-plugin does not support `doctype` option
			content = '<!DOCTYPE html>\n' + content;
		}

		if (prettierOptions) {
			const prettier = await import('prettier');
			const options = typeof prettierOptions === 'object' ? prettierOptions : {};
			const config = await prettier.resolveConfig(this.page.inputPath);
			content = await prettier.format(content, {
				parser: 'html',
				printWidth: 100_000,
				tabWidth: 2,
				useTabs: false,
				...config,
				...options,
			});
		}

		if (minifierOptions) {
			content = await minify(content, minifierOptions);
		}

		if (lineBreakOptions) {
			content = content.replaceAll(/\r?\n/g, lineBreakOptions);
		}

		if (replaceHook) {
			const filePath = this.page.outputPath;
			const dirPath = path.dirname(filePath);
			const relativePathFromBase =
				path.relative(dirPath, eleventyConfig.dir.output) || '.';

			content = await replaceHook(
				content,
				{
					filePath,
					dirPath,
					relativePathFromBase,
				},
				isServe,
			);
		}

		if (!isServe) {
			let charset =
				typeof pluginConfig.charset === 'string'
					? pluginConfig.charset
					: (pluginConfig.charset?.encoding ?? 'utf8');

			if (typeof pluginConfig.charset === 'object') {
				const overrides = pluginConfig.charset.overrides ?? [];
				for (const override of overrides) {
					if (override.paths.some((pattern) => minimatch(outputPath, pattern))) {
						charset = override.encoding;
					}
				}
			}

			if (charset && isShiftJIS(charset)) {
				content = content
					// Change charset
					.replaceAll(/<meta\s+charset="utf-?8"\s*\/?>/gi, `<meta charset="${charset}">`)
					// Change entities
					.replaceAll('©', '&copy;')
					.replaceAll('⚠️', 'WARNING')
					.replaceAll('〜', '&#12316;');

				// TODO: Support Buffer output cache
				return iconv.encode(content, 'CP932');
			}
		}

		await setContentCache(hash, content);
		return content;
	});
};
