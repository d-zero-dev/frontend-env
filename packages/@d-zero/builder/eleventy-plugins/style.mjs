import fs from 'node:fs/promises';
import path from 'node:path';

import { build } from 'vite';

const INLINE_SCRIPT_FILE_DELETE_ID = '::inline-script::';

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @param {Object} pluginConfig
 * @param {string} pluginConfig.tmpDir
 * @param {string} pluginConfig.banner
 * @param {boolean} pluginConfig.minify
 * @param {Record<string, string>} pluginConfig.alias
 * @returns
 */
export function stylePlugin(eleventyConfig, pluginConfig) {
	eleventyConfig.addTemplateFormats('scss');

	eleventyConfig.addExtension('scss', {
		outputFileExtension: 'css',
		compile(_, inputPath) {
			return async () => {
				const absInputPath = path.resolve(inputPath);

				const tmpPath = path.join(pluginConfig.tmpDir, inputPath);

				const outDir = path.dirname(tmpPath);
				const name = path.basename(tmpPath, path.extname(tmpPath));
				const entryJS = path.resolve(outDir, `${name}.js`);

				await fs.mkdir(outDir, { recursive: true });

				const cssMinify = pluginConfig.minify ?? true;

				await fs.writeFile(entryJS, `import '${absInputPath}';`, 'utf8');

				await build({
					logLevel: 'silent',
					build: {
						emptyOutDir: false,
						cssMinify,
						target: 'modules',
						polyfillModulePreload: false,
						mode: 'production',
						sourcemap: false,
						cssCodeSplit: false,
						outDir,
						rollupOptions: {
							input: entryJS,
							output: {
								assetFileNames: ({ name }) => {
									if (name.endsWith('.css')) {
										name = path.basename(tmpPath);
										return `${name}`;
									}
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

				const content = await fs.readFile(tmpPath, 'utf8');

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
}
