import type { EleventyPlugin } from '../eleventy.types.js';
import type { EleventyGlobalData } from '../types.js';
import type { Options as HMTOptions } from 'html-minifier-terser';
import type { Options as PrettierOptions } from 'prettier';

import fs from 'node:fs/promises';
import path from 'node:path';

import stripComments from 'strip-css-comments';
import { build } from 'vite';

const INLINE_SCRIPT_FILE_DELETE_ID = '::inline-script::';

type StylePluginConfig = {
	tmpDir: string;
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
		compile(_, inputPath) {
			return async () => {
				const absInputPath = path.resolve(inputPath);

				const tmpPath = path.join(pluginConfig.tmpDir, inputPath);

				const outDir = path.dirname(tmpPath);
				const name = path.basename(tmpPath, path.extname(tmpPath));
				const entryJS = path.resolve(outDir, `${name}.js`);

				await fs.mkdir(outDir, { recursive: true });

				const cssMinify = !!(pluginConfig.minify ?? true);

				await fs.writeFile(entryJS, `import '${absInputPath}';`, 'utf8');

				await build({
					logLevel: 'silent',
					build: {
						emptyOutDir: false,
						cssMinify,
						target: 'modules',
						polyfillModulePreload: false,
						sourcemap: false,
						cssCodeSplit: false,
						outDir,
						rollupOptions: {
							input: entryJS,
							output: {
								assetFileNames: ({ name }) => {
									if (name?.endsWith('.css')) {
										name = path.basename(tmpPath);
										return `${name}`;
									}
									return '[name]-[hash][extname]';
								},
								chunkFileNames: () => INLINE_SCRIPT_FILE_DELETE_ID,
								entryFileNames: () => INLINE_SCRIPT_FILE_DELETE_ID,
							},
						},
					},
					resolve: {
						alias: pluginConfig.alias,
					},
				});

				let content = await fs.readFile(tmpPath, 'utf8');

				if (!cssMinify) {
					content = stripComments(content);
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

	eleventyConfig.on('eleventy.after', async () => {
		await fs.rm(pluginConfig.tmpDir, {
			recursive: true,
			force: true,
		});
	});
};
