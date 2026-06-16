import { describe, expect, test } from 'vitest';

import { rewriteAssetRefs } from './rewrite-asset-refs.js';

const prefix = (url: string) =>
	`https://cdn.example.com${url.startsWith('/') ? url : `/${url}`}`;

describe('rewriteAssetRefs', () => {
	test('rewrites href on <a> and src on <img>', async () => {
		const input = '<p><a href="/about">about</a><img src="/logo.png"></p>';
		const out = await rewriteAssetRefs(input, prefix);
		expect(out).toContain('href="https://cdn.example.com/about"');
		expect(out).toContain('src="https://cdn.example.com/logo.png"');
	});

	test('leaves attributes untouched when the resolver returns null', async () => {
		const input = '<a href="/about">about</a>';
		const out = await rewriteAssetRefs(input, () => null);
		expect(out).toContain('href="/about"');
	});

	test('rewrites every URL in a srcset and preserves descriptors', async () => {
		const input = '<img srcset="a.jpg 1x, b.jpg 2x">';
		const out = await rewriteAssetRefs(input, (url) => `cdn/${url}`);
		expect(out).toContain('srcset="cdn/a.jpg 1x, cdn/b.jpg 2x"');
	});

	test('does not rewrite attributes outside the allow-list', async () => {
		const input = '<div id="foo" data-href="/x"></div>';
		const out = await rewriteAssetRefs(input, prefix);
		expect(out).toContain('id="foo"');
		expect(out).toContain('data-href="/x"');
	});

	test('passes tag name to the resolver for context-sensitive rewriting', async () => {
		const calls: { url: string; attribute: string; tag: string }[] = [];
		await rewriteAssetRefs(
			'<a href="/x"></a><link rel="icon" href="/y">',
			(url, attribute, tag) => {
				calls.push({ url, attribute, tag });
				return null;
			},
		);
		expect(calls).toEqual([
			{ url: '/x', attribute: 'href', tag: 'a' },
			{ url: '/y', attribute: 'href', tag: 'link' },
		]);
	});
});
