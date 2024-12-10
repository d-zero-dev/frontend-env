import fs from 'node:fs';

/**
 *
 * @param filePath
 */
export function readFileSafe(filePath) {
	try {
		return fs.readFileSync(filePath, 'utf8');
	} catch {
		return null;
	}
}
