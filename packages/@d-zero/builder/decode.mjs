import iconv from 'iconv-lite';

import { reShiftJIS } from './fn/charset.mjs';

/**
 *
 * @param {Buffer} body
 */
export function decode(body) {
	const reCharsetShiftJIS = new RegExp(
		'charset\\s*=\\s*("|\')\\s*' + reShiftJIS.source + '\\s*\\1',
		'gi',
	);

	let html = body.toString('utf8');

	if (reCharsetShiftJIS.test(html)) {
		html = iconv.decode(body, 'CP932');
		// eslint-disable-next-line unicorn/text-encoding-identifier-case
		html = html.replaceAll(reShiftJIS, 'utf-8');
	}

	return html;
}
