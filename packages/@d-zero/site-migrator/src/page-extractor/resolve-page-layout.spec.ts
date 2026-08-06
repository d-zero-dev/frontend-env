import type { ResolvePageLayoutResult } from './resolve-page-layout.js';
import type { LayoutAnalysisResult } from '@d-zero/anatomist/types';
import type { Browser } from 'puppeteer';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('puppeteer', () => ({
	launch: vi.fn(),
}));
vi.mock('@d-zero/anatomist', () => ({
	analyzePageLayout: vi.fn(),
}));

const { launch } = await import('puppeteer');
const { analyzePageLayout } = await import('@d-zero/anatomist');
const { parseLayoutJsonl, resolvePageLayouts } = await import('./resolve-page-layout.js');

const launchMock = vi.mocked(launch);
const analyzePageLayoutMock = vi.mocked(analyzePageLayout);

const sampleResult = (
	url: string,
	overrides: Partial<LayoutAnalysisResult> = {},
): LayoutAnalysisResult => ({
	url,
	viewport: { name: 'pc', width: 1280 },
	mainSelector: 'main',
	root: null,
	...overrides,
});

/**
 * Minimal `Browser` double: only `newPage`/`close` are exercised by
 * `resolvePageLayouts`. Both resolve to match the real Puppeteer API's
 * `Promise`-returning contract.
 */
function fakeBrowser() {
	return {
		newPage: vi.fn(() => ({ close: vi.fn(() => Promise.resolve()) })),
		close: vi.fn(() => Promise.resolve()),
	};
}

describe('resolvePageLayouts', () => {
	let tmpDir = '';

	beforeEach(async () => {
		tmpDir = await mkdtemp(path.join(tmpdir(), 'site-migrator-layout-'));
		launchMock.mockReset();
		analyzePageLayoutMock.mockReset();
	});

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});

	test('resolves all URLs live when layoutJsonPath is omitted', async () => {
		const browser = fakeBrowser();
		launchMock.mockResolvedValueOnce(browser as unknown as Browser);
		const liveResult = sampleResult('https://example.com/a');
		analyzePageLayoutMock.mockResolvedValueOnce([liveResult]);

		const results: ResolvePageLayoutResult[] = [];
		await resolvePageLayouts({
			items: [{ url: 'https://example.com/a' }],
			onResult: (event) => results.push(event),
		});

		expect(results).toEqual([
			{ url: 'https://example.com/a', outcome: 'resolved-live', results: [liveResult] },
		]);
		expect(browser.newPage).toHaveBeenCalledTimes(1);
		expect(browser.close).toHaveBeenCalledTimes(1);
	});

	test('uses a JSON hit as-is (including root:null) and live-analyzes only the rest', async () => {
		const hitResult = sampleResult('https://example.com/hit');
		const jsonlPath = path.join(tmpDir, 'layout.jsonl');
		await writeFile(jsonlPath, `${JSON.stringify(hitResult)}\n`, 'utf8');

		const browser = fakeBrowser();
		launchMock.mockResolvedValueOnce(browser as unknown as Browser);
		const liveResult = sampleResult('https://example.com/miss');
		analyzePageLayoutMock.mockResolvedValueOnce([liveResult]);

		const results: ResolvePageLayoutResult[] = [];
		await resolvePageLayouts({
			items: [{ url: 'https://example.com/hit' }, { url: 'https://example.com/miss' }],
			layoutJsonPath: jsonlPath,
			onResult: (event) => results.push(event),
		});

		expect(results).toContainEqual({
			url: 'https://example.com/hit',
			outcome: 'resolved-from-json',
			results: [hitResult],
		});
		expect(results).toContainEqual({
			url: 'https://example.com/miss',
			outcome: 'resolved-live',
			results: [liveResult],
		});
		// Only the JSON-miss URL should have opened a page.
		expect(browser.newPage).toHaveBeenCalledTimes(1);
	});

	test('launches the browser only once when multiple URLs need live analysis', async () => {
		const browser = fakeBrowser();
		launchMock.mockResolvedValueOnce(browser as unknown as Browser);
		analyzePageLayoutMock.mockResolvedValue([sampleResult('https://example.com/a')]);

		await resolvePageLayouts({
			items: [{ url: 'https://example.com/a' }, { url: 'https://example.com/b' }],
		});

		expect(launchMock).toHaveBeenCalledTimes(1);
		expect(browser.newPage).toHaveBeenCalledTimes(2);
	});

	test('does not launch a browser when every URL is covered by layoutJsonPath', async () => {
		const hitResult = sampleResult('https://example.com/hit');
		const jsonlPath = path.join(tmpDir, 'layout.jsonl');
		await writeFile(jsonlPath, `${JSON.stringify(hitResult)}\n`, 'utf8');

		const results: ResolvePageLayoutResult[] = [];
		await resolvePageLayouts({
			items: [{ url: 'https://example.com/hit' }],
			layoutJsonPath: jsonlPath,
			onResult: (event) => results.push(event),
		});

		expect(results).toEqual([
			{
				url: 'https://example.com/hit',
				outcome: 'resolved-from-json',
				results: [hitResult],
			},
		]);
		expect(launchMock).not.toHaveBeenCalled();
	});

	test('reports outcome=missing with a classified kind when live analysis throws', async () => {
		const browser = fakeBrowser();
		launchMock.mockResolvedValueOnce(browser as unknown as Browser);
		analyzePageLayoutMock.mockRejectedValueOnce(
			new Error('getaddrinfo ENOTFOUND example.invalid'),
		);

		const results: ResolvePageLayoutResult[] = [];
		await resolvePageLayouts({
			items: [{ url: 'https://example.invalid/' }],
			onResult: (event) => results.push(event),
		});

		expect(results).toHaveLength(1);
		const [result] = results;
		expect(result.outcome).toBe('missing');
		if (result.outcome === 'missing') {
			expect(result.kind).toBe('dns');
			expect(result.error.message).toContain('ENOTFOUND');
		}
	});

	test('reports outcome=missing (without hanging) when browser.newPage() itself throws', async () => {
		const browser = fakeBrowser();
		browser.newPage.mockImplementationOnce(() => {
			throw new Error('Target.createTarget failed');
		});
		launchMock.mockResolvedValueOnce(browser as unknown as Browser);

		const results: ResolvePageLayoutResult[] = [];
		await resolvePageLayouts({
			items: [{ url: 'https://example.com/a' }],
			onResult: (event) => results.push(event),
		});

		expect(results).toHaveLength(1);
		expect(results[0]?.outcome).toBe('missing');
	});

	test('resolves (does not reject) when launch() itself fails — no Chrome binary / sandbox restrictions', async () => {
		launchMock.mockRejectedValueOnce(new Error('spawn ENOENT'));

		const results: ResolvePageLayoutResult[] = [];
		await expect(
			resolvePageLayouts({
				items: [{ url: 'https://example.com/a' }, { url: 'https://example.com/b' }],
				onResult: (event) => results.push(event),
			}),
		).resolves.toBeUndefined();

		expect(results).toHaveLength(2);
		for (const result of results) {
			expect(result.outcome).toBe('missing');
		}
	});

	test('does not hang and still reports the result when page.close() rejects during cleanup', async () => {
		const page = {
			close: vi.fn().mockRejectedValueOnce(new Error('Protocol error: Target closed')),
		};
		const browser = {
			newPage: vi.fn(() => page),
			close: vi.fn(),
		};
		launchMock.mockResolvedValueOnce(browser as unknown as Browser);
		const liveResult = sampleResult('https://example.com/a');
		analyzePageLayoutMock.mockResolvedValueOnce([liveResult]);

		const results: ResolvePageLayoutResult[] = [];
		await resolvePageLayouts({
			items: [{ url: 'https://example.com/a' }],
			onResult: (event) => results.push(event),
		});

		expect(results).toEqual([
			{ url: 'https://example.com/a', outcome: 'resolved-live', results: [liveResult] },
		]);
	});

	test('rejects without launching a browser when layoutJsonPath contains an invalid line', async () => {
		const jsonlPath = path.join(tmpDir, 'bad.jsonl');
		await writeFile(jsonlPath, 'not json\n', 'utf8');

		await expect(
			resolvePageLayouts({
				items: [{ url: 'https://example.com/a' }],
				layoutJsonPath: jsonlPath,
			}),
		).rejects.toThrow(/1行目/);
		expect(launchMock).not.toHaveBeenCalled();
	});

	test('returns immediately without launching a browser when items is empty', async () => {
		await resolvePageLayouts({ items: [] });
		expect(launchMock).not.toHaveBeenCalled();
	});

	test('returns immediately without launching a browser when the signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();

		await resolvePageLayouts({
			items: [{ url: 'https://example.com/a' }],
			signal: controller.signal,
		});

		expect(launchMock).not.toHaveBeenCalled();
	});
});

