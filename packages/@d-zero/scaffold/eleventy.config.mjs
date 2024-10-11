import path from 'node:path';

import eleventy from '@d-zero/builder/11ty';

export default function (eleventyConfig) {
	return eleventy(eleventyConfig, {
		/**
		 * Alias for the path to the directory containing the components.
		 */
		alias: {
			'@': path.resolve(import.meta.dirname, '__assets', '_libs'),
		},

		/**
		 * Output directory for CSS files.
		 */
		// outputCssDir: 'css',

		/**
		 * Output directory for JavaScript files
		 */
		// outputJsDir: 'js',

		/**
		 * Output directory for image files
		 */
		// outputImgDir: 'img',

		/**
		 * Prettier options.
		 *
		 * @see https://prettier.io/docs/en/options
		 */
		// prettier: false,

		/**
		 * Minifier options.
		 *
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
	});
}
