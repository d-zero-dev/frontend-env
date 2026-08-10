import type { LayoutBlock } from '@d-zero/anatomist/types';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { IncludeNoMatchError, InvalidIncludeValueError } from './include-filter.js';

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
vi.mock('./page-extractor/resolve-page-layout.js', () => ({
	resolvePageLayouts: vi.fn(),
}));

const { openArchive } = await import('./archive/open-archive.js');
const { listInternalResources } = await import('./archive/list-internal-resources.js');
const { listInternalPages } = await import('./archive/list-internal-pages.js');
const { getPageHtml } = await import('./archive/get-page-html.js');
const { getFrontmatter } = await import('./archive/get-frontmatter.js');
const { rewritePageRefs } = await import('./page-extractor/rewrite-page-refs.js');
const { resolvePageLayouts } = await import('./page-extractor/resolve-page-layout.js');
const { migrate } = await import('./migrate.js');

const openArchiveMock = vi.mocked(openArchive);
const listInternalResourcesMock = vi.mocked(listInternalResources);
const listInternalPagesMock = vi.mocked(listInternalPages);
const getPageHtmlMock = vi.mocked(getPageHtml);
const getFrontmatterMock = vi.mocked(getFrontmatter);
const rewritePageRefsMock = vi.mocked(rewritePageRefs);
const resolvePageLayoutsMock = vi.mocked(resolvePageLayouts);

const CONTENT_CLASS = 'js-bge-content';

/**
 * @param overrides
 */
function sampleLeafBlock(overrides: Partial<LayoutBlock> = {}): LayoutBlock {
	return {
		layoutType: 'leaf',
		tagName: 'DIV',
		id: null,
		classList: [],
		boundingBox: { x: 0, y: 0, width: 0, height: 0 },
		innerHTML: '',
		confidence: 0,
		signals: {},
		children: [],
		...overrides,
	};
}

/**
 * `resolvePageLayouts`のモックを、渡された全URLについて「main一致・単一wysiwygブロックへの
 * 変換に成功する」決定的な結果を返すよう設定する（`extract-pages.spec.ts`と同じ方針）。
 * @param innerHTMLByUrl 単一文字列なら全URL共通、`Record`ならURLごとの`innerHTML`（未指定は空）。
 */
