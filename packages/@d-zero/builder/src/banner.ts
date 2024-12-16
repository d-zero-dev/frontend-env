import type { CreateBanner } from './types.js';

import dayjs from 'dayjs';

export const defaultBanner: CreateBanner = (options) => {
	return (now) => {
		if (options?.devMode) {
			return `🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧
🚧                                                                    🚧
🚧                      👷これは開発中のコードです。                       🚧
🚧                                                                    🚧
🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧

🈲 このファイルを直接編集しないでください。
⚠️ 正式公開の場合は正しい手順でリリースビルドを行なってファイルを最適化してください。`;
		}

		return `rev. ${now.format('YYYY-MM-DD')}
copyright © ${now.year()}`;
	};
};

/**
 *
 * @param create
 */
export function createBanner(create: ReturnType<CreateBanner>) {
	const banner = create(dayjs());
	return `/*\n${banner}\n*/`;
}
