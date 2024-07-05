import path from 'node:path';

// eslint-disable-next-line import/no-extraneous-dependencies
import lintStagedConfigGenerator from '@d-zero/lint-staged-config';
export default lintStagedConfigGenerator({
	ignore: [path.resolve(process.cwd(), 'htdocs', '**', '*')],
});