function mockConvertedLayout(innerHTMLByUrl: Record<string, string> | string = ''): void {
	resolvePageLayoutsMock.mockImplementation((options) => {
		for (const item of options.items) {
			const innerHTML =
				typeof innerHTMLByUrl === 'string'
					? innerHTMLByUrl
					: (innerHTMLByUrl[item.url] ?? '');
			options.onResult?.({
				url: item.url,
				outcome: 'resolved-live',
				results: [
					{
						url: item.url,
						viewport: { name: 'pc', width: 1280 },
						mainSelector: 'main',
						root: {
							...sampleLeafBlock(),
							layoutType: 'vertical-stack',
							confidence: 1,
							children: [sampleLeafBlock({ innerHTML })],
						},
					},
				],
			});
		}
		return Promise.resolve();
	});
}

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
		resolvePageLayoutsMock.mockReset();
		// Default: layout resolution + block conversion succeeds for every
		// matched page, producing one empty wysiwyg block. Most tests here are
		// about the resource/page pipeline orchestration, not about block
		// conversion itself (that's `extract-pages.spec.ts`'s concern).
		mockConvertedLayout();
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
			contentClass: CONTENT_CLASS,
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
			pagesBlockConverted: 1,
			pagesBlockPartial: 0,
			pagesBlockConversionFailed: 0,
		});
		expect(closeMock).toHaveBeenCalledTimes(1);
	});

	test('aggregates pagesBlockPartial and pagesBlockConversionFailed from distinct pages', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(
			iter([
				{ url: 'https://example.com/partial' },
				{ url: 'https://example.com/fatal' },
			]),
		);
		vi.stubGlobal('fetch', vi.fn());
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main><p>x</p></main></body></html>',
		);
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main><p>y</p></main></body></html>',
		);
		resolvePageLayoutsMock.mockImplementation((options) => {
			for (const item of options.items) {
				if (item.url === 'https://example.com/partial') {
					// simple-grid with malformed rowSizes → the block falls back to
					// wysiwyg, but the page itself is still `converted`→`partial`.
					options.onResult?.({
						url: item.url,
						outcome: 'resolved-live',
						results: [
							{
								url: item.url,
								viewport: { name: 'pc', width: 1280 },
								mainSelector: 'main',
								root: {
									...sampleLeafBlock(),
									layoutType: 'vertical-stack',
									confidence: 1,
									children: [
										{
											...sampleLeafBlock(),
											layoutType: 'simple-grid',
											confidence: 0.9,
											signals: { rowSizes: [3] },
											children: [sampleLeafBlock()],
										},
									],
								},
							},
						],
					});
				} else {
					// Fatal: resolvePageLayouts failed outright for this page.
					options.onResult?.({
						url: item.url,
						outcome: 'missing',
						error: new Error('live analysis failed'),
						kind: 'unknown',
					});
				}
			}
			return Promise.resolve();
		});

		const report = await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
		});

		expect(report).toMatchObject({
			pagesExtracted: 2,
			pagesBlockConverted: 0,
			pagesBlockPartial: 1,
			pagesBlockConversionFailed: 1,
		});
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
			contentClass: CONTENT_CLASS,
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

		await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
		});

		expect(callOrder).toEqual(['fetch', 'getPageHtml']);
		const written = await readFile(path.join(outputDir, 'p1.html'), 'utf8');
		expect(written.startsWith(`---\nid: 5\n---\n<main class="${CONTENT_CLASS}">`)).toBe(
			true,
		);
		expect(written.endsWith('</main>')).toBe(true);
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

		await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
		});

		const written = await readFile(path.join(outputDir, 'p1.html'), 'utf8');
		expect(
			written.startsWith(
				`---\nid: 5\ntitle: "P1"\nog:\n  title: "OG P1"\n---\n<main class="${CONTENT_CLASS}">`,
			),
		).toBe(true);
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
		const indexInnerHtml =
			'<a href="/about/">about</a>' +
			'<img src="../img/logo.png">' +
			'<a href="https://other.example/x">ext</a>';
		getPageHtmlMock.mockResolvedValueOnce(
			`<!doctype html><html><head></head><body><main>${indexInnerHtml}</main></body></html>`,
		);
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main>body</main></body></html>',
		);
		// Route the same markup through the mocked block so the merged body
		// (what rewritePageRefs actually runs against) contains it.
		mockConvertedLayout({ 'https://example.com/index.html': indexInnerHtml });

		await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
		});

		const written = await readFile(path.join(outputDir, 'index.html'), 'utf8');
		expect(written).toContain('{{10000}}');
		expect(written).toContain('<img src="/img/logo.png">');
		expect(written).toContain('https://other.example/x');
		expect(written).not.toContain('href="/about/"');
	});

	test('counts pages whose rewritePageRefs rejection was surfaced as rewriteError under pagesRewriteFailed', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(iter([{ url: 'https://example.com/p1' }]));
		vi.stubGlobal('fetch', vi.fn());
		getPageHtmlMock.mockResolvedValueOnce(
			'<!doctype html><html><head></head><body><main>x</main></body></html>',
		);
		rewritePageRefsMock.mockRejectedValueOnce(new Error('rewrite boom'));

		const report = await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
		});

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

		const report = await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
		});

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
			migrate({
				archivePath: '/tmp/fake.nitpicker',
				outputDir,
				contentClass: CONTENT_CLASS,
			}),
		).rejects.toThrow('listing crashed');
		expect(closeMock).toHaveBeenCalledTimes(1);
	});

	test('include filters pages while resources are still downloaded in full', async () => {
		listInternalResourcesMock.mockReturnValue(
			iter([
				{ url: 'https://example.com/a.css', contentType: 'text/css' },
				{ url: 'https://example.com/b.css', contentType: 'text/css' },
			]),
		);
		listInternalPagesMock.mockReturnValue(
			iter([
				{ url: 'https://example.com/index.html' },
				{ url: 'https://example.com/about/' },
				{ url: 'https://example.com/about/team.html' },
			]),
		);
		const fetchMock = vi.fn(() =>
			Promise.resolve(new Response(new Uint8Array([1]), { status: 200 })),
		);
		vi.stubGlobal('fetch', fetchMock);
		getPageHtmlMock.mockImplementation(() =>
			Promise.resolve(
				'<!doctype html><html><head></head><body><main><p>x</p></main></body></html>',
			),
		);

		const report = await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
			include: ['/about/'],
		});

		expect(report).toMatchObject({ totalPages: 2, pagesExtracted: 2 });
		// Resources are never filtered by `include` — both are still downloaded.
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(getPageHtmlMock).toHaveBeenCalledTimes(2);
		await expect(readFile(path.join(outputDir, 'index.html'))).rejects.toThrow();
	});

	test('include keeps ids identical to a full run and rewrites links to excluded pages to {{<id>}}', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(
			iter([
				{ url: 'https://example.com/index.html' },
				{ url: 'https://example.com/about/' },
			]),
		);
		vi.stubGlobal('fetch', vi.fn());
		const indexInnerHtml = '<a href="/about/">about</a>';
		getPageHtmlMock.mockResolvedValueOnce(
			`<!doctype html><html><head></head><body><main>${indexInnerHtml}</main></body></html>`,
		);
		mockConvertedLayout({ 'https://example.com/index.html': indexInnerHtml });

		await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
			include: ['/index.html'],
		});

		const written = await readFile(path.join(outputDir, 'index.html'), 'utf8');
		// `/about/` was excluded by `include`, yet its id (subdir section 1 → 10000)
		// is identical to an unfiltered run because the id population stays the
		// full archive page list.
		expect(written.startsWith(`---\nid: 5\n---\n<main class="${CONTENT_CLASS}">`)).toBe(
			true,
		);
		expect(written).toContain('{{10000}}');
		await expect(readFile(path.join(outputDir, 'about', 'index.html'))).rejects.toThrow();
	});

	test('include with no matching pages rejects before any download or write', async () => {
		listInternalResourcesMock.mockReturnValue(
			iter([{ url: 'https://example.com/a.css', contentType: 'text/css' }]),
		);
		listInternalPagesMock.mockReturnValue(
			iter([{ url: 'https://example.com/index.html' }]),
		);
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(
			migrate({
				archivePath: '/tmp/fake.nitpicker',
				outputDir,
				contentClass: CONTENT_CLASS,
				include: ['/nope/'],
			}),
		).rejects.toThrow(IncludeNoMatchError);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(getPageHtmlMock).not.toHaveBeenCalled();
		expect(closeMock).toHaveBeenCalledTimes(1);
	});

	test('include with an invalid value rejects before any download or write', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(
			iter([{ url: 'https://example.com/index.html' }]),
		);
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(
			migrate({
				archivePath: '/tmp/fake.nitpicker',
				outputDir,
				contentClass: CONTENT_CLASS,
				include: ['news/'],
			}),
		).rejects.toThrow(InvalidIncludeValueError);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(getPageHtmlMock).not.toHaveBeenCalled();
	});

	test('an empty include array behaves as no filter', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(
			iter([
				{ url: 'https://example.com/index.html' },
				{ url: 'https://example.com/about/' },
			]),
		);
		vi.stubGlobal('fetch', vi.fn());
		getPageHtmlMock.mockImplementation(() =>
			Promise.resolve(
				'<!doctype html><html><head></head><body><main><p>x</p></main></body></html>',
			),
		);

		const report = await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
			include: [],
		});

		expect(report).toMatchObject({ totalPages: 2, pagesExtracted: 2 });
	});

	test('onInclude fires once with selected/total when include is given, and not at all otherwise', async () => {
		listInternalResourcesMock.mockReturnValue(iter([]));
		listInternalPagesMock.mockReturnValue(
			iter([
				{ url: 'https://example.com/index.html' },
				{ url: 'https://example.com/about/' },
				{ url: 'https://example.com/about/team.html' },
			]),
		);
		vi.stubGlobal('fetch', vi.fn());
		getPageHtmlMock.mockImplementation(() =>
			Promise.resolve(
				'<!doctype html><html><head></head><body><main><p>x</p></main></body></html>',
			),
		);

		const events: unknown[] = [];
		await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
			include: ['/about/'],
			onInclude: (event) => events.push(event),
		});
		expect(events).toStrictEqual([{ selected: 2, total: 3 }]);

		events.length = 0;
		await migrate({
			archivePath: '/tmp/fake.nitpicker',
			outputDir,
			contentClass: CONTENT_CLASS,
			onInclude: (event) => events.push(event),
		});
		expect(events).toStrictEqual([]);
	});
});
