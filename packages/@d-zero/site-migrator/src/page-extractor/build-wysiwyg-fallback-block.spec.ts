import { describe, expect, test } from 'vitest';

import { buildWysiwygFallbackBlock } from './build-wysiwyg-fallback-block.js';

describe('buildWysiwygFallbackBlock', () => {
	test('1行1列のwysiwyg単一アイテムを持つBlockDataを組み立てる', () => {
		const block = buildWysiwygFallbackBlock('<p>hello</p>', { name: 'migrated' });

		expect(block).toEqual({
			name: 'migrated',
			containerProps: { type: 'grid', columns: 1 },
			items: [[{ name: 'wysiwyg', data: { wysiwyg: '<p>hello</p>' } }]],
		});
	});

	test('classList/style/idを指定した場合はBlockDataに含める', () => {
		const block = buildWysiwygFallbackBlock('<p>hello</p>', {
			name: 'migrated',
			classList: ['js-highlight'],
			style: { '--gap': '8px' },
			id: 'anchor-1',
		});

		expect(block.classList).toEqual(['js-highlight']);
		expect(block.style).toEqual({ '--gap': '8px' });
		expect(block.id).toBe('anchor-1');
	});

	test('classList/style/idを省略した場合はBlockDataに含めない', () => {
		const block = buildWysiwygFallbackBlock('<p>hello</p>', { name: 'migrated' });

		expect(block).not.toHaveProperty('classList');
		expect(block).not.toHaveProperty('style');
		expect(block).not.toHaveProperty('id');
	});

	test('idがnullの場合はBlockDataにid:nullとして含める（省略しない）', () => {
		const block = buildWysiwygFallbackBlock('<p>hello</p>', {
			name: 'migrated',
			id: null,
		});

		expect(block).toHaveProperty('id', null);
	});
});