describe('parseLayoutJsonl', () => {
	test('throws with a 1-based line number on invalid JSON', () => {
		expect(() => parseLayoutJsonl('not json')).toThrow(/1行目/);
	});

	test.each([
		['not an object', '"just a string"'],
		['missing url', JSON.stringify({ url: 'https://example.com/' })],
		[
			'viewport.name not a string',
			JSON.stringify({
				...sampleResult('https://example.com/a'),
				viewport: { name: 1, width: 1280 },
			}),
		],
		[
			'viewport.width not a number',
			JSON.stringify({
				...sampleResult('https://example.com/a'),
				viewport: { name: 'pc', width: '1280' },
			}),
		],
		[
			'mainSelector neither a string nor null',
			JSON.stringify({ ...sampleResult('https://example.com/a'), mainSelector: 123 }),
		],
		[
			'root field missing entirely',
			JSON.stringify({
				url: 'https://example.com/a',
				viewport: { name: 'pc', width: 1280 },
				mainSelector: 'main',
			}),
		],
	])('throws when the shape does not match LayoutAnalysisResult (%s)', (_label, line) => {
		expect(() => parseLayoutJsonl(line)).toThrow(/1行目/);
	});

	test('skips blank lines', () => {
		const result = sampleResult('https://example.com/a');
		const map = parseLayoutJsonl(`\n${JSON.stringify(result)}\n\n`);
		expect(map.get('https://example.com/a')).toEqual([result]);
	});

	test('accumulates multiple viewport entries for the same URL, in file order', () => {
		const pc = sampleResult('https://example.com/a');
		const mobile = sampleResult('https://example.com/a', {
			viewport: { name: 'mobile', width: 375 },
		});
		const map = parseLayoutJsonl(`${JSON.stringify(pc)}\n${JSON.stringify(mobile)}\n`);
		expect(map.get('https://example.com/a')).toEqual([pc, mobile]);
	});
});
