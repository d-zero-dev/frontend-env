import { spawn } from 'node:child_process';

/**
 *
 * @param {string} commandName
 * @param {string[]} args
 * @param {string} cwd
 * @returns {Promise<number>}
 */
export async function command(commandName, args, cwd = process.cwd()) {
	return new Promise((resolve, reject) => {
		const child = spawn(commandName, args, {
			cwd,
			stdio: 'inherit',
		});

		child.on('exit', (code) => {
			if (code === 0) {
				resolve(code);
				return;
			}
			reject(code);
		});

		child.on('error', (error) => {
			reject(error);
		});

		process.on('SIGINT', () => {
			child.kill('SIGINT');
		});
	});
}
