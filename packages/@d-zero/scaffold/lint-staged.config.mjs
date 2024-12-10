import path from 'node:path';

import lintStagedConfigGenerator from '@d-zero/lint-staged-config';
export default lintStagedConfigGenerator({
	ignore: [
		path.resolve(import.meta.dirname, 'htdocs', '**', '*'),
		{
			textlint: 'CHANGELOG.md',
		},
	],
});
