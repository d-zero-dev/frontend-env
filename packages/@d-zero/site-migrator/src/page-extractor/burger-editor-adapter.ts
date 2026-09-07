import type {
	BlockTargetAdapter,
	ClassifyResult,
	RewriteRefsResult,
} from '../adapter.js';
import type { BlockData } from '@burger-editor/core';

import { downloadBlockFiles } from './download-block-files.js';
import { layoutToBlockData } from './layout-to-block-data.js';
import { renderBlocks } from './render-blocks.js';
import { rewriteBlockRefs } from './rewrite-block-refs.js';

/**
 * `@burger-editor/core`/`@burger-editor/blocks`を使ってページを既存サイトから
 * BurgerEditorの`data-bge-*`ブロック構造へ変換する、`BlockTargetAdapter`の既定実装。
 * `extractPages`/`migrate`のBurgerEditor向け利用（`dz-migrate` CLI含む）はこれを渡す。
 * @example
 * ```ts
 * import { burgerEditorAdapter, migrate } from '@d-zero/site-migrator';
 *
 * await migrate({
 *   archivePath: 'site.nitpicker',
 *   outputDir: './htdocs',
 *   contentClass: 'js-bge-content',
 *   adapter: burgerEditorAdapter,
 * });
 * ```
 */
export const burgerEditorAdapter: BlockTargetAdapter<BlockData[]> = {
	classify(layoutResults): ClassifyResult<BlockData[]> {
		const { blocks, fallbacks } = layoutToBlockData(layoutResults);
		if (blocks.length === 0) {
			return {
				kind: 'fatal',
				error: new Error(
					'レイアウト解析でブロック化可能なmain要素の子構造が見つかりませんでした',
				),
			};
		}
		return { kind: fallbacks.length > 0 ? 'partial' : 'converted', blocks };
	},

	async rewriteRefs(
		blocks,
		baseUrl,
		pageIdLookup,
	): Promise<RewriteRefsResult<BlockData[]>> {
		const rewritten = await rewriteBlockRefs({ blocks, baseUrl, pageIdLookup });
		return {
			blocks: rewritten.blocks,
			// `RewriteBlockRefsError`のblock/row/itemインデックスは`BlockTargetAdapter`の
			// 公開契約には出てこない（`errors: readonly Error[]`）ため、ここで整形済み
			// メッセージを持つ`Error`へ変換してから返す。
			errors: rewritten.errors.map(
				(e) =>
					new Error(
						`block ${e.blockIndex}/row ${e.rowIndex}/item ${e.itemIndex}: ${e.error.message}`,
					),
			),
		};
	},

	async render(blocks, contentClass): Promise<string> {
		return renderBlocks(blocks, { contentClass });
	},

	async downloadFiles(blocksByUrl, ctx): Promise<void> {
		await downloadBlockFiles({
			blocksByUrl,
			outputDir: ctx.outputDir,
			knownResourceUrls: ctx.knownResourceUrls,
			limit: ctx.limit,
			onResult: ctx.onResult,
			signal: ctx.signal,
		});
	},
};
