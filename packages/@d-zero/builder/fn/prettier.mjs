/**
 * @param {string} content
 */
export async function prettier(content) {
	// eslint-disable-next-line import/no-extraneous-dependencies
	const prettier = await import('prettier');
	const formatted = await prettier.format(content, {
		parser: 'html',
		printWidth: 100_000,
		tabWidth: 2,
		useTabs: false,
	});
	return formatted;
}
