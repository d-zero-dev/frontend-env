import path from 'node:path';

import { mimeToExtension } from '@d-zero/shared/mime-to-extension';
import { urlToLocalPath } from '@d-zero/shared/url-to-local-path';

/**
 * Resolves where a remote URL should be stored on disk under `outputDir`.
 *
 * The URL's pathname is mirrored verbatim — `https://example.com/img/a.png`
 * lands at `<outputDir>/img/a.png`. When the URL's last path segment lacks
 * an extension, the supplied `contentType` (e.g. `text/html; charset=utf-8`)
 * is mapped to one via `@d-zero/shared/mime-to-extension`; if the MIME is
 * also missing or unknown the path is returned without any extension.
 *
 * Throws when the URL produces a path that escapes `outputDir` (e.g. the
 * URL parser normalised a pathname starting with `//` — `path.resolve`
 * would otherwise treat that as absolute and write outside the tree).
 * @param url
 * @param outputDir
 * @param contentType
 */
export function urlToOutputPath(
	url: string,
	outputDir: string,
	contentType?: string | null,
): string {
	const extension = mimeToExtension(contentType ?? undefined);
	const relative = urlToLocalPath(url, extension).replace(/^\/+/, '');
	const root = path.resolve(outputDir);
	const resolved = path.resolve(root, relative);
	const rel = path.relative(root, resolved);
	if (rel.startsWith('..') || path.isAbsolute(rel)) {
		throw new Error(`URL produces an out-of-output path: ${url}`);
	}
	return resolved;
}
