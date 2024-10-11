import iconv from 'iconv-lite';

import { reShiftJIS } from './fn/charset.mjs';

const reCharsetShiftJIS = new RegExp(
	'charset\\s*=\\s*("|\')\\s*' + reShiftJIS.source + '\\s*\\1',
	'gi',
);

/**
 *
 * @param {Buffer} body
 * @param {boolean} decoding
 */
export function decode(body, decoding) {
	let html = body.toString('utf8');

	if (decoding && reCharsetShiftJIS.test(html)) {
		html = iconv.decode(body, 'CP932');
		// eslint-disable-next-line unicorn/text-encoding-identifier-case
		html = html.replaceAll(reShiftJIS, 'utf-8');
	}

	return html;
}
