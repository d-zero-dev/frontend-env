import type { EleventyServerResponse } from './eleventy.types.js';
import type { SSIOption } from './types.js';

import fs from 'node:fs/promises';
import path from 'node:path';

import c from 'cli-color';
import iconv from 'iconv-lite';
import { minimatch } from 'minimatch';

import { isShiftJIS } from './charset.js';

/**
 * <!--#include virtual="/path/to/common.html"-->
 */
const reSSITag = /<!--\s*#include\s+virtual\s*=\s*(["'])(?<virtual>.+)\1\s*-->/gi;

type SSIFuncOptions = {
	url: URL;
	output: string;
	ssi: Record<string, SSIOption>;
};

/**
 *
 * @param html
 * @param options
 */
export async function ssi(
	html: string,
	options: SSIFuncOptions,
): Promise<EleventyServerResponse> {
	const { url, output } = options;
	const filePath = path.join(output, url.pathname);

	process.stdout.write(
		`${c.black('[11ty]')} ${c.bold.bgBlue(' SSI ')} ${c.bold.green(`${filePath}`)}\n`,
	);

	const cache = new Map<string, string>();

	while (true) {
		const matches = reSSITag.exec(html);
		if (!matches) {
			break;
		}

		const virtual = matches.groups?.virtual;

		if (!virtual) {
			continue;
		}

		const includePath = virtual.startsWith('/')
			? path.join(output, virtual)
			: path.join(path.dirname(filePath), virtual);

		const cached = cache.get(includePath);
		if (cached) {
			html = html.replace(matches[0], cached);
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
		} catch (error: unknown) {
			if (error instanceof Error) {
				const errorMsg = error.message ?? error;
				return {
					status: 500,
					body: `Internal Server Error: ${errorMsg}`,
				};
			}
			throw error;
		}
	}

	cache.clear();

	return html;
}
