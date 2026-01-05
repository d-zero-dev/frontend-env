import { spawn } from 'node:child_process';

/**
 *
 * @param {string} commandName
 * @param {string[]} args
 * @param {import("node:child_process").SpawnOptionsWithoutStdio} options
 * @returns {Promise<string>}
 */
export async function command(commandName, args, options) {
	return new Promise((resolve, reject) => {
		const child = spawn(commandName, args, options);

		child.on('error', (error) => {
			reject(error);
		});

		process.on('SIGINT', () => {
			child.kill('SIGINT');
		});

		if (child.stdout) {
			let returnValue = '';

			child.stdout.on('data', (data) => {
				returnValue += data.toString();
			});

			child.stdout.on('end', () => {
				resolve(returnValue.trim());
			});

			return;
		}

		child.on('exit', (code) => {
			if (code !== 0) {
				reject(
					new Error(
						`Command "${commandName} ${args.join(' ')}" exited with code ${code}`,
					),
				);
				return;
			}
			resolve('');
		});
	});
}
