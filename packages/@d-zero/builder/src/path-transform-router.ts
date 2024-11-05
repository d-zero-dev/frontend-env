import fs from 'node:fs/promises';
import path from 'node:path';

import c from 'cli-color';

type PathTransformRouterOptions = {
	output: string;
};

type PathTransformRouter = (args: { url: URL }) => Promise<{ body: Buffer } | void>;

export function pathTransformRouter(
	options: PathTransformRouterOptions,
): PathTransformRouter {
	return async ({ url }) => {
		if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html')) {
			return;
		}

		const origin = path.join(options.output, url.pathname);

		if (url.pathname.endsWith('/')) {
			// 👍️ Honesty
			// /path/to/name/ => Find: /path/to/name/index.html
			{
				const filePath = path.join(origin, 'index.html');
				const content = await fs.readFile(filePath).catch(() => null);
				if (content) {
					_(`${url.pathname}`, filePath);
					return {
						body: content,
					};
				}
			}

			// 🤔 Failback
			// /path/to/name/ => Find: /path/to/name.html
			{
				const filePath = origin + '.html';
				const content = await fs.readFile(filePath).catch(() => null);
				if (content) {
					_(`${url.pathname}`, filePath);
					return {
						body: content,
					};
				}
			}
		}

		if (url.pathname.endsWith('.html')) {
			// 🤖 Access to 11ty's Cool URLs
			// /path/to/name.html => Find: /path/to/name/index.html
			{
				const dir = path.dirname(origin);
				const name = path.basename(origin, '.html');
				const filePath = path.join(dir, name, 'index.html');
				const content = await fs.readFile(filePath).catch(() => null);
				if (content) {
					_(`${url.pathname}`, filePath);
					return {
						body: content,
					};
				}
			}

			// ✅️ Access to original path
			{
				const content = await fs.readFile(origin).catch(() => null);
				if (content) {
					_(`${url.pathname}`, origin);
					return {
						body: content,
					};
				}
			}
		}

		return;
	};
}

function _(url: string, found: string) {
	process.stdout.write(
		[c.black('[11ty]'), c.green(url), c.blue(`Found: ${found}`), '\n'].join(' '),
	);
}
