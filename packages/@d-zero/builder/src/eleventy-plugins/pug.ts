import type { EleventyPlugin } from '../eleventy.types.js';
import type { EleventyGlobalData } from '../types.js';
import type { Options as PugOptions } from 'pug';

import { render } from 'pug';

type PugPluginOptions = PugOptions & { [key: string]: unknown };

/**
 * Ref: https://github.com/11ty/eleventy-plugin-template-languages/blob/main/pug/extension.js
 * @param eleventyConfig
 * @param pluginConfig
 */
export const pugPlugin: EleventyPlugin<PugPluginOptions, EleventyGlobalData> = (
	eleventyConfig,
	pluginConfig,
) => {
	eleventyConfig.addTemplateFormats('pug');

	eleventyConfig.addExtension('pug', {
		outputFileExtension: 'html',
		compile(content, inputPath) {
			return (context) => {
				const pugRenderOptions: PugOptions = {
					doctype: 'html',
					...context,
					...pluginConfig,
					basedir: context.eleventy.directories.includes,
					filename: inputPath,
					filters: {
						...context,
						...context.filters,
						...eleventyConfig.javascript.filters,
						...pluginConfig.filters,
					},
				};

				/**
				 * @see https://pugjs.org/api/reference.html#pugrendersource-options-callback
				 */
				const result = render(content, pugRenderOptions);
				return result;
			};
		},
	});
};
