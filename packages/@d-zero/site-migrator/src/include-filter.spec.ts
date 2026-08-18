import { describe, expect, test } from 'vitest';

import {
	filterUrlsByInclude,
	IncludeNoMatchError,
	InvalidIncludeValueError,
	parseIncludePattern,
} from './include-filter.js';

describe('parseIncludePattern', () => {
	test('parses a pathname prefix', () => {
		expect(parseIncludePattern('/news/')).toStrictEqual({
			pathname: '/news/',
			isPrefix: true,
			raw: '/news/',
		});
	});

	test('parses a pathname exact match', () => {
		expect(parseIncludePattern('/news/a.html')).toStrictEqual({
			pathname: '/news/a.html',
			isPrefix: false,
			raw: '/news/a.html',
		});
	});

	test('parses a full https URL, ignoring the host', () => {
		expect(parseIncludePattern('https://example.com/news/')).toStrictEqual({
			pathname: '/news/',
			isPrefix: true,
			raw: 'https://example.com/news/',
		});
	});

	test('parses a full http URL, ignoring the host', () => {
		expect(parseIncludePattern('http://other.example/page.html')).toStrictEqual({
			pathname: '/page.html',
			isPrefix: false,
			raw: 'http://other.example/page.html',
		});
	});

	test('a host-only URL normalises to the root prefix pattern', () => {
		expect(parseIncludePattern('https://example.com')).toStrictEqual({
			pathname: '/',
			isPrefix: true,
			raw: 'https://example.com',
		});
	});

	test('a full URL without trailing slash is an exact match', () => {
		expect(parseIncludePattern('https://example.com/news')).toStrictEqual({
			pathname: '/news',
			isPrefix: false,
			raw: 'https://example.com/news',
		});
	});

	test('percent-encodes non-ASCII segments the same way page URLs do', () => {
		const pattern = parseIncludePattern('/ニュース/');
		expect(pattern.pathname).toBe('/%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%B9/');
		expect(pattern.isPrefix).toBe(true);
	});

	test('resolves `.` / `..` segments like a browser would', () => {
		expect(parseIncludePattern('/a/../b.html').pathname).toBe('/b.html');
	});

	test('rejects a value not starting with "/" or "http(s)://"', () => {
		expect(() => parseIncludePattern('news/')).toThrow(InvalidIncludeValueError);
	});

	test('rejects an empty string', () => {
		expect(() => parseIncludePattern('')).toThrow(InvalidIncludeValueError);
	});

	test('rejects a non-http(s) scheme', () => {
		expect(() => parseIncludePattern('ftp://example.com/x')).toThrow(
			InvalidIncludeValueError,
		);
	});

	test('rejects a value with a query string', () => {
		expect(() => parseIncludePattern('/news/?p=1')).toThrow(InvalidIncludeValueError);
	});

	test('rejects a value with a fragment', () => {
		expect(() => parseIncludePattern('/news/#top')).toThrow(InvalidIncludeValueError);
	});

	test('rejects a protocol-relative value instead of reading the first segment as a host', () => {
		// Without this guard, `new URL('//news/index.html', base)` treats `news`
		// as the hostname and silently yields pathname `/index.html`.
		expect(() => parseIncludePattern('//news/index.html')).toThrow(
			InvalidIncludeValueError,
		);
	});

	test('rejects an http(s)-prefixed value that the URL parser cannot construct', () => {
		// `https://` matches the `^https?:\/\//` prefix check but has no host,
		// so `new URL(raw)` itself throws — exercises the inner catch branch.
		expect(() => parseIncludePattern('https://')).toThrow(InvalidIncludeValueError);
	});
});

describe('filterUrlsByInclude', () => {
	test('a prefix pattern selects the subtree and its index page, not siblings', () => {
		const urls = [
			'https://example.com/news/',
			'https://example.com/news/a.html',
			'https://example.com/news/2024/b.html',
			'https://example.com/newsroom/x.html',
			'https://example.com/news',
		];

		expect(filterUrlsByInclude(['/news/'], urls)).toStrictEqual([
			'https://example.com/news/',
			'https://example.com/news/a.html',
			'https://example.com/news/2024/b.html',
		]);
	});

	test('an exact pattern selects only the matching pathname, ignoring the query', () => {
		const urls = [
			'https://example.com/list?p=1',
			'https://example.com/list?p=2',
			'https://example.com/list/',
			'https://example.com/list.html',
		];

		expect(filterUrlsByInclude(['/list'], urls)).toStrictEqual([
			'https://example.com/list?p=1',
			'https://example.com/list?p=2',
		]);
	});

	test('multiple values union, dedupe overlapping matches, and preserve input order', () => {
		const urls = [
			'https://example.com/news/',
			'https://example.com/news/a.html',
			'https://example.com/about/',
		];

		expect(
			filterUrlsByInclude(['/news/', '/news/a.html', '/about/'], urls),
		).toStrictEqual(urls);
	});

	test('a duplicated include value does not change the result or error', () => {
		const urls = ['https://example.com/news/', 'https://example.com/about/'];

		expect(filterUrlsByInclude(['/news/', '/news/'], urls)).toStrictEqual([
			'https://example.com/news/',
		]);
	});

	test('pathname comparison is case-sensitive', () => {
		const urls = ['https://example.com/news/x.html'];

		expect(() => filterUrlsByInclude(['/News/'], urls)).toThrow(IncludeNoMatchError);
	});

	test('the include value host is ignored — matching is pathname-only', () => {
		const urls = ['https://example.com/about/'];

		expect(filterUrlsByInclude(['https://other.example/about/'], urls)).toStrictEqual([
			'https://example.com/about/',
		]);
	});

	test('lists every unmatched raw value, not just the first', () => {
		const urls = ['https://example.com/news/'];

		expect(() => filterUrlsByInclude(['/news/', '/nope/', '/also-nope/'], urls)).toThrow(
			IncludeNoMatchError,
		);
		try {
			filterUrlsByInclude(['/news/', '/nope/', '/also-nope/'], urls);
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(IncludeNoMatchError);
			expect((error as IncludeNoMatchError).unmatched).toStrictEqual([
				'/nope/',
				'/also-nope/',
			]);
		}
	});

	test('an invalid value throws before any matching happens', () => {
		expect(() => filterUrlsByInclude(['news/'], ['https://example.com/'])).toThrow(
			InvalidIncludeValueError,
		);
	});

	test('an unparsable page URL is treated as matching nothing, not thrown', () => {
		const urls = ['not a url', 'https://example.com/news/'];

		expect(filterUrlsByInclude(['/news/'], urls)).toStrictEqual([
			'https://example.com/news/',
		]);
	});

	test('the root pattern "/" selects every page', () => {
		const urls = ['https://example.com/', 'https://example.com/about/'];

		expect(filterUrlsByInclude(['/'], urls)).toStrictEqual(urls);
	});

	test('an empty include list selects every URL unchanged, without error', () => {
		const urls = ['https://example.com/', 'not a url', 'https://example.com/about/'];

		expect(filterUrlsByInclude([], urls)).toStrictEqual(urls);
	});
});
