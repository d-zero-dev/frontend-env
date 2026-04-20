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
 * basercms4の場合期待されるファイル一覧
 * @param {string} dir
 */
function expectedBasercms4(dir) {
	return [
		`✔  ++ ${dir}/.claude/commands/debug-diff.md`,
		`✔  ++ ${dir}/.claude/commands/fix-component.md`,
		`✔  ++ ${dir}/.claude/commands/git.md`,
		`✔  ++ ${dir}/.claude/commands/release.md`,
		`✔  ++ ${dir}/.claude/settings.json`,
		`✔  ++ ${dir}/.cursor/mcp.json`,
		`✔  ++ ${dir}/.editorconfig`,
		`✔  ++ ${dir}/.gitignore`,
		`✔  ++ ${dir}/.husky/pre-commit`,
		`✔  ++ ${dir}/.mcp.json`,
		`✔  ++ ${dir}/.npmignore`,
		`✔  ++ ${dir}/.postcssrc.js`,
		`✔  ++ ${dir}/.prettierrc.mjs`,
		`✔  ++ ${dir}/.pug-lintrc`,
		`✔  ++ ${dir}/.stylelintrc`,
		`✔  ++ ${dir}/.textlintignore`,
		`✔  ++ ${dir}/.textlintrc.js`,
		`✔  ++ ${dir}/.vscode/extensions.json`,
		`✔  ++ ${dir}/.vscode/settings.json`,
		`✔  ++ ${dir}/.yarnrc.yml`,
		`✔  ++ ${dir}/CHANGELOG.md`,
		`✔  ++ ${dir}/CLAUDE.md`,
		`✔  ++ ${dir}/README.md`,
		`✔  ++ ${dir}/__assets/_libs/.markuplintrc`,
		`✔  ++ ${dir}/__assets/_libs/component/c-card-list.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-card.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-card.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/c-categories.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-categories.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/c-content-main.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-footer.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-footer.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/c-header.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-header.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/c-media-list.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-media.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-media.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/c-nav-breadcrumb.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-nav-breadcrumb.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/c-nav-global.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-nav-global.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/c-nav-sitemap.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-nav-sitemap.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/c-pagination.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-pagination.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/c-title-page.css`,
		`✔  ++ ${dir}/__assets/_libs/component/c-title-page.pug`,
		`✔  ++ ${dir}/__assets/_libs/component/l-home.css`,
		`✔  ++ ${dir}/__assets/_libs/component/l-sub.css`,
		`✔  ++ ${dir}/__assets/_libs/component/p-blog-index.css`,
		`✔  ++ ${dir}/__assets/_libs/component/p-form.css`,
		`✔  ++ ${dir}/__assets/_libs/component/p-home.css`,
		`✔  ++ ${dir}/__assets/_libs/component/p-sub-default.css`,
		`✔  ++ ${dir}/__assets/_libs/data/.markuplintrc`,
		`✔  ++ ${dir}/__assets/_libs/data/bge-blocks-v2.html`,
		`✔  ++ ${dir}/__assets/_libs/data/bge-blocks.html`,
		`✔  ++ ${dir}/__assets/_libs/data/blocks.js`,
		`✔  ++ ${dir}/__assets/_libs/data/data.yml`,
		`✔  ++ ${dir}/__assets/_libs/img/bg-arrow.svg`,
		`✔  ++ ${dir}/__assets/_libs/img/bg-repeat-01.gif`,
		`✔  ++ ${dir}/__assets/_libs/layouts/home.pug`,
		`✔  ++ ${dir}/__assets/_libs/layouts/sub.pug`,
		`✔  ++ ${dir}/__assets/_libs/mixin/meta-basercms.pug`,
		`✔  ++ ${dir}/__assets/_libs/mixin/meta.pug`,
		`✔  ++ ${dir}/__assets/_libs/script/index.ts`,
		`✔  ++ ${dir}/__assets/_libs/style/base/root.css`,
		`✔  ++ ${dir}/__assets/_libs/style/general/all.css`,
		`✔  ++ ${dir}/__assets/_libs/style/general/body.css`,
		`✔  ++ ${dir}/__assets/_libs/style/general/button.css`,
		`✔  ++ ${dir}/__assets/_libs/style/general/img.css`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/.markuplintrc`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/000_home.json`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/000_home.pug`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/100_sub.json`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/100_sub.pug`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/200_blog_index.json`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/200_blog_index.pug`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/210_blog_index.json`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/210_blog_index.pug`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/300_form_input.json`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/300_form_input.pug`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/301_form_confirm.json`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/301_form_confirm.pug`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/302_form_complete.json`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/302_form_complete.pug`,
		`✔  ++ ${dir}/__assets/htdocs/__tmpl/index.pug`,
		`✔  ++ ${dir}/__assets/htdocs/css/bge_style.css`,
		`✔  ++ ${dir}/__assets/htdocs/css/style.css`,
		`✔  ++ ${dir}/__assets/htdocs/js/script.ts`,
		`✔  ++ ${dir}/__assets/htdocs/sample/index.html`,
		`✔  ++ ${dir}/__info/print.txt`,
		`✔  ++ ${dir}/burgereditor.config.js`,
		`✔  ++ ${dir}/cspell.json`,
		`✔  ++ ${dir}/eslint.config.js`,
		`✔  ++ ${dir}/htdocs/__tmpl/__burger_editor/img/bg-sample.png`,
		`✔  ++ ${dir}/htdocs/__tmpl/__burger_editor/js/bge_modules/bge_functions.min.js`,
		`✔  ++ ${dir}/htdocs/files/images/sample.png`,
		`✔  ++ ${dir}/kamado.config.ts`,
		`✔  ++ ${dir}/lint-staged.config.mjs`,
		`✔  ++ ${dir}/markuplint.config.js`,
		`✔  ++ ${dir}/package.json`,
		`✔  ++ ${dir}/prh.yaml`,
		`✔  ++ ${dir}/tsconfig.json`,
		'✔  Install dependencies skipped',
		'✔  Finalize finalized',
	];
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
		expect(actual).toStrictEqual([
			`✔  ++ ${dir}/.claude/commands/debug-diff.md`,
			`✔  ++ ${dir}/.claude/commands/fix-component.md`,
			`✔  ++ ${dir}/.claude/commands/git.md`,
			`✔  ++ ${dir}/.claude/commands/release.md`,
			`✔  ++ ${dir}/.claude/settings.json`,
			`✔  ++ ${dir}/.cursor/mcp.json`,
			`✔  ++ ${dir}/.editorconfig`,
			`✔  ++ ${dir}/.gitignore`,
			`✔  ++ ${dir}/.husky/pre-commit`,
			`✔  ++ ${dir}/.mcp.json`,
			`✔  ++ ${dir}/.npmignore`,
			`✔  ++ ${dir}/.postcssrc.js`,
			`✔  ++ ${dir}/.prettierrc.mjs`,
			`✔  ++ ${dir}/.pug-lintrc`,
			`✔  ++ ${dir}/.stylelintrc`,
			`✔  ++ ${dir}/.textlintignore`,
			`✔  ++ ${dir}/.textlintrc.js`,
			`✔  ++ ${dir}/.vscode/extensions.json`,
			`✔  ++ ${dir}/.vscode/settings.json`,
			`✔  ++ ${dir}/.yarnrc.yml`,
			`✔  ++ ${dir}/CHANGELOG.md`,
			`✔  ++ ${dir}/CLAUDE.md`,
			`✔  ++ ${dir}/README.md`,
			`✔  ++ ${dir}/__assets/_libs/.markuplintrc`,
			`✔  ++ ${dir}/__assets/_libs/component/c-card-list.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-card.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-card.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-categories.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-categories.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-content-main.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-footer.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-footer.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-header.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-header.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-media-list.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-media.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-media.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-breadcrumb.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-breadcrumb.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-global.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-global.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-sitemap.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-sitemap.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-pagination.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-pagination.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-title-page.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-title-page.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/l-home.css`,
			`✔  ++ ${dir}/__assets/_libs/component/l-sub.css`,
			`✔  ++ ${dir}/__assets/_libs/component/p-blog-index.css`,
			`✔  ++ ${dir}/__assets/_libs/component/p-form.css`,
			`✔  ++ ${dir}/__assets/_libs/component/p-home.css`,
			`✔  ++ ${dir}/__assets/_libs/component/p-sub-default.css`,
			`✔  ++ ${dir}/__assets/_libs/data/.markuplintrc`,
			`✔  ++ ${dir}/__assets/_libs/data/bge-blocks-v2.html`,
			`✔  ++ ${dir}/__assets/_libs/data/bge-blocks.html`,
			`✔  ++ ${dir}/__assets/_libs/data/blocks.js`,
			`✔  ++ ${dir}/__assets/_libs/data/data.yml`,
			`✔  ++ ${dir}/__assets/_libs/img/bg-arrow.svg`,
			`✔  ++ ${dir}/__assets/_libs/img/bg-repeat-01.gif`,
			`✔  ++ ${dir}/__assets/_libs/layouts/home.pug`,
			`✔  ++ ${dir}/__assets/_libs/layouts/sub.pug`,
			`✔  ++ ${dir}/__assets/_libs/mixin/meta-basercms.pug`,
			`✔  ++ ${dir}/__assets/_libs/mixin/meta.pug`,
			`✔  ++ ${dir}/__assets/_libs/script/index.ts`,
			`✔  ++ ${dir}/__assets/_libs/style/base/root.css`,
			`✔  ++ ${dir}/__assets/_libs/style/general/all.css`,
			`✔  ++ ${dir}/__assets/_libs/style/general/body.css`,
			`✔  ++ ${dir}/__assets/_libs/style/general/button.css`,
			`✔  ++ ${dir}/__assets/_libs/style/general/img.css`,
			`✔  ++ ${dir}/__assets/htdocs/css/style.css`,
			`✔  ++ ${dir}/__assets/htdocs/index.json`,
			`✔  ++ ${dir}/__assets/htdocs/index.pug`,
			`✔  ++ ${dir}/__assets/htdocs/js/script.ts`,
			`✔  ++ ${dir}/__assets/htdocs/sample/index.html`,
			`✔  ++ ${dir}/__info/print.txt`,
			`✔  ++ ${dir}/burgereditor.config.js`,
			`✔  ++ ${dir}/cspell.json`,
			`✔  ++ ${dir}/eslint.config.js`,
			`✔  ++ ${dir}/htdocs/files/images/sample.png`,
			`✔  ++ ${dir}/kamado.config.ts`,
			`✔  ++ ${dir}/lint-staged.config.mjs`,
			`✔  ++ ${dir}/markuplint.config.js`,
			`✔  ++ ${dir}/package.json`,
			`✔  ++ ${dir}/prh.yaml`,
			`✔  ++ ${dir}/tsconfig.json`,
			'✔  Install dependencies skipped',
			'✔  Finalize finalized',
		]);
	});

	test('npx --type basercms4', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const actual = await cliTest(dir, 'basercms4');
		expect(actual).toStrictEqual(expectedBasercms4(dir));
	});

	test('npx --type static', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const actual = await cliTest(dir, 'static');
		expect(actual).toStrictEqual([
			`✔  ++ ${dir}/.claude/commands/debug-diff.md`,
			`✔  ++ ${dir}/.claude/commands/fix-component.md`,
			`✔  ++ ${dir}/.claude/commands/git.md`,
			`✔  ++ ${dir}/.claude/commands/release.md`,
			`✔  ++ ${dir}/.claude/settings.json`,
			`✔  ++ ${dir}/.cursor/mcp.json`,
			`✔  ++ ${dir}/.editorconfig`,
			`✔  ++ ${dir}/.gitignore`,
			`✔  ++ ${dir}/.husky/pre-commit`,
			`✔  ++ ${dir}/.mcp.json`,
			`✔  ++ ${dir}/.npmignore`,
			`✔  ++ ${dir}/.postcssrc.js`,
			`✔  ++ ${dir}/.prettierrc.mjs`,
			`✔  ++ ${dir}/.pug-lintrc`,
			`✔  ++ ${dir}/.stylelintrc`,
			`✔  ++ ${dir}/.textlintignore`,
			`✔  ++ ${dir}/.textlintrc.js`,
			`✔  ++ ${dir}/.vscode/extensions.json`,
			`✔  ++ ${dir}/.vscode/settings.json`,
			`✔  ++ ${dir}/.yarnrc.yml`,
			`✔  ++ ${dir}/CHANGELOG.md`,
			`✔  ++ ${dir}/CLAUDE.md`,
			`✔  ++ ${dir}/README.md`,
			`✔  ++ ${dir}/__assets/_libs/.markuplintrc`,
			`✔  ++ ${dir}/__assets/_libs/component/c-card-list.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-card.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-card.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-categories.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-categories.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-content-main.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-footer.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-footer.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-header.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-header.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-media-list.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-media.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-media.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-breadcrumb.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-breadcrumb.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-global.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-global.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-sitemap.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-sitemap.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-pagination.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-pagination.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-title-page.css`,
			`✔  ++ ${dir}/__assets/_libs/component/c-title-page.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/l-home.css`,
			`✔  ++ ${dir}/__assets/_libs/component/l-sub.css`,
			`✔  ++ ${dir}/__assets/_libs/component/p-blog-index.css`,
			`✔  ++ ${dir}/__assets/_libs/component/p-form.css`,
			`✔  ++ ${dir}/__assets/_libs/component/p-home.css`,
			`✔  ++ ${dir}/__assets/_libs/component/p-sub-default.css`,
			`✔  ++ ${dir}/__assets/_libs/data/.markuplintrc`,
			`✔  ++ ${dir}/__assets/_libs/data/bge-blocks-v2.html`,
			`✔  ++ ${dir}/__assets/_libs/data/bge-blocks.html`,
			`✔  ++ ${dir}/__assets/_libs/data/blocks.js`,
			`✔  ++ ${dir}/__assets/_libs/data/data.yml`,
			`✔  ++ ${dir}/__assets/_libs/img/bg-arrow.svg`,
			`✔  ++ ${dir}/__assets/_libs/img/bg-repeat-01.gif`,
			`✔  ++ ${dir}/__assets/_libs/layouts/home.pug`,
			`✔  ++ ${dir}/__assets/_libs/layouts/sub.pug`,
			`✔  ++ ${dir}/__assets/_libs/mixin/meta-basercms.pug`,
			`✔  ++ ${dir}/__assets/_libs/mixin/meta.pug`,
			`✔  ++ ${dir}/__assets/_libs/script/index.ts`,
			`✔  ++ ${dir}/__assets/_libs/style/base/root.css`,
			`✔  ++ ${dir}/__assets/_libs/style/general/all.css`,
			`✔  ++ ${dir}/__assets/_libs/style/general/body.css`,
			`✔  ++ ${dir}/__assets/_libs/style/general/button.css`,
			`✔  ++ ${dir}/__assets/_libs/style/general/img.css`,
			`✔  ++ ${dir}/__assets/htdocs/css/style.css`,
			`✔  ++ ${dir}/__assets/htdocs/index.json`,
			`✔  ++ ${dir}/__assets/htdocs/index.pug`,
			`✔  ++ ${dir}/__assets/htdocs/js/script.ts`,
			`✔  ++ ${dir}/__assets/htdocs/sample/index.html`,
			`✔  ++ ${dir}/__info/print.txt`,
			`✔  ++ ${dir}/burgereditor.config.js`,
			`✔  ++ ${dir}/cspell.json`,
			`✔  ++ ${dir}/eslint.config.js`,
			`✔  ++ ${dir}/htdocs/files/images/sample.png`,
			`✔  ++ ${dir}/kamado.config.ts`,
			`✔  ++ ${dir}/lint-staged.config.mjs`,
			`✔  ++ ${dir}/markuplint.config.js`,
			`✔  ++ ${dir}/package.json`,
			`✔  ++ ${dir}/prh.yaml`,
			`✔  ++ ${dir}/tsconfig.json`,
			'✔  Install dependencies skipped',
			'✔  Finalize finalized',
		]);
	});

	test('interactive basercms4', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const actual = await interactiveTest(dir, 'basercms4');
		expect(actual).toStrictEqual(expectedBasercms4(dir));
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
