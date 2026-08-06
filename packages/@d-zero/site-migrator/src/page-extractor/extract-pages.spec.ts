import type { ArchiveSession } from '../types.js';
import type { LayoutBlock } from '@d-zero/anatomist/types';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { extractPages, type ExtractPageResult } from './extract-pages.js';

type RewritePageRefsModule = typeof import('./rewrite-page-refs.js');
type RenderBlocksModule = typeof import('./render-blocks.js');

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
vi.mock('./resolve-page-layout.js', () => ({
	resolvePageLayouts: vi.fn(),
}));
vi.mock('./render-blocks.js', async (importOriginal) => {
	const actual = await importOriginal<RenderBlocksModule>();
	return {
		...actual,
		renderBlocks: vi.fn(actual.renderBlocks),
	};
});

const { getPageHtml } = await import('../archive/get-page-html.js');
const { getFrontmatter } = await import('../archive/get-frontmatter.js');
const { rewritePageRefs } = await import('./rewrite-page-refs.js');
const { resolvePageLayouts } = await import('./resolve-page-layout.js');
const { renderBlocks } = await import('./render-blocks.js');
const getPageHtmlMock = vi.mocked(getPageHtml);
const getFrontmatterMock = vi.mocked(getFrontmatter);
const rewritePageRefsMock = vi.mocked(rewritePageRefs);
const resolvePageLayoutsMock = vi.mocked(resolvePageLayouts);
const renderBlocksMock = vi.mocked(renderBlocks);

const FAKE_SESSION = {
	archiveId: 'test',
	accessor: {} as ArchiveSession['accessor'],
	close: async () => {
		/* noop */
	},
} satisfies ArchiveSession;

const CONTENT_CLASS = 'js-bge-content';

const docWith = (body: string) =>
	`<!doctype html><html><head><title>t</title></head><body>${body}</body></html>`;

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
 * 変換に成功する」決定的な結果を返すよう設定する。`mainSelector: 'main'`で、テストフィクスチャの
 * `<main>...</main>`（`extractMainContent`がタグでマッチする唯一の要素）と一致させる。
 * @param childInnerHTML 生成される単一wysiwygブロックの`innerHTML`（既定は空）。
 */
function mockConvertedLayout(childInnerHTML = ''): void {
	resolvePageLayoutsMock.mockImplementation((options) => {
		for (const item of options.items) {
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
							children: [sampleLeafBlock({ innerHTML: childInnerHTML })],
						},
					},
				],
			});
		}
		return Promise.resolve();
	});
}

/**
 * `resolvePageLayouts`が全URLについて致命的に失敗した（`missing`）ことにするモック。
 * ページ単位の致命的フォールバック（`blockConversion: 'fallback'`）を発火させるために使う。
 * @param message
 */
function mockMissingLayout(message = 'live analysis failed'): void {
	resolvePageLayoutsMock.mockImplementation((options) => {
		for (const item of options.items) {
			options.onResult?.({
				url: item.url,
				outcome: 'missing',
				error: new Error(message),
				kind: 'unknown',
			});
		}
		return Promise.resolve();
	});
}

