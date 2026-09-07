import { describe, expect, test } from 'vitest';

import { assetAttributesFor, parseSrcset, serializeSrcset } from './selectors.js';

describe('assetAttributesFor', () => {
	test('returns expected attribute set for known tags', () => {
		expect([...assetAttributesFor('img')].toSorted()).toEqual(['src', 'srcset']);
		expect([...assetAttributesFor('video')].toSorted()).toEqual(['poster', 'src']);
		expect([...assetAttributesFor('form')]).toEqual(['action']);
	});

	test('returns an empty set for tags we do not rewrite', () => {
		expect(assetAttributesFor('div').size).toBe(0);
		expect(assetAttributesFor('section').size).toBe(0);
	});
});

describe('parseSrcset / serializeSrcset', () => {
	test('round-trips a typical descriptor list', () => {
		const value = 'a.jpg 1x, b.jpg 2x';
		expect(parseSrcset(value)).toEqual([
			{ url: 'a.jpg', descriptor: '1x' },
			{ url: 'b.jpg', descriptor: '2x' },
		]);
		expect(serializeSrcset(parseSrcset(value))).toBe(value);
	});

	test('handles entries without descriptors', () => {
		const value = 'a.jpg, b.jpg 2x';
		expect(parseSrcset(value)).toEqual([
			{ url: 'a.jpg', descriptor: '' },
			{ url: 'b.jpg', descriptor: '2x' },
		]);
		expect(serializeSrcset(parseSrcset(value))).toBe(value);
	});

	test('drops empty entries from accidentally extra commas', () => {
		expect(parseSrcset('a.jpg,, b.jpg 2x')).toEqual([
			{ url: 'a.jpg', descriptor: '' },
			{ url: 'b.jpg', descriptor: '2x' },
		]);
	});
});
