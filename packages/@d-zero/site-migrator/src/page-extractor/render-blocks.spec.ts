import type { BlockData } from '@burger-editor/core';

import { parseHTMLToBlockData, render } from '@burger-editor/core';
import { describe, expect, test, vi } from 'vitest';

import { renderBlocks } from './render-blocks.js';

// `render-blocks.ts`が呼ぶ`render`と（`verifyBlockRoundTrip`経由の）`parseHTMLToBlockData`を
// スパイでラップする。既定では実装（`actual`）へそのまま転送するため、ここで
// `mockReturnValueOnce`/`mockImplementationOnce`しない限り既存テストの挙動は一切変わらない —
// 往復検証のフォールバック分岐（#980）だけを狙って検証するための仕込み。
vi.mock('@burger-editor/core', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@burger-editor/core')>();
	return {
		...actual,
		render: vi.fn(actual.render),
		parseHTMLToBlockData: vi.fn(actual.parseHTMLToBlockData),
	};
});

/**
 * @param overrides
 */
function sampleBlock(overrides: Partial<BlockData> = {}): BlockData {
	return {
		name: 'migrated',
		containerProps: { type: 'grid', columns: 1 },
		items: [[{ name: 'wysiwyg', data: { wysiwyg: '<p>hello</p>' } }]],
		...overrides,
	};
}

