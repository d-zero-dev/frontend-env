import type { DownloadResult } from '../downloader/download-resources.js';
import type { ExtractMainCriterion } from '../html/extract-main-content.js';
import type { ArchiveSession, Frontmatter } from '../types.js';
import type { BlockData } from '@burger-editor/core';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { deal } from '@d-zero/dealer';

import { getFrontmatter } from '../archive/get-frontmatter.js';
import { getPageHtml } from '../archive/get-page-html.js';
import { urlToOutputPath } from '../downloader/url-to-output-path.js';
import { extractMainContent } from '../html/extract-main-content.js';
import { formatFrontmatter } from '../html/format-frontmatter.js';
import { mergeMainContent } from '../html/merge-main-content.js';

import { assignPageIds } from './assign-page-ids.js';
import { isMainConsistent } from './check-main-consistency.js';
import { downloadBlockFiles } from './download-block-files.js';
import {
	DEFAULT_PRIMARY_VIEWPORT_NAME,
	layoutToBlockData,
	selectPrimary,
} from './layout-to-block-data.js';
import { renderBlocks } from './render-blocks.js';
import {
	resolvePageLayouts,
	type ResolvePageLayoutResult,
} from './resolve-page-layout.js';
import { buildPageIdLookup, rewritePageRefs } from './rewrite-page-refs.js';

/**
 * Single page to extract. Wrapped as an object so `@d-zero/dealer` (which
 * requires `T extends WeakKey`) can track progress against it.
 */
export interface ExtractPageItem {
	url: string;
}

export interface ExtractPagesOptions {
	session: ArchiveSession;
	items: readonly ExtractPageItem[];
	outputDir: string;
	/**
	 * BurgerEditorの`editableArea`セレクタに対応させるクラス名。生成したブロック群を
	 * 埋め込む既存main要素自身の`classList`に追加する（新規ラッパー要素は追加しない）。
	 * 移行先サイトのBurgerEditor設定に依存する値であり、決め打ちのデフォルトを持たせると
	 * 気づかれないまま不整合な出力を生成しうるため必須。
	 */
	contentClass: string;
	/**
	 * 事前生成済みのanatomistレイアウト解析JSONL（1ファイルで対象URL全件分）。
	 * {@link resolvePageLayouts}にそのまま転送される。省略時は全ページをライブ解析する。
	 */
	layoutJsonPath?: string;
	/**
	 * 通常のリソースDL（`listInternalResources`由来）で既にカバー済みの絶対URL集合。
	 * ブロック内`download-file`アイテムの実DL時、二重ダウンロードを避けるために使う。
	 * 省略時は空集合（＝すべてのdownload-file候補を新規DL対象とみなす）。
	 */
	knownResourceUrls?: ReadonlySet<string>;
	/**
	 * Maximum concurrent page extractions. `resolvePageLayouts`の並列数（ライブレイアウト
	 * 解析の並列数）にも同じ値を転送する（専用オプションは設けない）。Defaults to 10.
	 */
	limit?: number;
	onResult?: (event: ExtractPageResult) => void;
	/** ブロック内download-fileアイテムの追加DL進捗。`downloadResources`と同じイベント形。 */
	onResource?: (event: DownloadResult) => void;
	signal?: AbortSignal;
}

export type ExtractPageResult =
	| {
			url: string;
			outcome: 'extracted';
			outputPath: string;
			matchedBy: ExtractMainCriterion;
			/**
			 * ブロック単位の変換結果。`converted`=全ブロックが構造変換に成功、`partial`=
			 * 一部ブロックのみ低信頼度でwysiwygフォールバックされたが致命的ではない、
			 * `fallback`=致命的エラーによりページ全体がプレーンHTML（`data-bge-*`マーカー
			 * 無し）のまま出力された。
			 */
			blockConversion: 'converted' | 'partial' | 'fallback';
			/** `blockConversion`が`fallback`のときのみセットされる致命的エラー。 */
			blockConversionError?: Error;
			/**
			 * Present only when {@link rewritePageRefs} threw. The page body was
			 * still written (fail-soft), but with original asset / page references
			 * instead of the rewritten ones.
			 */
			rewriteError?: Error;
			/**
			 * Present only when {@link getFrontmatter} threw. The page body was
			 * still written and the id-only frontmatter still prepended, but the
			 * DB-sourced meta (title / description / og / …) is missing.
			 */
			metaError?: Error;
	  }
	| {
			url: string;
			outcome: 'fallback';
			outputPath: string;
			/** See `extracted.rewriteError`. */
			rewriteError?: Error;
			/** See `extracted.metaError`. */
			metaError?: Error;
	  }
	| {
			url: string;
			outcome: 'missing';
	  }
	| {
			url: string;
			outcome: 'failed';
			error: Error;
	  };

