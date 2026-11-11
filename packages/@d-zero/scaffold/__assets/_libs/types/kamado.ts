/**
 * このプロジェクト固有のメタのキーとデータファイルの型。
 *
 * `PageProps`、`LayoutProps`、`SiteInfo`などの型は`kamado/jsx`から import する。
 * `PageMeta`と`GlobalData`は、`kamado/jsx`の宣言を拡張（declaration merging）して
 * ここでキーを足す。
 * @see https://github.com/d-zero-dev/kamado/blob/dev/docs/v3/MIGRATION.md
 * @module
 */

// この import が、ファイルをモジュールにして、下の`declare module`を「宣言の拡張」にする
// （無いと、`kamado/jsx`を置き換える別の宣言になる）。
import 'kamado/jsx';

declare module 'kamado/jsx' {
	/**
	 * ページのメタ。`pages.overrides`、同名の JSON（sidecar）、ページ内の`meta`を
	 * マージした値。
	 */
	interface PageMeta {
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
	}

	/**
	 * `data.dir`にあるファイルの内容。キーはファイル名（拡張子なし）。
	 * `.html`は文字列として読まれる。
	 */
	interface GlobalData {
		/** BurgerEditor Local App のブロック（HTML） */
		readonly 'bge-blocks': string;
		/** BurgerEditor v2（baserCMS）のブロック（HTML） */
		readonly 'bge-blocks-v2': string;
	}
}
