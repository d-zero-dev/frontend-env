import { spawnSync } from 'node:child_process';
import {
	chmodSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

const script = path.resolve(import.meta.dirname, 'diff-pages.mjs');

/** @type {string} */
let dir;

beforeEach(() => {
	dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'diff-pages-')));
	mkdirSync(path.join(dir, '__assets/htdocs'), { recursive: true });
});

afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
});

/**
 * Writes a page list in the shape `kamado pages` writes. A page is a URL, or a URL and the
 * source file of the page (relative to the project).
 * @param {string} name
 * @param {readonly (string | readonly [string, string])[]} pages
 * @param {readonly string[]} [warnings]
 */
function writePages(name, pages, warnings = []) {
	const list = pages.map((page) => {
		const [url, file] = typeof page === 'string' ? [page, null] : page;
		return {
			url,
			inputPath: file === null ? null : path.join(dir, file),
			virtual: file === null,
			meta: {},
		};
	});
	writeFileSync(path.join(dir, name), JSON.stringify({ version: 1, pages: list, warnings }));
}

/**
 * Writes a source file, with the directories above it.
 * @param {string} file - Relative to the project
 * @param {string} text
 */
function writeSource(file, text) {
	mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
	writeFileSync(path.join(dir, file), text);
}

/**
 * @param {readonly string[]} args
 */
function run(args) {
	const result = spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
	expect(result.error).toBeUndefined();
	return result;
}

/**
 * The lines of a section of the report, without the title.
 * @param {string} stdout
 * @param {string} title - The title up to the count
 * @returns {string[]}
 */
function sectionOf(stdout, title) {
	const lines = stdout.split('\n');
	const start = lines.findIndex((line) => line.startsWith(`${title} (`));
	expect(start).not.toBe(-1);
	const end = lines.findIndex((line, index) => index > start && !line.startsWith('  '));
	return lines.slice(start + 1, end);
}

const LINKS = 'Links to removed URLs';
const MISSING = 'Relative links of moved or new pages to pages that do not exist';
const POSSIBLE = 'Possible links to removed URLs';

const EMPTY_REPORT = [
	'Removed URLs (0):',
	'  (none)',
	'Added URLs (0):',
	'  (none)',
	'Links to removed URLs (0):',
	'  (none)',
	'Relative links of moved or new pages to pages that do not exist (0):',
	'  (none)',
	'Possible links to removed URLs (relative paths in files that are not pages) (0):',
	'  (none)',
	'Warnings of kamado pages (0):',
	'  (none)',
	'',
].join('\n');

