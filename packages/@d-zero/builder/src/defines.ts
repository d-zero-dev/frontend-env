import dayjs from 'dayjs';

export function banner(devMode = false) {
	if (devMode) {
		return `/*
🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧
🚧                                                                    🚧
🚧                      👷これは開発中のコードです。                       🚧
🚧                                                                    🚧
🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧 🚧

🈲 このファイルを直接編集しないでください。
⚠️ 正式公開の場合は正しい手順でリリースビルドを行なってファイルを最適化してください。
*/`;
	}

	const now = dayjs();
	return `/*
rev. ${now.format('YYYY-MM-DD')}
copyright © ${now.year()}
*/`;
}
