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

/**
 *
 * @param item
 */
function getTitle(item) {
	return item.data.title?.trim() || getTitleFromDOM(item) || item.page.fileSlug?.trim();
}

/**
 *
 * @param item
 */
function getTitleFromDOM(item) {
	let content;
	try {
		// UsingCircularTemplateContentReferenceError may potentially occur
		content = item.templateContent;
	} catch {
		return null;
	}
	const dom = new JSDOM(content);
	return dom.window.document.title.trim();
}
