import fs from 'node:fs/promises';
import path from 'node:path';

import { build as viteBuild } from 'vite';

import Const from '../const.cjs';
const { INLINE_SCRIPT_FILE_DELETE_ID } = Const;

export async function buildCss(input, output, options) {
	const outDir = path.dirname(output);
	const entryJS = input.replaceAll(/\.scss$/g, '.js');

	const cssMinify = options.minifier?.minifyCSS ?? true;

	await fs.writeFile(entryJS, `import '${input}';`, 'utf8');

	await viteBuild({
		logLevel: 'silent',
		build: {
			emptyOutDir: false,
			cssMinify,
			target: 'modules',
			polyfillModulePreload: false,
			mode: 'production',
			sourcemap: false,
			cssCodeSplit: false,
			outDir,
			rollupOptions: {
				input: entryJS,
				output: {
					assetFileNames: ({ name }) => {
						if (name.endsWith('.css')) {
							name = path.basename(output);
							return `${name}`;
						}
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

	await fs.unlink(entryJS);
	await fs.unlink(path.resolve(outDir, INLINE_SCRIPT_FILE_DELETE_ID));
}
