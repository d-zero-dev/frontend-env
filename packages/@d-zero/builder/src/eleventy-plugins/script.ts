import type { EleventyExtensionCompiler, EleventyPlugin } from '../eleventy.types.js';
import type { EleventyGlobalData } from '../types.js';

import fs from 'node:fs/promises';
import path from 'node:path';

import esbuild from 'esbuild';

type ScriptPluginConfig = {
	tmpDir: string;
	banner: string;
};

export const scriptPlugin: EleventyPlugin<ScriptPluginConfig, EleventyGlobalData> = (
	eleventyConfig,
	pluginConfig,
) => {
	eleventyConfig.addTemplateFormats('js');
	eleventyConfig.addTemplateFormats('cjs');
	eleventyConfig.addTemplateFormats('mjs');
	eleventyConfig.addTemplateFormats('ts');

	const settings: EleventyExtensionCompiler = {
		outputFileExtension: 'js',
		compile(_, inputPath) {
			return async () => {
				const tmpPath = path.join(pluginConfig.tmpDir, inputPath);

				const result = await esbuild.build({
					entryPoints: [inputPath],
					bundle: true,
					alias: eleventyConfig.globalData.alias,
					outfile: tmpPath,
					minify: !!(eleventyConfig.globalData.minifier?.minifyJS ?? true),
					charset: 'utf8',
					metafile: true,
					banner: {
						js: pluginConfig.banner,
					},
				});

				const dependencies = result.metafile
					? Object.keys(result.metafile.inputs)
							.filter(
								(key) =>
									typeof key === 'string' &&
									!key.startsWith('<') &&
									!key.startsWith('node:'),
							)
							.map((key) => path.resolve(key))
					: [];

				if (dependencies.length > 0) {
					// @ts-ignore
					this.addDependencies(inputPath, dependencies);
				}

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
};
