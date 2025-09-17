import breadcrumbs from './breadcrumbs.js';

/**
 *
 */
export default async function () {
	return (page, collections, pkg, separator = ' | ') => {
		const breadcrumbLinkList = breadcrumbs()(page, collections);
		const titleList = breadcrumbLinkList
			.filter((item) => item.href !== '/')
			.toReversed()
			.map((item) => item.title);
		titleList.push(pkg.production?.siteName || '__サイト名__');
		return titleList.join(separator);
	};
}
