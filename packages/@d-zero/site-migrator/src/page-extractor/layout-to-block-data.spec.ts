import type { LayoutAnalysisResult, LayoutBlock } from '@d-zero/anatomist/types';

import { describe, expect, test } from 'vitest';

import { layoutToBlockData } from './layout-to-block-data.js';

/**
 * @param overrides
 */
function sampleBlock(overrides: Partial<LayoutBlock> = {}): LayoutBlock {
	return {
		layoutType: 'leaf',
		tagName: 'DIV',
		id: null,
		classList: [],
		boundingBox: { x: 0, y: 0, width: 100, height: 100 },
		innerHTML: '',
		confidence: 0,
		signals: {},
		children: [],
		...overrides,
	};
}

/**
 * @param overrides
 */
function sampleResult(
	overrides: Partial<LayoutAnalysisResult> = {},
): LayoutAnalysisResult {
	return {
		url: 'https://example.com/',
		viewport: { name: 'pc', width: 1280 },
		mainSelector: 'main',
		root: sampleBlock(),
		...overrides,
	};
}

const heading = (text: string) => sampleBlock({ tagName: 'H2', innerHTML: text });

describe('layoutToBlockData', () => {
	test('vertical-stackはN児をN行1列に変換する', () => {
		const depth1 = sampleBlock({
			layoutType: 'vertical-stack',
			confidence: 0.8,
			children: [heading('見出し1'), heading('見出し2')],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks).toHaveLength(1);
		expect(result.blocks[0]!.containerProps).toStrictEqual({ type: 'grid', columns: 1 });
		expect(result.blocks[0]!.items).toStrictEqual([
			[{ name: 'title-h2', data: { titleH2: '見出し1' } }],
			[{ name: 'title-h2', data: { titleH2: '見出し2' } }],
		]);
		expect(result.fallbacks).toStrictEqual([]);
	});

	test('horizontal-rowはN児を1行N列に変換する', () => {
		const depth1 = sampleBlock({
			layoutType: 'horizontal-row',
			confidence: 0.8,
			children: [heading('見出し1'), heading('見出し2')],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks[0]!.containerProps).toStrictEqual({ type: 'inline' });
		expect(result.blocks[0]!.items).toStrictEqual([
			[
				{ name: 'title-h2', data: { titleH2: '見出し1' } },
				{ name: 'title-h2', data: { titleH2: '見出し2' } },
			],
		]);
	});

	test('simple-gridはsignals.rowSizesに基づき正しく行分割する', () => {
		const children = Array.from({ length: 8 }, (_, i) => heading(`item${i}`));
		const depth1 = sampleBlock({
			layoutType: 'simple-grid',
			confidence: 0.85,
			signals: { rowSizes: [3, 3, 2] },
			children,
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks[0]!.containerProps).toStrictEqual({ type: 'grid', columns: 3 });
		expect(result.blocks[0]!.items).toHaveLength(3);
		expect(result.blocks[0]!.items[0]).toHaveLength(3);
		expect(result.blocks[0]!.items[1]).toHaveLength(3);
		expect(result.blocks[0]!.items[2]).toHaveLength(2);
		expect(result.fallbacks).toStrictEqual([]);
	});

	test('float-wrapはすべて1行になり、signalsに方向情報が無ければfloatはnullになる', () => {
		const depth1 = sampleBlock({
			layoutType: 'float-wrap',
			confidence: 0.75,
			children: [heading('見出し1'), heading('見出し2')],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks[0]!.containerProps).toStrictEqual({
			type: 'float',
			float: null,
		});
		expect(result.blocks[0]!.items).toHaveLength(1);
		expect(result.blocks[0]!.items[0]).toHaveLength(2);
	});

	test('float-wrapはsignals.floatに方向情報があればContainerProps.floatに反映する（将来anatomistが対応した場合の先行実装）', () => {
		const depth1 = sampleBlock({
			layoutType: 'float-wrap',
			confidence: 0.75,
			signals: { float: 'start' },
			children: [heading('見出し1'), heading('見出し2')],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks[0]!.containerProps).toStrictEqual({
			type: 'float',
			float: 'start',
		});
	});

	test('table/unknown/leafのdepth-1ノードは1行1列の単一itemになる', () => {
		const depth1 = sampleBlock({
			layoutType: 'table',
			tagName: 'TABLE',
			innerHTML:
				'<thead><tr><th>項目</th></tr></thead><tbody><tr><td>値</td></tr></tbody>',
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks[0]!.containerProps).toStrictEqual({ type: 'grid', columns: 1 });
		expect(result.blocks[0]!.items).toStrictEqual([
			[
				{
					name: 'table',
					data: { caption: '', th: ['項目'], td: ['値'], scrollable: false },
				},
			],
		]);
	});

	test('rowSizesが存在しないsimple-gridはwysiwyg単一アイテムに倒れ、malformed-row-sizesが記録される', () => {
		const depth1 = sampleBlock({
			layoutType: 'simple-grid',
			confidence: 0.85,
			tagName: 'DIV',
			classList: ['grid'],
			innerHTML: '<p>a</p><p>b</p>',
			children: [heading('a'), heading('b')],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks[0]!.items).toStrictEqual([
			[
				{
					name: 'wysiwyg',
					data: { wysiwyg: '<div class="grid"><p>a</p><p>b</p></div>' },
				},
			],
		]);
		expect(result.fallbacks).toStrictEqual([
			{ blockIndex: 0, reason: 'malformed-row-sizes' },
		]);
	});

	test('rowSizesが非配列のsimple-gridはwysiwygに倒れる', () => {
		const depth1 = sampleBlock({
			layoutType: 'simple-grid',
			confidence: 0.85,
			signals: { rowSizes: 'not-an-array' },
			children: [heading('a'), heading('b')],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks[0]!.items[0]![0]).toMatchObject({ name: 'wysiwyg' });
		expect(result.fallbacks[0]).toStrictEqual({
			blockIndex: 0,
			reason: 'malformed-row-sizes',
		});
	});

	test('rowSizesが空配列のsimple-gridはwysiwygに倒れる（columnsがMath.maxの空適用で-Infinityになることを防ぐ）', () => {
		const depth1 = sampleBlock({
			layoutType: 'simple-grid',
			confidence: 0.85,
			signals: { rowSizes: [] },
			children: [],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks[0]!.containerProps).not.toHaveProperty(
			'columns',
			Number.NEGATIVE_INFINITY,
		);
		expect(result.fallbacks[0]).toStrictEqual({
			blockIndex: 0,
			reason: 'malformed-row-sizes',
		});
	});

	test('rowSizesの合計がchildren数と不一致なsimple-gridはwysiwygに倒れる', () => {
		const depth1 = sampleBlock({
			layoutType: 'simple-grid',
			confidence: 0.85,
			signals: { rowSizes: [2, 2] },
			children: [heading('a'), heading('b'), heading('c')],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.fallbacks[0]).toStrictEqual({
			blockIndex: 0,
			reason: 'malformed-row-sizes',
		});
	});

	test('コンテナ系confidenceが閾値未満の場合はlow-confidenceとしてwysiwygに倒れる', () => {
		const depth1 = sampleBlock({
			layoutType: 'vertical-stack',
			confidence: 0.1,
			children: [heading('a'), heading('b')],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.blocks[0]!.items[0]![0]).toMatchObject({ name: 'wysiwyg' });
		expect(result.fallbacks[0]).toStrictEqual({
			blockIndex: 0,
			reason: 'low-confidence',
		});
	});

	test('PC/モバイルで同一indexの子要素数が不一致の場合、そのブロックのみwysiwygになり他は正常に分類される', () => {
		const pcMatching = sampleBlock({
			layoutType: 'vertical-stack',
			confidence: 0.8,
			children: [heading('a')],
		});
		const pcMismatching = sampleBlock({
			layoutType: 'vertical-stack',
			confidence: 0.8,
			tagName: 'DIV',
			innerHTML: '<p>x</p><p>y</p>',
			children: [heading('x'), heading('y')],
		});
		const pcRoot = sampleBlock({ children: [pcMatching, pcMismatching] });

		const spMatching = sampleBlock({
			layoutType: 'vertical-stack',
			confidence: 0.8,
			children: [heading('a')],
		});
		const spMismatching = sampleBlock({
			layoutType: 'vertical-stack',
			confidence: 0.8,
			children: [heading('x')],
		});
		const spRoot = sampleBlock({ children: [spMatching, spMismatching] });

		const result = layoutToBlockData([
			sampleResult({ viewport: { name: 'pc', width: 1280 }, root: pcRoot }),
			sampleResult({ viewport: { name: 'sp', width: 375 }, root: spRoot }),
		]);

		expect(result.blocks).toHaveLength(2);
		// index 0: 子要素数一致 → 正常分類
		expect(result.blocks[0]!.items).toStrictEqual([
			[{ name: 'title-h2', data: { titleH2: 'a' } }],
		]);
		// index 1: 子要素数不一致（PC:2 vs SP:1） → ブロック全体がwysiwygに倒れる
		expect(result.blocks[1]!.items[0]![0]).toStrictEqual({
			name: 'wysiwyg',
			data: { wysiwyg: '<div><p>x</p><p>y</p></div>' },
		});
		expect(result.fallbacks).toStrictEqual([
			{ blockIndex: 1, reason: 'viewport-mismatch' },
		]);
	});

	test('他ビューポート側のrootがnullの場合は不一致として扱う', () => {
		const pcRoot = sampleBlock({
			children: [
				sampleBlock({
					layoutType: 'vertical-stack',
					confidence: 0.8,
					children: [heading('a')],
				}),
			],
		});
		const result = layoutToBlockData([
			sampleResult({ viewport: { name: 'pc', width: 1280 }, root: pcRoot }),
			sampleResult({ viewport: { name: 'sp', width: 375 }, root: null }),
		]);

		expect(result.fallbacks).toStrictEqual([
			{ blockIndex: 0, reason: 'viewport-mismatch' },
		]);
	});

	test('単一ビューポートのみの入力ではビューポート整合性チェックをスキップして通常変換する', () => {
		const depth1 = sampleBlock({
			layoutType: 'vertical-stack',
			confidence: 0.8,
			children: [heading('a')],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		expect(result.fallbacks).toStrictEqual([]);
		expect(result.blocks[0]!.items).toStrictEqual([
			[{ name: 'title-h2', data: { titleH2: 'a' } }],
		]);
	});

	test('primary.rootがnullの場合は空配列を返す', () => {
		const result = layoutToBlockData([sampleResult({ root: null })]);
		expect(result).toStrictEqual({ blocks: [], fallbacks: [] });
	});

	test('resultsが空配列の場合は空配列を返す', () => {
		const result = layoutToBlockData([]);
		expect(result).toStrictEqual({ blocks: [], fallbacks: [] });
	});

	test('深さ圧縮: depth-2ノードがchildrenを持つ非tableの場合でもchildrenを見ずclassifyBlockItemに丸投げされる', () => {
		const deepGrandchild = sampleBlock({ tagName: 'SPAN', innerHTML: '深すぎる内容' });
		const depth2NonLeaf = sampleBlock({
			layoutType: 'horizontal-row',
			confidence: 0.8,
			tagName: 'DIV',
			innerHTML: '<p>深い内容</p>',
			children: [deepGrandchild, deepGrandchild],
		});
		const depth1 = sampleBlock({
			layoutType: 'vertical-stack',
			confidence: 0.8,
			children: [depth2NonLeaf],
		});
		const result = layoutToBlockData([
			sampleResult({ root: sampleBlock({ children: [depth1] }) }),
		]);

		// depth2ノード自身のlayoutTypeがleaf/table以外なのでカテゴリカルゲートでwysiwygになり、
		// innerHTML（"<p>深い内容</p>"）だけが使われる。孫（"深すぎる内容"）は結果に一切現れない。
		expect(result.blocks[0]!.items).toStrictEqual([
			[{ name: 'wysiwyg', data: { wysiwyg: '<div><p>深い内容</p></div>' } }],
		]);
	});

	test('primaryViewportNameを指定しない場合は既定で"pc"が優先される', () => {
		const pcRoot = sampleBlock({
			children: [
				sampleBlock({
					layoutType: 'vertical-stack',
					confidence: 0.8,
					children: [heading('pc')],
				}),
			],
		});
		const spRoot = sampleBlock({
			children: [
				sampleBlock({
					layoutType: 'vertical-stack',
					confidence: 0.8,
					children: [heading('sp')],
				}),
			],
		});
		const result = layoutToBlockData([
			sampleResult({ viewport: { name: 'sp', width: 375 }, root: spRoot }),
			sampleResult({ viewport: { name: 'pc', width: 1280 }, root: pcRoot }),
		]);

		expect(result.blocks[0]!.items).toStrictEqual([
			[{ name: 'title-h2', data: { titleH2: 'pc' } }],
		]);
	});

	test('該当する名前のビューポートが無い場合は幅最大のエントリにフォールバックする', () => {
		const wideRoot = sampleBlock({
			children: [
				sampleBlock({
					layoutType: 'vertical-stack',
					confidence: 0.8,
					children: [heading('wide')],
				}),
			],
		});
		const narrowRoot = sampleBlock({
			children: [
				sampleBlock({
					layoutType: 'vertical-stack',
					confidence: 0.8,
					children: [heading('narrow')],
				}),
			],
		});
		const result = layoutToBlockData([
			sampleResult({ viewport: { name: 'desktop', width: 1440 }, root: wideRoot }),
			sampleResult({ viewport: { name: 'mobile', width: 390 }, root: narrowRoot }),
		]);

		expect(result.blocks[0]!.items).toStrictEqual([
			[{ name: 'title-h2', data: { titleH2: 'wide' } }],
		]);
	});
});
