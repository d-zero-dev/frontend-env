import type { ArchiveSession, InternalResource } from '../types.js';

import { listResources } from '@nitpicker/query';

import { paginate } from './paginate.js';

const PAGE_SIZE = 500;

/**
 * Yields every internal sub-resource (CSS / JS / image / font / …) URL from the
 * archive.
 * @param session
 */
export function listInternalResources(
	session: ArchiveSession,
): AsyncIterable<InternalResource> {
	return paginate(
		(offset, limit) =>
			listResources(session.accessor, { isExternal: false, limit, offset }),
		(row) => ({ url: row.url, contentType: row.contentType }),
		PAGE_SIZE,
	);
}
