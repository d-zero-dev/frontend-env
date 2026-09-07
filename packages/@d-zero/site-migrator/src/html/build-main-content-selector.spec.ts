import { describe, expect, test } from 'vitest';

import { buildMainContentSelector } from './build-main-content-selector.js';

describe('buildMainContentSelector', () => {
	test('tag+id+classのセレクタを組み立てる', () => {
		expect(
			buildMainContentSelector({
				tagName: 'div',
				id: 'main',
				classList: ['l-main', 'p-index'],
			}),
		).toBe('div#main.l-main.p-index');
	});

	test('idが無い場合は#部分を省略する', () => {
		expect(
			buildMainContentSelector({ tagName: 'main', id: null, classList: ['content'] }),
		).toBe('main.content');
	});

	test('idもclassも無い場合はtag名のみのセレクタになる', () => {
		expect(buildMainContentSelector({ tagName: 'main', id: null, classList: [] })).toBe(
			'main',
		);
	});

	test('class内の特殊文字をエスケープする', () => {
		expect(
			buildMainContentSelector({ tagName: 'div', id: null, classList: ['lg:w-1/2'] }),
		).toBe('div.lg\\:w-1\\/2');
	});

	test('id内の特殊文字をエスケープする', () => {
		expect(buildMainContentSelector({ tagName: 'div', id: 'a:b', classList: [] })).toBe(
			'div#a\\:b',
		);
	});
});
