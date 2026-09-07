import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { urlToOutputPath } from './url-to-output-path.js';

const OUT = '/tmp/htdocs';

describe('urlToOutputPath', () => {
	test('mirrors the URL pathname under the output directory', () => {
		expect(urlToOutputPath('https://example.com/img/a.png', OUT)).toBe(
			path.resolve(OUT, 'img/a.png'),
		);
	});

	test('treats a trailing slash as an index document', () => {
		expect(urlToOutputPath('https://example.com/', OUT, 'text/html')).toBe(
			path.resolve(OUT, 'index.html'),
		);
		expect(urlToOutputPath('https://example.com/blog/', OUT, 'text/html')).toBe(
			path.resolve(OUT, 'blog/index.html'),
		);
	});

	test('appends a content-type-derived extension when the URL has none', () => {
		expect(urlToOutputPath('https://example.com/api', OUT, 'application/json')).toBe(
			path.resolve(OUT, 'api.json'),
		);
	});

	test('does not overwrite an existing URL extension', () => {
		expect(urlToOutputPath('https://example.com/main.css', OUT, 'text/css')).toBe(
			path.resolve(OUT, 'main.css'),
		);
	});

	test('leaves the path without extension when content-type is missing or unknown', () => {
		expect(urlToOutputPath('https://example.com/unknown', OUT)).toBe(
			path.resolve(OUT, 'unknown'),
		);
		expect(urlToOutputPath('https://example.com/unknown', OUT, 'something/weird')).toBe(
			path.resolve(OUT, 'unknown'),
		);
	});

	test('strips repeated leading slashes so the resolved path stays under outputDir', () => {
		// A URL pathname like `//foo/bar` (rare CDN artefact) must not escape outputDir.
		const url = new URL('https://example.com/');
		url.pathname = '//foo/bar.css';
		expect(urlToOutputPath(url.href, OUT, 'text/css')).toBe(
			path.resolve(OUT, 'foo/bar.css'),
		);
	});

	test('relies on WHATWG URL normalisation to flatten ".." segments before mapping', () => {
		// URL constructor collapses ../.. into the pathname, so the on-disk path
		// is the normalised form (no traversal). Verifying this so the contract
		// is regression-tested if upstream changes how URL parses dot-segments.
		const url = new URL('https://example.com/safe/../etc/passwd');
		expect(urlToOutputPath(url.href, OUT, 'application/octet-stream')).toBe(
			path.resolve(OUT, 'etc/passwd'),
		);
	});
});
