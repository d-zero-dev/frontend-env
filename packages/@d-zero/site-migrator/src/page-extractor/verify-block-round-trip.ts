import type { BlockData, BlockItem } from '@burger-editor/core';

import { parseHTMLToBlockData } from '@burger-editor/core';

export interface RoundTripMismatch {
	/** 不一致箇所を指すパス（例: `'name'`、`'containerProps.type'`、`'items[0][1].name'`）。 */
	readonly field: string;
	readonly expected: unknown;
	readonly actual: unknown;
}

export interface RoundTripVerification {
	readonly ok: boolean;
	/** `ok`が`true`のときは常に空配列。 */
	readonly mismatches: readonly RoundTripMismatch[];
}

/**
 * `@burger-editor/core`の`render()`が生成した`rendered`（1ブロック分のHTMLElement）を、同じ
 * `@burger-editor/core`の`parseHTMLToBlockData`で逆パースし直し、変換元の`original`と構造的に
 * 一致するかを検証する。深い内容比較（`data`フィールドの値そのもの等）は行わず、
 * BurgerEditor側の`listBlocks`/`getBlockAtPosition`等が構造化ブロックとして正しく認識できるかの
 * 指標となる範囲（`name`、`containerProps.type`、`items`の行数・各行の列数、各アイテムの`name`）
 * のみを比較する。
 * `parseHTMLToBlockData`自体が例外を投げた場合も不一致として扱う（安全側 — 呼び出し元が
 * 例外で落ちないようにする）。
 * @param original `renderBlocks`が`render()`に渡した変換元の`BlockData`。
 * @param rendered `render(original, options)`が返した`HTMLElement`。
 * @example
 * ```ts
 * const rendered = await render(block, { items });
 * const verification = verifyBlockRoundTrip(block, rendered);
 * if (!verification.ok) {
 *   console.warn(verification.mismatches);
 * }
 * ```
 */
export function verifyBlockRoundTrip(
	original: BlockData,
	rendered: HTMLElement,
): RoundTripVerification {
	let parsed: BlockData;
	try {
		parsed = parseHTMLToBlockData(rendered);
	} catch (error) {
		return {
			ok: false,
			mismatches: [
				{
					field: 'parseHTMLToBlockData',
					expected: '例外を投げないこと',
					actual: error instanceof Error ? error.message : String(error),
				},
			],
		};
	}

	const mismatches: RoundTripMismatch[] = [];

	if (parsed.name !== original.name) {
		mismatches.push({ field: 'name', expected: original.name, actual: parsed.name });
	}
	if (parsed.containerProps.type !== original.containerProps.type) {
		mismatches.push({
			field: 'containerProps.type',
			expected: original.containerProps.type,
			actual: parsed.containerProps.type,
		});
	}

	compareItems(original.items, parsed.items, mismatches);

	return { ok: mismatches.length === 0, mismatches };
}

/**
 * `original`/`parsed`両方の`items`（行×列のBlockItem構造）を、行数→各行の列数→各セルの
 * `name`の順に位置ベースで比較し、不一致を`mismatches`へ追記する。行数・列数が既に不一致な
 * 行は、対応するセルが存在しない/意味を持たないため`name`比較をスキップする。
 * @param original 変換元の`items`。
 * @param parsed 逆パースで得た`items`。
 * @param mismatches 検出した不一致を追記する配列（呼び出し元と共有、破壊的に変更する）。
 */
function compareItems(
	original: BlockData['items'],
	parsed: BlockData['items'],
	mismatches: RoundTripMismatch[],
): void {
	if (parsed.length !== original.length) {
		mismatches.push({
			field: 'items.length',
			expected: original.length,
			actual: parsed.length,
		});
		return;
	}

	for (const [rowIndex, originalRow] of original.entries()) {
		const parsedRow = parsed[rowIndex]!;
		if (parsedRow.length !== originalRow.length) {
			mismatches.push({
				field: `items[${rowIndex}].length`,
				expected: originalRow.length,
				actual: parsedRow.length,
			});
			continue;
		}

		for (const [itemIndex, originalItem] of originalRow.entries()) {
			const parsedItem = parsedRow[itemIndex]!;
			const expected = itemName(originalItem);
			const actual = itemName(parsedItem);
			if (expected !== actual) {
				mismatches.push({
					field: `items[${rowIndex}][${itemIndex}].name`,
					expected,
					actual,
				});
			}
		}
	}
}

/**
 * `BlockItem`（文字列 or `{name, data}`オブジェクト）から比較対象の`name`を取り出す。
 * @param item 比較対象の`BlockItem`。
 */
function itemName(item: BlockItem): string {
	return typeof item === 'string' ? item : item.name;
}
