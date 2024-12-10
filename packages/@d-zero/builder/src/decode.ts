import iconv from 'iconv-lite';

import { reShiftJIS } from './charset.js';

const reCharsetShiftJIS = new RegExp(
	'charset\\s*=\\s*("|\')\\s*' + reShiftJIS.source + '\\s*\\1',
	'i',
);

/**
 *
 * @param body
 * @param decoding
 */
export function decode(body: Buffer, decoding: boolean) {
	let html = body.toString('utf8');

	if (decoding && reCharsetShiftJIS.test(html)) {
		html = iconv.decode(body, 'CP932');
		// eslint-disable-next-line unicorn/text-encoding-identifier-case
		html = html.replaceAll(reShiftJIS, 'utf-8');
	}

	return html;
}
