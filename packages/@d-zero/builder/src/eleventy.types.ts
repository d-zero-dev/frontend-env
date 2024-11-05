export type Eleventy<G extends Record<string, unknown> | void = void> = {
	write(): Promise<EleventyResult[][]>;
	config: EleventyConfig<G>;
};

export type EleventyConfig<G extends Record<string, unknown> | void = void> = {
	addPlugin: <C extends Record<string, unknown> | void>(
		plugin: EleventyPlugin<C, G>,
		pluginConfig?: C,
	) => void;
	addGlobalData: <N extends keyof G>(name: N, data: G[N]) => void;
	addFilter: (name: string, filter: (code: string, ...args: string[]) => string) => void;
	addDataExtension: (ext: string, fn: (contents: string) => string) => void;
	addTransform: (
		name: string,
		fn: (this: EleventyTransformContext, content: string) => Promise<string | Buffer>,
	) => void;
	addTemplateFormats: (ext: string) => void;
	addExtension: (ext: string, compiler: EleventyExtensionCompiler) => void;
	setServerOptions(options: EleventyServerOptions, b: boolean): void;
	on: {
		(name: string, fn: (args: EleventyEventArguments) => void | Promise<void>): void;
		(
			name: 'eleventy.after',
			fn: (args: EleventyAfterEventArguments) => void | Promise<void>,
		): void;
	};

	dir: EleventyDirectories;
	globalData: G;
	javascript: {
		filters: Record<string, unknown>;
	};
};

export type EleventyTransformContext = {
	page: {
		outputPath?: string;
	};
};

export type EleventyExtensionCompiler = {
	outputFileExtension?: string;
	compile: (content: string, inputPath: string) => () => Promise<string>;
};

export type EleventyPlugin<
	C extends Record<string, unknown> | void = void,
	G extends Record<string, unknown> | void = void,
> = {
	(eleventyConfig: EleventyConfig<G>, pluginConfig: C): void;
};

/**
 * @see https://www.11ty.dev/docs/events/#event-arguments
 */
export type EleventyEventArguments = {
	directories: EleventyDirectories;
	/**
	 * @deprecated
	 */
	dir: EleventyDirectories;
	outputMode: 'fs' | 'json' | 'ndjson'; // cspell: disable-line
	runMode: 'build' | 'watch' | 'serve';
	result: Record<string, unknown>;
};

export type EleventyAfterEventArguments = EleventyEventArguments & {
	results: EleventyResult[];
};

export type EleventyDirectories = {
	input: string;
	output: string;
	includes: string;
	data: string;
	layouts?: string;
};

export type EleventyResult = {
	inputPath: string;
	outputPath: string;
	url: string;
	content: string;
};

export type EleventyServerOptions = {
	liveReload?: boolean;
	domDiff?: boolean;
	port?: number;
	showAllHosts?: boolean;
	encoding?: string;
	onRequest?: Record<string, EleventyServerRequest>;
};

export type EleventyServerRequest = {
	(args: { url: URL }): Promise<EleventyServerResponse | void>;
};

export type EleventyServerResponse =
	| string
	| Buffer
	| {
			status?: number;
			headers?: Record<string, string>;
			body: string | Buffer;
	  };
