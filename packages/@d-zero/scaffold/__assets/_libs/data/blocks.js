import fs from 'node:fs';
import path from 'node:path';

export default fs.readFileSync(path.resolve(import.meta.dirname, './blocks.html'), {
	encoding: 'utf8',
});
