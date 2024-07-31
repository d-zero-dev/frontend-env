const path = require('node:path');

const eleventy = require('@d-zero/builder/11ty');

module.exports = function (eleventyConfig) {
	// eleventyConfig.addGlobalData('publicDir', '@static');
	// eleventyConfig.addGlobalData('outputCssDir', 'css');
	// eleventyConfig.addGlobalData('outputJsDir', 'js');
	// eleventyConfig.addGlobalData('outputImgDir', 'img');

	eleventyConfig.addGlobalData('alias', {
		'@': path.resolve(__dirname, '__assets', '_libs'),
	});

	eleventyConfig.setPugOptions({
		basedir: path.resolve(__dirname, '__assets', '_libs'),
	});

	if (process.env.NODE_ENV === 'production') {
		eleventyConfig.addGlobalData('prettier', true);
		// eleventyConfig.addGlobalData('minifier', { minifyJS: false });
		// eleventyConfig.addGlobalData('lineBreak', '\r\n');
		// eleventyConfig.addGlobalData('charset', 'shift_jis');
		// eleventyConfig.addGlobalData('pathFormat', 'preserve');
	}

	return eleventy(eleventyConfig);
};
