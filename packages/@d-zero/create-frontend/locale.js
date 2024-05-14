import { I18n } from 'i18n-js/dist/require/index.js';

const i18n = new I18n({
	en: {
		["What's the type of project?"]: "What's the type of project?",
		['Destination path']: 'Destination path',
		['Install dependencies with yarn?']: 'Install dependencies with yarn?',
	},
	ja: {
		["What's the type of project?"]: 'プロジェクトの種類',
		['Destination path']: '出力先パス',
		['Install dependencies with yarn?']: '依存関係をyarnでインストールしますか？',
	},
});

i18n.locale = process.env.LANG?.slice(0, 2) ?? 'en';

export const t = (strings) => i18n.t(strings.raw[0]);
