export const reShiftJIS = /s(?:hift)?[_-]?jis/gi; // cspell:disable-line
/**
 * @param {string} charset
 * @returns
 */
export function isShiftJIS(charset) {
	const result = reShiftJIS.test(charset.trim()); // cspell:disable-line
	reShiftJIS.lastIndex = 0;
	return result;
}
