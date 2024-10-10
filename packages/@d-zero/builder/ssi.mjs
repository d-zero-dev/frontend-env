import fs from 'node:fs/promises';
import path from 'node:path';

import c from 'cli-color';
import iconv from 'iconv-lite';
import { minimatch } from 'minimatch';

import { isShiftJIS } from './fn/charset.mjs';

/**
 * <!--#include virtual="/path/to/common.html"-->
 */
const reSSITag = /<!--\s*#include\s+virtual\s*=\s*(["'])(?<virtual>.+)\1\s*-->/gi;

/**
 * @typedef {Object} SSIOptions
 * @property {"CP932" | "utf8"} encoding
 */

/**
 * @param {string} html
 * @param {Object} options
 * @param {URL} options.url
 * @param {string} options.output
 * @param {Record<string, SSIOptions>} options.ssi
 * @returns
 */
export async function ssi(html, options) {
	const { url, output } = options;
	const filePath = path.join(output, url.pathname);

	process.stdout.write(
		`${c.black('[11ty]')} ${c.bold.bgBlue(' SSI ')} ${c.bold.green(`${filePath}`)}\n`,
	);

	const cache = new Map();

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const matches = reSSITag.exec(html);
		if (!matches) {
			break;
		}

		const { virtual } = matches.groups;
		const includePath = virtual.startsWith('/')
			? path.join(output, virtual)
			: path.join(path.dirname(filePath), virtual);

		if (cache.has(includePath)) {
			html = html.replace(matches[0], cache.get(includePath));
			continue;
		}

		const includeContent = await fs.readFile(includePath).catch(() => null);

		if (!includeContent) {
			process.stdout.write(
				`${c.black('[11ty]')}   ${c.bold.bgRed(' Error ')} ${c.red(`Include file not found ${filePath}`)}\n`,
			);
			return {
				status: 500,
				body: `Internal Server Error: Include file not found ${includePath}`,
			};
		}

		let enc = 'utf8';
		for (const [glob, ssiOptions] of Object.entries(options.ssi)) {
			const pattern = path.join(output, glob);
			if (minimatch(includePath, pattern)) {
				enc = isShiftJIS(ssiOptions.encoding) ? 'CP932' : (ssiOptions.encoding ?? 'utf8');
				break;
			}
		}

		try {
			process.stdout.write(
				`${c.black('[11ty]')}   ${c.black(`includes:`)} ${c.blue(includePath)} ${c.black(`(${enc})`)}\n`,
			);
			const part =
				enc === 'utf8'
					? includeContent.toString('utf8')
					: iconv.decode(includeContent, enc);

			cache.set(includePath, part);

			html = html.replace(matches[0], part);
		} catch (error) {
			const errorMsg = error.message ?? error;
			return {
				status: 500,
				body: `Internal Server Error: ${errorMsg}`,
			};
		}
	}

	cache.clear();

	return html;
}
