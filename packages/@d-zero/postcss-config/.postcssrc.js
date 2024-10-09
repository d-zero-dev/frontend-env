export default {
	plugins: {
		'postcss-custom-media': true,
		'postcss-math': true,
		'postcss-calc': true,
		'postcss-color-mod-function': true,
		'postcss-clip-path-polyfill': true,
		autoprefixer: true,
		'postcss-base64': {
			pattern: /<svg.*<\/svg>/i,
			prepend: 'data:image/svg+xml;base64,',
		},
	},
};
