import type { DownloadResult } from './downloader/download-resources.js';
import type { PageIdLookup } from './page-extractor/rewrite-page-refs.js';
import type { LayoutAnalysisResult } from '@d-zero/anatomist/types';

/**
 * {@link BlockTargetAdapter.classify}の戻り値。`main`要素は検出できたが変換先の構造化
 * データを組み立てられない場合は`fatal`（呼び出し側はページ全体を無変換HTMLへフォール
 * バックする）。`partial`はブロック単位の低信頼度フォールバックが一部混じっているが
 * ページ全体は諦めていない状態（アダプタ実装ごとの意味は`converted`/`partial`の閾値含め
 * 実装依存）。
 */
export type ClassifyResult<TBlocks> =
	{ kind: 'fatal'; error: Error } | { kind: 'converted' | 'partial'; blocks: TBlocks };

export interface RewriteRefsResult<TBlocks> {
	readonly blocks: TBlocks;
	/**
	 * 個別アイテムの参照書き換えが失敗した箇所の記録（fail-soft）。どのアイテムが失敗した
	 * か（インデックス等）の詳細はアダプタ実装依存のため、`message`に整形済みで含める
	 * こと — `extractPages`側は`error.message`だけを見て1ページ分の`Error`に集約する。
	 */
	readonly errors: readonly Error[];
}

export interface DownloadFilesContext {
	readonly outputDir: string;
	/** 通常のリソースDLで既にカバー済みの絶対URL集合。二重DL回避用。 */
	readonly knownResourceUrls: ReadonlySet<string>;
	readonly limit?: number;
	readonly signal?: AbortSignal;
	readonly onResult?: (event: DownloadResult) => void;
}

/**
 * nitpickerアーカイブ由来のanatomistレイアウト解析結果を、特定のブロックCMS（BurgerEditor
 * 等）向けの構造化データへ変換するためのプラガブルなインターフェース。`extractPages`/
 * `migrate`はこのインターフェースの向こう側の型（`TBlocks`）を一切知らず、fetch/main判定/
 * anatomist呼び出し/id採番/frontmatter生成/書き出しといった変換先非依存の足回りだけを担当
 * する。BurgerEditor向けの既定実装は{@link import('./page-extractor/burger-editor-adapter.js').burgerEditorAdapter}を参照。
 * @example
 * ```ts
 * // 全ページを固定のwysiwygテキストへ倒すだけの最小アダプタ。
 * const wysiwygOnlyAdapter: BlockTargetAdapter<string> = {
 *   classify: () => ({ kind: 'converted', blocks: 'plain text only' }),
 *   rewriteRefs: async (blocks) => ({ blocks, errors: [] }),
 *   render: async (blocks, contentClass) => `<div class="${contentClass}">${blocks}</div>`,
 * };
 *
 * await migrate({
 *   archivePath: 'site.nitpicker',
 *   outputDir: './htdocs',
 *   contentClass: 'js-editable-area',
 *   adapter: wysiwygOnlyAdapter,
 * });
 * ```
 */
export interface BlockTargetAdapter<TBlocks> {
	/**
	 * anatomistのレイアウト解析結果（同一URL・複数ビューポート分）から`TBlocks`を組み立てる。
	 * `main`要素の検出自体（`extractMainContent`とanatomist検出結果の整合性）は呼び出し側
	 * （`extractPages`）が事前にチェック済みで、ここでは渡されない — このメソッドは
	 * 「構造化できるかどうか」だけを判定すればよい。
	 * @param layoutResults
	 */
	classify(layoutResults: readonly LayoutAnalysisResult[]): ClassifyResult<TBlocks>;

	/**
	 * `TBlocks`内の同一オリジンURL参照を`pageIdLookup`で書き換える（ページ参照は既知なら
	 * `{{<id>}}`化、それ以外はroot-relative化）。
	 * @param blocks
	 * @param baseUrl
	 * @param pageIdLookup
	 */
	rewriteRefs(
		blocks: TBlocks,
		baseUrl: string,
		pageIdLookup: PageIdLookup,
	): Promise<RewriteRefsResult<TBlocks>>;

	/**
	 * `TBlocks`を最終的なラッパーHTML文字列へレンダリングする。呼び出し側は返り値の
	 * `wrapperHtml`の子要素だけを取り出し、既存main要素の子として差し替える
	 * （`mergeMainContent`、`contentClass`は同時にmain要素自身へ付与される）。
	 * @param blocks
	 * @param contentClass
	 */
	render(blocks: TBlocks, contentClass: string): Promise<string>;

	/**
	 * 任意。コーパス全体を1回のバッチで扱い、`TBlocks`内のダウンロード対象アイテムの
	 * 重複DLを回避しつつ実ファイルサイズ等を書き戻す。`blocksByUrl`内のアイテムは直接
	 * mutateしてよい（同一オブジェクト参照のため下流に自動反映される）。省略時は何もしない。
	 * @param blocksByUrl
	 * @param ctx
	 */
	downloadFiles?(
		blocksByUrl: ReadonlyMap<string, TBlocks>,
		ctx: DownloadFilesContext,
	): Promise<void>;
}
