import path from 'node:path';

import { pathComparator } from '@d-zero/shared/sort/path';
import c from 'cli-color';
import { filesize } from 'filesize';
import { gzipSize } from 'gzip-size';

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @returns
 */
export function reportPlugin(eleventyConfig) {
	eleventyConfig.on('eleventy.after', async ({ dir, results }) => {
		const fileList = results.toSorted((a, b) =>
			pathComparator(a.outputPath, b.outputPath),
		);

		const table = await Promise.all(
			fileList.map(async (file) => {
				const baseDir = path.relative(process.cwd(), dir.output);
				const filePathFromBase = path.relative(dir.output, file.outputPath);
				const highlight = file.outputPath.endsWith('.html')
					? c.green
					: file.outputPath.endsWith('.css')
						? c.magenta
						: c.blue;
				const bytes = file.content.length;
				const gBytes = await gzipSize(file.content);
				const size = filesize(bytes, { exponent: 1 });
				const gSize = filesize(gBytes, { exponent: 1 });

				return [
					c.black(baseDir + path.sep) + highlight(filePathFromBase),
					c.black.bold(size),
					c.black('|'),
					c.black('gzip:'),
					c.black(gSize),
				];
			}),
		);

		process.stdout.write(
			c.columns(table, {
				sep: ' ',
				columns: [null, { align: 'right' }, null, null, { align: 'right' }],
			}),
		);
	});
}
