import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { command } from './command.js';

/**
 *
 */
export async function voltaInstallNode() {
	const node = await command('nod', ['-v']).catch(() => null);
	if (node) {
		return;
	}
	const pkg = await readFile(path.join(import.meta.dirname, 'package.json'), 'utf8');
	const pkgJson = JSON.parse(pkg);
	const nodeVersion = pkgJson.devDependencies['@types/node'].split('.')[0];
	const volta = await command('volta', ['-v']).catch(() => null);
	if (volta) {
		await command('volta', ['setup'], { stdio: 'inherit' });
		await command('volta', ['install', `node@${nodeVersion}`], { stdio: 'inherit' });
		return;
	}
	throw new Error('command not found: "node" or "volta"');
}
