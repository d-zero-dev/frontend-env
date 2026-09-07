import type { BlockData } from '@burger-editor/core';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { downloadBlockFiles } from './download-block-files.js';

/**
 * @param path_
 */
function downloadFileBlock(path_: string): BlockData {
	return {
		name: 'migrated',
		containerProps: { type: 'grid', columns: 1 },
		items: [
			[
				{
					name: 'download-file',
					data: {
						path: path_,
						download: '',
						name: '',
						formatedSize: '',
						size: '',
						downloadCheck: false,
					},
				},
			],
		],
	};
}

describe('downloadBlockFiles', () => {
	let outputDir = '';

	beforeEach(async () => {
		outputDir = await mkdtemp(path.join(tmpdir(), 'site-migrator-download-block-'));
	});

	afterEach(async () => {
		await rm(outputDir, { recursive: true, force: true });
		vi.unstubAllGlobals();
	});

	test('未知のdownload-file候補を実DLし、size/formatedSizeを実測値で書き戻す', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() =>
				Promise.resolve(
					new Response(new Uint8Array(2048), {
						status: 200,
						headers: { 'content-type': 'application/pdf' },
					}),
				),
			),
		);

		const block = downloadFileBlock('/files/a.pdf');
		await downloadBlockFiles({
			blocksByUrl: new Map([['https://example.com/p', [block]]]),
			outputDir,
			knownResourceUrls: new Set(),
		});

		const item = block.items[0]![0] as { data: { size: string; formatedSize: string } };
		expect(item.data.size).toBe('2048');
		expect(item.data.formatedSize).toBe('2.0KB');
		const written = await readFile(path.join(outputDir, 'files', 'a.pdf'));
		expect(written).toHaveLength(2048);
	});

	test('knownResourceUrlsに含まれるURLは再ダウンロードしない', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		// Pre-populate the file as if the main resource-download pass already saved it.
		const outputPath = path.join(outputDir, 'files', 'a.pdf');
		await import('node:fs/promises').then(({ mkdir, writeFile }) =>
			mkdir(path.dirname(outputPath), { recursive: true }).then(() =>
				writeFile(outputPath, new Uint8Array(10)),
			),
		);

		const block = downloadFileBlock('/files/a.pdf');
		await downloadBlockFiles({
			blocksByUrl: new Map([['https://example.com/p', [block]]]),
			outputDir,
			knownResourceUrls: new Set(['https://example.com/files/a.pdf']),
		});

		expect(fetchMock).not.toHaveBeenCalled();
		const item = block.items[0]![0] as { data: { size: string; formatedSize: string } };
		// Still reflects the real size on disk, even though no new download ran.
		expect(item.data.size).toBe('10');
	});

	test('同一URLを参照する複数ブロックのアイテム全てにsizeを反映する', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve(new Response(new Uint8Array(5), { status: 200 }))),
		);

		const blockA = downloadFileBlock('/files/shared.pdf');
		const blockB = downloadFileBlock('https://example.com/files/shared.pdf');
		await downloadBlockFiles({
			blocksByUrl: new Map([
				['https://example.com/pageA', [blockA]],
				['https://example.com/pageB', [blockB]],
			]),
			outputDir,
			knownResourceUrls: new Set(),
		});

		expect((blockA.items[0]![0] as { data: { size: string } }).data.size).toBe('5');
		expect((blockB.items[0]![0] as { data: { size: string } }).data.size).toBe('5');
	});

	test('ダウンロードが失敗した場合はsize/formatedSizeがプレースホルダーのまま残る', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve(new Response('not found', { status: 404 }))),
		);

		const block = downloadFileBlock('/files/missing.pdf');
		await downloadBlockFiles({
			blocksByUrl: new Map([['https://example.com/p', [block]]]),
			outputDir,
			knownResourceUrls: new Set(),
		});

		const item = block.items[0]![0] as { data: { size: string; formatedSize: string } };
		expect(item.data.size).toBe('');
		expect(item.data.formatedSize).toBe('');
	});

	test('1024バイト未満のファイルはB単位（小数無し）でformatedSizeを表す', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve(new Response(new Uint8Array(500), { status: 200 }))),
		);

		const block = downloadFileBlock('/files/small.pdf');
		await downloadBlockFiles({
			blocksByUrl: new Map([['https://example.com/p', [block]]]),
			outputDir,
			knownResourceUrls: new Set(),
		});

		const item = block.items[0]![0] as { data: { size: string; formatedSize: string } };
		expect(item.data.size).toBe('500');
		expect(item.data.formatedSize).toBe('500B');
	});

	test('パースできないpath（URLとして不正）を持つアイテムは例外を投げずスキップする', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		// A raw space in the host makes `new URL(...)` throw regardless of base,
		// since the value carries its own (invalid) scheme.
		const block = downloadFileBlock('https://ex ample.invalid/a.pdf');
		await expect(
			downloadBlockFiles({
				blocksByUrl: new Map([['https://example.com/p', [block]]]),
				outputDir,
				knownResourceUrls: new Set(),
			}),
		).resolves.toBeUndefined();

		expect(fetchMock).not.toHaveBeenCalled();
		const item = block.items[0]![0] as { data: { size: string; formatedSize: string } };
		expect(item.data.size).toBe('');
	});

	test('download-fileアイテムが無ければ何もしない（downloadResourcesを呼ばない）', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const block: BlockData = {
			name: 'migrated',
			containerProps: { type: 'grid', columns: 1 },
			items: [[{ name: 'wysiwyg', data: { wysiwyg: '<p>x</p>' } }]],
		};
		await downloadBlockFiles({
			blocksByUrl: new Map([['https://example.com/p', [block]]]),
			outputDir,
			knownResourceUrls: new Set(),
		});

		expect(fetchMock).not.toHaveBeenCalled();
	});
});
