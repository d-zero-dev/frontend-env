import { describe, expect, test } from 'vitest';

import { extractMainContent } from './extract-main-content.js';

const doc = (body: string) =>
	`<!doctype html><html><head><title>t</title></head><body>${body}</body></html>`;

describe('extractMainContent', () => {
	test('matches a single element whose class token contains "main"', () => {
		const html = doc('<div class="header"></div><div class="page-main"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('class:main');
		expect(result.html).toBe('<div class="page-main"><p>x</p></div>');
	});

	test('falls through to "class:content" when no class contains "main"', () => {
		const html = doc('<div class="page-content"><p>x</p></div><div class="foot"></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('class:content');
		expect(result.html).toBe('<div class="page-content"><p>x</p></div>');
	});

	test('falls through to "tag:main" when class hits 0 elements', () => {
		const html = doc('<main><p>x</p></main>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('tag:main');
		expect(result.html).toBe('<main><p>x</p></main>');
	});

	test('falls through to "role:main" when <main> is absent', () => {
		const html = doc('<div role="main"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('role:main');
		expect(result.html).toBe('<div role="main"><p>x</p></div>');
	});

	test('falls through to "id:main" when role:main is absent', () => {
		const html = doc('<div id="page-main"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('id:main');
		expect(result.html).toBe('<div id="page-main"><p>x</p></div>');
	});

	test('falls through to "id:content" when id:main is absent', () => {
		const html = doc('<div id="page-content"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('id:content');
		expect(result.html).toBe('<div id="page-content"><p>x</p></div>');
	});

	test('skips the rung that finds more than one match and tries the next', () => {
		// Two class-main candidates → criterion 1 disqualified. Criterion 2
		// (class:content) finds exactly one → that wins.
		const html = doc(
			'<div class="main"></div><div class="main"></div><div class="content"><p>x</p></div>',
		);
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('class:content');
		expect(result.html).toBe('<div class="content"><p>x</p></div>');
	});

	test('returns matched=false and the original HTML when every rung misses or duplicates', () => {
		const html = doc('<main></main><main></main>'); // two <main>s, no class/role/id matches
		const result = extractMainContent(html);
		expect(result.matched).toBe(false);
		expect(result.matchedBy).toBeUndefined();
		expect(result.html).toBe(html);
	});

	test('class match is case-insensitive and token-aware', () => {
		const html = doc('<section class="Site-MAIN extra"><p>x</p></section>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('class:main');
	});

	test('role match is case-insensitive', () => {
		const html = doc('<div role="MAIN"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('role:main');
	});

	test('id match is case-insensitive substring', () => {
		const html = doc('<div id="Site-Main-Wrap"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('id:main');
	});

	test('class match also walks nested descendants', () => {
		const html = doc(
			'<div class="layout"><header></header><div class="page-main"><p>x</p></div></div>',
		);
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('class:main');
		expect(result.html).toBe('<div class="page-main"><p>x</p></div>');
	});

	test('returns the original HTML untouched when zero rungs match', () => {
		const html = doc('<div class="x"></div><div class="y"></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(false);
		expect(result.html).toBe(html);
	});

	test('does not pick <body> even when it carries a matching class', () => {
		// <body class="page-main"> should not swallow the whole document — the
		// inner <main> is the real candidate.
		const html =
			'<!doctype html><html><head></head><body class="page-main"><header></header><main><p>real</p></main><footer></footer></body></html>';
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('tag:main');
		expect(result.html).toBe('<main><p>real</p></main>');
	});

	test('does not pick <html> or <head> even when they carry a matching id', () => {
		const html =
			'<!doctype html><html id="main"><head></head><body><main><p>x</p></main></body></html>';
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('tag:main');
	});

	test('role match accepts a space-separated token list', () => {
		const html = doc('<div role="main banner"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('role:main');
	});

	test('role match still works with a single token', () => {
		const html = doc('<div role="main"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('role:main');
	});

	test('class tokenization handles tab and newline separators', () => {
		const html = doc('<div class="header\tpage-main\nextra"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('class:main');
	});

	test('class="" does not match any rung 1/2 candidate', () => {
		const html = doc('<div class=""></div><main><p>x</p></main>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('tag:main');
	});

	test('class with only whitespace does not match', () => {
		const html = doc('<div class="   "></div><main><p>x</p></main>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('tag:main');
	});

	test('role match is case-insensitive across tokens', () => {
		const html = doc('<div role="BANNER Main extra"><p>x</p></div>');
		const result = extractMainContent(html);
		expect(result.matched).toBe(true);
		expect(result.matchedBy).toBe('role:main');
	});

	test('empty body falls back to original HTML', () => {
		const html = '<!doctype html><html><head></head><body></body></html>';
		const result = extractMainContent(html);
		expect(result.matched).toBe(false);
		expect(result.html).toBe(html);
	});
});
