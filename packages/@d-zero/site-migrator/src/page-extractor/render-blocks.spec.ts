import type { BlockData } from '@burger-editor/core';

import { describe, expect, test } from 'vitest';

import { renderBlocks } from './render-blocks.js';

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
});
