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

		test('basercms5: startPath が "__tmpl/" に設定されている', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms5');
			const content = fs.readFileSync(path.join(dir, 'kamado.config.ts'), 'utf8');
			expect(content).toContain("startPath: '__tmpl/'");
		});

		test('basercms5: output が "htdocs/webroot" に設定されている', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'basercms5');
			const content = fs.readFileSync(path.join(dir, 'kamado.config.ts'), 'utf8');
			expect(content).toContain("path.resolve(import.meta.dirname, 'htdocs', 'webroot')");
		});
	});

	describe('package.json', () => {
		test.for(['basercms4', 'basercms5'])(
			'%s: BurgerEditor の css/runtime が create-frontend の devDependencies（v3 系）と一致し、jquery/jquery-colorbox を含まない',
			async (type, { tmpDir, task }) => {
				const dir = path.join(tmpDir, getName(task));
				await interactiveTest(dir, type);
				const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
				const selfPkg = JSON.parse(
					fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'),
				);
				for (const name of ['@burger-editor/css', '@burger-editor/runtime']) {
					expect(selfPkg.devDependencies[name]).toMatch(/^3\.\d+\.\d+$/);
					expect(pkg.dependencies[name]).toBe(selfPkg.devDependencies[name]);
				}
				expect(pkg.dependencies).not.toHaveProperty('jquery');
				expect(pkg.dependencies).not.toHaveProperty('jquery-colorbox');
				expect(pkg.devDependencies).not.toHaveProperty('@burger-editor/local');
			},
		);

		test('static: BurgerEditor の runtime を依存に追加しない', async ({
			tmpDir,
			task,
		}) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'static');
			const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
			expect(pkg.dependencies).not.toHaveProperty('@burger-editor/runtime');
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

	describe('BurgerEditor runtime', () => {
		test.for([
			['basercms4', 'htdocs/__tmpl/__burger_editor'],
			['basercms5', 'htdocs/webroot/__tmpl/__burger_editor'],
		])(
			'%s: script.ts で runtime を import し、__tmpl に bge_functions.min.js を置かない',
			async ([type, bgeDir], { tmpDir, task }) => {
				const dir = path.join(tmpDir, getName(task));
				await interactiveTest(dir, type);
				const script = fs.readFileSync(
					path.join(dir, '__assets/htdocs/js/script.ts'),
					'utf8',
				);
				expect(script.split('\n')[0]).toBe("import '@burger-editor/runtime';");
				expect(
					fs.existsSync(path.join(dir, bgeDir, 'js/bge_modules/bge_functions.min.js')),
				).toBe(false);
			},
		);

		test.for(['basercms4', 'basercms5'])(
			'%s: meta-basercms.pug が bge_functions.min.js・colorbox・jQuery を読み込まない',
			async (type, { tmpDir, task }) => {
				const dir = path.join(tmpDir, getName(task));
				await interactiveTest(dir, type);
				const pug = fs.readFileSync(
					path.join(dir, '__assets/_libs/mixin/meta-basercms.pug'),
					'utf8',
				);
				expect(pug).not.toContain('bge_functions.min.js');
				expect(pug).not.toContain('colorbox');
				expect(pug).not.toContain('jquery');
			},
		);

		test('static: script.ts で runtime を import しない', async ({ tmpDir, task }) => {
			const dir = path.join(tmpDir, getName(task));
			await interactiveTest(dir, 'static');
			const script = fs.readFileSync(
				path.join(dir, '__assets/htdocs/js/script.ts'),
				'utf8',
			);
			expect(script).not.toContain('@burger-editor/runtime');
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
