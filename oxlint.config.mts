import config from '@d-zero/oxlint-config';

export default {
	...config,
	jsPlugins: ['@d-zero/oxlint-plugin'],
	rules: {
		...config.rules,
		'@d-zero/no-click-event': 'warn',
	},
	overrides: [
		{
			// textlint の設定ファイルは CommonJS でしか読み込めない
			files: ['**/.textlintrc.js'],
			rules: {
				'typescript/no-require-imports': 'off',
				'typescript/no-var-requires': 'off',
				'unicorn/prefer-module': 'off',
			},
		},
	],
	ignorePatterns: [
		...(config.ignorePatterns ?? []),
		'**/dist/**',
		'**/storybook-static/**',
		// Claude Code の運用スクリプトと worktree はプロダクトコードではない
		'.claude/**',
		'packages/@d-zero/scaffold/htdocs/**',
	],
};
