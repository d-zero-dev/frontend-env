import type { BlockData, BlockItem, ContainerProps } from '@burger-editor/core';
import type { LayoutAnalysisResult, LayoutBlock } from '@d-zero/anatomist/types';

import { classifyBlockItem, wysiwygItem } from './classify-block-item.js';

export type BlockFallbackReason =
	'viewport-mismatch' | 'malformed-row-sizes' | 'low-confidence';

export interface LayoutToBlockDataOptions {
	/** 構造判定の主とするビューポート名。既定 'pc'。見つからなければ幅最大のエントリにフォールバック。 */
	primaryViewportName?: string;
}

export interface LayoutToBlockDataResult {
	blocks: BlockData[];
	/**
	 * ブロック単位の構造フォールバックの記録（#976のレポート用）。セル単位の`classifyBlockItem`の
	 * 結果としての`wysiwyg`（正常な分類結果）はここには含まれない。
	 */
	fallbacks: { blockIndex: number; reason: BlockFallbackReason }[];
}

const DEFAULT_PRIMARY_VIEWPORT_NAME = 'pc';

/**
 * コンテナ系`layoutType`（vertical-stack/horizontal-row/simple-grid/complex-grid/float-wrap）
 * に対する`confidence`の下限。現行anatomist実装ではマッチ時confidenceは`0.6`(complex-grid)〜
 * `1`(table)、非マッチ(`unknown`)は常に`0`のため、この閾値は実質的に発火しない防御的な
 * 二重チェック（将来のdetector変更に備えた保険）。`leaf`には適用しない（`leaf`のconfidenceは
 * 常に0固定であり、この閾値の対象外 — `classify-block-item.ts`のJSDoc参照）。
 */
const DEFAULT_MIN_CONTAINER_CONFIDENCE = 0.5;

/**
 * ブロックの見た目上の種別名は未確定（#975/#976で命名確定するまでのプレースホルダー）。
 */
const MIGRATED_BLOCK_NAME = 'migrated';

/**
 * 同一URLの複数ビューポート分 `LayoutAnalysisResult[]` を受け取り、PCビューポートを主として
 * ビューポート整合性判断・深さ圧縮・行列変換・containerPropsマッピングを行い `BlockData[]` を
 * 返す純粋関数。
 *
 * 処理の流れ:
 * 1. `primaryViewportName`（既定`'pc'`）に一致する`viewport.name`のエントリを主とする。
 *    無ければ幅最大のエントリにフォールバック。`primary.root === null`または`results`が
 *    空なら`{blocks:[], fallbacks:[]}`を返す（main未検出はページ全体フォールバック=#976の
 *    責務であり、ここでは単に「0件」を返す）。
 * 2. `primary.root.children`（depth-1候補）をインデックスで走査し、他ビューポートの同一
 *    インデックスノードと`children.length`を比較する（ビューポートが1つしかなければこの
 *    チェックはスキップする）。不一致ならそのブロックを`wysiwyg`単一アイテムに倒す。
 * 3. `layoutType`→`ContainerProps`写像と`signals.rowSizes`を使った行列再構築
 *    （{@link resolveItemGrid}）。不正な形状・低信頼度ならそのブロックを`wysiwyg`単一
 *    アイテムに倒す。
 * 4. 深さ圧縮: 決定した行×列の各セル（depth-2ノード）を、`children`を一切見ずそのまま
 *    {@link classifyBlockItem} に渡す。深さ3以降の`layoutType`情報は`classifyBlockItem`が
 *    `innerHTML`文字列のみを見ることで自動的に破棄される。
 * @param results
 * @param options
 * @example
 * ```ts
 * const { blocks, fallbacks } = layoutToBlockData([
 *   { url: 'https://example.com/', viewport: { name: 'pc', width: 1280 }, mainSelector: 'main', root },
 * ]);
 * // blocks: BlockData[]（BurgerEditorへそのまま渡せる形）
 * // fallbacks: [{ blockIndex: 2, reason: 'viewport-mismatch' }, ...]（構造フォールバックの記録）
 * ```
 */
