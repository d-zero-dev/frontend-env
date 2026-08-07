import type { RoundTripMismatch } from './verify-block-round-trip.js';
import type { BlockData } from '@burger-editor/core';

import { items } from '@burger-editor/blocks';
import { render } from '@burger-editor/core';
import { JSDOM } from 'jsdom';

import { buildWysiwygFallbackBlock } from './build-wysiwyg-fallback-block.js';
import { verifyBlockRoundTrip } from './verify-block-round-trip.js';

export interface RenderBlocksOptions {
	/**
	 * 生成したブロック群HTMLを囲むラッパー要素に付与するクラス名
	 * （BurgerEditorの`editableArea`セレクタに対応させるためのもの）。
	 */
	contentClass: string;
	/**
	 * ブロックの往復検証（{@link verifyBlockRoundTrip}）が不一致を検出した際に呼ばれる。
	 * 開発時のデバッグ用途向けの通知であり、省略しても`renderBlocks`の変換動作
	 * （そのブロックをwysiwygフォールバックへ倒す挙動）自体は変わらない。
	 */
	onRoundTripMismatch?: (event: BlockRoundTripMismatchEvent) => void;
}

export interface BlockRoundTripMismatchEvent {
	/** `blocks`配列内でのインデックス。 */
	readonly blockIndex: number;
	/** 往復検証に失敗した変換元の`BlockData`。 */
	readonly block: BlockData;
	readonly mismatches: readonly RoundTripMismatch[];
}

let domInstalled = false;

/**
 * `@burger-editor/core`の`render()`が内部で`document.createElement`/`new Range()`等の
 * DOM APIに依存するため、初回呼び出し時のみjsdomを起動し`globalThis`へ反映する。既にDOM環境が
 * 存在する場合（jsdom環境のテスト実行時等）は何もしない。
 */
function ensureDomEnvironment(): void {
	if (domInstalled || globalThis.document !== undefined) {
		domInstalled = true;
		return;
	}

	const dom = new JSDOM('', { pretendToBeVisual: true });
	const window = dom.window as unknown as Record<string, unknown>;
	const target = globalThis as unknown as Record<string, unknown>;

	for (const key of Object.getOwnPropertyNames(window)) {
		// `window`自身は自己参照プロパティであり、jsdomの記述子をそのままコピーすると後段の
		// 上書きが失敗しうるため（configurable:falseなケースがある）、下で個別に扱う。
		if (key === 'window' || key in target) {
			continue;
		}
		const descriptor = Object.getOwnPropertyDescriptor(window, key);
		if (descriptor) {
			Object.defineProperty(target, key, descriptor);
		}
	}
	if (
		!('window' in target) ||
		Object.getOwnPropertyDescriptor(target, 'window')?.writable
	) {
		Object.defineProperty(target, 'window', {
			value: window,
			writable: true,
			configurable: true,
		});
	}

	domInstalled = true;
}

/**
 * 1ページ分の`BlockData[]`を`@burger-editor/core`公式の`render()`APIへ1ブロックずつ渡して
 * `data-bge-*`付きのHTML要素を生成し、それらを連結した上で`options.contentClass`を持つ
 * ラッパー要素で囲む。アイテムカタログはカスタマイズ不可で、常に`@burger-editor/blocks`の
 * 既定カタログ（`items`）を使う。
 *
 * 各ブロックは`render()`直後に{@link verifyBlockRoundTrip}で往復検証する（#980）—
 * 同じ`@burger-editor/core`の`parseHTMLToBlockData`で生成HTMLを逆パースし、変換元の
 * `BlockData`と構造的に一致するかを確認する。不一致（`render()`/`parseHTMLToBlockData`
 * 側の未知のバグ等）を検出した場合、そのブロックのみ#974の低信頼度フォールバックと同じ
 * 扱い（1行1列のwysiwygアイテムとして生HTMLを保持）に倒す — `render()`が実際に生成した
 * `outerHTML`をそのままwysiwygの内容として包み直し、`data-bge-*`マーカー付きの
 * フォールバックブロックとして再度`render()`する。他ブロックの見た目・変換結果には影響しない。
 * @param blocks
 * @param options
 * @example
 * ```ts
 * const html = await renderBlocks(blocks, { contentClass: 'js-bge-content' });
 * // '<div class="js-bge-content"><div data-bge-name="...">...</div>...</div>'
 * ```
 */
export async function renderBlocks(
	blocks: readonly BlockData[],
	options: RenderBlocksOptions,
): Promise<string> {
	ensureDomEnvironment();

	const htmlParts: string[] = [];
	for (const [blockIndex, block] of blocks.entries()) {
		// render()はページ内のブロック順を保つため直列に実行する（並列化しても速度上の利点が
		// 薄く、生成順の見た目上の意味を崩すリスクを避ける）。
		let element = await render(block, { items });

		const verification = verifyBlockRoundTrip(block, element);
		if (!verification.ok) {
			options.onRoundTripMismatch?.({
				blockIndex,
				block,
				mismatches: verification.mismatches,
			});
			try {
				element = await render(buildRoundTripFallback(block, element.outerHTML), {
					items,
				});
			} catch {
				// フォールバック用の再render()自体が失敗した場合、往復検証に失敗した
				// （が一応レンダリングはできている）元のelementをそのまま使う。ここで例外を
				// 伝播させると、このブロック1個の問題で呼び出し元（extract-pages.ts）が
				// ページ全体をfatalへ落とし他の正常ブロックまで失う — このJSDocが約束する
				// 「他ブロックの見た目・変換結果には影響しない」を保つための最終手段。
			}
		}

		htmlParts.push(element.outerHTML);
	}

	return `<div class="${escapeAttribute(options.contentClass)}">${htmlParts.join('')}</div>`;
}

/**
 * 往復検証（{@link verifyBlockRoundTrip}）に失敗したブロックを、#974の低信頼度フォールバック
 * と同じ形（{@link buildWysiwygFallbackBlock}）へ倒す。`rawHtml`には検証対象だった`render()`
 * の出力（`element.outerHTML`）をそのまま渡す — その中に元ブロック自身の`data-bge-*`属性が
 * ネストして残るが、`@burger-editor/core`の`listBlocks`は`editableArea`直下の子要素
 * （`:scope > [data-bge-container]`）のみをブロックとして走査するため、ネストした属性が
 * 上位のブロック走査へ影響することはない。
 * `name`に加えて`classList`/`style`/`id`も引き継ぐ — 往復検証はこれらのプロパティを比較対象に
 * しない（`verifyBlockRoundTrip`のJSDoc参照）ため、フォールバックへ倒す理由（`items`の構造
 * 不一致等）とは無関係に保持でき、CSSフックやアンカーリンク（`id`）を壊さない。
 * @param block 往復検証に失敗した変換元の`BlockData`。
 * @param rawHtml フォールバック後もそのまま保持する生HTML。
 */
function buildRoundTripFallback(block: BlockData, rawHtml: string): BlockData {
	return buildWysiwygFallbackBlock(rawHtml, {
		name: block.name,
		classList: block.classList,
		style: block.style,
		id: block.id,
	});
}

/**
 * @param value
 */
function escapeAttribute(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}
