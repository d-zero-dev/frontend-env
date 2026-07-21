import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('./archive/open-archive.js', () => ({
	openArchive: vi.fn(),
}));
vi.mock('./archive/list-internal-resources.js', () => ({
	listInternalResources: vi.fn(),
}));
vi.mock('./archive/list-internal-pages.js', () => ({
	listInternalPages: vi.fn(),
}));
vi.mock('./archive/get-page-html.js', () => ({
	getPageHtml: vi.fn(),
}));
vi.mock('./archive/get-frontmatter.js', () => ({
	getFrontmatter: vi.fn(),
}));
type RewritePageRefsModule = typeof import('./page-extractor/rewrite-page-refs.js');
vi.mock('./page-extractor/rewrite-page-refs.js', async (importOriginal) => {
	const actual = await importOriginal<RewritePageRefsModule>();
	return {
		...actual,
		rewritePageRefs: vi.fn(actual.rewritePageRefs),
	};
});

const { openArchive } = await import('./archive/open-archive.js');
const { listInternalResources } = await import('./archive/list-internal-resources.js');
const { listInternalPages } = await import('./archive/list-internal-pages.js');
const { getPageHtml } = await import('./archive/get-page-html.js');
const { getFrontmatter } = await import('./archive/get-frontmatter.js');
const { rewritePageRefs } = await import('./page-extractor/rewrite-page-refs.js');
const { migrate } = await import('./migrate.js');

const openArchiveMock = vi.mocked(openArchive);
const listInternalResourcesMock = vi.mocked(listInternalResources);
const listInternalPagesMock = vi.mocked(listInternalPages);
const getPageHtmlMock = vi.mocked(getPageHtml);
const getFrontmatterMock = vi.mocked(getFrontmatter);
const rewritePageRefsMock = vi.mocked(rewritePageRefs);

const closeMock = vi.fn(() => Promise.resolve());

/**
 *
 * @param items
 */
function iter<T>(items: readonly T[]): AsyncIterable<T> {
	return {
		[Symbol.asyncIterator]() {
			let index = 0;
			return {
				next: () =>
					Promise.resolve(
						index < items.length
							? { value: items[index++]!, done: false }
							: { value: undefined as never, done: true },
					),
			};
		},
	};
}

