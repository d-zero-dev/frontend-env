import type {
	ButtonItemData,
	DownloadFileItemData,
	ImageEntryData,
	WysiwygItemData,
} from './classify-block-item.js';
import type { PageIdLookup } from './rewrite-page-refs.js';
import type { BlockData, BlockItem } from '@burger-editor/core';

import { rewritePageRefs } from './rewrite-page-refs.js';

export interface RewriteBlockRefsOptions {
	/** `layoutToBlockData`が生成した`BlockData[]`（`renderBlocks`へ渡す前のもの）。 */
	readonly blocks: readonly BlockData[];
	/** このブロック群が属するページのURL。相対URL解決の基点として使う。 */
	readonly baseUrl: string;
	/**
	 * `buildPageIdLookup`で構築済みのルックアップテーブル。マイグレーション実行全体で
	 * 使い回す想定（`rewritePageRefs`と同じ制約 — 呼び出しごとの再構築はO(N²)）。
	 */
	readonly pageIdLookup: PageIdLookup;
}

export interface RewriteBlockRefsError {
	readonly blockIndex: number;
	readonly rowIndex: number;
	readonly itemIndex: number;
	/** `rewritePageRefs`が投げた例外（`wysiwyg`アイテムのみが発生源）。 */
	readonly error: Error;
}

export interface RewriteBlockRefsResult {
	readonly blocks: BlockData[];
	/**
	 * `wysiwyg`アイテムの`rewritePageRefs`呼び出しが失敗した箇所の記録（fail-soft —
	 * `extract-pages.ts`の`rewriteError`と同方針）。該当アイテムは元の内容のまま返され、
	 * 他のアイテム・ブロックの処理は継続する。
	 */
	readonly errors: RewriteBlockRefsError[];
}

/**
 * `<a>`/`<form>`等のページ参照タグが対象かを問わず、値がURL属性そのもの（ページ参照タグの
 * 属性値相当）として扱われる場合に限り除外するスキーム集合。`rewrite-page-refs.ts`の
 * `SKIPPED_SCHEMES`と同一の値だが、そちら側を変更せず本ファイル単体で完結させるため
 * （#979の非スコープ: `rewritePageRefs`自体のロジック変更）意図的に複製している。
 */
const SKIPPED_SCHEMES: ReadonlySet<string> = new Set([
	'mailto:',
	'tel:',
	'sms:',
	'javascript:',
	'data:',
	'blob:',
	'vbscript:',
	'file:',
]);

interface RewriteContext {
	readonly baseUrl: string;
	readonly basePageOrigin: string;
	readonly pageIdLookup: PageIdLookup;
	readonly blockIndex: number;
	readonly rowIndex: number;
	readonly itemIndex: number;
	readonly errors: RewriteBlockRefsError[];
}

/**
 * BurgerEditorブロック（`BlockData[]`）内の同一オリジンURLフィールドを、既存の
 * `rewritePageRefs`と同じ正規化ルールで書き換える。`renderBlocks`（`@burger-editor/core`の
 * `render()`）を呼ぶ**前**に適用する — レンダリング後のHTML文字列に対して既存の
 * `rewritePageRefs`をタグ名ベースで適用する方式では、`button`アイテムと`download-file`
 * アイテムがどちらも`<a href>`へレンダリングされ、両者を区別する`data-bgi`属性は`<a>`
 * 自身ではなく祖先要素に付与されるため、「buttonはpage-ref扱い（`{{id}}`化あり）、
 * download-fileはasset扱い（root-relativeのみ）」という要件を確実に満たせない
 * （祖先追跡ロジックの新規実装が必要になり`rewritePageRefs`の複雑化を招く）。アイテム種別
 * （`item.name`）が型として確定しているこの段階でフィールドを直接書き換えることで、
 * 誤判定リスクなく両者を区別する。
 *
 * アイテム種別ごとの扱い（Issue #979の要件）:
 * - `wysiwyg`: `data.wysiwyg`（HTML文字列）に既存の`rewritePageRefs`をそのまま適用する。
 * - `button`: `data.link`をページ参照として扱う（既知ページなら`{{<id>}}`化、それ以外は
 *   root-relative化）。
 * - `image`: `data.path[]`の各要素をアセット参照として扱う（root-relativeのみ、
 *   `{{<id>}}`化は行わない）。
 * - `download-file`: `data.path`をアセット参照として扱う（`image`と同様）。
 * - `google-maps`/`youtube`の`url`、`title-h2`/`title-h3`/`table`: 対象外・無変更。
 * @param options
 * @example
 * ```ts
 * const { blocks, errors } = await rewriteBlockRefs({
 *   blocks: layoutToBlockData(results).blocks,
 *   baseUrl: 'https://example.com/about/',
 *   pageIdLookup: buildPageIdLookup(pageIds),
 * });
 * const html = await renderBlocks(blocks, { contentClass: 'js-bge-content' });
 * ```
 */
