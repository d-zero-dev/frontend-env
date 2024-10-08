import path from 'node:path';

import eleventy from '@d-zero/builder/11ty';

export default function (eleventyConfig) {
	eleventyConfig.addGlobalData('alias', {
		'@': path.resolve(import.meta.dirname, '__assets', '_libs'),
	});

	// eleventyConfig.addGlobalData('outputCssDir', 'css');
	// eleventyConfig.addGlobalData('outputJsDir', 'js');
	// eleventyConfig.addGlobalData('outputImgDir', 'img');
	// eleventyConfig.addGlobalData('prettier', false);
	/**
	 * @see https://github.com/terser/html-minifier-terser?tab=readme-ov-file#options-quick-reference
	 */
	// eleventyConfig.addGlobalData('minifier', { minifyJS: false });
	// eleventyConfig.addGlobalData('lineBreak', '\r\n');
	// eleventyConfig.addGlobalData('charset', 'shift_jis');
	// eleventyConfig.addGlobalData('pathFormat', 'directory');

	return eleventy(eleventyConfig);
}