describe('extractPages', () => {
	let outputDir = '';

	beforeEach(async () => {
		outputDir = await mkdtemp(path.join(tmpdir(), 'site-migrator-pages-'));
		getPageHtmlMock.mockReset();
		getFrontmatterMock.mockReset();
		resolvePageLayoutsMock.mockReset();
		// Default: no DB row → only the id is emitted in frontmatter.
		getFrontmatterMock.mockResolvedValue(null);
		// Default: delegate to the real rewriter/renderer so other tests
		// exercise the real implementation. Override per-test to force a
		// failure.
		const realRewrite = await vi.importActual<RewritePageRefsModule>(
			'./rewrite-page-refs.js',
		);
		rewritePageRefsMock.mockImplementation(realRewrite.rewritePageRefs);
		const realRender = await vi.importActual<RenderBlocksModule>('./render-blocks.js');
		renderBlocksMock.mockImplementation(realRender.renderBlocks);
		// Default: layout resolution + block conversion succeeds for every
		// matched page, producing one empty wysiwyg block. Most tests here are
		// about extraction / frontmatter / rewrite behaviour, not about block
		// conversion itself (that's covered by the dedicated tests below).
		mockConvertedLayout();
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
			contentClass: CONTENT_CLASS,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results).toMatchObject([
			{
				url: 'https://example.com/about/',
				outcome: 'extracted',
				outputPath: path.join(outputDir, 'about', 'index.html'),
				matchedBy: 'tag:main',
				blockConversion: 'converted',
			},
		]);
		const written = await readFile(path.join(outputDir, 'about', 'index.html'), 'utf8');
		// `/about/` is the only page in its subdirectory section → id 10000.
		// The original `<p>hello</p>` is replaced by the rendered block group;
		// exact BurgerEditor markup is `render-blocks.spec.ts`'s concern, so we
		// only assert the frontmatter, the main-element merge, and that a
		// block was actually rendered into it.
		expect(
			written.startsWith(`---\nid: 10000\n---\n<main class="${CONTENT_CLASS}">`),
		).toBe(true);
		expect(written.endsWith('</main>')).toBe(true);
		expect(written).toContain('data-bge-name="migrated"');
		expect(written).not.toContain('<p>hello</p>');
	});

	test('writes the original document when no rung matches (outcome=fallback)', async () => {
		const original = docWith('<div class="x"></div><div class="y"></div>');
		getPageHtmlMock.mockResolvedValueOnce(original);

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/x' }],
			outputDir,
			contentClass: CONTENT_CLASS,
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
		// No main was found, so block conversion is never attempted.
		expect(resolvePageLayoutsMock).not.toHaveBeenCalled();
	});

	test('emits outcome=missing without writing to disk when archive returns null', async () => {
		getPageHtmlMock.mockResolvedValueOnce(null);

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/nope' }],
			outputDir,
			contentClass: CONTENT_CLASS,
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
			contentClass: CONTENT_CLASS,
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
			contentClass: CONTENT_CLASS,
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
			contentClass: CONTENT_CLASS,
			limit: 2,
			onResult: (event) => results.push(event),
		});

		expect(results).toHaveLength(2);
		const extracted = results.find((event) => event.url === 'https://example.com/about/');
		const failed = results.find(
			(event) => event.url === 'https://example.com/about/index.html',
		);
		expect(extracted).toMatchObject({
			outcome: 'extracted',
			blockConversion: 'converted',
		});
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
			contentClass: CONTENT_CLASS,
			limit: 1,
		});

		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		expect(
			written.startsWith(
				`---\nid: 5\ntitle: "Page"\nog:\n  title: "OG Page"\n---\n<main class="${CONTENT_CLASS}">`,
			),
		).toBe(true);
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
			contentClass: CONTENT_CLASS,
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
			contentClass: CONTENT_CLASS,
			limit: 1,
		});

		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		expect(written.startsWith(`---\nid: 5\n---\n<main class="${CONTENT_CLASS}">`)).toBe(
			true,
		);
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
			contentClass: CONTENT_CLASS,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			url: 'https://example.com/p',
			outcome: 'extracted',
			metaError: { message: 'db boom' },
		});
		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		expect(written.startsWith(`---\nid: 5\n---\n<main class="${CONTENT_CLASS}">`)).toBe(
			true,
		);
	});

	test('rewrites same-origin <a href> to the id template using the items-derived id map', async () => {
		getPageHtmlMock.mockResolvedValueOnce(
			docWith('<main><a href="/about/">about</a></main>'),
		);
		// Route the same href through the mocked block so the merged body (what
		// rewritePageRefs actually runs against) contains it.
		mockConvertedLayout('<a href="/about/">about</a>');

		await extractPages({
			session: FAKE_SESSION,
			items: [
				{ url: 'https://example.com/index.html' },
				{ url: 'https://example.com/about/' },
			],
			outputDir,
			contentClass: CONTENT_CLASS,
			limit: 2,
		});

		const written = await readFile(path.join(outputDir, 'index.html'), 'utf8');
		// `/index.html` is root section → id 5, `/about/` is subdir section 1 → id 10000.
		expect(written).toContain('{{10000}}');
		expect(written).not.toContain('href="/about/"');
	});

	test('fail-soft on rewriteBlockRefs (wysiwyg→rewritePageRefs) throw: writes pre-rewrite HTML and surfaces an aggregate rewriteError on the outcome', async () => {
		getPageHtmlMock.mockResolvedValueOnce(
			docWith('<main><a href="/about/">about</a></main>'),
		);
		mockConvertedLayout('<a href="/about/">about</a>');
		// Converted pages no longer run the whole-body rewritePageRefs pass (it would
		// double-process the already-rewritten block markup) — the single wysiwyg item
		// produced from this layout is what invokes rewritePageRefs now, via
		// rewriteBlockRefs.
		rewritePageRefsMock.mockRejectedValueOnce(new Error('parse5 boom'));

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/p' }],
			outputDir,
			contentClass: CONTENT_CLASS,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			url: 'https://example.com/p',
			outcome: 'extracted',
			rewriteError: {
				message:
					'rewriteBlockRefs failed for 1 item(s): block 0/row 0/item 0: parse5 boom',
			},
		});
		const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
		// Body is the un-rewritten merged fragment (no {{id}} substitution).
		expect(written).toContain('href="/about/"');
		expect(written).not.toContain('{{');
	});

	test('surfaces getFrontmatter rejection as metaError on the outcome (id-only frontmatter still written)', async () => {
		getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>x</p></main>'));
		getFrontmatterMock.mockRejectedValueOnce(new Error('sqlite contention'));

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/p' }],
			outputDir,
			contentClass: CONTENT_CLASS,
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
		mockConvertedLayout('<img src="../img/a.png">');

		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/sub/page.html' }],
			outputDir,
			contentClass: CONTENT_CLASS,
			limit: 1,
		});

		const written = await readFile(path.join(outputDir, 'sub', 'page.html'), 'utf8');
		expect(written).toContain('src="/img/a.png"');
	});

	test('returns immediately and writes nothing when signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();

		const results: ExtractPageResult[] = [];
		await extractPages({
			session: FAKE_SESSION,
			items: [{ url: 'https://example.com/x' }],
			outputDir,
			contentClass: CONTENT_CLASS,
			limit: 1,
			signal: controller.signal,
			onResult: (event) => results.push(event),
		});

		expect(results).toEqual([]);
		expect(getPageHtmlMock).not.toHaveBeenCalled();
		await expect(readFile(path.join(outputDir, 'x.html'))).rejects.toThrow();
	});

	describe('BurgerEditorブロック変換パイプライン', () => {
		test('button: known-page link becomes {{id}} without double-rewrite corruption', async () => {
			getPageHtmlMock.mockResolvedValueOnce(
				docWith('<main><a class="btn" href="/about/">about</a></main>'),
			);
			mockConvertedLayout('<a class="btn" href="/about/">about</a>');

			await extractPages({
				session: FAKE_SESSION,
				items: [
					{ url: 'https://example.com/index.html' },
					{ url: 'https://example.com/about/' },
				],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 2,
			});

			const written = await readFile(path.join(outputDir, 'index.html'), 'utf8');
			// `/index.html` is root section -> id 5, `/about/` is subdir section 1 -> id
			// 10000 (see the wysiwyg-equivalent id-template test above).
			expect(written).toContain('{{10000}}');
			expect(written).not.toContain('href="/about/"');
			// If rewriteBlockRefs' {{10000}} token got double-processed by the outer
			// rewritePageRefs pass, it would corrupt into `%7B%7B10000%7D%7D`.
			expect(written).not.toContain('%7B');
		});

		test('download-file: href pathname matching a known page id still stays root-relative (asset rule)', async () => {
			getPageHtmlMock.mockResolvedValueOnce(
				docWith('<main><a href="/files/report.pdf">Report</a></main>'),
			);
			mockConvertedLayout('<a href="/files/report.pdf">Report</a>');

			await extractPages({
				session: FAKE_SESSION,
				items: [
					{ url: 'https://example.com/index.html' },
					// This URL's pathname exactly matches the download-file href above, to
					// confirm the button/download-file distinction does not depend on
					// pathname collisions with known pages.
					{ url: 'https://example.com/files/report.pdf' },
				],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 2,
			});

			const written = await readFile(path.join(outputDir, 'index.html'), 'utf8');
			expect(written).toContain('href="/files/report.pdf"');
			expect(written).not.toContain('{{');
		});

		test('resolvePageLayoutsを一括で1回だけ呼び、複数の一致ページをまとめて処理する', async () => {
			getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>a</p></main>'));
			getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>b</p></main>'));

			await extractPages({
				session: FAKE_SESSION,
				items: [{ url: 'https://example.com/a' }, { url: 'https://example.com/b' }],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 2,
			});

			expect(resolvePageLayoutsMock).toHaveBeenCalledTimes(1);
			const call = resolvePageLayoutsMock.mock.calls[0]![0];
			expect(call.items.map((item) => item.url).toSorted()).toEqual([
				'https://example.com/a',
				'https://example.com/b',
			]);
		});

		test('layoutJsonPathをresolvePageLayoutsへそのまま転送する', async () => {
			getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>a</p></main>'));

			await extractPages({
				session: FAKE_SESSION,
				items: [{ url: 'https://example.com/a' }],
				outputDir,
				contentClass: CONTENT_CLASS,
				layoutJsonPath: '/tmp/layout.jsonl',
				limit: 1,
			});

			expect(resolvePageLayoutsMock).toHaveBeenCalledWith(
				expect.objectContaining({ layoutJsonPath: '/tmp/layout.jsonl' }),
			);
		});

		test('一部ブロックが低信頼度でwysiwygフォールバックされた場合はblockConversion=partialになる', async () => {
			getPageHtmlMock.mockResolvedValueOnce(docWith('<main><p>x</p></main>'));
			resolvePageLayoutsMock.mockImplementation((options) => {
				for (const item of options.items) {
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
											// rowSizes合計(3) !== children.length(1) → malformed-row-sizes
											signals: { rowSizes: [3] },
											children: [sampleLeafBlock()],
										},
									],
								},
							},
						],
					});
				}
				return Promise.resolve();
			});

			const results: ExtractPageResult[] = [];
			await extractPages({
				session: FAKE_SESSION,
				items: [{ url: 'https://example.com/p' }],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 1,
				onResult: (event) => results.push(event),
			});

			expect(results[0]).toMatchObject({
				outcome: 'extracted',
				blockConversion: 'partial',
			});
		});

		test('resolvePageLayoutsが致命的に失敗した場合はページ全体をプレーンHTMLでフォールバックする', async () => {
			const original = docWith('<main><p>hello</p></main>');
			getPageHtmlMock.mockResolvedValueOnce(original);
			mockMissingLayout('getaddrinfo ENOTFOUND');

			const results: ExtractPageResult[] = [];
			await extractPages({
				session: FAKE_SESSION,
				items: [{ url: 'https://example.com/p' }],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 1,
				onResult: (event) => results.push(event),
			});

			expect(results[0]).toMatchObject({
				outcome: 'extracted',
				blockConversion: 'fallback',
				blockConversionError: { message: 'getaddrinfo ENOTFOUND' },
			});
			const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
			expect(written).toBe(`---\nid: 5\n---\n${original}`);
		});

		test('anatomistのmainSelectorとextractMainContentのマッチが不整合な場合はページ全体をフォールバックする', async () => {
			const original = docWith('<main><p>hello</p></main><section></section>');
			getPageHtmlMock.mockResolvedValueOnce(original);
			resolvePageLayoutsMock.mockImplementation((options) => {
				for (const item of options.items) {
					options.onResult?.({
						url: item.url,
						outcome: 'resolved-live',
						results: [
							{
								url: item.url,
								viewport: { name: 'pc', width: 1280 },
								// extractMainContentは<main>を選ぶが、anatomistは<section>を指している。
								mainSelector: 'section',
								root: {
									...sampleLeafBlock(),
									layoutType: 'vertical-stack',
									confidence: 1,
									children: [sampleLeafBlock()],
								},
							},
						],
					});
				}
				return Promise.resolve();
			});

			const results: ExtractPageResult[] = [];
			await extractPages({
				session: FAKE_SESSION,
				items: [{ url: 'https://example.com/p' }],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 1,
				onResult: (event) => results.push(event),
			});

			expect(results[0]).toMatchObject({
				outcome: 'extracted',
				blockConversion: 'fallback',
			});
			const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
			expect(written).toBe(`---\nid: 5\n---\n${original}`);
		});

		test('anatomist側でmainのrootが見つからない(root:null)場合はページ全体をフォールバックする', async () => {
			const original = docWith('<main><p>hello</p></main>');
			getPageHtmlMock.mockResolvedValueOnce(original);
			resolvePageLayoutsMock.mockImplementation((options) => {
				for (const item of options.items) {
					options.onResult?.({
						url: item.url,
						outcome: 'resolved-live',
						results: [
							{
								url: item.url,
								viewport: { name: 'pc', width: 1280 },
								mainSelector: null,
								root: null,
							},
						],
					});
				}
				return Promise.resolve();
			});

			const results: ExtractPageResult[] = [];
			await extractPages({
				session: FAKE_SESSION,
				items: [{ url: 'https://example.com/p' }],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 1,
				onResult: (event) => results.push(event),
			});

			expect(results[0]).toMatchObject({
				outcome: 'extracted',
				blockConversion: 'fallback',
			});
		});

		test('renderBlocksが例外を投げた場合はページ全体をフォールバックする', async () => {
			const original = docWith('<main><p>hello</p></main>');
			getPageHtmlMock.mockResolvedValueOnce(original);
			renderBlocksMock.mockRejectedValueOnce(new Error('render boom'));

			const results: ExtractPageResult[] = [];
			await extractPages({
				session: FAKE_SESSION,
				items: [{ url: 'https://example.com/p' }],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 1,
				onResult: (event) => results.push(event),
			});

			expect(results[0]).toMatchObject({
				outcome: 'extracted',
				blockConversion: 'fallback',
				blockConversionError: { message: 'render boom' },
			});
			const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
			expect(written).toBe(`---\nid: 5\n---\n${original}`);
		});

		test('resolvePageLayoutsが一致したURLについて結果を1件も返さない場合もページ全体をフォールバックする', async () => {
			const original = docWith('<main><p>hello</p></main>');
			getPageHtmlMock.mockResolvedValueOnce(original);
			// Misbehaving mock: never calls onResult for the URL it was given.
			resolvePageLayoutsMock.mockImplementation(() => Promise.resolve());

			const results: ExtractPageResult[] = [];
			await extractPages({
				session: FAKE_SESSION,
				items: [{ url: 'https://example.com/p' }],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 1,
				onResult: (event) => results.push(event),
			});

			expect(results[0]).toMatchObject({
				outcome: 'extracted',
				blockConversion: 'fallback',
			});
			const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
			expect(written).toBe(`---\nid: 5\n---\n${original}`);
		});

		test('resolvePageLayoutsが空のresults配列を返した場合もページ全体をフォールバックする', async () => {
			const original = docWith('<main><p>hello</p></main>');
			getPageHtmlMock.mockResolvedValueOnce(original);
			resolvePageLayoutsMock.mockImplementation((options) => {
				for (const item of options.items) {
					options.onResult?.({ url: item.url, outcome: 'resolved-live', results: [] });
				}
				return Promise.resolve();
			});

			const results: ExtractPageResult[] = [];
			await extractPages({
				session: FAKE_SESSION,
				items: [{ url: 'https://example.com/p' }],
				outputDir,
				contentClass: CONTENT_CLASS,
				limit: 1,
				onResult: (event) => results.push(event),
			});

			expect(results[0]).toMatchObject({
				outcome: 'extracted',
				blockConversion: 'fallback',
			});
			const written = await readFile(path.join(outputDir, 'p.html'), 'utf8');
			expect(written).toBe(`---\nid: 5\n---\n${original}`);
		});
	});
});
