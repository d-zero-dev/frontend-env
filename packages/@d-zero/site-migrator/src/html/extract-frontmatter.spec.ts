import { describe, expect, test } from 'vitest';

import { extractFrontmatter } from './extract-frontmatter.js';

describe('extractFrontmatter', () => {
	test('returns empty object when head is absent', () => {
		expect(extractFrontmatter('<html><body>hi</body></html>')).toEqual({});
	});

	test('extracts title without splitting when no separator is present', () => {
		const html = '<html><head><title>Welcome to D-ZERO</title></head></html>';
		expect(extractFrontmatter(html)).toMatchObject({
			title: 'Welcome to D-ZERO',
		});
		expect(extractFrontmatter(html)).not.toHaveProperty('rawTitle');
	});

	test('splits title on full-width and half-width pipes, keeps raw on rawTitle', () => {
		const html = '<head><title>Page Name｜D-ZERO</title></head>';
		expect(extractFrontmatter(html)).toMatchObject({
			title: 'Page Name',
			rawTitle: 'Page Name｜D-ZERO',
		});
	});

	test('drops leading empty segments when splitting', () => {
		// Whitespace around the <title> text content is trimmed at the boundary,
		// so the raw passed into the splitter is the trimmed value.
		const html = '<head><title> | Tail </title></head>';
		expect(extractFrontmatter(html)).toMatchObject({
			title: 'Tail',
			rawTitle: '| Tail',
		});
	});

	test('preserves empty-string meta values', () => {
		const html = '<head><meta name="description" content=""></head>';
		expect(extractFrontmatter(html)).toMatchObject({ description: '' });
	});

	test('keeps the first occurrence when a tag repeats', () => {
		const html =
			'<head><meta name="description" content="first"><meta name="description" content="second"></head>';
		expect(extractFrontmatter(html)).toMatchObject({ description: 'first' });
	});

	test('collects og:* into nested object with siteName camel-cased', () => {
		const html = `
			<head>
				<meta property="og:title" content="OG Title｜Site">
				<meta property="og:description" content="Desc">
				<meta property="og:image" content="https://example.com/og.png">
				<meta property="og:url" content="https://example.com/page">
				<meta property="og:type" content="article">
				<meta property="og:site_name" content="Example">
			</head>
		`;
		expect(extractFrontmatter(html)).toMatchObject({
			og: {
				title: 'OG Title',
				rawTitle: 'OG Title｜Site',
				description: 'Desc',
				image: 'https://example.com/og.png',
				url: 'https://example.com/page',
				type: 'article',
				siteName: 'Example',
			},
		});
	});

	test('collects twitter:* meta tags', () => {
		const html = `
			<head>
				<meta name="twitter:card" content="summary">
				<meta name="twitter:title" content="Tw Title">
				<meta name="twitter:description" content="Tw Desc">
				<meta name="twitter:image" content="https://example.com/tw.png">
			</head>
		`;
		expect(extractFrontmatter(html)).toMatchObject({
			twitter: {
				card: 'summary',
				title: 'Tw Title',
				description: 'Tw Desc',
				image: 'https://example.com/tw.png',
			},
		});
	});

	test('reads canonical from link rel attribute', () => {
		const html =
			'<head><link rel="canonical" href="https://example.com/canonical"></head>';
		expect(extractFrontmatter(html)).toMatchObject({
			canonical: 'https://example.com/canonical',
		});
	});

	test('reads lang from <html lang> attribute', () => {
		const html = '<html lang="ja"><head></head></html>';
		expect(extractFrontmatter(html)).toMatchObject({ lang: 'ja' });
	});

	test('prefers the bare lang attribute over xml:lang when both are present', () => {
		const html = '<html xml:lang="ja" lang="en"><head></head></html>';
		expect(extractFrontmatter(html)).toMatchObject({ lang: 'en' });
	});

	test('does not extract lang from xml:lang alone', () => {
		const html = '<html xml:lang="ja"><head></head></html>';
		expect(extractFrontmatter(html)).not.toHaveProperty('lang');
	});

	test('trims full-width (U+3000) whitespace when splitting titles', () => {
		const html = '<head><title>　|　Tail　</title></head>';
		expect(extractFrontmatter(html)).toMatchObject({ title: 'Tail' });
	});

	test('reads robots meta content', () => {
		const html = '<head><meta name="robots" content="noindex, nofollow"></head>';
		expect(extractFrontmatter(html)).toMatchObject({ robots: 'noindex, nofollow' });
	});

	test('reads charset from meta charset', () => {
		const html = '<head><meta charset="us-ascii"></head>';
		expect(extractFrontmatter(html)).toMatchObject({ charset: 'us-ascii' });
	});

	test('reads charset from http-equiv content-type', () => {
		const html =
			'<head><meta http-equiv="content-type" content="text/html; charset=shift_jis"></head>';
		expect(extractFrontmatter(html)).toMatchObject({ charset: 'shift_jis' });
	});

	test('decodes HTML entities in attribute values via parse5', () => {
		const html = '<head><meta name="description" content="A &amp; B"></head>';
		expect(extractFrontmatter(html)).toMatchObject({ description: 'A & B' });
	});
});