describe('the report', () => {
	test('lists nothing and exits 0 when the two lists are the same', () => {
		writePages('before.json', ['/', '/a.html']);
		writePages('after.json', ['/', '/a.html']);
		writeSource('__assets/htdocs/index.tsx', '<a href="/a.html">a</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toBe(EMPTY_REPORT);
		expect(result.stderr).toBe('');
		expect(result.status).toBe(0);
	});

	test('lists the removed and the added URLs in order, and exits 0 when no link is left', () => {
		writePages('before.json', ['/', '/b.html', '/a.html']);
		writePages('after.json', ['/', '/d.html', '/c.html']);
		writeSource('__assets/htdocs/index.tsx', '<a href="/c.html">c</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toBe(
			[
				'Removed URLs (2):',
				'  /a.html',
				'  /b.html',
				'Added URLs (2):',
				'  /c.html',
				'  /d.html',
				'Links to removed URLs (0):',
				'  (none)',
				'Relative links of moved or new pages to pages that do not exist (0):',
				'  (none)',
				'Possible links to removed URLs (relative paths in files that are not pages) (0):',
				'  (none)',
				'Warnings of kamado pages (0):',
				'  (none)',
				'',
			].join('\n'),
		);
		expect(result.status).toBe(0);
	});

	test('shows the file, the line, the link and the source line, and exits 1', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', ['/b.html']);
		writeSource('__assets/_libs/nav.tsx', 'first line\r\n\t<a href="/a.html">a</a>\r\n');

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS)).toStrictEqual([
			'  __assets/_libs/nav.tsx:2: /a.html -> /a.html',
			'    <a href="/a.html">a</a>',
		]);
		expect(result.stdout).toContain('Links to removed URLs (1):');
		expect(result.status).toBe(1);
	});

	test('reports each link of a line that holds two', () => {
		writePages('before.json', ['/a.html', '/b.html']);
		writePages('after.json', []);
		writeSource('__assets/_libs/nav.tsx', '<a href="/a.html">a</a><a href="/b.html">b</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS)).toStrictEqual([
			'  __assets/_libs/nav.tsx:1: /a.html -> /a.html',
			'    <a href="/a.html">a</a><a href="/b.html">b</a>',
			'  __assets/_libs/nav.tsx:1: /b.html -> /b.html',
			'    <a href="/a.html">a</a><a href="/b.html">b</a>',
		]);
	});

	test('cuts a long source line', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', []);
		writeSource('__assets/_libs/min.js', `x="/a.html";${'y'.repeat(300)}\n`);

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS)[1]).toBe(`    x="/a.html";${'y'.repeat(188)}…`);
	});

	test('shows the warnings of the list written after the change, and exits 1', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', ['/a.html'], ['output path conflict: /a.html']);

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, 'Warnings of kamado pages')).toStrictEqual([
			'  output path conflict: /a.html',
		]);
		expect(result.status).toBe(1);
	});
});

