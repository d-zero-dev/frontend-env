const search = '</head>';
const insert = `<script type="module" src="/.11ty/reload-client.js"></script></head>`;
const searchBuf = Buffer.from(search);
const insertBuf = Buffer.from(insert);

/**
 *
 * @param {Buffer} content
 */
export function insertReloadClient(content) {
	const index = content.indexOf(searchBuf);
	if (index !== -1) {
		// content.set(insertBuf, index);
		const head = content.subarray(0, index);
		const tail = content.subarray(index + searchBuf.length);
		return Buffer.concat([head, insertBuf, tail]);
	}
	return content;
}
