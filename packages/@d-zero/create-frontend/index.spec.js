import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { execa } from 'execa';
import nodePlop from 'node-plop';
import { describe, test, expect, beforeEach } from 'vitest';

/**
 *
 * @param task
 */
function getName(task) {
	return createHash('sha256').update(`${task.suite.name}_${task.name}`).digest('hex');
}

/**
 * スナップショット比較のため、実行ごとに変わる一時ディレクトリのパスを正規化する
 * @param {string[]} lines
 * @param {string} dir
 */
function normalizePaths(lines, dir) {
	return lines.map((line) => line.replaceAll(dir.replaceAll(path.sep, '/'), '<tmpDir>'));
}

beforeEach((ctx) => {
	ctx.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
});

describe('CLI', () => {
	/**
	 *
	 * @param dir
	 * @param type
	 */
	async function cliTest(dir, type) {
		const { stdout } = await execa(
			'npx',
			[
				'@d-zero/create-frontend',
				...(type ? ['--type', type] : []),
				'--dir',
				dir,
				'--no-install',
				'--silent',
			],
			{
				failed: true,
				env: {
					NODE_NO_WARNINGS: '1',
					NO_COLOR: '1',
					FORCE_COLOR: '0',
				},
			},
		);
		return stdout
			.replaceAll(path.sep, '/')
			.split('\n')
			.filter((line) => line.trim() !== '');
	}

	/**
	 * node-plop APIを使い、CLIを経由せずジェネレーターを直接実行する。
	 * 対話モードでのプロンプト回答をシミュレートしてアクション結果を検証する。
	 * @param dir
	 * @param type
	 */
	async function interactiveTest(dir, type) {
		const plopfilePath = path.resolve(import.meta.dirname, 'plopfile.js');
		const plop = await nodePlop(plopfilePath);
		const generator = plop.getGenerator('basic');

		const { changes, failures } = await generator.runActions({
			'__d-zero_project_type__': type,
			'__d-zero_scaffold_dest__': dir,
			'__d-zero_scaffold_yarn_install__': false,
		});

		if (failures.length > 0) {
			throw new Error(`Actions failed: ${JSON.stringify(failures)}`);
		}

		return changes.map((c) => {
			if (c.type === 'add') {
				return `✔  ++ ${c.path.replaceAll(path.sep, '/')}`;
			}
			return `✔  ${c.type} ${c.path}`;
		});
	}

	test('npx', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const actual = await cliTest(dir);
		expect(normalizePaths(actual, dir)).toMatchSnapshot();
	});

	test('npx --type basercms4', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const actual = await cliTest(dir, 'basercms4');
		expect(normalizePaths(actual, dir)).toMatchSnapshot();
	});

	test('npx --type static', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const actual = await cliTest(dir, 'static');
		expect(normalizePaths(actual, dir)).toMatchSnapshot();
	});

	test('interactive basercms4', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const actual = await interactiveTest(dir, 'basercms4');
		expect(normalizePaths(actual, dir)).toMatchSnapshot();
	});

	describe('kamado.config.ts', () => {
		test('basercms4: startPath が "__tmpl/" に設定されている', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms4');
			const content = fs.readFileSync(path.join(dir, 'kamado.config.ts'), 'utf8');
			expect(content).toContain("startPath: '__tmpl/'");
		});
	});
});