describe('an absolute link', () => {
	/**
	 * Runs with `/a/b.html` and `/news/` removed and one line in a component.
	 * @param {string} line
	 * @returns {string[]} The section of the links
	 */
	function linksFor(line) {
		writePages('before.json', ['/a/b.html', '/news/', '/news/2026.html', '/en/news/']);
		writePages('after.json', ['/news/2026.html', '/en/news/']);
		writeSource('__assets/_libs/nav.tsx', `${line}\n`);
		return sectionOf(run(['before.json', 'after.json']).stdout, LINKS);
	}

	test.each([
		['<a href="/a/b.html">', '/a/b.html'],
		['<a href="/a/b.html?x=1">', '/a/b.html?x'],
		['<a href="/a/b.html#top">', '/a/b.html#top'],
		['<a href=/a/b.html', '/a/b.html'],
		['/a/b.html', '/a/b.html'],
		['<link rel="canonical" href="https://example.com/a/b.html">', 'https://example.com/a/b.html'],
		['<a href="//example.com/a/b.html">', '//example.com/a/b.html'],
		['const u = `${base}/a/b.html`;', '/a/b.html'],
		['location.href = "/a/b.html";', '/a/b.html'],
		['url:/a/b.html', 'url:/a/b.html'],
		['items: [/a/b.html]', '/a/b.html'],
		['data-x="{&quot;u&quot;:&quot;/a/b.html&quot;}"', '/a/b.html'],
		['<a href="/a/./b.html">', '/a/./b.html'],
		['<a href="/a/x/../b.html">', '/a/x/../b.html'],
	])('finds %s', (line, token) => {
		expect(linksFor(line)).toStrictEqual([
			`  __assets/_libs/nav.tsx:1: ${token} -> /a/b.html`,
			`    ${line}`,
		]);
	});

	test.each([
		['<a href="/news/">', '/news/'],
		['<a href="/news">', '/news'],
		['<a href="/news/index.html">', '/news/index.html'],
		['<a href="/news/index.html#top">', '/news/index.html#top'],
	])('finds the directory index in %s', (line, token) => {
		expect(linksFor(line)).toStrictEqual([
			`  __assets/_libs/nav.tsx:1: ${token} -> /news/`,
			`    ${line}`,
		]);
	});

	test.each([
		['<a href="/news/2026.html">'],
		['<a href="/en/news/">'],
		['<a href="/a/bXhtml">'],
		['<a href="/a/b.html.bak">'],
		['<a href="/news/index.css">'],
		['<a href="/A/B.html">'],
		['<a href="mailto:a/b.html@example.com">'],
		['</a>'],
		['// a comment'],
	])('does not report %s', (line) => {
		expect(linksFor(line)).toStrictEqual(['  (none)']);
	});

	test('finds a percent-encoded link to a page with a name that is not ASCII', () => {
		writePages('before.json', ['/a/日本.html']);
		writePages('after.json', []);
		writeSource('__assets/_libs/nav.tsx', '<a href="/a/%E6%97%A5%E6%9C%AC.html">\n');

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS)[0]).toBe(
			'  __assets/_libs/nav.tsx:1: /a/%E6%97%A5%E6%9C%AC.html -> /a/日本.html',
		);
	});

	test.each([
		['<a href=/a/b.html>x</a>', '/a/b.html'],
		['<https://example.com/a/b.html>', 'https://example.com/a/b.html'],
		['<a href="/a/index.htm/../b.html">', '/a/index.htm/../b.html'],
	])('finds %s', (line, token) => {
		writePages('before.json', ['/a/b.html']);
		writePages('after.json', []);
		writeSource('__assets/_libs/nav.md', `${line}\n`);

		expect(sectionOf(run(['before.json', 'after.json']).stdout, LINKS)[0]).toBe(
			`  __assets/_libs/nav.md:1: ${token} -> /a/b.html`,
		);
	});

	test('reads /dir/index.htm as the directory', () => {
		writePages('before.json', ['/news/']);
		writePages('after.json', []);
		writeSource('__assets/_libs/nav.tsx', '<a href="/news/index.htm">\n');

		expect(sectionOf(run(['before.json', 'after.json']).stdout, LINKS)[0]).toBe(
			'  __assets/_libs/nav.tsx:1: /news/index.htm -> /news/',
		);
	});

	test('does not find a URL with a bracket in it', () => {
		writePages('before.json', ['/a/b(1)+[x].html']);
		writePages('after.json', []);
		writeSource('__assets/_libs/data/nav.yml', 'url: /a/b(1)+[x].html\n');

		const result = run(['before.json', 'after.json']);

		// The brackets end a token, so the link is not found: the report says nothing.
		expect(sectionOf(result.stdout, LINKS)).toStrictEqual(['  (none)']);
	});

	test('does not search for the removed top page, and says so', () => {
		writePages('before.json', ['/', '/a.html']);
		writePages('after.json', ['/a.html']);
		writeSource('__assets/_libs/nav.tsx', '<a href="/">top</a>\n<br />\n');
		writeSource('__assets/_libs/a.css', 'inline-size: calc(80 / 100 * 100%);\n');

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS)).toStrictEqual(['  (none)']);
		expect(result.stdout.trimEnd().split('\n').at(-1)).toBe(
			'Not searched: / (the top page was removed; check the links to it by hand)',
		);
		expect(result.status).toBe(0);
	});
});

