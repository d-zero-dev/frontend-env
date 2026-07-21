import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { downloadResources, type DownloadResult } from './download-resources.js';

describe('downloadResources', () => {
	let outputDir = '';

	beforeEach(async () => {
		outputDir = await mkdtemp(path.join(tmpdir(), 'site-migrator-test-'));
	});

	afterEach(async () => {
		await rm(outputDir, { recursive: true, force: true });
		vi.unstubAllGlobals();
	});

	test('downloads each URL and writes bodies under outputDir mirroring the pathname', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn((input: string) => {
				const body = input.endsWith('/a.png')
					? new Uint8Array([0xff, 1, 2])
					: new Uint8Array([3, 4]);
				return Promise.resolve(new Response(body, { status: 200 }));
			}),
		);

		const results: DownloadResult[] = [];
		await downloadResources({
			items: [
				{ url: 'https://example.com/img/a.png', contentType: 'image/png' },
				{ url: 'https://example.com/main.css', contentType: 'text/css' },
			],
			outputDir,
			limit: 2,
			onResult: (event) => results.push(event),
		});

		expect(new Set(results.map((event) => event.outcome))).toEqual(new Set(['saved']));
		const png = await readFile(path.join(outputDir, 'img', 'a.png'));
		const css = await readFile(path.join(outputDir, 'main.css'));
		expect([...png]).toEqual([0xff, 1, 2]);
		expect([...css]).toEqual([3, 4]);
	});

	test('reports each non-2xx response as a failed result without writing to disk', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() =>
				Promise.resolve(
					new Response('not found', { status: 404, statusText: 'Not Found' }),
				),
			),
		);

		const results: DownloadResult[] = [];
		await downloadResources({
			items: [{ url: 'https://example.com/missing.css', contentType: 'text/css' }],
			outputDir,
			limit: 1,
			onResult: (event) => results.push(event),
		});

		expect(results).toHaveLength(1);
		expect(results[0]?.outcome).toBe('failed');
		await expect(readFile(path.join(outputDir, 'missing.css'))).rejects.toThrow();
	});

	test('returns immediately when items is empty', async () => {
		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
		await downloadResources({ items: [], outputDir });
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
