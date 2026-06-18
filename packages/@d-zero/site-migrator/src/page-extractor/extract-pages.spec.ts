import type { ArchiveSession } from '../types.js';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { extractPages, type ExtractPageResult } from './extract-pages.js';

vi.mock('../archive/get-page-html.js', () => ({
	getPageHtml: vi.fn(),
}));
vi.mock('../archive/get-frontmatter.js', () => ({
	getFrontmatter: vi.fn(),
}));

const { getPageHtml } = await import('../archive/get-page-html.js');
const { getFrontmatter } = await import('../archive/get-frontmatter.js');
const getPageHtmlMock = vi.mocked(getPageHtml);
const getFrontmatterMock = vi.mocked(getFrontmatter);

const FAKE_SESSION = {
	archiveId: 'test',
	accessor: {} as ArchiveSession['accessor'],
	close: async () => {
		/* noop */
	},
} satisfies ArchiveSession;

const docWith = (body: string) =>
	`<!doctype html><html><head><title>t</title></head><body>${body}</body></html>`;

describe('extractPages', () => {
	let outputDir = '';

	beforeEach(async () => {
		outputDir = await mkdtemp(path.join(tmpdir(), 'site-migrator-pages-'));
		getPageHtmlMock.mockReset();
		getFrontmatterMock.mockReset();
		// Default: no DB row → no frontmatter prepended, keeping unrelated tests
		// focused on extractMainContent behaviour rather than YAML output.
		getFrontmatterMock.mockResolvedValue(null);
	});

	afterEach(async () => {
		await rm(outputDir, { recursive: true, force: true });
	});

	test('writes the extracted fragment when extractMainContent finds a single match', async () => {
		getPageHtmlMock.mockResolvedValueOnce(
			docWith('<header></header><main><p>hello</p></main>'),
		);

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/about/' }],
			outputDir,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results).toEqual([
			{
				url: 'https://example.com/about/',
				outcome: 'extracted',
				outputPath: path.join(outputDir, 'about', 'index.html'),
				matchedBy: 'tag:main',
			},
		]);
		const written = await readFile(path.join(outputDir, 'about', 'index.html'), 'utf8');
		expect(written).toBe('<main><p>hello</p></main>');
	});

	test('writes the original document when no rung matches (outcome=fallback)', async () => {
		const original = docWith('<div class="x"></div><div class="y"></div>');
		getPageHtmlMock.mockResolvedValueOnce(original);

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/x' }],
			outputDir,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results).toEqual([
			{
				url: 'https://example.com/x',
				outcome: 'fallback',
				outputPath: path.join(outputDir, 'x.html'),
			},
		]);
		const written = await readFile(path.join(outputDir, 'x.html'), 'utf8');
		expect(written).toBe(original);
	});

	test('emits outcome=missing without writing to disk when archive returns null', async () => {
		getPageHtmlMock.mockResolvedValueOnce(null);

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/nope' }],
			outputDir,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results).toEqual([{ url: 'https://example.com/nope', outcome: 'missing' }]);
		await expect(readFile(path.join(outputDir, 'nope.html'))).rejects.toThrow();
	});

	test('surfaces getPageHtml errors as outcome=failed', async () => {
		getPageHtmlMock.mockRejectedValueOnce(new Error('boom'));

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/x' }],
			outputDir,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			url: 'https://example.com/x',
			outcome: 'failed',
			error: { message: 'boom' },
		});
	});

	test('returns immediately when items is empty', async () => {
		await extractPages({
			session: FAKE_SESSION,
			items: [],
			outputDir,
			limit: 1,
		});
		expect(getPageHtmlMock).not.toHaveBeenCalled();
	});

	test('marks duplicate-outputPath URLs as failed without writing twice', async () => {
		// Both URLs collapse to `<outputDir>/about/index.html` via urlToLocalPath.
		// The second one should be reported as failed without ever calling getPageHtml.
		getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>x</p></main>'));

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [
				{ url: 'https://example.com/about/' },
				{ url: 'https://example.com/about/index.html' },
			],
			outputDir,
			limit: 2,
			onResult: (event) => results.push(event),
		});

		expect(results).toHaveLength(2);
		const extracted = results.find((event) => event.url === 'https://example.com/about/');
		const failed = results.find(
			(event) => event.url === 'https://example.com/about/index.html',
		);
		expect(extracted).toMatchObject({ outcome: 'extracted' });
		expect(failed).toMatchObject({
			outcome: 'failed',
			error: { message: expect.stringMatching(/duplicate output path/i) },
		});
		expect(getPageHtmlMock).toHaveBeenCalledTimes(1);
	});

	test('prepends a YAML frontmatter block when the archive has DB meta for the URL', async () => {
		getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>body</p></main>'));
		getFrontmatterMock.mockResolvedValueOnce({
			title: 'Page',
			og: { title: 'OG Page' },
		});

		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/p' }],
			outputDir,
			limit: 1,
		});

		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		expect(written).toBe(
			'---\ntitle: "Page"\nog:\n  title: "OG Page"\n---\n<main><p>body</p></main>',
		);
	});

	test('prepends frontmatter even when extractMainContent falls back to the full document', async () => {
		const fullDoc = docWith('<div class="x"></div><div class="y"></div>');
		getPageHtmlMock.mockResolvedValueOnce(fullDoc);
		getFrontmatterMock.mockResolvedValueOnce({ title: 'Page', lang: 'ja' });

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/p' }],
			outputDir,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results[0]).toMatchObject({ outcome: 'fallback' });
		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		expect(written).toBe(`---\ntitle: "Page"\nlang: "ja"\n---\n${fullDoc}`);
	});

	test('omits the frontmatter block entirely when the DB has no row (getFrontmatter null)', async () => {
		getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>x</p></main>'));
		getFrontmatterMock.mockResolvedValueOnce(null);

		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/p' }],
			outputDir,
			limit: 1,
		});

		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		expect(written).toBe('<main><p>x</p></main>');
	});

	test('fails soft when getFrontmatter errors: the HTML is still written without a frontmatter block', async () => {
		// Meta is best-effort — a transient SQLite contention should not lose
		// the page's already-extracted HTML body.
		getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>x</p></main>'));
		getFrontmatterMock.mockRejectedValueOnce(new Error('db boom'));

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/p' }],
			outputDir,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			url: 'https://example.com/p',
			outcome: 'extracted',
		});
		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		expect(written).toBe('<main><p>x</p></main>');
	});

	test('returns immediately and writes nothing when signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/x' }],
			outputDir,
			limit: 1,
			signal: controller.signal,
			onResult: (event) => results.push(event),
		});

		expect(results).toEqual([]);
		expect(getPageHtmlMock).not.toHaveBeenCalled();
		await expect(readFile(path.join(outputDir, 'x.html'))).rejects.toThrow();
	});
});
