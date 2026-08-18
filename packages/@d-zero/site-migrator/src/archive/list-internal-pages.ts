import type { ArchiveSession, InternalPage } from '../types.js';

import { listPages } from '@nitpicker/query';

import { paginate } from './paginate.js';

const PAGE_SIZE = 500;

/**
 * Yields every internal (non-external) page URL from the archive.
 * @param session
 */
export function listInternalPages(session: ArchiveSession): AsyncIterable<InternalPage> {
	return paginate(
		(offset, limit) => listPages(session.accessor, { isExternal: false, limit, offset }),
		(row) => ({ url: row.url }),
		PAGE_SIZE,
	);
}
