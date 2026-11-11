/**
 * kamado がページとレイアウトに渡す値の型。
 *
 * kamado は props の型を`exports`から公開しない（`kamado`、`kamado/build`、
 * `kamado/jsx`のどれからも import できない）ので、使う側がここに宣言する。形は
 * kamado の`dist/props.d.ts`と`dist/page-data/*.d.ts`に合わせる。
 *
 * scaffold が使う props だけを宣言する。kamado はほかに`pages`、`nav()`、
 * `titleList()`、`formatDate()`、`page.meta`も渡すので、使うときに足す。
 * @see https://github.com/d-zero-dev/kamado/blob/dev/docs/v3/MIGRATION.md
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
	/**
	 * タイトルがないページは`__NO_TITLE__`。kamado の組み込みのパンくずは常に文字列
	 * だが、kamado の型（`BreadcrumbItem`）に合わせて`undefined`も受ける
	 */
	readonly title: string | undefined;
	readonly href: string;
	readonly depth: number;
	readonly meta: PageMeta;
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
}

/**
 * レイアウトコンポーネントに渡される props。`content`はページの出力（HTML）。
 */
export interface LayoutProps extends PageProps {
	readonly content: string;
}