export function layoutToBlockData(
	results: readonly LayoutAnalysisResult[],
	options: LayoutToBlockDataOptions = {},
): LayoutToBlockDataResult {
	const primaryViewportName =
		options.primaryViewportName ?? DEFAULT_PRIMARY_VIEWPORT_NAME;
	const primary = selectPrimary(results, primaryViewportName);
	if (!primary || primary.root === null) {
		return { blocks: [], fallbacks: [] };
	}

	const otherRoots = results
		.filter((result) => result !== primary)
		.map((result) => result.root);
	const checkViewportConsistency = otherRoots.length > 0;

	const blocks: BlockData[] = [];
	const fallbacks: { blockIndex: number; reason: BlockFallbackReason }[] = [];

	for (const [index, node] of primary.root.children.entries()) {
		if (checkViewportConsistency && !childCountMatches(node, index, otherRoots)) {
			blocks.push(wysiwygBlockData(node));
			fallbacks.push({ blockIndex: index, reason: 'viewport-mismatch' });
			continue;
		}

		const resolved = resolveItemGrid(node, DEFAULT_MIN_CONTAINER_CONFIDENCE);
		if (!resolved.ok) {
			blocks.push(wysiwygBlockData(node));
			fallbacks.push({ blockIndex: index, reason: resolved.reason });
			continue;
		}

		blocks.push({
			name: MIGRATED_BLOCK_NAME,
			containerProps: resolved.containerProps,
			items: resolved.rows.map((row) =>
				row.map((cell) => toBlockItem(classifyBlockItem(cell))),
			),
		});
	}

	return { blocks, fallbacks };
}

/**
 * @param results
 * @param primaryViewportName
 */
function selectPrimary(
	results: readonly LayoutAnalysisResult[],
	primaryViewportName: string,
): LayoutAnalysisResult | undefined {
	if (results.length === 0) {
		return undefined;
	}
	const named = results.find((result) => result.viewport.name === primaryViewportName);
	if (named) {
		return named;
	}
	let widest = results[0]!;
	for (const result of results) {
		if (result.viewport.width > widest.viewport.width) {
			widest = result;
		}
	}
	return widest;
}

/**
 * `primary`側の depth-1 ノード（`node`）自身の子要素数が、他ビューポートの同一インデックス
 * ノードと一致するかを判定する。対応ノードが存在しない場合（`root`がnull、または
 * `children[index]`が無い）も不一致として扱う（安全側）。
 * @param node
 * @param index
 * @param otherRoots
 */
function childCountMatches(
	node: LayoutBlock,
	index: number,
	otherRoots: readonly (LayoutBlock | null)[],
): boolean {
	const expected = node.children.length;
	return otherRoots.every((otherRoot) => {
		const otherNode = otherRoot?.children[index];
		return otherNode !== undefined && otherNode.children.length === expected;
	});
}

type ResolveItemGridResult =
	| {
			ok: true;
			containerProps: Partial<ContainerProps>;
			rows: readonly (readonly LayoutBlock[])[];
	  }
	| { ok: false; reason: BlockFallbackReason };

/**
 * 1つの depth-1 ノードについて、`layoutType`から`ContainerProps`を決定し、`children`を
 * 行×列（`BlockItem`の元になる`LayoutBlock`の2次元配列）に並べ替える。Issue記載の対応表:
 *
 * - `vertical-stack` → `{type:'grid', columns:1}`、子はN行1列
 * - `horizontal-row` → `{type:'inline'}`、子は1行N列
 * - `simple-grid`/`complex-grid` → `{type:'grid', columns: 行あたり最大列数}`。
 *   `signals.rowSizes`を検証した上で使用。不正な形状なら`ok:false`
 * - `float-wrap` → `{type:'float', float: signalsから読めれば反映、読めなければnull}`
 * - `table`/`unknown`/`leaf` → `{type:'grid', columns:1}`（単一item、1行1列）
 * @param node
 * @param minConfidence
 */
