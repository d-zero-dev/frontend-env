import { describe, expect, test } from 'vitest';

import { assignPageIds } from './assign-page-ids.js';

describe('assignPageIds', () => {
	test('assigns 5/10/15 to root pages sorted by pathComparator', () => {
		const ids = assignPageIds([
			'https://example.com/sorry.html',
			'https://example.com/profile.html',
			'https://example.com/index.html',
			'https://example.com/maintenance.html',
		]);

		expect([...ids.entries()]).toStrictEqual([
			['https://example.com/index.html', 5],
			['https://example.com/maintenance.html', 10],
			['https://example.com/profile.html', 15],
			['https://example.com/sorry.html', 20],
		]);
	});

	test('groups by first-level subdirectory and starts each section at N*10000', () => {
		const ids = assignPageIds([
			'https://example.com/products/index.html',
			'https://example.com/products/about.html',
			'https://example.com/news/1.html',
			'https://example.com/news/2.html',
			'https://example.com/news/10.html',
		]);

		expect(ids.get('https://example.com/news/1.html')).toBe(10_000);
		expect(ids.get('https://example.com/news/2.html')).toBe(10_005);
		// pathComparator does natural sort; 10 sorts after 2.
		expect(ids.get('https://example.com/news/10.html')).toBe(10_010);
		// products sorts after news, so section index is 2 → start at 20000.
		// pathComparator puts `index` before regular names.
		expect(ids.get('https://example.com/products/index.html')).toBe(20_000);
		expect(ids.get('https://example.com/products/about.html')).toBe(20_005);
	});

	test('treats trailing-slash root URLs as root section', () => {
		const ids = assignPageIds(['https://example.com/', 'https://example.com/about.html']);

		expect(ids.get('https://example.com/')).toBe(5);
		expect(ids.get('https://example.com/about.html')).toBe(10);
	});

	test('treats `/foo/` as a subdirectory section even when alone', () => {
		const ids = assignPageIds([
			'https://example.com/about/',
			'https://example.com/index.html',
		]);

		expect(ids.get('https://example.com/index.html')).toBe(5);
		expect(ids.get('https://example.com/about/')).toBe(10_000);
	});

	test('dedupes duplicate URLs by exact string equality', () => {
		const ids = assignPageIds([
			'https://example.com/a.html',
			'https://example.com/a.html',
			'https://example.com/b.html',
		]);

		expect(ids.size).toBe(2);
		expect(ids.get('https://example.com/a.html')).toBe(5);
		expect(ids.get('https://example.com/b.html')).toBe(10);
	});

	test('section index counts only subdirectory sections (root does not consume one)', () => {
		const ids = assignPageIds([
			'https://example.com/root.html',
			'https://example.com/alpha/page.html',
			'https://example.com/bravo/page.html',
			'https://example.com/charlie/page.html',
		]);

		expect(ids.get('https://example.com/root.html')).toBe(5);
		expect(ids.get('https://example.com/alpha/page.html')).toBe(10_000);
		expect(ids.get('https://example.com/bravo/page.html')).toBe(20_000);
		expect(ids.get('https://example.com/charlie/page.html')).toBe(30_000);
	});

	test('drops unparsable URLs silently', () => {
		const ids = assignPageIds(['not a url', 'https://example.com/index.html']);

		expect(ids.size).toBe(1);
		expect(ids.get('https://example.com/index.html')).toBe(5);
	});

	test('sorts subdirectory section names case-insensitively', () => {
		const ids = assignPageIds([
			'https://example.com/Beta/page.html',
			'https://example.com/alpha/page.html',
		]);

		expect(ids.get('https://example.com/alpha/page.html')).toBe(10_000);
		expect(ids.get('https://example.com/Beta/page.html')).toBe(20_000);
	});

	test('throws when a section would exceed the 2000-page id-range, instead of silently colliding with the next section', () => {
		const urls = Array.from(
			{ length: 2001 },
			(_, i) => `https://example.com/section/${i}.html`,
		);
		expect(() => assignPageIds(urls)).toThrow(/section "section" has 2001 pages/);
	});

	test('accepts exactly 2000 pages in a section without throwing (boundary)', () => {
		const urls = Array.from(
			{ length: 2000 },
			(_, i) => `https://example.com/section/${i}.html`,
		);
		// Must not throw; the last id must stay strictly below the next section's
		// base (20_000) so peer-section ids never collide.
		const ids = assignPageIds(urls);
		const maxId = Math.max(...ids.values());
		expect(maxId).toBeLessThan(20_000);
	});

	test('throws for the same reason when the root section overflows', () => {
		const urls = Array.from(
			{ length: 2001 },
			(_, i) => `https://example.com/page-${i}.html`,
		);
		expect(() => assignPageIds(urls)).toThrow(/section "root" has 2001 pages/);
	});

	test('output is stable regardless of input order', () => {
		const inputA = [
			'https://example.com/index.html',
			'https://example.com/foo/a.html',
			'https://example.com/bar/b.html',
		];
		const inputB = inputA.toReversed();

		const idsA = assignPageIds(inputA);
		const idsB = assignPageIds(inputB);

		expect([...idsA.entries()].toSorted()).toStrictEqual([...idsB.entries()].toSorted());
	});
});