describe('renderBlocks', () => {
	test('BlockDataをdata-bge-*付きHTMLへ変換し、contentClassのラッパーで囲む', async () => {
		const html = await renderBlocks([sampleBlock()], { contentClass: 'js-bge-content' });

		expect(html.startsWith('<div class="js-bge-content">')).toBe(true);
		expect(html.endsWith('</div>')).toBe(true);
		expect(html).toContain('data-bge-name="migrated"');
		expect(html).toContain('data-bge-container="grid:1"');
		expect(html).toContain('<p>hello</p>');
	});

	test('複数ブロックを配列順のまま連結する', async () => {
		const html = await renderBlocks(
			[
				sampleBlock({
					name: 'first',
					items: [[{ name: 'wysiwyg', data: { wysiwyg: 'A' } }]],
				}),
				sampleBlock({
					name: 'second',
					items: [[{ name: 'wysiwyg', data: { wysiwyg: 'B' } }]],
				}),
			],
			{ contentClass: 'wrap' },
		);

		expect(html.indexOf('data-bge-name="first"')).toBeLessThan(
			html.indexOf('data-bge-name="second"'),
		);
	});

	test('空配列の場合は空のラッパー要素のみ返す', async () => {
		const html = await renderBlocks([], { contentClass: 'wrap' });

		expect(html).toBe('<div class="wrap"></div>');
	});

	test('wysiwyg以外の既定カタログアイテム（image）も解決して描画する', async () => {
		const html = await renderBlocks(
			[
				sampleBlock({
					name: 'image-block',
					items: [
						[
							{
								name: 'image',
								data: {
									path: ['/a.jpg'],
									alt: ['a'],
									width: [100],
									height: [100],
									media: [''],
									loading: ['eager'],
								},
							},
						],
					],
				}),
			],
			{ contentClass: 'wrap' },
		);

		expect(html).toContain('data-bgi="image"');
		expect(html).toContain('<img src="/a.jpg" alt="a"');
	});

	test('contentClassの二重引用符をエスケープする', async () => {
		const html = await renderBlocks([], { contentClass: '"><script>' });

		expect(html).toBe('<div class="&quot;><script>"></div>');
	});

	test('往復検証が一致する場合はonRoundTripMismatchを呼ばない', async () => {
		const onRoundTripMismatch = vi.fn();

		await renderBlocks([sampleBlock()], { contentClass: 'wrap', onRoundTripMismatch });

		expect(onRoundTripMismatch).not.toHaveBeenCalled();
	});

	test('往復検証の不一致を検出したブロックはwysiwygフォールバックへ倒し、onRoundTripMismatchを呼ぶ', async () => {
		vi.mocked(parseHTMLToBlockData).mockReturnValueOnce({
			name: 'not-matching',
			containerProps: { type: 'inline' },
			items: [[{ name: 'wysiwyg', data: { wysiwyg: 'x' } }]],
		});
		const block = sampleBlock();
		const onRoundTripMismatch = vi.fn();

		const html = await renderBlocks([block], {
			contentClass: 'wrap',
			onRoundTripMismatch,
		});

		expect(onRoundTripMismatch).toHaveBeenCalledTimes(1);
		const event = onRoundTripMismatch.mock.calls[0]![0];
		expect(event.blockIndex).toBe(0);
		expect(event.block).toBe(block);
		expect(event.mismatches.length).toBeGreaterThan(0);

		// フォールバック後のトップレベルブロックはフォールバック自身の1個だけ
		// （data-bge-name="migrated"は1回だけ出現する）— 失敗した元ブロックの
		// render()出力はwysiwygアイテムの内容としてネストされ、wysiwygのサニタイズにより
		// 構造マーカー（data-bge-name/data-bge-group/data-bge-item）は失われるが、
		// 見た目上のコンテンツ（`<p>hello</p>`）は保持される。
		const nameAttrCount = [...html.matchAll(/data-bge-name="migrated"/g)].length;
		expect(nameAttrCount).toBe(1);
		expect(html).toContain('<p>hello</p>');
	});

	test('往復検証に失敗したブロックが複数中の1個でも、他ブロックは通常どおり変換される', async () => {
		vi.mocked(parseHTMLToBlockData).mockReturnValueOnce({
			name: 'not-matching',
			containerProps: { type: 'inline' },
			items: [[{ name: 'wysiwyg', data: { wysiwyg: 'x' } }]],
		});

		const html = await renderBlocks(
			[
				sampleBlock({
					name: 'first',
					items: [[{ name: 'wysiwyg', data: { wysiwyg: 'A' } }]],
				}),
				sampleBlock({
					name: 'second',
					items: [[{ name: 'wysiwyg', data: { wysiwyg: 'B' } }]],
				}),
			],
			{ contentClass: 'wrap' },
		);

		expect(html).toContain('data-bge-name="second"');
		expect(html).toContain('B');
	});

	test('フォールバック時もclassList/style/idを引き継ぐ', async () => {
		vi.mocked(parseHTMLToBlockData).mockReturnValueOnce({
			name: 'not-matching',
			containerProps: { type: 'inline' },
			items: [[{ name: 'wysiwyg', data: { wysiwyg: 'x' } }]],
		});
		const block = sampleBlock({
			classList: ['js-highlight'],
			style: { '--gap': '8px' },
			id: 'anchor-1',
		});

		const html = await renderBlocks([block], { contentClass: 'wrap' });

		expect(html).toContain('js-highlight');
		expect(html).toContain('bge-anchor-1');
	});

	test('フォールバック用のrender()自体が失敗しても例外を伝播させず、往復検証に失敗した元のelementをそのまま使う', async () => {
		vi.mocked(parseHTMLToBlockData).mockReturnValueOnce({
			name: 'not-matching',
			containerProps: { type: 'inline' },
			items: [[{ name: 'wysiwyg', data: { wysiwyg: 'x' } }]],
		});
		const defaultImpl = vi.mocked(render).getMockImplementation()!;
		vi.mocked(render)
			.mockImplementationOnce(defaultImpl) // 1回目（通常のブロック描画）は実装通り
			.mockImplementationOnce(() => {
				throw new Error('fallback render failed');
			}); // 2回目（フォールバックの再render）は失敗させる

		const html = await renderBlocks([sampleBlock()], { contentClass: 'wrap' });

		// フォールバックが失敗しても例外は投げられず、往復検証に失敗した（が一応レンダリング
		// はできている）元のブロックのHTMLがそのまま出力される。
		expect(html).toContain('data-bge-name="migrated"');
		expect(html).toContain('<p>hello</p>');
	});
});
