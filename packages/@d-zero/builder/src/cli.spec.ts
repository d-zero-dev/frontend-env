import fs from 'node:fs/promises';
import path from 'node:path';

import { execa } from 'execa';
import ignore from 'ignore';
import stripAnsi from 'strip-ansi';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

const scaffoldDir = path.resolve(process.cwd(), 'packages', '@d-zero', 'scaffold');
const publishDir = path.resolve(scaffoldDir, 'htdocs');

/**
 * Cleans up files in publishDir based on .gitignore in scaffoldDir.
 * If .gitignore does not exist (or is empty), all files will be deleted.
 */
async function cleanUp() {
	// Read .gitignore from the root of scaffoldDir
	const gitignorePath = path.join(scaffoldDir, '.gitignore');
	let ig: { ignores: (path: string) => boolean };
	try {
		const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
		ig = ignore().add(gitignoreContent);
	} catch {
		// If .gitignore does not exist, then treat it as if it is empty (delete all files)
		ig = { ignores: () => true };
	}

	/**
	 * Recursively cleans files and directories within the given directory.
	 * @param dir - The target directory path.
	 */
	async function cleanDir(dir: string) {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		await Promise.all(
			entries.map(async (entry) => {
				const fullPath = path.join(dir, entry.name);
				// Evaluate relative path from scaffoldDir
				const relativePath = path.relative(scaffoldDir, fullPath);

				if (ig.ignores(relativePath)) {
					// Delete only if the file or directory is ignored by .gitignore
					if (entry.isDirectory()) {
						await fs.rm(fullPath, { recursive: true, force: true });
					} else {
						await fs.unlink(fullPath);
					}
				} else if (entry.isDirectory()) {
					// Recursively check subdirectories
					await cleanDir(fullPath);
				}
			}),
		);
	}

	// Ignore errors during cleanup
	await cleanDir(publishDir).catch(() => null);
}

beforeAll(cleanUp);
afterAll(cleanUp);

describe('CLI', () => {
	test('dzbuild (no params)', async () => {
		const { stdout } = await execa('npx', ['dzbuild'], {
			cwd: scaffoldDir,
			failed: true,
			env: {
				NODE_NO_WARNINGS: '1',
			},
		});
		expect(
			stripAnsi(stdout)
				// Replace Windows path separator with '/'
				.replaceAll(path.sep, '/')
				// Remove time numbers
				.replaceAll(/\d+(?:\.\d{1,3})?\s*(?:ms|seconds|s)/g, '{time}')
				// Remove version numbers
				.replaceAll(/v\d+\.\d+\.\d+(?:[a-z]+(?:\.[\da-z]+)?)?/gi, '{version}')
				// Remove file sizes
				.replaceAll(/\s*\d+\.\d+\s*(?:kB|MB|GB)/g, ' {size}')
				.split('\n'),
		).toStrictEqual([
			'htdocs/index.html {size} | gzip: {size}',
			'htdocs/__tmpl/index.html {size} | gzip: {size}',
			'htdocs/__tmpl/000_home.html {size} | gzip: {size}',
			'htdocs/__tmpl/100_sub.html {size} | gzip: {size}',
			'htdocs/__tmpl/200_blog_index.html {size} | gzip: {size}',
			'htdocs/__tmpl/210_blog_index.html {size} | gzip: {size}',
			'htdocs/__tmpl/300_form_input.html {size} | gzip: {size}',
			'htdocs/__tmpl/301_form_confirm.html {size} | gzip: {size}',
			'htdocs/__tmpl/302_form_complete.html {size} | gzip: {size}',
			'htdocs/css/bge_style.css {size} | gzip: {size}',
			'htdocs/css/style.css {size} | gzip: {size}',
			'htdocs/js/script.js {size} | gzip: {size}',
			'htdocs/sample/index.html {size} | gzip: {size}',
			'htdocs/sub-folder.test/index.html {size} | gzip: {size}',
			'htdocs/sub-folder.test/build.test.html {size} | gzip: {size}',
			'htdocs/sub-folder.test/css/style.css {size} | gzip: {size}',
			'htdocs/sub-folder.test/js/script.js {size} | gzip: {size}',
			'[11ty] Wrote 17 files in {time} ({time} each, {version})',
			// No output for pathFormat: preserve
		]);
	});
});
