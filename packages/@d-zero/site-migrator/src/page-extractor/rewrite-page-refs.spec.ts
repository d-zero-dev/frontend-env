import { describe, expect, test } from 'vitest';

import { buildPageIdLookup, rewritePageRefs } from './rewrite-page-refs.js';

const BASE = 'https://example.com/about/';

const lookupFrom = (entries: readonly (readonly [string, number])[]) =>
	buildPageIdLookup(new Map(entries));

describe('rewritePageRefs', () => {
	test('rewrites same-origin <a href> to the id template', async () => {
		const html = await rewritePageRefs({
			html: '<a href="/news/">news</a>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/news/', 42]]),
		});
		expect(html).toBe('<a href="{{42}}">news</a>');
	});

	test('preserves query and fragment when rewriting page refs', async () => {
		const html = await rewritePageRefs({
			html: '<a href="/news/?q=foo#top">news</a>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/news/', 42]]),
		});
		expect(html).toBe('<a href="{{42}}?q=foo#top">news</a>');
	});

	test('falls back to root-relative path when no id mapping exists', async () => {
		const html = await rewritePageRefs({
			html: '<a href="/missing.html">x</a>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(html).toBe('<a href="/missing.html">x</a>');
	});

	test('rewrites relative same-origin asset URLs to root-relative paths', async () => {
		const html = await rewritePageRefs({
			html: '<img src="../img/a.png">',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(html).toBe('<img src="/img/a.png">');
	});

	test('rewrites absolute same-origin asset URLs to root-relative paths', async () => {
		const html = await rewritePageRefs({
			html: '<script src="https://example.com/js/a.js"></script>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(html).toBe('<script src="/js/a.js"></script>');
	});

	test('keeps cross-origin URLs untouched', async () => {
		const html = await rewritePageRefs({
			html:
				'<a href="https://other.example/x">x</a>' + '<img src="https://cdn.other/y.png">',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://other.example/x', 99]]),
		});
		expect(html).toBe(
			'<a href="https://other.example/x">x</a>' + '<img src="https://cdn.other/y.png">',
		);
	});

	test('keeps mailto:/tel:/javascript:/data: untouched', async () => {
		const html = await rewritePageRefs({
			html:
				'<a href="mailto:a@example.com">m</a>' +
				'<a href="tel:+81-3-0000">t</a>' +
				'<a href="javascript:void(0)">j</a>' +
				'<img src="data:image/png;base64,abc">',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(html).toBe(
			'<a href="mailto:a@example.com">m</a>' +
				'<a href="tel:+81-3-0000">t</a>' +
				'<a href="javascript:void(0)">j</a>' +
				'<img src="data:image/png;base64,abc">',
		);
	});

	test('keeps bare-fragment same-page anchors untouched', async () => {
		const html = await rewritePageRefs({
			html: '<a href="#section">jump</a>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(html).toBe('<a href="#section">jump</a>');
	});

	test('keeps whitespace-padded bare-fragment anchors untouched', async () => {
		const html = await rewritePageRefs({
			html: '<a href=" #section">jump</a>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/about/', 7]]),
		});
		// The leading space-fragment must NOT be rewritten to {{<own-id>}}#section.
		expect(html).toBe('<a href=" #section">jump</a>');
	});

	test('rewrites <form action> the same way as <a href>', async () => {
		const html = await rewritePageRefs({
			html: '<form action="/contact/"></form>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/contact/', 7]]),
		});
		expect(html).toBe('<form action="{{7}}"></form>');
	});

	test('rewrites <iframe src> as a page reference', async () => {
		const html = await rewritePageRefs({
			html: '<iframe src="/widget/"></iframe>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/widget/', 11]]),
		});
		expect(html).toBe('<iframe src="{{11}}"></iframe>');
	});

	test('rewrites <link rel="canonical" href> as a page reference', async () => {
		const html = await rewritePageRefs({
			html: '<link rel="canonical" href="/about/">',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/about/', 13]]),
		});
		expect(html).toBe('<link rel="canonical" href="{{13}}">');
	});

	test.each(['alternate', 'prev', 'next'])(
		'rewrites <link rel="%s" href> as a page reference',
		async (rel) => {
			const html = await rewritePageRefs({
				html: `<link rel="${rel}" href="/p/">`,
				baseUrl: BASE,
				pageIdLookup: lookupFrom([['https://example.com/p/', 21]]),
			});
			expect(html).toBe(`<link rel="${rel}" href="{{21}}">`);
		},
	);

	test('treats <link rel="stylesheet"|"icon"> href as an asset (root-relative path, NOT id template)', async () => {
		const html = await rewritePageRefs({
			html:
				'<link rel="stylesheet" href="/css/site.css">' +
				'<link rel="icon" href="/favicon.ico">',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([
				['https://example.com/css/site.css', 30],
				['https://example.com/favicon.ico', 31],
			]),
		});
		expect(html).toBe(
			'<link rel="stylesheet" href="/css/site.css">' +
				'<link rel="icon" href="/favicon.ico">',
		);
	});

	test('rewrites srcset URL candidates while preserving descriptors', async () => {
		const html = await rewritePageRefs({
			html: '<img srcset="/a.png 1x, /b.png 2x">',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(html).toBe('<img srcset="/a.png 1x, /b.png 2x">');
	});

	test('returns the original HTML when baseUrl is not parseable', async () => {
		const original = '<a href="/x">x</a>';
		const html = await rewritePageRefs({
			html: original,
			baseUrl: 'not a url',
			pageIdLookup: lookupFrom([]),
		});
		expect(html).toBe(original);
	});

	test('absorbs trailing-slash drift: items registered with `/about/` match a link to `/about`', async () => {
		const html = await rewritePageRefs({
			html: '<a href="/about">about</a>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/about/', 9]]),
		});
		expect(html).toBe('<a href="{{9}}">about</a>');
	});

	test('absorbs trailing-slash drift: items registered with `/about` match a link to `/about/`', async () => {
		const html = await rewritePageRefs({
			html: '<a href="/about/">about</a>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/about', 9]]),
		});
		expect(html).toBe('<a href="{{9}}">about</a>');
	});

	test('exact-query lookup wins over pathname-only fallback when both `?p=1` and `?p=2` are mapped', async () => {
		const html = await rewritePageRefs({
			html: '<a href="/list?p=1">a</a><a href="/list?p=2">b</a>',
			baseUrl: BASE,
			pageIdLookup: lookupFrom([
				['https://example.com/list?p=1', 5],
				['https://example.com/list?p=2', 10],
			]),
		});
		expect(html).toBe('<a href="{{5}}?p=1">a</a><a href="{{10}}?p=2">b</a>');
	});
});
