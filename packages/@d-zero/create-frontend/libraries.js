import fs from 'node:fs/promises';
import path from 'node:path';

const basercms5Libraries = [
	{
		from: 'node_modules/jquery/dist/jquery.min.js',
		to: 'htdocs/webroot/js/jquery.min.js',
	},
	{
		from: 'node_modules/jquery-colorbox/example3/colorbox.css',
		to: 'htdocs/webroot/__tmpl/__burger_editor/css/colorbox.css',
	},
	{
		from: 'node_modules/jquery-colorbox/example3/images/loading.gif',
		to: 'htdocs/webroot/__tmpl/__burger_editor/css/images/loading.gif',
	},
	{
		from: 'node_modules/jquery-colorbox/example3/images/controls.png',
		to: 'htdocs/webroot/__tmpl/__burger_editor/css/images/controls.png',
	},
	{
		from: 'node_modules/jquery-colorbox/jquery.colorbox-min.js',
		to: 'htdocs/webroot/__tmpl/__burger_editor/js/bge_modules/jquery.colorbox-min.js',
	},
];

const basercms4Libraries = [
	{
		from: 'node_modules/jquery/dist/jquery.min.js',
		to: 'htdocs/js/jquery.min.js',
	},
	{
		from: 'node_modules/jquery-colorbox/example3/colorbox.css',
		to: 'htdocs/__tmpl/__burger_editor/css/colorbox.css',
	},
	{
		from: 'node_modules/jquery-colorbox/example3/images/loading.gif',
		to: 'htdocs/__tmpl/__burger_editor/css/images/loading.gif',
	},
	{
		from: 'node_modules/jquery-colorbox/example3/images/controls.png',
		to: 'htdocs/__tmpl/__burger_editor/css/images/controls.png',
	},
	{
		from: 'node_modules/jquery-colorbox/jquery.colorbox-min.js',
		to: 'htdocs/__tmpl/__burger_editor/js/bge_modules/jquery.colorbox-min.js',
	},
];

/**
 *
 * @param type
 * @param dest
 */
export async function copyLibraries(type, dest) {
	dest = path.isAbsolute(dest) ? dest : path.resolve(process.cwd(), dest);
	let libraries = [];
	switch (type) {
		case 'basercms4': {
			libraries = basercms4Libraries;
			break;
		}
		case 'basercms5': {
			libraries = basercms5Libraries;
			break;
		}
	}

	for (const library of libraries) {
		const from = path.join(dest, library.from);
		const dist = path.join(dest, library.to);
		const dir = path.dirname(dist);
		const stats = await fs.stat(from).catch(() => null);
		if (!stats?.isFile()) {
			continue;
		}
		await fs.mkdir(dir, { recursive: true });
		await fs.copyFile(from, dist);
	}
}
