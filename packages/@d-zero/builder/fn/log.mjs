import path from 'node:path';

import c from 'cli-color';

/**
 * @param {string[][]} outputLogTable
 */
export function log(outputLogTable, pathFormat = 'preserve') {
	process.stdout.write(
		`${c.bold.blue('File Transfer')} ${c.bgBlue(` ${pathFormat} `)}:\n`,
	);
	process.stdout.write(
		c.columns(
			outputLogTable.map((row, i) => {
				const [origin, from, to] = row;
				const fromDir = path.dirname(from);
				const toDir = path.dirname(to);
				const fromName = path.basename(from, path.extname(from));
				const toName = path.basename(to, path.extname(to));
				const toNameWithExt = path.basename(to);
				const name =
					fromName === toName ? c.black(toNameWithExt) : c.greenBright(toNameWithExt);

				const formDirArray = fromDir.split(path.sep);
				const toDirArray = toDir.split(path.sep);

				const dir = toDirArray
					.map((dir, i) => {
						if (dir === '.') {
							return '';
						}
						const from = formDirArray[i];
						if (from === dir) {
							return c.black(dir + path.sep);
						}
						return c.white(dir + path.sep);
					})
					.join('');

				const rel = path.relative(fromDir, toDir);
				const commonDir = rel
					? path.relative(path.resolve(), path.resolve(to, rel))
					: path.dirname(to);
				const fromPath = path.relative(commonDir, from);
				const fromDelete = fromName === toName ? c.black(fromPath) : c.red(fromPath);
				const fromDeleteBase =
					commonDir === '.' || commonDir === '' ? '' : commonDir + '/';

				return [
					//
					c.black(origin),
					c.black(fromDeleteBase) + fromDelete,
					dir + name,
				];
			}),
			{
				sep: c.black(' -> '),
			},
		),
	);
}
