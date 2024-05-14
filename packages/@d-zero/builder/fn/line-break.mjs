/**
 * @param {string} content
 * @param {"\n" | "\r\n"} lineBreak
 * @returns
 */
export function lineBreak(content, lineBreak) {
	return content.replaceAll('\n', lineBreak);
}
