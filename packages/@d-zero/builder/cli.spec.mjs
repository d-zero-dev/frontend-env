import fs from 'node:fs';
import path from 'node:path';

import { execa } from 'execa';
import stripAnsi from 'strip-ansi';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

const scaffoldDir = path.resolve(process.cwd(), 'packages', '@d-zero', 'scaffold');
const publishDir = path.resolve(scaffoldDir, 'htdocs');

function cleanUp() {
	fs.rmSync(publishDir, { recursive: true, force: true });
}

beforeAll(cleanUp);
afterAll(cleanUp);

describe('CLI', () => {
	test('build (no params)', async ({ tmpDir, task }) => {
		const { stdout } = await execa('build', [], {
			cwd: path.resolve(process.cwd(), 'packages', '@d-zero', 'scaffold'),
			failed: true,
			env: {
				NODE_NO_WARNINGS: '1',
			},
		});
		expect(
			stripAnsi(stdout)
				// Windows path separator
				.replaceAll(path.sep, '/')
				// Remove time
				.replaceAll(/\d+(?:\.\d{1,3})?\s*(?:ms|seconds|s)/g, '{time}')
				// Remove version
				.replaceAll(/v\d+\.\d+\.\d+(?:[a-z]+(?:\.[\da-z]+)?)?/gi, '{version}')
				// Remove size
				.replaceAll(/\s*\d+\.\d{2}\s*(?:kB|MB|GB)/g, ' {size}')
				.split('\n'),
		).toStrictEqual([
			'vite {version} building for production...',
			'transforming...',
			'✓ 15 modules transformed.',
			'rendering chunks...',
			'computing gzip size...',
			'../htdocs/img/bg-arrow.svg {size} │ gzip: {size}',
			'../htdocs/index.html {size} │ gzip: {size}',
			'../htdocs/sub-folder.test/index.html {size} │ gzip: {size}',
			'../htdocs/__tmpl/index.html {size} │ gzip: {size}',
			'../htdocs/__tmpl/000_home/index.html {size} │ gzip: {size}',
			'../htdocs/__tmpl/302_form_complete/index.html {size} │ gzip: {size}',
			'../htdocs/__tmpl/100_sub/index.html {size} │ gzip: {size}',
			'../htdocs/__tmpl/210_blog_index/index.html {size} │ gzip: {size}',
			'../htdocs/__tmpl/200_blog_index/index.html {size} │ gzip: {size}',
			'../htdocs/__tmpl/301_form_confirm/index.html {size} │ gzip: {size}',
			'../htdocs/__tmpl/300_form_input/index.html {size} │ gzip: {size}',
			'../htdocs/css/style.css {size} │ gzip: {size}',
			'../htdocs/js/script.js {size} │ gzip: {size}',
			'../htdocs/::inline-script:: {size} │ gzip: {size}',
			'✓ built in {time}',
			'[11ty] Copied 4 files / Wrote 10 files in {time} ({time} each, {version})',
			'Convert:',
			'From                                | To                            | alias   | minifier',
			'index.html                          | index.html                    | enabled | enabled ',
			'__tmpl/index.html                   | __tmpl/index.html             | enabled | enabled ',
			'__tmpl/000_home/index.html          | __tmpl/000_home.html          | enabled | enabled ',
			'__tmpl/100_sub/index.html           | __tmpl/100_sub.html           | enabled | enabled ',
			'__tmpl/200_blog_index/index.html    | __tmpl/200_blog_index.html    | enabled | enabled ',
			'__tmpl/210_blog_index/index.html    | __tmpl/210_blog_index.html    | enabled | enabled ',
			'__tmpl/300_form_input/index.html    | __tmpl/300_form_input.html    | enabled | enabled ',
			'__tmpl/301_form_confirm/index.html  | __tmpl/301_form_confirm.html  | enabled | enabled ',
			'__tmpl/302_form_complete/index.html | __tmpl/302_form_complete.html | enabled | enabled ',
			'sub-folder.test/index.html          | sub-folder.test/index.html    | enabled | enabled ',
		]);
	});
});