describe('a relative link in a page', () => {
	test('is resolved against the URL of the page', () => {
		writePages('before.json', ['/about/history.html', ['/about/', '__assets/htdocs/about/index.tsx']]);
		writePages('after.json', [['/about/', '__assets/htdocs/about/index.tsx']]);
		writeSource(
			'__assets/htdocs/about/index.tsx',
			['<a href="history.html">1</a>', '<a href="./history.html">2</a>', '<a href="../about/history.html">3</a>'].join('\n'),
		);

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS)).toStrictEqual([
			'  __assets/htdocs/about/index.tsx:1: history.html -> /about/history.html',
			'    <a href="history.html">1</a>',
			'  __assets/htdocs/about/index.tsx:2: ./history.html -> /about/history.html',
			'    <a href="./history.html">2</a>',
			'  __assets/htdocs/about/index.tsx:3: ../about/history.html -> /about/history.html',
			'    <a href="../about/history.html">3</a>',
		]);
		expect(result.status).toBe(1);
	});

	test('finds the relative forms of a link to a removed directory index', () => {
		writePages('before.json', ['/news/', ['/', '__assets/htdocs/index.tsx'], ['/news/a.html', '__assets/htdocs/news/a.tsx']]);
		writePages('after.json', [['/', '__assets/htdocs/index.tsx'], ['/news/a.html', '__assets/htdocs/news/a.tsx']]);
		writeSource('__assets/htdocs/index.tsx', '<a href="news/">1</a>\n<a href="./news">2</a>\n<a href="news/index.html">3</a>\n');
		writeSource('__assets/htdocs/news/a.tsx', '<a href="./">4</a>\n<a href="index.html">5</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS).filter((line) => line.includes(' -> '))).toStrictEqual([
			'  __assets/htdocs/index.tsx:1: news/ -> /news/',
			'  __assets/htdocs/index.tsx:2: ./news -> /news/',
			'  __assets/htdocs/index.tsx:3: news/index.html -> /news/',
			'  __assets/htdocs/news/a.tsx:1: ./ -> /news/',
			'  __assets/htdocs/news/a.tsx:2: index.html -> /news/',
		]);
	});

	test('does not report a link to a page of the same name in another directory', () => {
		writePages('before.json', ['/a/history.html', ['/company/', '__assets/htdocs/company/index.tsx'], '/company/history.html']);
		writePages('after.json', [['/company/', '__assets/htdocs/company/index.tsx'], '/company/history.html']);
		writeSource('__assets/htdocs/company/index.tsx', '<a href="history.html">history</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS)).toStrictEqual(['  (none)']);
		expect(result.status).toBe(0);
	});

	test('does not report a bare word that is the name of a removed directory', () => {
		writePages('before.json', ['/news/', ['/', '__assets/htdocs/index.tsx']]);
		writePages('after.json', [['/', '__assets/htdocs/index.tsx']]);
		writeSource('__assets/htdocs/index.tsx', '<div className="news">news</div>\n');

		const result = run(['before.json', 'after.json']);

		expect(result.status).toBe(0);
	});

	test('does not report a link that is right after the move of both pages', () => {
		writePages('before.json', [['/a/list.html', '__assets/htdocs/a/list.tsx'], ['/a/detail.html', '__assets/htdocs/a/detail.tsx']]);
		writePages('after.json', [['/b/list.html', '__assets/htdocs/b/list.tsx'], ['/b/detail.html', '__assets/htdocs/b/detail.tsx']]);
		writeSource('__assets/htdocs/b/list.tsx', '<a href="detail.html">detail</a>\n');
		writeSource('__assets/htdocs/b/detail.tsx', '<a href="./list.html">list</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toContain('Links to removed URLs (0):');
		expect(result.stdout).toContain(`${MISSING} (0):`);
		expect(result.status).toBe(0);
	});

	test('reports a relative link of a moved page that points next to the old place', () => {
		writePages('before.json', [['/a/list.html', '__assets/htdocs/a/list.tsx'], ['/a/detail.html', '__assets/htdocs/a/detail.tsx']]);
		writePages('after.json', [['/b/list.html', '__assets/htdocs/b/list.tsx'], ['/a/detail.html', '__assets/htdocs/a/detail.tsx']]);
		writeSource('__assets/htdocs/b/list.tsx', '<a href="detail.html">detail</a>\n<img src="pict.png" />\n');
		writeSource('__assets/htdocs/a/detail.tsx', '<a href="nowhere.html">kept as it was</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, MISSING)).toStrictEqual([
			'  __assets/htdocs/b/list.tsx:1: detail.html -> /b/detail.html',
			'    <a href="detail.html">detail</a>',
		]);
		expect(result.status).toBe(1);
	});

	test('does not take the tags and the comments of a moved page for links', () => {
		writePages('before.json', [['/a/list.html', '__assets/htdocs/a/list.tsx']]);
		writePages('after.json', [['/b/list.html', '__assets/htdocs/b/list.tsx']]);
		writeSource(
			'__assets/htdocs/b/list.tsx',
			[
				'/**',
				' * A page.',
				' */',
				'{/* comment */}',
				'<br/>',
				'<CHeader/>',
				'<img src="pict.png"/>',
				'</div>',
				'<style>/* c */</style>',
				'-- ./ --',
			].join('\n'),
		);

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, MISSING)).toStrictEqual([
			'  __assets/htdocs/b/list.tsx:10: ./ -> /b/',
			'    -- ./ --',
		]);
	});

	test('resolves the links of a page that is a symbolic link', () => {
		writePages('before.json', ['/a.html', ['/', '__assets/htdocs/index.tsx']]);
		writePages('after.json', [['/', '__assets/htdocs/index.tsx']]);
		writeSource('real/index.tsx', '<a href="a.html">a</a>\n');
		symlinkSync(path.join(dir, 'real/index.tsx'), path.join(dir, '__assets/htdocs/index.tsx'));

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS)[0]).toBe(
			'  __assets/htdocs/index.tsx:1: a.html -> /a.html',
		);
	});
});

