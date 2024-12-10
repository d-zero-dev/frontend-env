import type { Options as HMTOptions } from 'html-minifier-terser';
import type { Options as PrettierOptions } from 'prettier';

export type EleventyGlobalData = Pick<
	DZBuilderConfig,
	'alias' | 'pathFormat' | 'minifier'
>;

export type DZBuilderConfig = {
	alias?: Record<string, string>;
	outputCssDir?: string;
	outputJsDir?: string;
	outputImgDir?: string;
	imageSizes?: ImageSizesOptions;
	prettier?: boolean | PrettierOptions;
	minifier?: HMTOptions;
	lineBreak?: '\n' | '\r\n';
	charset?: Charset | CharsetOptions;
	characterEntities?: boolean;
	pathFormat?: PathFormat;
	autoDecode?: boolean;
	ssi?: Record<string, SSIOption>;
};

export type CharsetList =
	| 'utf-8' // eslint-disable-line unicorn/text-encoding-identifier-case
	| 'utf8'
	| 'cp932'
	| 'shift_jis'
	| 'shift-jis'
	| 's-jis'
	| 's_jis'
	| 'sjis';

export type Charset = CharsetList | Uppercase<CharsetList>;

export type CharsetOptions = {
	encoding: Charset;
	overrides?: CharsetOverride[];
};

export type CharsetOverride = {
	paths: string[];
	encoding: Charset;
};

export type PathFormat = 'file' | 'directory' | 'preserve';

export type HtmlFile = {
	inputPath: string;
	inputRoot?: string;
	outputRoot?: string;
	content?: string;
};

export type SSIOption = {
	encoding: Charset;
};

export type ImageSize = {
	width: number;
	height: number;
};

export type ImageSizesOptions = {
	rootDir?: string;
	selector?: string;
	ext?: string[];
};

export type OutputTableRow = [origin: string, from: string, to: string];
