import { describe, expect, test } from 'vitest';

import { isMainConsistent } from './check-main-consistency.js';

const docWith = (body: string) =>
	`<!doctype html><html><head><title>t</title></head><body>${body}</body></html>`;

describe('isMainConsistent', () => {
	test('mainSelectorがnullの場合は無条件に不整合とみなす', () => {
		const html = docWith('<main><p>x</p></main>');
		expect(isMainConsistent(html, '<main><p>x</p></main>', null)).toBe(false);
	});

	test('mainSelectorが指す要素のouterHTMLがextractMainContentのマッチと一致すれば整合', () => {
		const html = docWith('<main class="l-main"><p>x</p></main>');
		expect(isMainConsistent(html, '<main class="l-main"><p>x</p></main>', 'main')).toBe(
			true,
		);
	});

	test('mainSelectorが別の要素を指している場合は不整合', () => {
		const html = docWith('<main><p>x</p></main><section><p>y</p></section>');
		expect(isMainConsistent(html, '<main><p>x</p></main>', 'section')).toBe(false);
	});

	test('mainSelectorにマッチする要素が存在しない場合は不整合', () => {
		const html = docWith('<main><p>x</p></main>');
		expect(isMainConsistent(html, '<main><p>x</p></main>', '.does-not-exist')).toBe(
			false,
		);
	});

	test('mainSelectorが不正なセレクタで例外を投げる場合も不整合として扱う', () => {
		const html = docWith('<main><p>x</p></main>');
		expect(isMainConsistent(html, '<main><p>x</p></main>', ':::invalid:::')).toBe(false);
	});
});
