import type { ArchiveSession } from '../types.js';

import { getPageHtml as queryGetPageHtml } from '@nitpicker/query';

/**
 * Retrieves the full rendered-DOM HTML snapshot for a given URL.
 *
 * `@nitpicker/query`'s `getPageHtml` defaults to a 100,000-character truncate.
 * Migration consumers always need the full document, so we pass
 * `Number.MAX_SAFE_INTEGER` and return only the string (or `null` when the URL
 * is not in the archive).
 * @param session
 * @param url
 */
export async function getPageHtml(
	session: ArchiveSession,
	url: string,
): Promise<string | null> {
	const result = await queryGetPageHtml(session.accessor, url, Number.MAX_SAFE_INTEGER);
	if (!result) {
		return null;
	}
	return result.html;
}
