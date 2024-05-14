import c from 'cli-color';

/**
 * @param {string[][]} outputLogTable
 */
export function log(outputLogTable) {
	process.stdout.write(`${c.bold.blue('Convert')}:\n`);
	process.stdout.write(
		c.columns(
			outputLogTable.map((row, i) => {
				if (i === 0) {
					return row.map((cell) => c.bold(cell));
				}

				const [to, from, ...options] = row;

				const optionsLog = options.map((value) => {
					if (typeof value === 'boolean') {
						return enable(value);
					}
					if (value === '\n') {
						return 'LF';
					}
					if (value === '\r\n') {
						return 'CRLF';
					}
					if (typeof value === 'string') {
						return string(value);
					}
					return enable(value);
				});

				if (from === to) {
					return [c.black(from), c.white(to), ...optionsLog];
				}
				return [c.black(from), c.greenBright(to), ...optionsLog];
			}),
		),
	);
}

function enable(value) {
	return value ? c.blueBright('enabled') : c.black('disabled');
}

function string(value) {
	return c.yellowBright(`"${value}"`);
}
