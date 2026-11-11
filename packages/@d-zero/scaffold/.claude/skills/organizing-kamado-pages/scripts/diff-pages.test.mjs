import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

const script = path.resolve(import.meta.dirname, 'diff-pages.mjs');

/** @type {string} */
let dir;

beforeEach(() => {
	dir = mkdtempSync(path.join(tmpdir(), 'diff-pages-'));
	mkdirSync(path.join(dir, '__assets/htdocs'), { recursive: true });
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

/**
 * Writes a page list in the shape `kamado pages` writes.
 * @param {string} name
 * @param {readonly string[]} urls
 */
function writePages(name, urls) {
	const pages = urls.map((url) => ({ url, virtual: false, meta: {} }));
	writeFileSync(path.join(dir, name), JSON.stringify({ version: 1, pages, warnings: [] }));
}

/**
 * @param {readonly string[]} args
 */
function run(args) {
	return spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
}

describe('diff-pages.mjs', () => {
	test('reports added and removed URLs, and exits 0 when nothing refers to a removed URL', () => {
		writePages('before.json', ['/', '/a.html']);
		writePages('after.json', ['/', '/b.html']);
		writeFileSync(path.join(dir, '__assets/htdocs/index.tsx'), '<a href="/b.html">b</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toBe(
			[
				'Removed URLs (1):',
				'  /a.html',
				'Added URLs (1):',
				'  /b.html',
				'References to removed URLs (0):',
				'  (none)',
				'',
			].join('\n'),
		);
		expect(result.status).toBe(0);
	});

	test('lists the file and the line of an absolute link to a removed URL, and exits 1', () => {
		writePages('before.json', ['/', '/a.html']);
		writePages('after.json', ['/', '/b.html']);
		writeFileSync(
			path.join(dir, '__assets/htdocs/index.tsx'),
			'first line\n<a href="/a.html">a</a>\n',
		);

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toContain(
			[
				'References to removed URLs (1):',
				'  __assets/htdocs/index.tsx:2: /a.html',
				'    <a href="/a.html">a</a>',
			].join('\n'),
		);
		expect(result.status).toBe(1);
	});

	test('finds a relative link to the file name of a removed page', () => {
		writePages('before.json', ['/__tmpl/100_sub.html']);
		writePages('after.json', ['/service/detail.html']);
		mkdirSync(path.join(dir, '__assets/htdocs/__tmpl'), { recursive: true });
		writeFileSync(
			path.join(dir, '__assets/htdocs/__tmpl/index.tsx'),
			'<a href="100_sub.html">sub</a>\n',
		);

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toContain(
			'  __assets/htdocs/__tmpl/index.tsx:1: /__tmpl/100_sub.html',
		);
		expect(result.status).toBe(1);
	});

	test('finds links to a removed directory index, with and without index.html', () => {
		writePages('before.json', ['/news/']);
		writePages('after.json', ['/topics/']);
		writeFileSync(
			path.join(dir, '__assets/htdocs/index.tsx'),
			'<a href="/news/">1</a>\n<a href="/news/index.html#top">2</a>\n',
		);

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toContain('  __assets/htdocs/index.tsx:1: /news/');
		expect(result.stdout).toContain('  __assets/htdocs/index.tsx:2: /news/');
		expect(result.status).toBe(1);
	});

	test('does not report a longer URL that only starts with the removed URL', () => {
		writePages('before.json', ['/news/', '/news/2026.html']);
		writePages('after.json', ['/news/2026.html']);
		writeFileSync(
			path.join(dir, '__assets/htdocs/index.tsx'),
			'<a href="/news/2026.html">2026</a>\n',
		);

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toContain('References to removed URLs (0):');
		expect(result.status).toBe(0);
	});

	test('does not search for the root URL, and says so', () => {
		writePages('before.json', ['/', '/a.html']);
		writePages('after.json', ['/a.html']);
		writeFileSync(path.join(dir, '__assets/htdocs/a.tsx'), '<a href="/">top</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toContain('References to removed URLs (0):');
		expect(result.stdout).toContain(
			'Not searched: / (every link starts with it; check links to the top page by hand)',
		);
		expect(result.status).toBe(0);
	});

	test('searches the directory given with --root', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', []);
		mkdirSync(path.join(dir, 'src'));
		writeFileSync(path.join(dir, 'src/nav.tsx'), '<a href="/a.html">a</a>\n');

		const result = run(['before.json', 'after.json', '--root', 'src']);

		expect(result.stdout).toContain('  src/nav.tsx:1: /a.html');
		expect(result.status).toBe(1);
	});

	test('exits 2 and shows the usage when a file is not given', () => {
		const result = run(['before.json']);

		expect(result.stderr).toContain('Usage: node diff-pages.mjs <before.json> <after.json>');
		expect(result.status).toBe(2);
	});

	test('exits 2 and names the file that cannot be read', () => {
		writePages('after.json', []);

		const result = run(['missing.json', 'after.json']);

		expect(result.stderr).toContain('cannot read missing.json');
		expect(result.stderr).toContain('yarn pages --out missing.json');
		expect(result.status).toBe(2);
	});

	test('exits 2 when a file is not a page list of kamado pages', () => {
		writeFileSync(path.join(dir, 'before.json'), '{"pages":"x"}');
		writePages('after.json', []);

		const result = run(['before.json', 'after.json']);

		expect(result.stderr).toContain(
			'before.json is not the output of `kamado pages` (no "pages" array)',
		);
		expect(result.status).toBe(2);
	});

	test('exits 2 when the directory to search does not exist', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', []);

		const result = run(['before.json', 'after.json', '--root', 'nowhere']);

		expect(result.stderr).toContain('cannot search nowhere');
		expect(result.status).toBe(2);
	});
});