describe('a relative path in a file that is not a page', () => {
	test('is reported as a possible link when a removed URL ends with it', () => {
		writePages('before.json', ['/about/history.html', '/news/', '/about/news/']);
		writePages('after.json', []);
		writeSource(
			'__assets/_libs/component/c-nav.tsx',
			['<a href="history.html">1</a>', '<a href="../about/history.html">2</a>', '<a href="news/">3</a>', '<a href="about/news">4</a>', '<a href="./">5</a>', '<a className="news">6</a>'].join('\n'),
		);

		const result = run(['before.json', 'after.json', '--root', '__assets']);

		expect(sectionOf(result.stdout, POSSIBLE).filter((line) => line.includes(' ~ '))).toStrictEqual([
			'  __assets/_libs/component/c-nav.tsx:1: history.html ~ /about/history.html',
			'  __assets/_libs/component/c-nav.tsx:2: ../about/history.html ~ /about/history.html',
			'  __assets/_libs/component/c-nav.tsx:3: news/ ~ /about/news/',
			'  __assets/_libs/component/c-nav.tsx:3: news/ ~ /news/',
			'  __assets/_libs/component/c-nav.tsx:4: about/news ~ /about/news/',
		]);
		expect(result.stdout).toContain('Links to removed URLs (0):');
		expect(result.status).toBe(1);
	});
});

