import type { ArchiveSession, InternalResource } from '../types.js';

import { listResources } from '@nitpicker/query';

import { paginate } from './paginate.js';

const PAGE_SIZE = 500;

/**
 * Yields every internal sub-resource (CSS / JS / image / font / …) URL from the
 * archive.
 * @param session
 * @yields {InternalResource}
 */
export async function* listInternalResources(
	session: ArchiveSession,
): AsyncIterable<InternalResource> {
	const rows = paginate(
		(offset, limit) =>
			listResources(session.accessor, { isExternal: false, limit, offset }),
		(row) => ({ url: row.url, contentType: row.contentType }),
		PAGE_SIZE,
	);
	for await (const row of rows) {
		// `url` is null for resources whose identity is a large `data:` URI
		// (routed to blob_refs instead of url_refs); nothing to download.
		if (row.url !== null) {
			yield { url: row.url, contentType: row.contentType };
		}
	}
}
