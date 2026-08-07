import type { LayoutBlock } from '@d-zero/anatomist/types';

import { describe, expect, test } from 'vitest';

import { isMainConsistent } from './check-main-consistency.js';

const sampleRoot = (overrides: Partial<LayoutBlock> = {}): LayoutBlock => ({
	layoutType: 'leaf',
	tagName: 'MAIN',
	id: null,
	classList: [],
	boundingBox: { x: 0, y: 0, width: 0, height: 0 },
	innerHTML: '',
	confidence: 0,
	signals: {},
	children: [],
	...overrides,
});

describe('isMainConsistent', () => {
	test('rootがnullの場合は無条件に不整合とみなす', () => {
		expect(isMainConsistent({ tagName: 'main', id: null, classList: [] }, null)).toBe(
			false,
		);
	});

	test('tagNameが大文字小文字違いでも一致すれば整合', () => {
		expect(
			isMainConsistent({ tagName: 'main', id: null, classList: [] }, sampleRoot()),
		).toBe(true);
	});

	test('tagNameが異なれば不整合', () => {
		expect(
			isMainConsistent(
				{ tagName: 'section', id: null, classList: [] },
				sampleRoot({ tagName: 'MAIN' }),
			),
		).toBe(false);
	});

	test('idが異なれば不整合', () => {
		expect(
			isMainConsistent(
				{ tagName: 'main', id: 'a', classList: [] },
				sampleRoot({ id: 'b' }),
			),
		).toBe(false);
	});

	test('idの大文字小文字が異なれば不整合', () => {
		expect(
			isMainConsistent(
				{ tagName: 'main', id: 'Main', classList: [] },
				sampleRoot({ id: 'main' }),
			),
		).toBe(false);
	});

	test('classListは順序が異なっても集合として一致すれば整合', () => {
		expect(
			isMainConsistent(
				{ tagName: 'main', id: null, classList: ['a', 'b'] },
				sampleRoot({ classList: ['b', 'a'] }),
			),
		).toBe(true);
	});

	test('classListの要素数が異なれば不整合', () => {
		expect(
			isMainConsistent(
				{ tagName: 'main', id: null, classList: ['a'] },
				sampleRoot({ classList: ['a', 'b'] }),
			),
		).toBe(false);
	});

	test('classListの内容が異なれば不整合', () => {
		expect(
			isMainConsistent(
				{ tagName: 'main', id: null, classList: ['a'] },
				sampleRoot({ classList: ['b'] }),
			),
		).toBe(false);
	});
});