/**
 * ページ単位の致命的ブロック変換エラー（main検出はできたが、それ以降のパイプラインで
 * 復旧不能なエラーが起きた）を表す。この場合は{@link BlockOutcome}全体を諦め、呼び出し側が
 * ページ全体をプレーンHTMLとして書き出す。
 */
interface FatalBlockOutcome {
	readonly kind: 'fatal';
	readonly error: Error;
}

interface ResolvedBlockOutcome {
	readonly kind: 'converted' | 'partial';
	readonly blocks: BlockData[];
}

type BlockOutcome = FatalBlockOutcome | ResolvedBlockOutcome;

/**
 * For each page URL, reads the HTML snapshot from the archive, strips the
 * shared layout via {@link extractMainContent}, reads the per-page metadata
 * from the `.nitpicker` DB via {@link getFrontmatter}, converts the page's
 * anatomist layout analysis into BurgerEditor blocks (see below), rewrites
 * same-origin URL references via {@link rewritePageRefs}, and writes the
 * result to disk under `outputDir` mirroring the URL pathname.
 *
 * Mirrors {@link import('../downloader/download-resources.js').downloadResources}
 * in shape: failures (including pages absent from the archive) are surfaced via
 * `onResult`, never thrown, so a single bad page does not abort the run.
 *
 * ## BurgerEditorブロック変換パイプライン（親Issue #977）
 *
 * 全ページの`getPageHtml`+`extractMainContent`+`getFrontmatter`を並列実行し、
 * main要素が見つかったページ（`extracted`候補）と見つからなかったページ（`fallback`）を
 * 仕分ける。main候補となった全URLはまとめて**1回**の{@link resolvePageLayouts}呼び出しに
 * 渡す — ページごとに呼ぶとPuppeteerブラウザをページ数だけlaunch/closeすることになり
 * 実運用サイト規模では致命的に遅くなるため、ブラウザを1回だけ起動して使い回す。続けて
 * 各ページについて{@link layoutToBlockData}でBurgerEditorの`BlockData[]`へ変換し、
 * {@link renderBlocks}で`data-bge-*`付きHTMLへ変換し、{@link mergeMainContent}で
 * ラッパー要素を挟まずに既存main要素へ埋め込み、`rewritePageRefs`→frontmatter→
 * 書き出し、という既存の後段パイプラインへ合流させる。
 *
 * ### ページ単位の致命的フォールバック
 *
 * 以下のいずれかに該当する場合、そのページのブロック変換は諦め、`blockConversion:
 * 'fallback'`として**ページ全体の元の完全なHTML**（`data-bge-*`マーカー無し）を書き出す
 * （品質判断によるページ全体フォールバックは行わない — 個別ブロックの低信頼度は
 * `blockConversion: 'partial'`として扱い、ページ全体は諦めない）:
 *
 * - {@link resolvePageLayouts}がそのページについて完全に失敗した（`missing` outcome。
 *   ライブURL到達不可等）
 * - anatomistの`mainSelector`と`extractMainContent`がマッチした要素が一致しない
 *   （{@link isMainConsistent}による簡易判定。厳密な整合化は#978の責務）
 * - {@link layoutToBlockData}が空の`blocks`を返した（anatomist側で`root`が
 *   見つからなかった — mainは検出できたがブロック化できる構造が無い）
 * - {@link renderBlocks}または{@link mergeMainContent}が例外を投げた
 *
 * Output layout per file:
 *
 * - A `---\n…\n---\n` YAML frontmatter block is prepended. It always carries
 *   the page's integer `id` assigned by {@link assignPageIds}, plus any
 *   non-empty meta from the DB. The id is the only mandatory field.
 * - The body that follows depends on the outcome:
 *   - `extracted`（`blockConversion: 'converted'`/`'partial'`）— main要素の`outerHTML`
 *     フラグメント。子要素はBurgerEditorブロック群に置き換わり、`contentClass`が
 *     main要素自身の`classList`に追加されている。
 *   - `extracted`（`blockConversion: 'fallback'`）／`fallback` — the entire original
 *     document, DOCTYPE included.
 * - In both cases same-origin URLs are rewritten: `<a href>` / `<form action>`
 *   pointing at a known page → `{{<id>}}<query><fragment>`; other same-origin
 *   asset references → root-relative paths. Cross-origin URLs are left
 *   untouched. 生成したブロック内のURL自体の書き換えは対象外（#979の責務）。
 *
 * Rewrite failure is fail-soft: the original HTML body is written and
 * `rewriteError` is set on the result so the caller can log a warning without
 * losing the page.
 * @param options
 */
