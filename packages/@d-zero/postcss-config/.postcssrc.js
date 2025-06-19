import autoprefixer from 'autoprefixer';
import postcssBase64 from 'postcss-base64';
import postcssCalc from 'postcss-calc';
import postcssClipPathPolyfill from 'postcss-clip-path-polyfill';
import postcssColorModFunction from 'postcss-color-mod-function'; // eslint-disable-line import/default
import postcssCustomMedia from 'postcss-custom-media';
import postcssExtendRule from 'postcss-extend-rule';
import postcssMath from 'postcss-math';

/** @type {import('postcss-load-config').Config} */
export default {
	plugins: [
		postcssExtendRule({
			name: 'bge-legacy-copy',
		}),
		postcssCustomMedia(),
		postcssMath(),
		postcssCalc(),
		postcssColorModFunction(),
		postcssClipPathPolyfill(),
		autoprefixer(),
		postcssBase64({
			pattern: /<svg.*<\/svg>/i,
			prepend: 'data:image/svg+xml;base64,',
		}),
	],
};
