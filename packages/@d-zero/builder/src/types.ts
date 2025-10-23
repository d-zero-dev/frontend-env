import type { EleventyPage } from './eleventy.types.js';
import type { Dayjs } from 'dayjs';
import type { Options as HMTOptions } from 'html-minifier-terser';
import type { Options as PrettierOptions } from 'prettier';
import type { Options as PugOptions } from 'pug';

export type EleventyGlobalData = Pick<
	DZBuilderConfig,
	'alias' | 'pathFormat' | 'minifier' | 'extensions' | 'permalink'
>;

export type ParserOptions = {
	pugOptions?: PugOptions;
};

export type DZBuilderConfig = {
	alias?: Record<string, string>;
	outDir?: string;
	banner?: CreateBanner | string;
	imageSizes?: ImageSizesOptions;
	prettier?: boolean | PrettierOptions;
	minifier?: HMTOptions;
	lineBreak?: '\n' | '\r\n';
	charset?: Charset | CharsetOptions;
	characterEntities?: boolean;
	pathFormat?: PathFormat;
	autoDecode?: boolean;
	ssi?: Record<string, SSIOption>;
	htmlHooks?: HtmlHooks;
	extensions?: Record<Extensions, string>;
	permalink?: () => (data: { page: EleventyPage }) => string;
	parserOptions?: ParserOptions;
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

export type HtmlHooks = {
	beforeSerialize?: (content: string, isServe: boolean) => Promise<string> | string;
	afterSerialize?: (
		elements: Element[],
		window: Window,
		isServe: boolean,
	) => Promise<void> | void;
	replace?: (content: string, paths: Paths, isServe: boolean) => Promise<string> | string;
};

export type Paths = {
	filePath: string;
	dirPath: string;
	relativePathFromBase: string;
};

export type Extensions = 'html' /* | 'css' | 'js' */;

export type OutputTableRow = [origin: string, from: string, to: string];

export type BannerOptions = {
	devMode?: boolean;
};

export type CreateBanner = (options?: BannerOptions) => (now: Dayjs) => string;
