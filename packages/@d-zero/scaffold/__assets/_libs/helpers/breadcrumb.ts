/**
 * パンくずと`<title>`の組み立て。
 *
 * kamado の`titleList()`を使わないのは、サイト名を区切りなしで続け（トップページは
 * サイト名が2回並ぶ）、`baseURL`を文字列のまま比べるのでフル URL の`baseURL`では
 * トップページを除けないため。
 *
 * トップページの判定は、kamado がパンくずを切るのと同じ規則にする。kamado は
 * `site.baseURL`のパスの部分（`kamado/jsx`の`basePathOf`）の深さより浅いページを
 * パンくずから除くので、残った中でいちばん浅いページがトップになる。
 * @module
 */

import type { BreadcrumbItem, SiteInfo } from 'kamado/jsx';

import { basePathOf } from 'kamado/jsx';

type Breadcrumb = BreadcrumbItem;

/** kamado がタイトルの無いページに入れる値 */
const NO_TITLE = '__NO_TITLE__';

/**
 * パンくずの1項目がトップページか。
 * @param item - パンくずの1項目
 * @param baseURL - `site.baseURL`
 * @returns トップページなら`true`
 * @example
 * isTopPage({ title: 'Top', href: '/sub/', depth: 1, meta: {} }, 'https://example.com/sub'); // true
 */
export function isTopPage(item: Breadcrumb, baseURL: SiteInfo['baseURL']): boolean {
	const baseDepth = basePathOf(baseURL).split('/').filter(Boolean).length;
	return item.depth <= baseDepth;
}

/**
 * パンくずの1項目の表示名。タイトルの無いページは URL の最後のセグメント（拡張子なし）。
 * @param item - パンくずの1項目
 * @returns 表示名
 * @example
 * breadcrumbLabel({ title: '__NO_TITLE__', href: '/news/', depth: 1, meta: {} }); // 'news'
 */
export function breadcrumbLabel(item: Breadcrumb): string {
	if (item.title !== undefined && item.title !== '' && item.title !== NO_TITLE) {
		return item.title;
	}
	const last = item.href.split('/').findLast((segment) => segment !== '');
	return last?.replace(/\.html$/, '') ?? item.href;
}

/**
 * `<title>`の文字列。深いページから順に`|`で区切り、最後にサイト名を付ける。
 * トップページはサイト名だけになる。
 * @param breadcrumbs - パンくず
 * @param site - サイト情報（`baseURL`と`siteName`を使う）
 * @returns `<title>`の文字列
 * @example
 * // '下層ページ | テンプレート一覧 | サイト名'
 * pageTitle(breadcrumbs, site);
 */
export function pageTitle(breadcrumbs: readonly Breadcrumb[], site: SiteInfo): string {
	const titles = breadcrumbs
		.filter((item) => !isTopPage(item, site.baseURL))
		.toReversed()
		.map((item) => breadcrumbLabel(item));
	return [...titles, site.siteName ?? ''].filter((title) => title !== '').join(' | ');
}
