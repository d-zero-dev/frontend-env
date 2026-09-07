import { describe, expect, test, vi } from 'vitest';

import { resolveIdTemplate } from './resolve-id-template.js';

describe('resolveIdTemplate', () => {
	test('swaps a single {{id}} token for the mapped URL', () => {
		const out = resolveIdTemplate({
			html: '<a href="{{42}}">about</a>',
			idMap: new Map([[42, '/about/']]),
		});
		expect(out).toBe('<a href="/about/">about</a>');
	});

	test('preserves the trailing ?query#fragment that follows the token', () => {
		const out = resolveIdTemplate({
			html: '<a href="{{42}}?q=foo#top">about</a>',
			idMap: new Map([[42, '/about/']]),
		});
		expect(out).toBe('<a href="/about/?q=foo#top">about</a>');
	});

	test('leaves the token verbatim and notifies onUnresolved when the id is missing', () => {
		const seen: number[] = [];
		const out = resolveIdTemplate({
			html: '<a href="{{999}}">missing</a>',
			idMap: new Map([[42, '/about/']]),
			onUnresolved: (id) => seen.push(id),
		});
		expect(out).toBe('<a href="{{999}}">missing</a>');
		expect(seen).toStrictEqual([999]);
	});

	test('handles multiple tokens including duplicates', () => {
		const onUnresolved = vi.fn();
		const out = resolveIdTemplate({
			html: '<a href="{{10}}">x</a><a href="{{20}}">y</a><a href="{{10}}">z</a>',
			idMap: new Map([
				[10, '/x/'],
				[20, '/y/'],
			]),
			onUnresolved,
		});
		expect(out).toBe('<a href="/x/">x</a><a href="/y/">y</a><a href="/x/">z</a>');
		expect(onUnresolved).not.toHaveBeenCalled();
	});

	test('does not touch non-digit mustache tokens', () => {
		const out = resolveIdTemplate({
			html: '<p>Hello {{name}}, see {{42}}</p>',
			idMap: new Map([[42, '/page/']]),
		});
		expect(out).toBe('<p>Hello {{name}}, see /page/</p>');
	});

	test('treats id 0 as a real key (no falsy-zero confusion)', () => {
		const out = resolveIdTemplate({
			html: '<a href="{{0}}">root</a>',
			idMap: new Map([[0, '/zero/']]),
		});
		expect(out).toBe('<a href="/zero/">root</a>');
	});

	test('returns the html unchanged when no tokens exist', () => {
		const html = '<p>no tokens here</p>';
		const out = resolveIdTemplate({ html, idMap: new Map([[42, '/x/']]) });
		expect(out).toBe(html);
	});

	test('calls onUnresolved once per occurrence, even when the same id repeats', () => {
		const seen: number[] = [];
		resolveIdTemplate({
			html: '{{1}}-{{1}}-{{2}}',
			idMap: new Map(),
			onUnresolved: (id) => seen.push(id),
		});
		expect(seen).toStrictEqual([1, 1, 2]);
	});
});
