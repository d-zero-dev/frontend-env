import { describe, expect, test } from 'vitest';

import { formatFrontmatter } from './format-frontmatter.js';

describe('formatFrontmatter', () => {
	test('emits an empty string when no fields are set', () => {
		expect(formatFrontmatter({})).toBe('');
	});

	test('wraps the YAML in --- delimiters with a trailing newline', () => {
		const out = formatFrontmatter({ title: 'Hello' });
		expect(out).toBe('---\ntitle: "Hello"\n---\n');
	});

	test('preserves the stable key order: top-level → og → twitter → tail', () => {
		const out = formatFrontmatter({
			lang: 'ja',
			twitter: { card: 'summary' },
			og: { title: 'OG' },
			title: 'T',
			description: 'D',
		});
		expect(out).toBe(
			'---\ntitle: "T"\ndescription: "D"\nog:\n  title: "OG"\ntwitter:\n  card: "summary"\nlang: "ja"\n---\n',
		);
	});

	test('serialises og / twitter as nested maps, not flattened keys', () => {
		const out = formatFrontmatter({
			title: 'T',
			og: { title: 'OG', siteName: 'Example' },
			twitter: { card: 'summary', image: 'https://example.com/img.png' },
		});
		expect(out).toContain('og:\n  title: "OG"\n  siteName: "Example"\n');
		expect(out).toContain(
			'twitter:\n  card: "summary"\n  image: "https://example.com/img.png"\n',
		);
		expect(out).not.toContain('og:title');
		expect(out).not.toContain('twitter:card');
	});

	test('drops empty og / twitter sub-objects entirely', () => {
		const out = formatFrontmatter({
			title: 'T',
			og: {},
			twitter: {},
		});
		expect(out).toBe('---\ntitle: "T"\n---\n');
	});

	test('force-quotes string scalars even for innocuous values', () => {
		const out = formatFrontmatter({ title: 'Plain', lang: 'ja' });
		expect(out).toContain('"Plain"');
		expect(out).toContain('"ja"');
		expect(out).not.toMatch(/title: Plain/);
	});

	test('does not line-wrap long URLs', () => {
		const longUrl = `https://example.com/${'a'.repeat(200)}`;
		const out = formatFrontmatter({ canonical: longUrl });
		expect(out).toContain(`"${longUrl}"`);
		// One line, no folding (`>` or `|`) should appear.
		expect(out).not.toContain('>-');
		expect(out).not.toContain('|-');
	});

	test('emits rawTitle directly after title when both are present', () => {
		const out = formatFrontmatter({
			title: 'ニュース',
			rawTitle: 'ニュース｜製品｜会社',
		});
		expect(out).toBe('---\ntitle: "ニュース"\nrawTitle: "ニュース｜製品｜会社"\n---\n');
	});

	test('handles special characters via js-yaml escaping (no manual escapes)', () => {
		const out = formatFrontmatter({ title: 'Quote "inside" & Tab\there' });
		// js-yaml double-quote rules escape `"` as `\"` and tab as `\t`.
		expect(out).toContain('title: "Quote \\"inside\\" & Tab\\there"');
	});

	test('emits id at the top of the block as a bare integer (not quoted)', () => {
		const out = formatFrontmatter({ id: 42, title: 'T' });
		expect(out).toBe('---\nid: 42\ntitle: "T"\n---\n');
	});

	test('omits id when undefined', () => {
		const out = formatFrontmatter({ title: 'T' });
		expect(out).not.toContain('id:');
	});
});