describe('the files that are searched', () => {
	test.each(['.yml', '.yaml', '.txt', '.htm', '.md', '.cjs', '.jsonc', '.css', '.json', '.HTML'])(
		'reads a %s file',
		(extension) => {
			writePages('before.json', ['/a.html']);
			writePages('after.json', []);
			writeSource(`__assets/_libs/data/nav${extension}`, 'url: /a.html\n');

			const result = run(['before.json', 'after.json']);

			expect(sectionOf(result.stdout, LINKS)[0]).toBe(
				`  __assets/_libs/data/nav${extension}:1: /a.html -> /a.html`,
			);
		},
	);

	test.each(['__assets/img/a.svg', '__assets/node_modules/p/x.js', '__assets/.cache/x.js'])(
		'does not read %s',
		(file) => {
			writePages('before.json', ['/a.html']);
			writePages('after.json', []);
			writeSource(file, '"/a.html"\n');

			const result = run(['before.json', 'after.json']);

			expect(result.stdout).toContain('Links to removed URLs (0):');
			expect(result.status).toBe(0);
		},
	);

	test('reads the files in the order of their names', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', []);
		for (const file of ['__assets/c.tsx', '__assets/a.tsx', '__assets/b/x.tsx']) {
			writeSource(file, '"/a.html"\n');
		}

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS).filter((line) => line.includes(' -> '))).toStrictEqual([
			'  __assets/a.tsx:1: /a.html -> /a.html',
			'  __assets/b/x.tsx:1: /a.html -> /a.html',
			'  __assets/c.tsx:1: /a.html -> /a.html',
		]);
	});

	test('reads a file once when a symbolic link points back into the directory', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', []);
		writeSource('__assets/sub/x.tsx', '"/a.html"\n');
		symlinkSync(path.join(dir, '__assets'), path.join(dir, '__assets/sub/loop'));
		symlinkSync(path.join(dir, 'nowhere'), path.join(dir, '__assets/broken.tsx'));

		const result = run(['before.json', 'after.json']);

		expect(sectionOf(result.stdout, LINKS)).toStrictEqual([
			'  __assets/sub/x.tsx:1: /a.html -> /a.html',
			'    "/a.html"',
		]);
		expect(result.stderr).toBe('');
	});

	test('does not read the two lists when they are in the searched directory', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', []);

		const result = run(['before.json', 'after.json', '--root', '.']);

		expect(sectionOf(result.stdout, LINKS)).toStrictEqual(['  (none)']);
		expect(result.status).toBe(0);
	});

	test('searches the directory given with --root, in either form', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', []);
		writeSource('src/nav.tsx', '<a href="/a.html">a</a>\n');

		expect(sectionOf(run(['before.json', 'after.json', '--root', 'src']).stdout, LINKS)[0]).toBe(
			'  src/nav.tsx:1: /a.html -> /a.html',
		);
		expect(sectionOf(run(['before.json', 'after.json', '--root=src']).stdout, LINKS)[0]).toBe(
			'  src/nav.tsx:1: /a.html -> /a.html',
		);
	});
});

