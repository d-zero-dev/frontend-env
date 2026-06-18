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

const { openArchive } = await import('./archive/open-archive.js');
const { listInternalResources } = await import('./archive/list-internal-resources.js');
const { listInternalPages } = await import('./archive/list-internal-pages.js');
const { getPageHtml } = await import('./archive/get-page-html.js');
const { migrate } = await import('./migrate.js');

const openArchiveMock = vi.mocked(openArchive);
const listInternalResourcesMock = vi.mocked(listInternalResources);
const listInternalPagesMock = vi.mocked(listInternalPages);
const getPageHtmlMock = vi.mocked(getPageHtml);

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
		expect(written).toBe('<main>PAGE</main>');
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
