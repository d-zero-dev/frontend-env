import { describe, expect, test } from 'vitest';

import { splitTitle } from './split-title.js';

describe('splitTitle', () => {
	test('returns the trimmed title verbatim when no separator is present', () => {
		expect(splitTitle('About us')).toEqual({ title: 'About us' });
	});

	test('splits on full-width vertical bar and keeps the first segment', () => {
		expect(splitTitle('ニュース｜製品｜会社')).toEqual({
			title: 'ニュース',
			rawTitle: 'ニュース｜製品｜会社',
		});
	});

	test('splits on ASCII vertical bar', () => {
		expect(splitTitle('Page | Site')).toEqual({
			title: 'Page',
			rawTitle: 'Page | Site',
		});
	});

	test('falls through to the first non-empty segment when the head is empty', () => {
		expect(splitTitle(' | Tail ')).toEqual({
			title: 'Tail',
			rawTitle: ' | Tail ',
		});
	});

	test('returns undefined for null / undefined / empty / whitespace-only', () => {
		expect(splitTitle()).toBeUndefined();
		expect(splitTitle(null)).toBeUndefined();
		expect(splitTitle('')).toBeUndefined();
		expect(splitTitle('   ')).toBeUndefined();
	});

	test('trims surrounding whitespace before splitting', () => {
		expect(splitTitle('  Trimmed  ')).toEqual({ title: 'Trimmed' });
	});

	test('does not emit rawTitle when split is a no-op', () => {
		// Already trimmed and no separator → no rawTitle.
		expect(splitTitle('Solo').rawTitle).toBeUndefined();
	});
});
