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
		{
			// ファイル名がそのまま出力の URL になるので、命名を変えられない
			files: ['__assets/htdocs/**/*.tsx'],
			rules: {
				'unicorn/filename-case': 'off',
			},
		},
	],
	ignorePatterns: [...(config.ignorePatterns ?? []), 'htdocs/**'],
};
