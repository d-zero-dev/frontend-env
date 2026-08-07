import type { MainTagInfo } from '../html/parse-main-tag.js';
import type { LayoutBlock } from '@d-zero/anatomist/types';

/**
 * anatomistが検出したmain要素（`LayoutBlock`のroot）と`extractMainContent`が
 * マッチした要素が同一要素を指しているかを、`tagName`/`id`/`classList`の比較で判定する
 * （#978「anatomistとextractMainContentのmain要素検出結果を整合させる」）。
 *
 * ライブ実行時は呼び出し元がanatomistの`mainContentSelector`に`extractMainContent`の
 * マッチ結果由来のセレクタを渡し、同一要素を解析させることで構造的に整合が保証される
 * ため、この関数は呼ばない（`extract-pages.ts`の`resolveBlockOutcome`参照）。事前生成
 * JSON（`--layout-json`）使用時は生成時点のanatomist側main解決結果が
 * `extractMainContent`の結果と一致する保証がないため、この関数で明示的に検証する。
 *
 * `root`が`null`の場合（anatomistがmain候補を検出できなかった）は無条件に不整合とみなす。
 * `tagName`はDOMの`Element#tagName`（大文字）とparse5のタグ名（小文字）という実装差が
 * あるため大文字小文字を無視して比較する。`classList`は集合として比較する（DOMの
 * `classList`はトークンの重複を許さないが順序を保証しないため）。`id`は大文字小文字を
 * 区別した完全一致を要求する。
 * @param matched `extractMainContent`がマッチした要素から{@link import('../html/parse-main-tag.js').parseMainTag}で抽出した`tagName`/`id`/`classList`。
 * @param root anatomistの`LayoutAnalysisResult.root`（主ビューポート分）。
 */
export function isMainConsistent(
	matched: MainTagInfo,
	root: LayoutBlock | null,
): boolean {
	if (root === null) {
		return false;
	}
	if (matched.tagName.toLowerCase() !== root.tagName.toLowerCase()) {
		return false;
	}
	if (matched.id !== root.id) {
		return false;
	}
	const matchedClasses = new Set(matched.classList);
	const rootClasses = new Set(root.classList);
	if (matchedClasses.size !== rootClasses.size) {
		return false;
	}
	for (const token of matchedClasses) {
		if (!rootClasses.has(token)) {
			return false;
		}
	}
	return true;
}
