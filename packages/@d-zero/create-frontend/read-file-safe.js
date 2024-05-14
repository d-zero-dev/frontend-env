import fs from 'node:fs';

export function readFileSafe(filePath) {
	try {
		return fs.readFileSync(filePath, 'utf8');
	} catch {
		return null;
	}
}
