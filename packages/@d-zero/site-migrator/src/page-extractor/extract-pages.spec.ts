import type { ArchiveSession } from '../types.js';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { extractPages, type ExtractPageResult } from './extract-pages.js';

type RewritePageRefsModule = typeof import('./rewrite-page-refs.js');

vi.mock('../archive/get-page-html.js', () => ({
	getPageHtml: vi.fn(),
}));
vi.mock('../archive/get-frontmatter.js', () => ({
	getFrontmatter: vi.fn(),
}));
vi.mock('./rewrite-page-refs.js', async (importOriginal) => {
	const actual = await importOriginal<RewritePageRefsModule>();
	return {
		...actual,
		rewritePageRefs: vi.fn(actual.rewritePageRefs),
	};
});

const { getPageHtml } = await import('../archive/get-page-html.js');
const { getFrontmatter } = await import('../archive/get-frontmatter.js');
const { rewritePageRefs } = await import('./rewrite-page-refs.js');
const getPageHtmlMock = vi.mocked(getPageHtml);
const getFrontmatterMock = vi.mocked(getFrontmatter);
const rewritePageRefsMock = vi.mocked(rewritePageRefs);

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
		// Default: no DB row → only the id is emitted in frontmatter.
		getFrontmatterMock.mockResolvedValue(null);
		// Default: delegate to the real rewriter so other tests exercise it.
		// Override per-test to force a rewrite failure.
		const real = await vi.importActual<RewritePageRefsModule>('./rewrite-page-refs.js');
		rewritePageRefsMock.mockImplementation(real.rewritePageRefs);
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
		// `/about/` is the only page in its subdirectory section → id 10000.
		expect(written).toBe('---\nid: 10000\n---\n<main><p>hello</p></main>');
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
		expect(written).toBe(`---\nid: 5\n---\n${original}`);
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
			'---\nid: 5\ntitle: "Page"\nog:\n  title: "OG Page"\n---\n<main><p>body</p></main>',
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
		expect(written).toBe(`---\nid: 5\ntitle: "Page"\nlang: "ja"\n---\n${fullDoc}`);
	});

	test('emits an id-only frontmatter block when the DB has no row (getFrontmatter null)', async () => {
		getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>x</p></main>'));
		getFrontmatterMock.mockResolvedValueOnce(null);

		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/p' }],
			outputDir,
			limit: 1,
		});

		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		expect(written).toBe('---\nid: 5\n---\n<main><p>x</p></main>');
	});

	test('fails soft when getFrontmatter errors: the id-only frontmatter is still emitted', async () => {
		// Meta is best-effort — a transient SQLite contention should not lose
		// the page's already-extracted HTML body, but the id we computed up
		// front does not depend on the DB read.
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
		expect(written).toBe('---\nid: 5\n---\n<main><p>x</p></main>');
	});

	test('rewrites same-origin <a href> to the id template using the items-derived id map', async () => {
		getPageHtmlMock.mockResolvedValueOnce(
			docWith('<main><a href="/about/">about</a></main>'),
		);

		await extractPages({
			session: FAKE_SESSION,
			items: [
				{ url: 'https://example.com/index.html' },
				{ url: 'https://example.com/about/' },
			],
			outputDir,
			limit: 2,
		});

		const written = await readFile(path.join(outputDir, 'index.html'), 'utf8');
		// `/index.html` is root section → id 5, `/about/` is subdir section 1 → id 10000.
		expect(written).toBe('---\nid: 5\n---\n<main><a href="{{10000}}">about</a></main>');
	});

	test('fail-soft on rewritePageRefs throw: writes pre-rewrite HTML and surfaces rewriteError on the outcome', async () => {
		getPageHtmlMock.mockResolvedValueOnce(
			docWith('<main><a href="/about/">about</a></main>'),
		);
		rewritePageRefsMock.mockRejectedValueOnce(new Error('parse5 boom'));

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
			rewriteError: { message: 'parse5 boom' },
		});
		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		// Body is the un-rewritten extracted fragment (no {{id}} substitution).
		expect(written).toBe('---\nid: 5\n---\n<main><a href="/about/">about</a></main>');
	});

	test('surfaces getFrontmatter rejection as metaError on the outcome (id-only frontmatter still written)', async () => {
		getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>x</p></main>'));
		getFrontmatterMock.mockRejectedValueOnce(new Error('sqlite contention'));

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/p' }],
			outputDir,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results[0]).toMatchObject({
			url: 'https://example.com/p',
			outcome: 'extracted',
			metaError: { message: 'sqlite contention' },
		});
	});

	test('rewrites same-origin asset URLs to root-relative paths', async () => {
		getPageHtmlMock.mockResolvedValueOnce(
			docWith('<main><img src="../img/a.png"></main>'),
		);

		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/sub/page.html' }],
			outputDir,
			limit: 1,
		});

		const written = await readFile(path.join(outputDir, 'sub', 'page.html'), 'utf8');
		expect(written).toBe('---\nid: 10000\n---\n<main><img src="/img/a.png"></main>');
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
