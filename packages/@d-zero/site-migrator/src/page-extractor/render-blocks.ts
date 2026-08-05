import type { BlockData } from '@burger-editor/core';

import { items } from '@burger-editor/blocks';
import { render } from '@burger-editor/core';
import { JSDOM } from 'jsdom';

export interface RenderBlocksOptions {
	/**
	 * 生成したブロック群HTMLを囲むラッパー要素に付与するクラス名
	 * （BurgerEditorの`editableArea`セレクタに対応させるためのもの）。
	 */
	contentClass: string;
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
	for (const block of blocks) {
		// render()はページ内のブロック順を保つため直列に実行する（並列化しても速度上の利点が
		// 薄く、生成順の見た目上の意味を崩すリスクを避ける）。
		const element = await render(block, { items });
		htmlParts.push(element.outerHTML);
	}

	return `<div class="${escapeAttribute(options.contentClass)}">${htmlParts.join('')}</div>`;
}

/**
 * @param value
 */
function escapeAttribute(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}
