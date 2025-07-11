import fs from 'node:fs/promises';
import path from 'node:path';

import stripComments from 'strip-css-comments';
import { build } from 'vite';

const INLINE_SCRIPT_FILE_DELETE_ID = '::inline-script::';

type CompileCssOptions = {
	minify: boolean;
	alias: Record<string, string>;
	tmpDir: string;
};

/**
 *
 * @param inputPath
 * @param options
 */
export async function compileSass(inputPath: string, options: CompileCssOptions) {
	const tmpPath = path.join(options.tmpDir, inputPath);

	const outDir = path.dirname(tmpPath);
	const name = path.basename(tmpPath, path.extname(tmpPath));
	const entryJS = path.resolve(outDir, `${name}.js`);

	await fs.mkdir(outDir, { recursive: true });

	await fs.writeFile(entryJS, `import '${inputPath}';`, 'utf8');

	await build({
		logLevel: 'silent',
		build: {
			emptyOutDir: false,
			cssMinify: options.minify,
			polyfillModulePreload: false,
			sourcemap: false,
			cssCodeSplit: false,
			outDir,
			rollupOptions: {
				input: entryJS,
				output: {
					assetFileNames: ({ name }) => {
						if (name?.endsWith('.css')) {
							name = path.basename(tmpPath);
							return `${name}`;
						}
						return '[name]-[hash][extname]';
					},
					chunkFileNames: () => INLINE_SCRIPT_FILE_DELETE_ID,
					entryFileNames: () => INLINE_SCRIPT_FILE_DELETE_ID,
				},
			},
		},
		resolve: {
			alias: options.alias,
		},
	});

	let content = await fs.readFile(tmpPath, 'utf8');

	content = stripComments(content);

	return content.trim();
}
