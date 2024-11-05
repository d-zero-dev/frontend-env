export const reShiftJIS = /s(?:hift)?[_-]?jis/gi; // cspell:disable-line

export function isShiftJIS(charset: string) {
	const result = reShiftJIS.test(charset.trim()); // cspell:disable-line
	reShiftJIS.lastIndex = 0;
	return result;
}
