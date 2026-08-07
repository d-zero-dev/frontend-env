import { describe, expect, test } from 'vitest';

import { parseMainTag } from './parse-main-tag.js';

describe('parseMainTag', () => {
	test('tagNameとclassListを抽出する（id無し）', () => {
		expect(parseMainTag('<main class="l-main p-index"><p>x</p></main>')).toEqual({
			tagName: 'main',
			id: null,
			classList: ['l-main', 'p-index'],
		});
	});

	test('idを抽出する', () => {
		expect(parseMainTag('<div id="content"><p>x</p></div>')).toEqual({
			tagName: 'div',
			id: 'content',
			classList: [],
		});
	});

	test('class属性が無い場合はclassListが空配列になる', () => {
		expect(parseMainTag('<main><p>x</p></main>')).toEqual({
			tagName: 'main',
			id: null,
			classList: [],
		});
	});

	test('class属性の連続する空白は分割時に除去される', () => {
		expect(parseMainTag('<div class="  a   b  "></div>')).toEqual({
			tagName: 'div',
			id: null,
			classList: ['a', 'b'],
		});
	});

	test('要素が見つからない場合は例外を投げる', () => {
		expect(() => parseMainTag('')).toThrow();
	});
});