export async function extractPages(options: ExtractPagesOptions): Promise<void> {
	const {
		session,
		items,
		outputDir,
		contentClass,
		layoutJsonPath,
		knownResourceUrls = new Set(),
		limit = 10,
		onResult,
		onResource,
		signal,
	} = options;
	if (items.length === 0 || signal?.aborted) {
		// Short-circuit when the signal is already aborted (e.g. SIGINT during
		// the preceding download phase) so we don't litter outputDir with
		// pre-created directories for work that will never run.
		return;
	}

	interface PreparedPage {
		readonly url: string;
		readonly outputPath: string;
		readonly resolveError: Error | null;
	}
	// Resolve every page URL to a disk path. Detect intra-page outputPath
	// collisions (e.g. `/about/` and `/about/index.html` both map to
	// `about/index.html`): the first winner runs normally, every subsequent
	// duplicate is reported as `failed` so two workers never race writeFile()
	// against the same path.
	const seenPaths = new Set<string>();
	const prepared: PreparedPage[] = items.map((item) => {
		try {
			const outputPath = urlToOutputPath(item.url, outputDir, 'text/html');
			if (seenPaths.has(outputPath)) {
				return {
					url: item.url,
					outputPath: '',
					resolveError: new Error(
						`Duplicate output path for page URL: ${item.url} → ${outputPath}`,
					),
				};
			}
			seenPaths.add(outputPath);
			return { url: item.url, outputPath, resolveError: null };
		} catch (error) {
			return { url: item.url, outputPath: '', resolveError: toError(error) };
		}
	});

	const directories = new Set<string>();
	for (const entry of prepared) {
		if (entry.resolveError === null) {
			directories.add(path.dirname(entry.outputPath));
		}
	}
	await Promise.all([...directories].map((dir) => mkdir(dir, { recursive: true })));

	// Build the URL → id map up front from the full items list. Each page's id
	// stays stable even when only a subset of pages succeeds, because the map
	// is computed before any page worker runs. Build the pre-keyed lookup once
	// alongside it so per-page rewritePageRefs calls don't pay an O(N²)
	// rebuild.
	const pageIds = assignPageIds(items.map((item) => item.url));
	const pageIdLookup = buildPageIdLookup(pageIds);

	// --- Fetch + extractMainContent + meta, per page, concurrent ---
	interface PageExtractState {
		readonly entry: PreparedPage;
		readonly originalHtml: string;
		readonly matched: boolean;
		readonly matchedBy?: ExtractMainCriterion;
		readonly extractedHtml: string;
		readonly meta: Frontmatter | null;
		readonly metaError?: Error;
	}
	const extractedByUrl = new Map<string, PageExtractState>();

	await deal(
		prepared,
		(entry) => async () => {
			if (entry.resolveError !== null) {
				onResult?.({ url: entry.url, outcome: 'failed', error: entry.resolveError });
				return;
			}
			try {
				// Parallelise the two SQLite reads — they're independent and the
				// page worker is the loop hot-path. Use `allSettled` so a flaky
				// meta read doesn't lose the HTML body: we already paid the cost
				// of fetching the page, write what we have and surface the meta
				// failure separately rather than dropping the page.
				const [htmlSettled, metaSettled] = await Promise.allSettled([
					getPageHtml(session, entry.url),
					getFrontmatter(session, entry.url),
				]);
				if (htmlSettled.status === 'rejected') {
					throw htmlSettled.reason;
				}
				const html = htmlSettled.value;
				if (html === null) {
					onResult?.({ url: entry.url, outcome: 'missing' });
					return;
				}
				const extracted = extractMainContent(html);
				// `matchedBy` is only ever `undefined` when `matched` is `false` in
				// practice, but `ExtractMainResult`'s type doesn't encode that —
				// treat the pair as the single source of truth for "did we
				// actually find a main candidate".
				const matched = extracted.matched && extracted.matchedBy !== undefined;
				const meta = metaSettled.status === 'fulfilled' ? metaSettled.value : null;
				const metaError =
					metaSettled.status === 'rejected' ? toError(metaSettled.reason) : undefined;
				extractedByUrl.set(entry.url, {
					entry,
					originalHtml: html,
					matched,
					matchedBy: matched ? extracted.matchedBy : undefined,
					extractedHtml: extracted.html,
					meta,
					metaError,
				});
			} catch (error) {
				onResult?.({ url: entry.url, outcome: 'failed', error: toError(error) });
			}
		},
		{ limit, signal },
	);

	// --- Batch layout resolution: one resolvePageLayouts call for every
	// matched URL, so the Puppeteer browser (when needed) launches once for
	// the whole run instead of once per page. ---
	const matchedStates = [...extractedByUrl.values()].filter((state) => state.matched);
	const layoutResultsByUrl = new Map<string, ResolvePageLayoutResult>();
	if (matchedStates.length > 0) {
		await resolvePageLayouts({
			items: matchedStates.map((state) => ({ url: state.entry.url })),
			layoutJsonPath,
			limit,
			signal,
			onResult: (event) => {
				layoutResultsByUrl.set(event.url, event);
			},
		});
	}

	// --- Resolve each matched page's BlockData (or the fatal reason it
	// can't be produced), independent of rendering. ---
	const blockOutcomeByUrl = new Map<string, BlockOutcome>();
	for (const state of matchedStates) {
		blockOutcomeByUrl.set(
			state.entry.url,
			resolveBlockOutcome(state, layoutResultsByUrl),
		);
	}

	// --- download-file dedupe + real DL, batched across every page that has a
	// usable BlockData tree (fatal pages have nothing to scan). ---
	const blocksByUrl = new Map<string, readonly BlockData[]>();
	for (const [url, outcome] of blockOutcomeByUrl) {
		if (outcome.kind !== 'fatal') {
			blocksByUrl.set(url, outcome.blocks);
		}
	}
	if (blocksByUrl.size > 0) {
		await downloadBlockFiles({
			blocksByUrl,
			outputDir,
			knownResourceUrls,
			limit,
			onResult: onResource,
			signal,
		});
	}

	// --- Render + merge + rewrite + frontmatter + write, per page. ---
	await deal(
		[...extractedByUrl.values()],
		(state) => async () => {
			const { entry } = state;
			try {
				if (!state.matched) {
					let bodyHtml = state.extractedHtml;
					let rewriteError: Error | undefined;
					try {
						bodyHtml = await rewritePageRefs({
							html: state.extractedHtml,
							baseUrl: entry.url,
							pageIdLookup,
						});
					} catch (error) {
						rewriteError = toError(error);
					}
					await writeFile(
						entry.outputPath,
						buildFrontmatterBlock(state, pageIds) + bodyHtml,
						'utf8',
					);
					onResult?.({
						url: entry.url,
						outcome: 'fallback',
						outputPath: entry.outputPath,
						...(rewriteError ? { rewriteError } : {}),
						...(state.metaError ? { metaError: state.metaError } : {}),
					});
					return;
				}

				const blockOutcome = blockOutcomeByUrl.get(entry.url)!;
				const built = await buildExtractedBody(state, blockOutcome, contentClass);

				let bodyHtml = built.body;
				let rewriteError: Error | undefined;
				try {
					bodyHtml = await rewritePageRefs({
						html: built.body,
						baseUrl: entry.url,
						pageIdLookup,
					});
				} catch (error) {
					rewriteError = toError(error);
				}

				await writeFile(
					entry.outputPath,
					buildFrontmatterBlock(state, pageIds) + bodyHtml,
					'utf8',
				);
				onResult?.({
					url: entry.url,
					outcome: 'extracted',
					outputPath: entry.outputPath,
					matchedBy: state.matchedBy!,
					blockConversion: built.blockConversion,
					...(built.blockConversionError
						? { blockConversionError: built.blockConversionError }
						: {}),
					...(rewriteError ? { rewriteError } : {}),
					...(state.metaError ? { metaError: state.metaError } : {}),
				});
			} catch (error) {
				onResult?.({ url: entry.url, outcome: 'failed', error: toError(error) });
			}
		},
		{ limit, signal },
	);
}