describe('migrate', () => {
	let outputDir = '';

	beforeEach(async () => {
		outputDir = await mkdtemp(path.join(tmpdir(), 'site-migrator-migrate-'));
		openArchiveMock.mockReset();
		listInternalResourcesMock.mockReset();
		listInternalPagesMock.mockReset();
		getPageHtmlMock.mockReset();
		getFrontmatterMock.mockReset();
		getFrontmatterMock.mockResolvedValue(null);
		rewritePageRefsMock.mockReset();
		const real = await vi.importActual<RewritePageRefsModule>(
			'./page-extractor/rewrite-page-refs.js',
		);
		rewritePageRefsMock.mockImplementation(real.rewritePageRefs);
		closeMock.mockClear();

		openArchiveMock.mockResolvedValue({
			archiveId: 'test',
			accessor: {} as never,
			close: closeMock,
		});
	});

	afterEach(async () => {
		await rm(outputDir, { recursive: true, force: true });
		vi.unstubAllGlobals();
	});

	test('aggregates per-pipeline counts into MigrateReport with the renamed keys', async () => {
		listInternalResourcesMock.mockReturnValue(
			iter([
				{ url: 'https://example.com/a.css', contentType: 'text/css' },
				{ url: 'https://example.com/b.css', contentType: 'text/css' },
			]),
		);
		listInternalPagesMock.mockReturnValue(
			iter([{ url: 'https://example.com/p1' }, { url: 'https://example.com/p2' }]),
		);
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve(new Response(new Uint8Array([1, 2]), { status: 200 }))),
		);
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main><p>x</p></main></body></html>',
		);
		getPageHtmlMock.mockResolvedValueOnce(null);

		const report = await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
		});

		expect(report).toEqual({
			totalResources: 2,
			resourcesSaved: 2,
			resourcesFailed: 0,
			totalPages: 2,
			pagesExtracted: 1,
			pagesFallback: 0,
			pagesMissing: 1,
			pagesFailed: 0,
			pagesRewriteFailed: 0,
			pagesMetaFailed: 0,
		});
		expect(closeMock).toHaveBeenCalledTimes(1);
	});

	test('forwards onResource and onPage callbacks for every per-item event', async () => {
		listInternalResourcesMock.mockReturnValue(
			iter([{ url: 'https://example.com/a.css', contentType: 'text/css' }]),
		);
		listInternalPagesMock.mockReturnValue(iter([{ url: 'https://example.com/p1' }]));
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve(new Response(new Uint8Array([1]), { status: 200 }))),
		);
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main><p>x</p></main></body></html>',
		);

		const resources: unknown[] = [];
		const pages: unknown[] = [];
		await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			onResource: (event) => resources.push(event),
			onPage: (event) => pages.push(event),
		});

		expect(resources).toHaveLength(1);
		expect(resources[0]).toMatchObject({
			url: 'https://example.com/a.css',
			outcome: 'saved',
		});
		expect(pages).toHaveLength(1);
		expect(pages[0]).toMatchObject({
			url: 'https://example.com/p1',
			outcome: 'extracted',
			matchedBy: 'tag:main',
		});
	});

	test('runs resources before pages so layout-stripped HTML wins on overlap', async () => {
		const callOrder: string[] = [];
		listInternalResourcesMock.mockReturnValue(
			iter([{ url: 'https://example.com/p1.html', contentType: 'text/html' }]),
		);
		listInternalPagesMock.mockReturnValue(iter([{ url: 'https://example.com/p1.html' }]));
		vi.stubGlobal(
			'fetch',
			vi.fn(() => {
				callOrder.push('fetch');
				return Promise.resolve(new Response('NETWORK', { status: 200 }));
			}),
		);
		getPageHtmlMock.mockImplementation(() => {
			callOrder.push('getPageHtml');
			return Promise.resolve(
				'<!doctype html><html><head></head><body><main>PAGE</main></body></html>',
			);
		});

		await migrate({ archivePath: '/tmp/fake.nitpicker', outputDir });

		expect(callOrder).toEqual(['fetch', 'getPageHtml']);
		const written = await readFile(path.join(outputDir, 'p1.html'), 'utf8');
		expect(written).toBe('---\nid: 5\n---\n<main>PAGE</main>');
	});

	test('end-to-end: prepends YAML frontmatter (id + DB meta) to the extracted HTML', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(iter([{ url: 'https://example.com/p1' }]));
		vi.stubGlobal('fetch', vi.fn());
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main><p>body</p></main></body></html>',
		);
		getFrontmatterMock.mockResolvedValueOnce({
			title: 'P1',
			og: { title: 'OG P1' },
		});

		await migrate({ archivePath: '/tmp/fake.nitpicker', outputDir });

		const written = await readFile(path.join(outputDir, 'p1.html'), 'utf8');
		expect(written).toBe(
			'---\nid: 5\ntitle: "P1"\nog:\n  title: "OG P1"\n---\n<main><p>body</p></main>',
		);
	});

	test('end-to-end: rewrites same-origin <a href> to {{<id>}} and assets to root-relative paths', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(
			iter([
				{ url: 'https://example.com/index.html' },
				{ url: 'https://example.com/about/' },
			]),
		);
		vi.stubGlobal('fetch', vi.fn());
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main>' +
				'<a href="/about/">about</a>' +
				'<img src="../img/logo.png">' +
				'<a href="https://other.example/x">ext</a>' +
				'</main></body></html>',
		);
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main>body</main></body></html>',
		);

		await migrate({ archivePath: '/tmp/fake.nitpicker', outputDir });

		const written = await readFile(path.join(outputDir, 'index.html'), 'utf8');
		expect(written).toBe(
			'---\nid: 5\n---\n<main>' +
				'<a href="{{10000}}">about</a>' +
				'<img src="/img/logo.png">' +
				'<a href="https://other.example/x">ext</a>' +
				'</main>',
		);
	});

	test('counts pages whose rewritePageRefs rejection was surfaced as rewriteError under pagesRewriteFailed', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(iter([{ url: 'https://example.com/p1' }]));
		vi.stubGlobal('fetch', vi.fn());
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main>x</main></body></html>',
		);
		rewritePageRefsMock.mockRejectedValueOnce(new Error('rewrite boom'));

		const report = await migrate({ archivePath: '/tmp/fake.nitpicker', outputDir });

		expect(report).toMatchObject({
			pagesExtracted: 1,
			pagesRewriteFailed: 1,
			pagesMetaFailed: 0,
		});
	});

	test('counts pages whose getFrontmatter rejection was surfaced as metaError under pagesMetaFailed', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(iter([{ url: 'https://example.com/p1' }]));
		vi.stubGlobal('fetch', vi.fn());
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main>x</main></body></html>',
		);
		// Override the default `mockResolvedValue(null)` set in beforeEach.
		getFrontmatterMock.mockReset();
		getFrontmatterMock.mockRejectedValueOnce(new Error('sqlite boom'));

		const report = await migrate({ archivePath: '/tmp/fake.nitpicker', outputDir });

		expect(report).toMatchObject({
			pagesExtracted: 1,
			pagesMetaFailed: 1,
			pagesRewriteFailed: 0,
		});
	});

	test('closes the archive session even when the resource pipeline throws', async () => {
		listInternalResourcesMock.mockImplementation(() => {
			throw new Error('listing crashed');
		});
		listInternalPagesMock.mockReturnValue(iter([]));

		await expect(
			migrate({ archivePath: '/tmp/fake.nitpicker', outputDir }),
		).rejects.toThrow('listing crashed');
		expect(closeMock).toHaveBeenCalledTimes(1);
	});
});
