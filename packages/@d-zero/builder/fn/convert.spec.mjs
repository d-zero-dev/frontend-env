import { describe, test, expect } from 'vitest';

import { convert } from './convert.mjs';

describe('convert', () => {
	const HTML_CONTENT = '<html><head></head><body></body></html>';

	/**
	 * @param {string[]} paths
	 * @param {"file" | "directory" | "preserve"} format
	 * @returns {Promise<string[]>}
	 */
	async function _(paths, format) {
		return await Promise.all(
			paths.map(async (path, index) => {
				const htmlFile = await convert(
					{
						inputPath: path,
						inputRoot: 'path/to',
						content: HTML_CONTENT,
					},
					{
						pathFormat: format,
					},
				);
				return htmlFile.outputPath;
			}),
		);
	}

	test('default (preserve)', async () => {
		expect(
			await _([
				//
				'path/to/index.pug',
				'path/to/foo.pug',
				'path/to/bar/index.pug',
			]),
		).toStrictEqual([
			//
			'path/to/index.html',
			'path/to/foo.html',
			'path/to/bar/index.html',
		]);
	});

	test('file', async () => {
		expect(
			await _(
				[
					//
					'path/to/index.pug',
					'path/to/foo.pug',
					'path/to/bar/index.pug',
				],
				'file',
			),
		).toStrictEqual([
			//
			'path/to/index.html',
			'path/to/foo.html',
			'path/to/bar.html',
		]);
	});

	test('directory', async () => {
		expect(
			await _(
				[
					//
					'path/to/index.pug',
					'path/to/foo.pug',
					'path/to/bar/index.pug',
				],
				'directory',
			),
		).toStrictEqual([
			//
			'path/to/index.html',
			'path/to/foo/index.html',
			'path/to/bar/index.html',
		]);
	});
});