/**
 * `resolvePageLayouts`の結果と`extractMainContent`の結果から、そのページのブロック変換が
 * 続行可能かを判定する。続行不能（致命的）と判定した場合は理由を`Error`として保持する。
 * @param state
 * @param state.entry
 * @param state.entry.url
 * @param state.originalHtml
 * @param state.extractedHtml
 * @param layoutResultsByUrl
 */
function resolveBlockOutcome(
	state: {
		readonly entry: { readonly url: string };
		readonly originalHtml: string;
		readonly extractedHtml: string;
	},
	layoutResultsByUrl: ReadonlyMap<string, ResolvePageLayoutResult>,
): BlockOutcome {
	const layoutEvent = layoutResultsByUrl.get(state.entry.url);
	if (!layoutEvent) {
		return {
			kind: 'fatal',
			error: new Error('resolvePageLayouts produced no result for this URL'),
		};
	}
	if (layoutEvent.outcome === 'missing') {
		return { kind: 'fatal', error: layoutEvent.error };
	}

	const { results } = layoutEvent;
	const primary = selectPrimary(results, DEFAULT_PRIMARY_VIEWPORT_NAME);
	if (
		!isMainConsistent(
			state.originalHtml,
			state.extractedHtml,
			primary?.mainSelector ?? null,
		)
	) {
		return {
			kind: 'fatal',
			error: new Error(
				'anatomist(mainSelector)とextractMainContentのmain要素検出結果が不整合です（簡易判定 — 厳密な整合化は#978）',
			),
		};
	}

	const { blocks, fallbacks } = layoutToBlockData(results);
	if (blocks.length === 0) {
		return {
			kind: 'fatal',
			error: new Error(
				'レイアウト解析でブロック化可能なmain要素の子構造が見つかりませんでした',
			),
		};
	}

	return { kind: fallbacks.length > 0 ? 'partial' : 'converted', blocks };
}

