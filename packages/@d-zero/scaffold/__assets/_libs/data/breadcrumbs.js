import path from 'node:path';

import { JSDOM } from 'jsdom';

/**
 *
 */
export default async function () {
	return (page, collections) => {
		const breadcrumbs = collections.all
			.filter((item) => isAncestor(page, item.filePathStem))
			.map((item) => ({
				title: getTitle(item),
				href: item.page.url,
				depth: item.page.url.split('/').length,
			}))
			.sort((a, b) => a.depth - b.depth);
		return breadcrumbs;
	};
}

/**
 *
 * @param page
 * @param filePathStem
 */
function isAncestor(page, filePathStem) {
	const dirname = path.dirname(filePathStem);
	const name = path.basename(filePathStem);
	const included = page.filePathStem.startsWith(dirname);
	const isIndex = name === 'index';
	const isSelf = page.filePathStem === filePathStem;
	return (included && isIndex) || isSelf;
}

const titleCache = new Map();

/**
 *
 * @param item
 */
function getTitle(item) {
	const filePathStem = item.filePathStem;
	if (titleCache.has(filePathStem)) {
		return titleCache.get(filePathStem);
	}
	const title =
		item.data.title?.trim() ||
		getTitleFromDOM(getContent(item)) ||
		item.page.fileSlug?.trim();
	titleCache.set(filePathStem, title);
	return title;
}

/**
 *
 * @param item
 */
function getTitleFromDOM(item) {
	const content = getContent(item);
	const dom = new JSDOM(content);
	const title = dom.window.document.title.trim();
	return title;
}

/**
 *
 * @param item
 */
function getContent(item) {
	try {
		// UsingCircularTemplateContentReferenceError may potentially occur
		return item.templateContent;
	} catch {
		return null;
	}
}
