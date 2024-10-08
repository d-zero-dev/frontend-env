import fs from 'node:fs/promises';
import path from 'node:path';

import esbuild from 'esbuild';

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @param {Object} pluginConfig
 * @param {string} pluginConfig.tmpDir
 * @param {string} pluginConfig.banner
 * @returns
 */
export function scriptPlugin(eleventyConfig, pluginConfig) {
	eleventyConfig.addTemplateFormats('js');
	eleventyConfig.addTemplateFormats('cjs');
	eleventyConfig.addTemplateFormats('mjs');
	eleventyConfig.addTemplateFormats('ts');

	const settings = {
		outputFileExtension: 'js',
		compile(_, inputPath) {
			return async () => {
				const tmpPath = path.join(pluginConfig.tmpDir, inputPath);

				await esbuild.build({
					entryPoints: [inputPath],
					bundle: true,
					alias: eleventyConfig.globalData.alias,
					outfile: tmpPath,
					minify: eleventyConfig.globalData?.minifyJS ?? true,
					charset: 'utf8',
					banner: {
						js: pluginConfig.banner,
					},
				});

				const content = await fs.readFile(tmpPath, 'utf8');
				return content;
			};
		},
	};

	eleventyConfig.addExtension('js', settings);
	eleventyConfig.addExtension('cjs', settings);
	eleventyConfig.addExtension('mjs', settings);
	eleventyConfig.addExtension('ts', settings);

	eleventyConfig.on('eleventy.after', async () => {
		await fs.rm(pluginConfig.tmpDir, {
			recursive: true,
			force: true,
		});
	});
}