/**
 * `blockOutcome`から、rewritePageRefs適用前の本文HTMLと`blockConversion`分類を組み立てる。
 * `renderBlocks`/`mergeMainContent`が例外を投げた場合もここでfatalとして扱い、ページ全体の
 * 元の完全なHTMLへフォールバックする。
 * @param state
 * @param state.originalHtml
 * @param state.extractedHtml
 * @param blockOutcome
 * @param contentClass
 */
async function buildExtractedBody(
	state: { readonly originalHtml: string; readonly extractedHtml: string },
	blockOutcome: BlockOutcome,
	contentClass: string,
): Promise<{
	body: string;
	blockConversion: 'converted' | 'partial' | 'fallback';
	blockConversionError?: Error;
}> {
	if (blockOutcome.kind === 'fatal') {
		return {
			body: state.originalHtml,
			blockConversion: 'fallback',
			blockConversionError: blockOutcome.error,
		};
	}
	try {
		const wrapperHtml = await renderBlocks(blockOutcome.blocks, { contentClass });
		const merged = mergeMainContent({
			mainHtml: state.extractedHtml,
			wrapperHtml,
			contentClass,
		});
		return { body: merged, blockConversion: blockOutcome.kind };
	} catch (error) {
		return {
			body: state.originalHtml,
			blockConversion: 'fallback',
			blockConversionError: toError(error),
		};
	}
}

/**
 * @param state
 * @param state.entry
 * @param state.entry.url
 * @param state.meta
 * @param pageIds
 */
function buildFrontmatterBlock(
	state: { readonly entry: { readonly url: string }; readonly meta: Frontmatter | null },
	pageIds: ReadonlyMap<string, number>,
): string {
	const id = pageIds.get(state.entry.url);
	// Spread `meta` first so the computed integer id always wins over a stray
	// `id` field the DB might one day surface — keeping the frontmatter id
	// consistent with the {{<id>}} tokens rewritePageRefs emits on peer pages.
	const frontmatterMeta = id === undefined ? state.meta : { ...state.meta, id };
	// `frontmatterMeta === null` only happens when assignPageIds dropped the
	// URL (unparsable) AND getFrontmatter returned no row; the page is still
	// written body-only so downstream callers can decide what to do with the
	// orphan.
	return frontmatterMeta === null ? '' : formatFrontmatter(frontmatterMeta);
}

/**
 * @param error
 */
function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}
