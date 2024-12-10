import lintStagedConfigGenerator from '@d-zero/lint-staged-config';
export default lintStagedConfigGenerator({
	ignore: [
		{
			textlint: 'CHANGELOG.md',
		},
	],
});
