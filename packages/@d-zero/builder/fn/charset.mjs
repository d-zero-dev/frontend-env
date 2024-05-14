/**
 *
 * @param {string} content
 * @param {string} charset - Shift_JISのみ対応
 * @returns
 */
export async function changeCharset(content, charset) {
	charset = charset.toLowerCase().trim();

	/* cspell:disable-next-line */
	if (!/^s(?:hift)?[_-]?jis$/.test(charset)) {
		return content;
	}

	// eslint-disable-next-line import/no-extraneous-dependencies, unicorn/no-await-expression-member
	const iconv = (await import('iconv-lite')).default;

	content = content
		// Change charset
		.replaceAll(/<meta\s+charset="utf-8"\s*\/?>/gi, `<meta charset="${charset}">`)
		// Change entities
		.replaceAll('©', '&copy;')
		.replaceAll('⚠️', 'WARNING')
		.replaceAll('〜', '&#12316;');

	content = iconv.encode(content, 'CP932');

	return content;
}
