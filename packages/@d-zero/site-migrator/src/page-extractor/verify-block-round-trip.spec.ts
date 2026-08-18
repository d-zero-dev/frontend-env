import type { BlockData } from '@burger-editor/core';

import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';

import { renderBlocks } from './render-blocks.js';
import { verifyBlockRoundTrip } from './verify-block-round-trip.js';

/**
 * `renderBlocks`（実際の`@burger-editor/core`の`render()`）でblockを描画し、
 * `verifyBlockRoundTrip`が受け取る`HTMLElement`（描画結果1ブロック分）を、`renderBlocks`の
 * DOM環境インストールと無関係な独立した`JSDOM`インスタンスで再構築して返す。
 * @param block 描画対象の`BlockData`。
 */
async function renderToElement(block: BlockData): Promise<HTMLElement> {
	const html = await renderBlocks([block], { contentClass: 'wrap' });
	const dom = new JSDOM(html);
	const element = dom.window.document.querySelector('[data-bge-name]');
	if (!element) {
		throw new Error('renderBlocks output did not contain a data-bge-name element');
	}
	return element as unknown as HTMLElement;
}

/**
 * @param overrides
 */
function sampleBlock(overrides: Partial<BlockData> = {}): BlockData {
	return {
		name: 'migrated',
		containerProps: { type: 'grid', columns: 2 },
		items: [
			[
				{ name: 'wysiwyg', data: { wysiwyg: 'A' } },
				{ name: 'wysiwyg', data: { wysiwyg: 'B' } },
			],
			[
				{ name: 'wysiwyg', data: { wysiwyg: 'C' } },
				{ name: 'wysiwyg', data: { wysiwyg: 'D' } },
			],
		],
		...overrides,
	};
}

describe('verifyBlockRoundTrip', () => {
	test('render結果が変換元と構造的に一致する場合はok:true・mismatches:[]', async () => {
		const block = sampleBlock();
		const element = await renderToElement(block);

		const result = verifyBlockRoundTrip(block, element);

		expect(result).toEqual({ ok: true, mismatches: [] });
	});

	test('classList/style/idの差異は比較対象外のためok:trueのまま', async () => {
		const base = sampleBlock();
		const rendered = await renderToElement(base);
		const original = sampleBlock({
			classList: ['js-highlight'],
			style: { '--gap': '8px' },
			id: 'anchor-1',
		});

		const result = verifyBlockRoundTrip(original, rendered);

		expect(result).toEqual({ ok: true, mismatches: [] });
	});

	test('nameの不一致を検出する', async () => {
		const rendered = await renderToElement(sampleBlock());
		const original = sampleBlock({ name: 'other' });

		const result = verifyBlockRoundTrip(original, rendered);

		expect(result.ok).toBe(false);
		expect(result.mismatches).toContainEqual({
			field: 'name',
			expected: 'other',
			actual: 'migrated',
		});
	});

	test('containerProps.typeの不一致を検出する', async () => {
		const rendered = await renderToElement(sampleBlock());
		const original = sampleBlock({ containerProps: { type: 'inline' } });

		const result = verifyBlockRoundTrip(original, rendered);

		expect(result.ok).toBe(false);
		expect(result.mismatches).toContainEqual({
			field: 'containerProps.type',
			expected: 'inline',
			actual: 'grid',
		});
	});

	test('itemsの行数不一致を検出し、行単位の比較は行わない', async () => {
		const base = sampleBlock();
		const rendered = await renderToElement(base);
		const original = sampleBlock({ items: [base.items[0]!] });

		const result = verifyBlockRoundTrip(original, rendered);

		expect(result.ok).toBe(false);
		expect(result.mismatches).toEqual([
			{ field: 'items.length', expected: 1, actual: 2 },
		]);
	});

	test('itemsの列数不一致を検出する', async () => {
		const base = sampleBlock();
		const rendered = await renderToElement(base);
		const original = sampleBlock({
			items: [[base.items[0]![0]!], base.items[1]!],
		});

		const result = verifyBlockRoundTrip(original, rendered);

		expect(result.ok).toBe(false);
		expect(result.mismatches).toContainEqual({
			field: 'items[0].length',
			expected: 1,
			actual: 2,
		});
	});

	test('itemsの各セルのname不一致を行×列の位置ベースで検出する', async () => {
		const base = sampleBlock();
		const rendered = await renderToElement(base);
		const original = sampleBlock({
			items: [
				[{ name: 'button', data: { link: [''], label: [''] } }, base.items[0]![1]!],
				base.items[1]!,
			],
		});

		const result = verifyBlockRoundTrip(original, rendered);

		expect(result.ok).toBe(false);
		expect(result.mismatches).toContainEqual({
			field: 'items[0][0].name',
			expected: 'button',
			actual: 'wysiwyg',
		});
	});

	test('複数箇所の不一致をすべて返す（最初の不一致で短絡しない）', async () => {
		const rendered = await renderToElement(sampleBlock());
		const original = sampleBlock({ name: 'other', containerProps: { type: 'inline' } });

		const result = verifyBlockRoundTrip(original, rendered);

		expect(result.mismatches).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: 'name' }),
				expect.objectContaining({ field: 'containerProps.type' }),
			]),
		);
		expect(result.mismatches).toHaveLength(2);
	});

	test('parseHTMLToBlockDataが例外を投げた場合はok:falseとして扱う', () => {
		const throwingElement = {
			get dataset(): never {
				throw new Error('boom');
			},
		} as unknown as HTMLElement;

		const result = verifyBlockRoundTrip(sampleBlock(), throwingElement);

		expect(result.ok).toBe(false);
		expect(result.mismatches).toEqual([
			{
				field: 'parseHTMLToBlockData',
				expected: '例外を投げないこと',
				actual: 'boom',
			},
		]);
	});
});
