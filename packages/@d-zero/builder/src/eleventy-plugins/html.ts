import type { EleventyPlugin } from '../eleventy.types.js';
import type {
	Charset,
	CharsetOptions,
	EleventyGlobalData,
	ImageSizesOptions,
} from '../types.js';
import type { Options as HMTOptions } from 'html-minifier-terser';
import type { Options as PrettierOptions } from 'prettier';

import path from 'node:path';

import { minify } from 'html-minifier-terser';
import iconv from 'iconv-lite';
import { minimatch } from 'minimatch';

import { isShiftJIS } from '../charset.js';
import { domSerialize } from '../dom-serialize.js';
import { imageSizes } from '../image-sizes.js';
import { pathTransfer } from '../path-transfer.js';

type HtmlPluginOptions = {
	minifier?: HMTOptions;
	imageSizes?: ImageSizesOptions | boolean;
	prettier?: PrettierOptions | boolean;
	lineBreak?: '\n' | '\r\n';
	charset?: Charset | CharsetOptions;
	isServe?: boolean;
};

export const htmlPlugin: EleventyPlugin<HtmlPluginOptions, EleventyGlobalData> = (
	eleventyConfig,
	pluginConfig,
) => {
	eleventyConfig.addTransform('html', async function (content) {
		if (!this.page.inputPath || !(this.page.outputPath ?? '').endsWith('.html')) {
			return content;
		}

		const transferred = pathTransfer(
			{
				inputPath: this.page.inputPath,
			},
			eleventyConfig.globalData.pathFormat ?? 'preserve',
		);

		const outputPath =
			'/' +
			path
				.relative(path.join(process.cwd(), eleventyConfig.dir.input), transferred)
				.replaceAll(path.sep, '/');

		content = await domSerialize(content, async (documentElement) => {
			// Hooks
			if (pluginConfig?.imageSizes ?? true) {
				const options =
					typeof pluginConfig.imageSizes === 'object' ? pluginConfig.imageSizes : {};
				const rootDir = path.resolve(eleventyConfig.dir.output);
				await imageSizes(documentElement, {
					rootDir,
					...options,
				});
			}
		});

		if (
			// Start with `<html` (For partial HTML)
			/^<html(?:\s|>)/i.test(content.trim()) &&
			// Not start with `<!doctype html`
			!/^<!doctype html/i.test(content.trim())
		) {
			// eleventy-pug-plugin does not support `doctype` option
			content = '<!DOCTYPE html>\n' + content;
		}

		if (pluginConfig?.prettier) {
			// eslint-disable-next-line import/no-extraneous-dependencies
			const prettier = await import('prettier');
			const options =
				typeof pluginConfig.prettier === 'object' ? pluginConfig.prettier : {};
			content = await prettier.format(content, {
				parser: 'html',
				printWidth: 100_000,
				tabWidth: 2,
				useTabs: false,
				...options,
			});
		}

		if (pluginConfig?.minifier) {
			content = await minify(content, pluginConfig.minifier);
		}

		if (pluginConfig?.lineBreak) {
			content = content.replaceAll(/\r?\n/g, pluginConfig.lineBreak);
		}

		if (pluginConfig.isServe) {
			return content;
		}

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

			return iconv.encode(content, 'CP932');
		}

		console.log({ outputPath, charset, content });

		return content;
	});
};
