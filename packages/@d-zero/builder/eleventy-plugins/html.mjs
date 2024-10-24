import { minify } from 'html-minifier-terser';
import iconv from 'iconv-lite';

import { isShiftJIS } from '../fn/charset.mjs';

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @param {Object} pluginConfig
 * @param {import("html-minifier-terser").Options} pluginConfig.minifier
 * @param {import("prettier").Options} pluginConfig.prettier
 * @param {"\n" | "\r\n"} pluginConfig.lineBreak
 * @param {string} pluginConfig.charset
 * @returns
 */
export function htmlPlugin(eleventyConfig, pluginConfig) {
	eleventyConfig.addTransform('html', async function (content) {
		if (!(this.page.outputPath ?? '').endsWith('.html')) {
			return content;
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

		if (pluginConfig.prettier) {
			// eslint-disable-next-line import/no-extraneous-dependencies
			const prettier = await import('prettier');
			content = await prettier.format(content, {
				parser: 'html',
				printWidth: 100_000,
				tabWidth: 2,
				useTabs: false,
				...pluginConfig.prettier,
			});
		}

		if (pluginConfig.minifier) {
			content = await minify(content, pluginConfig.minifier);
		}

		if (pluginConfig.lineBreak) {
			content = content.replaceAll(/\r?\n/g, pluginConfig.lineBreak);
		}

		const charset = pluginConfig.charset.toLowerCase().trim();
		if (isShiftJIS(charset)) {
			content = content
				// Change charset
				.replaceAll(/<meta\s+charset="utf-?8"\s*\/?>/gi, `<meta charset="${charset}">`)
				// Change entities
				.replaceAll('©', '&copy;')
				.replaceAll('⚠️', 'WARNING')
				.replaceAll('〜', '&#12316;');

			content = iconv.encode(content, 'CP932');
		}

		return content;
	});
}
