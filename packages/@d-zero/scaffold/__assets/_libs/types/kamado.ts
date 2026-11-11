/**
 * kamado がページとレイアウトに渡す値の型。
 *
 * kamado は型定義を同梱しないので、使う側がここに宣言する。形は kamado の
 * ドキュメント（ページに渡されるもの）に合わせる。
 * @module
 */

/**
 * ページのメタ。`pages.overrides`、同名の JSON（sidecar）、ページ内の`meta`を
 * マージした値。
 */
export interface PageMeta {
	/** ページのタイトル。`<title>`、見出し、パンくずに使う */
	readonly title?: string;
	/** `pages.layouts.dir`にあるレイアウトのファイル名（拡張子なし） */
	readonly layout?: string;
	/** `<html>`の`lang`属性。省略時は`ja` */
	readonly lang?: string;
	readonly description?: string;
	readonly ogType?: string;
	readonly ogDescription?: string;
	readonly ogImage?: string;
	readonly ogCard?: string;
	/** 下層ページのレイアウトでページネーションを出すか */
	readonly hasPagination?: boolean;
	readonly [key: string]: unknown;
}

/**
 * ページのファイル情報。
 */
export interface PageInfo {
	readonly inputPath: string;
	readonly outputPath: string;
	readonly fileSlug: string;
	readonly filePathStem: string;
	/** `/`始まりのURL（`index.html`は`/dir/`） */
	readonly url: string;
	readonly extension: string;
	/** ビルドを始めた時刻（ISO 8601）。ページの更新日ではない */
	readonly date: string;
}

/**
 * サイト情報。`kamado.config.jsonc`の`site`、なければ`package.json`の`production`。
 */
export interface SiteInfo {
	readonly host: string | null;
	readonly baseURL: string | null;
	readonly siteName: string | null;
	readonly siteNameEn: string | null;
	/** `package.json`の`name` */
	readonly name: string | null;
	/** `package.json`の`version` */
	readonly version: string | null;
}

/**
 * パンくずの1項目。祖先の`index`ページとページ自身。
 */
export interface Breadcrumb {
	/** タイトルがないページは`__NO_TITLE__` */
	readonly title: string | undefined;
	readonly href: string;
	readonly depth: number;
	readonly meta: PageMeta;
}

/**
 * `titleList()`のオプション。
 */
export interface TitleListOptions {
	readonly separator?: string;
	readonly baseURL?: string;
	readonly prefix?: string;
	readonly suffix?: string;
	readonly siteName?: string;
	readonly fallback?: string;
}

/**
 * `data.dir`にあるファイルの内容。キーはファイル名（拡張子なし）。
 * `.html`は文字列として読まれる。
 */
export interface GlobalData {
	/** BurgerEditor Local App のブロック（HTML） */
	readonly 'bge-blocks': string;
	/** BurgerEditor v2（baserCMS）のブロック（HTML） */
	readonly 'bge-blocks-v2': string;
}

/**
 * ページコンポーネントに渡される props。
 */
export interface PageProps {
	readonly page: PageInfo;
	readonly meta: PageMeta;
	readonly site: SiteInfo;
	readonly data: GlobalData;
	readonly breadcrumbs: readonly Breadcrumb[];
	readonly titleList: (options?: TitleListOptions) => string;
}

/**
 * レイアウトコンポーネントに渡される props。`content`はページの出力（HTML）。
 */
export interface LayoutProps extends PageProps {
	readonly content: string;
}
