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
	return lines.map((line) => line.replaceAll(dir, '<tmpDir>'));
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
		return stdout.split('\n').filter((line) => line.trim() !== '');
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
				return `✔  ++ ${c.path}`;
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

	test('npx --type basercms5', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const actual = await cliTest(dir, 'basercms5');
		expect(normalizePaths(actual, dir)).toMatchSnapshot();
	});

	test('interactive basercms5', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const actual = await interactiveTest(dir, 'basercms5');
		expect(normalizePaths(actual, dir)).toMatchSnapshot();
	});

	describe('kamado.config.jsonc', () => {
		test('basercms4: startPath が "__tmpl/" に設定されている', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms4');
			const content = fs.readFileSync(path.join(dir, 'kamado.config.jsonc'), 'utf8');
			expect(content).toContain('"startPath": "__tmpl/"');
		});

		test('basercms5: startPath が "__tmpl/" に設定されている', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms5');
			const content = fs.readFileSync(path.join(dir, 'kamado.config.jsonc'), 'utf8');
			expect(content).toContain('"startPath": "__tmpl/"');
		});

		test('basercms5: output が "htdocs/webroot" に設定されている', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms5');
			const content = fs.readFileSync(path.join(dir, 'kamado.config.jsonc'), 'utf8');
			expect(content).toContain('"output": "htdocs/webroot"');
		});

		test('static: startPath と webroot の指定がない', async ({ tmpDir, task }) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'static');
			const content = fs.readFileSync(path.join(dir, 'kamado.config.jsonc'), 'utf8');
			expect(content).not.toContain('startPath');
			expect(content).toContain('"output": "htdocs"');
		});
	});

	describe('meta.tsx', () => {
		const metaPath = path.join('__assets', '_libs', 'mixin', 'meta.tsx');
		const metaBasercmsPath = path.join('__assets', '_libs', 'mixin', 'meta-basercms.tsx');

		test('basercms4: meta-basercms を読み込む', async ({ tmpDir, task }) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms4');
			const content = fs.readFileSync(path.join(dir, metaPath), 'utf8');
			expect(content).toContain("import MetaBasercms from './meta-basercms.tsx';");
			expect(content).toContain('<MetaBasercms />');
			expect(fs.existsSync(path.join(dir, metaBasercmsPath))).toBe(true);
		});

		test('static: meta-basercms を読み込まず、ファイルも展開しない', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'static');
			const content = fs.readFileSync(path.join(dir, metaPath), 'utf8');
			expect(content).not.toContain('MetaBasercms');
			expect(fs.existsSync(path.join(dir, metaBasercmsPath))).toBe(false);
		});
	});

	describe('100_sub.tsx', () => {
		const subPath = path.join('__assets', 'htdocs', '__tmpl', '100_sub.tsx');

		test('basercms4: BurgerEditor v2 のブロックを読み込む', async ({ tmpDir, task }) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms4');
			const content = fs.readFileSync(path.join(dir, subPath), 'utf8');
			expect(content).toContain("data['bge-blocks-v2']");
		});

		test('basercms5: BurgerEditor v2 のブロックを読み込む', async ({ tmpDir, task }) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms5');
			const content = fs.readFileSync(path.join(dir, subPath), 'utf8');
			expect(content).toContain("data['bge-blocks-v2']");
		});
	});

	describe('JSX の展開', () => {
		test('dangerouslySetInnerHTML の {{ }} が式として解釈されずに展開される', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'static');
			const content = fs.readFileSync(
				path.join(dir, '__assets', '_libs', 'layouts', 'l-home.tsx'),
				'utf8',
			);
			expect(content).toContain('dangerouslySetInnerHTML={{ __html: content }}');
		});
	});

	describe('package.json', () => {
		test('basercms4: jquery が 3.7.1 に固定されている', async ({ tmpDir, task }) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms4');
			const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
			expect(pkg.dependencies['jquery']).toBe('3.7.1');
		});

		test('static: skills:sync がプロジェクト配下の一時ディレクトリ(.tmp)を使用する', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'static');
			const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
			expect(pkg.scripts['skills:sync']).toContain('TMPDIR=./.tmp');
		});
	});

	describe('flake.nix', () => {
		test('volta の node メジャーバージョンと同じ nixpkgs パッケージを参照している', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'static');
			const scaffoldPkg = JSON.parse(
				fs.readFileSync(
					path.resolve(import.meta.dirname, '../scaffold/package.json'),
					'utf8',
				),
			);
			const nodeMajor = scaffoldPkg.volta.node.split('.')[0];
			const content = fs.readFileSync(path.join(dir, 'flake.nix'), 'utf8');
			expect(content).toContain(`pkgs.nodejs_${nodeMajor}`);
			expect(content).toContain('pkgs.yarn-berry_4');
		});

		test('プロジェクト内の他ファイルを参照しない自己完結した構成になっている', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'static');
			const content = fs.readFileSync(path.join(dir, 'flake.nix'), 'utf8');
			expect(content).not.toMatch(/import\s+\.{1,2}\//);
			expect(content).not.toMatch(/path:\.{1,2}\//);
		});

		test('flake.lock が同時に生成される', async ({ tmpDir, task }) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'static');
			expect(fs.existsSync(path.join(dir, 'flake.lock'))).toBe(true);
		});
	});
});
