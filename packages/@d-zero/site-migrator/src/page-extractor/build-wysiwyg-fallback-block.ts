import type { BlockData } from '@burger-editor/core';

export interface WysiwygFallbackBlockOptions {
	/** フォールバックブロックの`name`。呼び出し元の文脈に応じて決める（固定値/元ブロック引継ぎ等）。 */
	readonly name: string;
	readonly classList?: readonly string[];
	readonly style?: Record<string, string>;
	readonly id?: string | null;
}

/**
 * 構造化できなかった（または往復検証に失敗した）ブロックを、1行1列の`wysiwyg`単一アイテムへ
 * 倒す。`layout-to-block-data.ts`の低信頼度フォールバックと`render-blocks.ts`の往復検証
 * フォールバック（#980）の両方が使う共通の形 — どちらも判定基準・呼び出し元は異なるが、
 * 「構造化を諦めて生HTMLをそのままwysiwygとして保持する」という最終形は同一。
 * @param rawHtml `wysiwyg`アイテムの`data.wysiwyg`として保持する生HTML。
 * @param options
 * @example
 * ```ts
 * const block = buildWysiwygFallbackBlock('<p>hello</p>', { name: 'migrated' });
 * // { name: 'migrated', containerProps: { type: 'grid', columns: 1 },
 * //   items: [[{ name: 'wysiwyg', data: { wysiwyg: '<p>hello</p>' } }]] }
 * ```
 */
export function buildWysiwygFallbackBlock(
	rawHtml: string,
	options: WysiwygFallbackBlockOptions,
): BlockData {
	return {
		name: options.name,
		containerProps: { type: 'grid', columns: 1 },
		items: [[{ name: 'wysiwyg', data: { wysiwyg: rawHtml } }]],
		...(options.classList ? { classList: options.classList } : {}),
		...(options.style ? { style: options.style } : {}),
		...(options.id === undefined ? {} : { id: options.id }),
	};
}
