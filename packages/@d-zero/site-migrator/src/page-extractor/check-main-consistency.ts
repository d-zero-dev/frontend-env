import { JSDOM } from 'jsdom';

/**
 * anatomistの`mainSelector`（構造判定の主ビューポートのもの）と`extractMainContent`が
 * マッチした要素を比較し、両者が同一要素を指しているかを判定する、ページ単位の致命的
 * フォールバック判定に使う簡易版の整合性チェック。#978「anatomistとextractMainContentの
 * main要素検出結果を整合させる」が担う厳密な整合化の完全な実装ではない。
 *
 * `mainSelector`が`null`の場合（anatomistがmain候補を検出できなかった）は、この関数の
 * 呼び出し元が`extracted`（`extractMainContent`はマッチ済み）の場合にのみ呼ぶ前提のため、
 * 無条件に不整合とみなす。セレクタが不正でDOM側の`querySelector`が例外を投げた場合や、
 * セレクタにマッチする要素が無かった場合も同様に不整合として扱う（安全側）。
 *
 * 一致判定は`outerHTML`の完全一致で行う。DOM構造として同一要素であっても属性順序や
 * 空白の正規化差でずれる可能性があるが、`extractMainContent`（parse5）と本関数のjsdom
 * パースは同じ`originalHtml`文字列を独立にパースするため、同一要素であれば通常
 * `outerHTML`も一致する。誤検出（実際は同一要素なのに不一致と判定）が起きても、
 * 呼び出し側は安全側（致命的フォールバックへの倒し込み）に働くだけなので許容する。
 * @param originalHtml ページの元の完全なHTMLドキュメント。
 * @param matchedMainHtml `extractMainContent`がマッチしたと判定した要素の`outerHTML`。
 * @param mainSelector anatomistの`LayoutAnalysisResult.mainSelector`（主ビューポート分）。
 */
export function isMainConsistent(
	originalHtml: string,
	matchedMainHtml: string,
	mainSelector: string | null,
): boolean {
	if (mainSelector === null) {
		return false;
	}

	let anatomistElement: Element | null;
	try {
		const dom = new JSDOM(originalHtml);
		anatomistElement = dom.window.document.querySelector(mainSelector);
	} catch {
		return false;
	}

	return anatomistElement !== null && anatomistElement.outerHTML === matchedMainHtml;
}
