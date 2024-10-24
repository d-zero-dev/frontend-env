import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { execa } from 'execa';
import { describe, test, expect, beforeEach } from 'vitest';

function getName(task) {
	return encodeURIComponent(`${task.suite.name}_${task.name}`.toLowerCase());
}

beforeEach((ctx) => {
	ctx.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
});

describe('CLI', () => {
	test('npx', async ({ tmpDir, task }) => {
		const dir = path.join(tmpDir, getName(task));
		const { stdout } = await execa(
			'npx',
			[
				'@d-zero/create-frontend',
				'--type',
				'burger',
				'--dir',
				dir,
				'--no-install',
				'--silent',
			],
			{
				failed: true,
				env: {
					NODE_NO_WARNINGS: '1',
				},
			},
		);
		expect(stdout.replaceAll(path.sep, '/').split('\n')).toStrictEqual([
			`✔  ++ ${dir}/tsconfig.json`,
			`✔  ++ ${dir}/prh.yaml`,
			`✔  ++ ${dir}/package.json`,
			`✔  ++ ${dir}/lint-staged.config.mjs`,
			`✔  ++ ${dir}/eleventy.config.mjs`,
			`✔  ++ ${dir}/cspell.json`,
			`✔  ++ ${dir}/README.md`,
			`✔  ++ ${dir}/CHANGELOG.md`,
			`✔  ++ ${dir}/.textlintrc.js`,
			`✔  ++ ${dir}/.textlintignore`,
			`✔  ++ ${dir}/.stylelintrc`,
			`✔  ++ ${dir}/.pug-lintrc`,
			`✔  ++ ${dir}/.prettierrc.mjs`,
			`✔  ++ ${dir}/.postcssrc.js`,
			`✔  ++ ${dir}/.npmignore`,
			`✔  ++ ${dir}/.markuplintrc`,
			`✔  ++ ${dir}/.gitignore`,
			`✔  ++ ${dir}/.eslintrc.cjs`,
			`✔  ++ ${dir}/.editorconfig`,
			`✔  ++ ${dir}/__assets/htdocs/index.pug`,
			`✔  ++ ${dir}/__assets/htdocs/.eslintrc`,
			`✔  ++ ${dir}/__assets/htdocs/js/script.ts`,
			`✔  ++ ${dir}/__assets/htdocs/css/style.scss`,
			`✔  ++ ${dir}/__assets/htdocs/__tmpl/index.pug`,
			`✔  ++ ${dir}/__assets/htdocs/__tmpl/302_form_complete.pug`,
			`✔  ++ ${dir}/__assets/htdocs/__tmpl/301_form_confirm.pug`,
			`✔  ++ ${dir}/__assets/htdocs/__tmpl/300_form_input.pug`,
			`✔  ++ ${dir}/__assets/htdocs/__tmpl/210_blog_index.pug`,
			`✔  ++ ${dir}/__assets/htdocs/__tmpl/200_blog_index.pug`,
			`✔  ++ ${dir}/__assets/htdocs/__tmpl/100_sub.pug`,
			`✔  ++ ${dir}/__assets/htdocs/__tmpl/000_home.pug`,
			`✔  ++ ${dir}/__assets/htdocs/__tmpl/.markuplintrc`,
			`✔  ++ ${dir}/__assets/_libs/.markuplintrc`,
			`✔  ++ ${dir}/__assets/_libs/style/theme/index.scss`,
			`✔  ++ ${dir}/__assets/_libs/style/theme/font.scss`,
			`✔  ++ ${dir}/__assets/_libs/style/theme/dimension.scss`,
			`✔  ++ ${dir}/__assets/_libs/style/theme/color.scss`,
			`✔  ++ ${dir}/__assets/_libs/style/general/img.scss`,
			`✔  ++ ${dir}/__assets/_libs/style/general/button.scss`,
			`✔  ++ ${dir}/__assets/_libs/style/general/body.scss`,
			`✔  ++ ${dir}/__assets/_libs/style/general/all.scss`,
			`✔  ++ ${dir}/__assets/_libs/style/base/root.scss`,
			`✔  ++ ${dir}/__assets/_libs/script/index.ts`,
			`✔  ++ ${dir}/__assets/_libs/mixin/meta.pug`,
			`✔  ++ ${dir}/__assets/_libs/img/bg-repeat-01.gif`,
			`✔  ++ ${dir}/__assets/_libs/img/bg-arrow.svg`,
			`✔  ++ ${dir}/__assets/_libs/data/data.yml`,
			`✔  ++ ${dir}/__assets/_libs/data/blocks.html`,
			`✔  ++ ${dir}/__assets/_libs/data/blocks.cjs`,
			`✔  ++ ${dir}/__assets/_libs/data/blocks-burger.html`,
			`✔  ++ ${dir}/__assets/_libs/data/.markuplintrc`,
			`✔  ++ ${dir}/__assets/_libs/component/c-title-page.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-title-page.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-pagination.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-pagination.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-page-sub.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-page-home.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-sitemap.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-sitemap.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-global.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-global.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-breadcrumb.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-nav-breadcrumb.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-media.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-media.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-media-list.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-header.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-header.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-footer.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-footer.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-content-main.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-content-index.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-card.scss`,
			`✔  ++ ${dir}/__assets/_libs/component/c-card.pug`,
			`✔  ++ ${dir}/__assets/_libs/component/c-card-list.scss`,
			`✔  ++ ${dir}/.vscode/settings.json`,
			`✔  ++ ${dir}/.vscode/extensions.json`,
			`✔  ++ ${dir}/.husky/pre-commit`,
			'✔  Install dependencies : skipped',
		]);
	});
});
