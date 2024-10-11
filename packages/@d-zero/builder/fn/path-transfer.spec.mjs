import { describe, test, expect } from 'vitest';

import { pathTransfer } from './path-transfer.mjs';

describe('pathTransfer', () => {
	const HTML_CONTENT = '<html><head></head><body></body></html>';

	/**
	 * @param {string[]} paths
	 * @param {"file" | "directory" | "preserve"} format
	 * @returns {Promise<string[]>}
	 */
	function _(paths, pathFormat = 'preserve') {
		return paths.map((path) => {
			const outputPath = pathTransfer(
				{
					inputPath: path,
					inputRoot: 'path/to',
					content: HTML_CONTENT,
				},
				pathFormat,
			);
			return outputPath;
		});
	}

	test('default (preserve)', () => {
		expect(
			_([
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

	test('file', () => {
		expect(
			_(
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

	test('directory', () => {
		expect(
			_(
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
