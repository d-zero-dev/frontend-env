import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 *
 * @param input
 */
export async function getContentCache(input: string) {
	const hash = crypto.createHash('sha256').update(input).digest('hex');
	const tmpDir = path.join(os.tmpdir(), 'content-cache');
	const tmpPath = path.join(tmpDir, hash);
	const output = await fs.readFile(tmpPath, 'utf8').catch(() => null);
	return {
		hash,
		output: output ?? null,
	};
}

/**
 *
 * @param hash
 * @param output
 */
export async function setContentCache(hash: string, output: string) {
	const tmpDir = path.join(os.tmpdir(), 'content-cache');
	await fs.mkdir(tmpDir, { recursive: true });
	const tmpPath = path.join(tmpDir, hash);
	await fs.writeFile(tmpPath, output);
}