export async function rewriteBlockRefs(
	options: RewriteBlockRefsOptions,
): Promise<RewriteBlockRefsResult> {
	const { blocks, baseUrl, pageIdLookup } = options;

	let basePageOrigin: string;
	try {
		basePageOrigin = new URL(baseUrl).origin;
	} catch {
		return { blocks: [...blocks], errors: [] };
	}

	const errors: RewriteBlockRefsError[] = [];
	const nextBlocks: BlockData[] = [];

	for (const [blockIndex, block] of blocks.entries()) {
		const nextItems: BlockItem[][] = [];
		for (const [rowIndex, row] of block.items.entries()) {
			const nextRow: BlockItem[] = [];
			for (const [itemIndex, item] of row.entries()) {
				const ctx: RewriteContext = {
					baseUrl,
					basePageOrigin,
					pageIdLookup,
					blockIndex,
					rowIndex,
					itemIndex,
					errors,
				};
				nextRow.push(await rewriteBlockItem(item, ctx));
			}
			nextItems.push(nextRow);
		}
		nextBlocks.push({ ...block, items: nextItems });
	}

	return { blocks: nextBlocks, errors };
}

/**
 * @param item
 * @param ctx
 */
async function rewriteBlockItem(
	item: BlockItem,
	ctx: RewriteContext,
): Promise<BlockItem> {
	if (typeof item === 'string' || !item.data) {
		// `BlockItem`は`string`（アイテム名のみ）や`data`省略も許容する緩い型
		// （`@burger-editor/core`）のため、書き換え対象フィールドが存在しない場合はそのまま
		// 通す。
		return item;
	}

	switch (item.name) {
		case 'button': {
			const data = item.data as ButtonItemData;
			const link = resolveSameOriginUrl(data.link, ctx, true);
			return link === null ? item : { ...item, data: { ...data, link } };
		}
		case 'image': {
			const data = item.data as ImageEntryData;
			const resolvedPath = data.path.map((p) => resolveSameOriginUrl(p, ctx, false));
			if (resolvedPath.every((p) => p === null)) {
				// button/download-fileと同様、全要素が無変更（クロスオリジン等でnull）なら
				// 元のitem参照をそのまま返す — 呼び出し側が参照同一性で変更有無を判定できる
				// ようにするための不変条件。
				return item;
			}
			const path = resolvedPath.map((p, i) => p ?? data.path[i]!);
			return { ...item, data: { ...data, path } };
		}
		case 'download-file': {
			const data = item.data as DownloadFileItemData;
			const path = resolveSameOriginUrl(data.path, ctx, false);
			return path === null ? item : { ...item, data: { ...data, path } };
		}
		case 'wysiwyg': {
			return await rewriteWysiwygItem(
				item as { name: 'wysiwyg'; data: WysiwygItemData },
				ctx,
			);
		}
		default: {
			// google-maps/youtubeのurl（外部オリジン埋め込み用）、title-h2/title-h3/table
			// （URLフィールドなし）は対象外。
			return item;
		}
	}
}

/**
 * `wysiwyg`アイテムの`data.wysiwyg`（HTML文字列）に既存の`rewritePageRefs`を適用する。
 * 失敗時は元の内容を保持し`ctx.errors`へ記録する fail-soft 方針
 * （`extract-pages.ts`の`rewriteError`と同じ）。
 * @param item
 * @param item.name
 * @param item.data
 * @param ctx
 */
async function rewriteWysiwygItem(
	item: { name: 'wysiwyg'; data: WysiwygItemData },
	ctx: RewriteContext,
): Promise<BlockItem> {
	try {
		const wysiwyg = await rewritePageRefs({
			html: item.data.wysiwyg,
			baseUrl: ctx.baseUrl,
			pageIdLookup: ctx.pageIdLookup,
		});
		return { ...item, data: { wysiwyg } };
	} catch (error) {
		ctx.errors.push({
			blockIndex: ctx.blockIndex,
			rowIndex: ctx.rowIndex,
			itemIndex: ctx.itemIndex,
			error: error instanceof Error ? error : new Error(String(error)),
		});
		return item;
	}
}

/**
 * `BlockData`のフィールドから取り出した生URL文字列1個を、`rewritePageRefs`の既存resolverと
 * 同じセマンティクス（trim、bare-fragment/空文字は無視、非対応スキームとクロスオリジンは
 * 無変更、query/fragment保持）で解決する。`treatAsPageRef`が`true`かつ既知ページに一致する
 * 場合のみ`{{<id>}}`化する — `false`を渡す`image`/`download-file`は同じpathnameが既知ページと
 * 一致していても常にroot-relativeのままになる（この関数の存在意義そのもの）。
 * @param rawUrl
 * @param ctx
 * @param treatAsPageRef
 * @returns 書き換え後の値。無変更とすべき場合（空/bare-fragment/スキーム対象外/
 *   クロスオリジン/パース不能）は`null`。
 */
function resolveSameOriginUrl(
	rawUrl: string,
	ctx: RewriteContext,
	treatAsPageRef: boolean,
): string | null {
	const trimmed = rawUrl.trim();
	if (trimmed === '' || trimmed.startsWith('#')) {
		return null;
	}
	let resolved: URL;
	try {
		resolved = new URL(trimmed, ctx.baseUrl);
	} catch {
		return null;
	}
	if (SKIPPED_SCHEMES.has(resolved.protocol)) {
		return null;
	}
	if (resolved.origin !== ctx.basePageOrigin) {
		return null;
	}
	if (treatAsPageRef) {
		const exact = ctx.pageIdLookup.byExact.get(
			`${resolved.origin}${resolved.pathname}${resolved.search}`,
		);
		const id =
			exact ?? ctx.pageIdLookup.byPathname.get(`${resolved.origin}${resolved.pathname}`);
		if (id !== undefined) {
			return `{{${id}}}${resolved.search}${resolved.hash}`;
		}
	}
	return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
