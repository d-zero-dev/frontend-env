import { describe, expect, test } from 'vitest';

import { mergeMainContent } from './merge-main-content.js';

describe('mergeMainContent', () => {
	test('既存main要素の子要素をラッパーの中身で置き換え、contentClassをmain自身に追加する', () => {
		const result = mergeMainContent({
			mainHtml: '<main><p>old</p></main>',
			wrapperHtml: '<div class="js-bge-content"><div data-bge-name="a">new</div></div>',
			contentClass: 'js-bge-content',
		});

		expect(result).toBe(
			'<main class="js-bge-content"><div data-bge-name="a">new</div></main>',
		);
	});

	test('既存main要素が既にclassを持つ場合はトークンとして追加する（既存クラスは保持）', () => {
		const result = mergeMainContent({
			mainHtml: '<main class="l-main"><p>old</p></main>',
			wrapperHtml: '<div class="js-bge-content"><p>new</p></div>',
			contentClass: 'js-bge-content',
		});

		expect(result).toBe('<main class="l-main js-bge-content"><p>new</p></main>');
	});

	test('main要素が既にcontentClassを含む場合は重複追加しない', () => {
		const result = mergeMainContent({
			mainHtml: '<main class="l-main js-bge-content"><p>old</p></main>',
			wrapperHtml: '<div class="js-bge-content"><p>new</p></div>',
			contentClass: 'js-bge-content',
		});

		expect(result).toBe('<main class="l-main js-bge-content"><p>new</p></main>');
	});

	test('ラッパーが空（ブロック0件）でも既存main子要素を空に置き換える', () => {
		const result = mergeMainContent({
			mainHtml: '<main><p>old</p></main>',
			wrapperHtml: '<div class="js-bge-content"></div>',
			contentClass: 'js-bge-content',
		});

		expect(result).toBe('<main class="js-bge-content"></main>');
	});

	test('main要素自身のタグ名・属性以外の属性（idなど）は保持される', () => {
		const result = mergeMainContent({
			mainHtml: '<main id="content" class="l-main"><p>old</p></main>',
			wrapperHtml: '<div class="wrap"><p>new</p></div>',
			contentClass: 'js-bge-content',
		});

		expect(result).toBe(
			'<main id="content" class="l-main js-bge-content"><p>new</p></main>',
		);
	});

	test('mainHtmlが単一要素にパースできない場合は例外を投げる', () => {
		expect(() =>
			mergeMainContent({
				mainHtml: 'not an element',
				wrapperHtml: '<div class="wrap"></div>',
				contentClass: 'wrap',
			}),
		).toThrow(/mainHtml did not parse/);
	});

	test('複数ブロックのラッパー中身をすべて移し替える', () => {
		const result = mergeMainContent({
			mainHtml: '<main></main>',
			wrapperHtml: '<div class="wrap"><div>A</div><div>B</div></div>',
			contentClass: 'wrap',
		});

		expect(result).toBe('<main class="wrap"><div>A</div><div>B</div></main>');
	});
});
