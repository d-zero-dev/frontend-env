import path from 'node:path';

import eleventy from '@d-zero/builder/11ty';

/**
 *
 * @param eleventyConfig
 */
export default function (eleventyConfig) {
	return eleventy(eleventyConfig, {
		/**
		 * Alias for the path to the directory containing the components.
		 */
		alias: {
			'@': path.resolve(import.meta.dirname, '__assets', '_libs'),
		},

		/**
		 * The directory where the source files are located.
		 */
		// outDir: 'htdocs',

		/**
		 * Prettier options.
		 *
		 * If `true`, use the prettier config in the project root.
		 *
		 * If `false`, disable prettier.
		 *
		 * If `object`, use the options. Merge with the prettier config in the project root.
		 * @see https://prettier.io/docs/en/options
		 */
		prettier: true,

		/**
		 * Minifier options.
		 * @see https://github.com/terser/html-minifier-terser?tab=readme-ov-file#options-quick-reference
		 */
		// minifier: { minifyJS: false },

		/**
		 * Line break.
		 */
		// lineBreak: '\r\n',

		/**
		 * Character encoding.
		 */
		// charset: 'shift_jis',

		/**
		 * Convert character entities
		 */
		// characterEntities: true

		/**
		 * Path format
		 */
		// pathFormat: 'directory',

		/**
		 * Automatically decode the content on the dev server.
		 */
		// autoDecode: true,

		/**
		 * Server Side Include options on the dev server.
		 */
		// ssi: { '**/*': { encoding: 'shift_jis' } },

		/**
		 * Parser options.
		 */
		// parserOptions: {
		// 	/**
		// 	 * Pug parser options.
		// 	 * @see https://pugjs.org/api/reference.html
		// 	 */
		// 	pugOptions: { pretty: false },
		// },
	});
}