function resolveItemGrid(
	node: LayoutBlock,
	minConfidence: number,
): ResolveItemGridResult {
	switch (node.layoutType) {
		case 'vertical-stack': {
			if (node.confidence < minConfidence) {
				return { ok: false, reason: 'low-confidence' };
			}
			return {
				ok: true,
				containerProps: { type: 'grid', columns: 1 },
				rows: node.children.map((child) => [child]),
			};
		}
		case 'horizontal-row': {
			if (node.confidence < minConfidence) {
				return { ok: false, reason: 'low-confidence' };
			}
			return { ok: true, containerProps: { type: 'inline' }, rows: [node.children] };
		}
		case 'simple-grid':
		case 'complex-grid': {
			if (node.confidence < minConfidence) {
				return { ok: false, reason: 'low-confidence' };
			}
			const rows = buildRowsFromRowSizes(node.children, node.signals.rowSizes);
			if (!rows) {
				return { ok: false, reason: 'malformed-row-sizes' };
			}
			const columns = Math.max(...rows.map((row) => row.length));
			return { ok: true, containerProps: { type: 'grid', columns }, rows };
		}
		case 'float-wrap': {
			if (node.confidence < minConfidence) {
				return { ok: false, reason: 'low-confidence' };
			}
			return {
				ok: true,
				containerProps: { type: 'float', float: readFloatDirection(node.signals) },
				rows: [node.children],
			};
		}
		// 'table' / 'unknown' / 'leaf' はここに落ちる（単一item、1行1列）。
		default: {
			return { ok: true, containerProps: { type: 'grid', columns: 1 }, rows: [[node]] };
		}
	}
}

/**
 * `children`を先頭から`rowSizes`の各要素数ずつ順番に区切って行を再構築する。`signals`は
 * anatomist側で型付けされていない`Record<string, unknown>`（デバッグ用の生エビデンスであり
 * 公開契約ではない）であるため、`rowSizes`の形状を実行時に検証する:
 * 空でない配列であること、各要素が正の整数であること、合計が`children.length`と一致すること。
 * いずれかを満たさない場合は`undefined`を返し、呼び出し側が低信頼度としてブロックを
 * `wysiwyg`にフォールバックする（空配列を許すと`resolveItemGrid`の`Math.max(...rows.map(...))`
 * が`-Infinity`になり不正な`columns`が生成されるため、ここで弾く）。
 * @param children
 * @param rowSizesValue
 */
function buildRowsFromRowSizes(
	children: readonly LayoutBlock[],
	rowSizesValue: unknown,
): readonly (readonly LayoutBlock[])[] | undefined {
	if (!Array.isArray(rowSizesValue) || rowSizesValue.length === 0) {
		return undefined;
	}
	const rowSizes = rowSizesValue as unknown[];
	const isValidShape = rowSizes.every(
		(size) => typeof size === 'number' && Number.isInteger(size) && size > 0,
	);
	if (!isValidShape) {
		return undefined;
	}
	const total = (rowSizes as number[]).reduce((sum, size) => sum + size, 0);
	if (total !== children.length) {
		return undefined;
	}

	const rows: LayoutBlock[][] = [];
	let cursor = 0;
	for (const size of rowSizes as number[]) {
		rows.push(children.slice(cursor, cursor + size));
		cursor += size;
	}
	return rows;
}

/**
 * `detect-float-wrap-pattern.ts`の現状の`signals`にはfloat方向（start/end）を示すキーが
 * 存在しないため、実際には常に`null`を返す想定。将来anatomist側が対応した際に自動的に
 * 機能するようここで読み取りを試みる。
 * @param signals
 */
function readFloatDirection(signals: Record<string, unknown>): 'start' | 'end' | null {
	const value = signals.float ?? signals.floatDirection;
	return value === 'start' || value === 'end' ? value : null;
}

/**
 * ビューポート不一致・`rowSizes`不正形状・低信頼度で、depth-1ノード全体を単一アイテムの
 * `wysiwyg`に倒す。
 * @param node
 */
function wysiwygBlockData(node: LayoutBlock): BlockData {
	return {
		name: MIGRATED_BLOCK_NAME,
		containerProps: { type: 'grid', columns: 1 },
		items: [[toBlockItem(wysiwygItem(node))]],
	};
}

/**
 * @param classified
 */
function toBlockItem(classified: ReturnType<typeof classifyBlockItem>): BlockItem {
	return { name: classified.name, data: classified.data };
}