describe('the output of kamado pages', () => {
	const fixture = path.join(import.meta.dirname, 'diff-pages.test.fixture.json');

	/**
	 * Writes the list that `kamado pages` wrote for the scaffold (a copy of the real output,
	 * with the path of the project replaced by `<project>`), with the project of the test.
	 * @param {string} name - The file to write, relative to the project
	 * @param {(url: string) => string} [rename] - Gives a page its URL after a move
	 */
	function writeRealList(name, rename = (url) => url) {
		const list = JSON.parse(readFileSync(fixture, 'utf8').replaceAll('<project>', dir));
		for (const page of list.pages) {
			page.url = rename(page.url);
		}
		writeFileSync(path.join(dir, name), JSON.stringify(list));
	}

	test('has the shape that the script reads', () => {
		const list = JSON.parse(readFileSync(fixture, 'utf8'));

		expect(Object.keys(list)).toStrictEqual(['version', 'pages', 'warnings']);
		expect(list.pages.length).toBeGreaterThan(0);
		for (const page of list.pages) {
			expect(page.url).toMatch(/^\//);
			expect(page.inputPath).toMatch(/^<project>\//);
			expect(page.virtual).toBe(false);
		}
	});

	test('reports no difference between two copies of the list', () => {
		writeRealList('before.json');
		writeRealList('after.json');
		writeSource('__assets/htdocs/__tmpl/index.tsx', '<a href="100_sub.html">sub</a>\n');

		const result = run(['before.json', 'after.json']);

		expect(result.stdout).toBe(EMPTY_REPORT);
		expect(result.status).toBe(0);
	});

	test('finds the link left by the move of a page of the scaffold, then none once it is fixed', () => {
		writeRealList('before.json');
		writeRealList('after.json', (url) =>
			url === '/__tmpl/100_sub.html' ? '/service/detail.html' : url,
		);
		writeSource('__assets/htdocs/__tmpl/index.tsx', '<a href="100_sub.html">sub</a>\n');

		const left = run(['before.json', 'after.json']);

		expect(sectionOf(left.stdout, LINKS)[0]).toBe(
			'  __assets/htdocs/__tmpl/index.tsx:1: 100_sub.html -> /__tmpl/100_sub.html',
		);
		expect(left.status).toBe(1);

		writeSource(
			'__assets/htdocs/__tmpl/index.tsx',
			'<a href="../service/detail.html">sub</a>\n',
		);

		expect(run(['before.json', 'after.json']).status).toBe(0);
	});
});

describe('a wrong argument or file', () => {
	/**
	 * @param {readonly string[]} args
	 * @returns {string} The standard error
	 */
	function failure(args) {
		const result = run(args);
		expect(result.stdout).toBe('');
		expect(result.status).toBe(2);
		return result.stderr;
	}

	test.each(['--help', '-h'])('shows the usage and exits 0 for %s', (option) => {
		const result = run([option]);

		expect(result.stdout).toContain('Usage: node diff-pages.mjs <before.json> <after.json>');
		expect(result.status).toBe(0);
	});

	test('exits 2, not 1, on an error of the script itself', () => {
		// A list whose `warnings` cannot be turned into text makes the script throw.
		writeFileSync(
			path.join(dir, 'before.json'),
			'{"pages":[],"warnings":[{"toString":null,"valueOf":null}]}',
		);
		writePages('after.json', []);

		const stderr = failure(['before.json', 'after.json']);

		expect(stderr).toContain('diff-pages.mjs failed: ');
	});

	test.each([[['before.json']], [['a.json', 'b.json', 'c.json']], [[]]])(
		'shows the usage for %j',
		(args) => {
			expect(failure(args)).toContain('Usage: node diff-pages.mjs <before.json> <after.json>');
		},
	);

	test('names an unknown option', () => {
		expect(failure(['a.json', 'b.json', '--foo'])).toContain('unknown option --foo');
	});

	test.each([[['a.json', 'b.json', '--root']], [['a.json', 'b.json', '--root', '--x']], [['a.json', 'b.json', '--root=']]])(
		'asks for the directory of --root for %j',
		(args) => {
			expect(failure(args)).toContain('--root needs a directory');
		},
	);

	test('names the list that cannot be read, and how to write it', () => {
		writePages('after.json', []);

		const stderr = failure(['missing.json', 'after.json']);

		expect(stderr).toContain('cannot read missing.json');
		expect(stderr).toContain('yarn kamado pages --out missing.json');
	});

	test.each([
		['{oops', 'before.json is not JSON ('],
		['null', 'before.json is not the output of `kamado pages` (no "pages" array)'],
		['{"pages":"x"}', 'before.json is not the output of `kamado pages` (no "pages" array)'],
		['{"pages":[{"url":"/"},{"path":"/a.html"}]}', 'before.json is not the output of `kamado pages` (pages[1] has no "url")'],
		['{"pages":["/a.html"]}', 'before.json is not the output of `kamado pages` (pages[0] has no "url")'],
	])('refuses the list %s', (text, message) => {
		writeFileSync(path.join(dir, 'before.json'), text);
		writePages('after.json', []);

		expect(failure(['before.json', 'after.json'])).toContain(message);
	});

	test('names the directory that cannot be searched, even when no URL was removed', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', ['/a.html']);

		expect(failure(['before.json', 'after.json', '--root', 'nowhere'])).toContain(
			'cannot search nowhere',
		);
	});

	test.skipIf(process.getuid?.() === 0)('names the source file that cannot be read', () => {
		writePages('before.json', ['/a.html']);
		writePages('after.json', []);
		writeSource('__assets/x.tsx', '"/a.html"\n');
		chmodSync(path.join(dir, '__assets/x.tsx'), 0o000);

		expect(failure(['before.json', 'after.json'])).toContain('cannot read __assets/x.tsx');
	});
});
