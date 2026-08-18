import type { BlockTargetAdapter } from '../adapter.js';
import type { DownloadResult } from '../downloader/download-resources.js';
import type { ExtractMainCriterion } from '../html/extract-main-content.js';
import type { ArchiveSession, Frontmatter } from '../types.js';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { deal } from '@d-zero/dealer';

import { getFrontmatter } from '../archive/get-frontmatter.js';
import { getPageHtml } from '../archive/get-page-html.js';
import { urlToOutputPath } from '../downloader/url-to-output-path.js';
import { buildMainContentSelector } from '../html/build-main-content-selector.js';
import { extractMainContent } from '../html/extract-main-content.js';
import { formatFrontmatter } from '../html/format-frontmatter.js';
import { mergeMainContent } from '../html/merge-main-content.js';
import { parseMainTag } from '../html/parse-main-tag.js';

import { assignPageIds } from './assign-page-ids.js';
import { isMainConsistent } from './check-main-consistency.js';
import { DEFAULT_PRIMARY_VIEWPORT_NAME, selectPrimary } from './layout-to-block-data.js';
import {
	resolvePageLayouts,
	type ResolvePageLayoutResult,
} from './resolve-page-layout.js';
import {
	buildPageIdLookup,
	rewritePageRefs,
	type PageIdLookup,
} from './rewrite-page-refs.js';

/**
 * Single page to extract. Wrapped as an object so `@d-zero/dealer` (which
 * requires `T extends WeakKey`) can track progress against it.
 */
export interface ExtractPageItem {
	url: string;
}

export interface ExtractPagesOptions<TBlocks> {
	session: ArchiveSession;
	items: readonly ExtractPageItem[];
	outputDir: string;
	/**
	 * anatomistのレイアウト解析結果を変換先のブロックCMS向け構造化データへ変換する
	 * アダプタ。BurgerEditor向けには`burgerEditorAdapter`を渡す。
	 */
	adapter: BlockTargetAdapter<TBlocks>;
	/**
	 * {@link assignPageIds}の採番母集合となるURL一覧。省略時は`items`のURLから
	 * 採番する（従来互換）。`items`のスーパーセットであること — 呼び出し側が
	 * `items`を絞り込む場合（例: `migrate`の`include`オプション）でも、ここに
	 * アーカイブの全ページURLを渡すことで部分実行時のidが全体実行時と一致し、
	 * `items`に含まれないページへの`<a href>` / `<form action>`も
	 * {@link rewritePageRefs} 経由で `{{<id>}}` に書き換わる。`items`に含まれない
	 * URLは実際には抽出されないため、そのページ自身のfrontmatterは書き出されない
	 * （idの割り当て先が存在しないだけで、副作用はない）。
	 */
	idUrls?: readonly string[];
	/**
	 * `adapter.render`に転送されるクラス名。生成したブロック群を埋め込む既存main要素
	 * 自身の`classList`に追加する（新規ラッパー要素は追加しない、{@link mergeMainContent}
	 * 参照）。BurgerEditor向け（`burgerEditorAdapter`）では`editableArea`セレクタに対応
	 * させる値。移行先の変換対象設定に依存する値であり、決め打ちのデフォルトを持たせると
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
			 * Present only when {@link rewritePageRefs} (unconverted/fallback pages)
			 * or `adapter.rewriteRefs` (converted/partial pages, one aggregate
			 * `Error` per page even when multiple items failed) threw. The page
			 * body was still written (fail-soft), but with original asset / page
			 * references instead of the rewritten ones for the affected part.
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

interface ResolvedBlockOutcome<TBlocks> {
	readonly kind: 'converted' | 'partial';
	readonly blocks: TBlocks;
}

type BlockOutcome<TBlocks> = FatalBlockOutcome | ResolvedBlockOutcome<TBlocks>;

/**
 * For each page URL, reads the HTML snapshot from the archive, strips the
 * shared layout via {@link extractMainContent}, reads the per-page metadata
 * from the `.nitpicker` DB via {@link getFrontmatter}, converts the page's
 * anatomist layout analysis into the caller's `options.adapter` block
 * structure (see below), rewrites same-origin URL references via
 * {@link rewritePageRefs}, and writes the result to disk under `outputDir`
 * mirroring the URL pathname.
 *
 * Mirrors {@link import('../downloader/download-resources.js').downloadResources}
 * in shape: failures (including pages absent from the archive) are surfaced via
 * `onResult`, never thrown, so a single bad page does not abort the run.
 *
 * ## ブロック変換パイプライン（アダプタ経由、親Issue #977）
 *
 * 全ページの`getPageHtml`+`extractMainContent`+`getFrontmatter`を並列実行し、
 * main要素が見つかったページ（`extracted`候補）と見つからなかったページ（`fallback`）を
 * 仕分ける。main候補となった全URLはまとめて**1回**の{@link resolvePageLayouts}呼び出しに
 * 渡す — ページごとに呼ぶとPuppeteerブラウザをページ数だけlaunch/closeすることになり
 * 実運用サイト規模では致命的に遅くなるため、ブラウザを1回だけ起動して使い回す。続けて
 * 各ページについて`options.adapter.classify`で変換先の構造化データ（`TBlocks`）へ変換し、
 * `options.adapter.rewriteRefs`で構造化データ内の同一オリジンURLを書き換えてから
 * `options.adapter.render`でラッパーHTMLへ変換し、{@link mergeMainContent}でラッパー要素を
 * 挟まずに既存main要素へ埋め込み、frontmatter→書き出し、という既存の後段パイプラインへ
 * 合流させる。main要素検出自体（`extractMainContent`とanatomist検出結果の整合性）は
 * `options.adapter`の関与なくこの関数自身が判定する（{@link isMainConsistent}参照）。
 *
 * ブロック変換したページの本文はこの時点で既に`adapter.rewriteRefs`により書き換え済みの
 * ため、後段の`rewritePageRefs`（本文全体への同一オリジン参照書き換え）は**適用しない** —
 * 適用すると`adapter.rewriteRefs`が既に埋め込んだ`{{<id>}}`トークンを`rewritePageRefs`が
 * 通常URLとして再解釈し、`%7B%7B<id>%7D%7D`のようなpercent-encode文字列へ壊してしまう
 * （ブロック変換が効かなかったページ・main非検出ページは元HTMLに`{{<id>}}`token が
 * 存在しないため、従来通り`rewritePageRefs`を適用する）。
 *
 * ### ページ単位の致命的フォールバック
 *
 * 以下のいずれかに該当する場合、そのページのブロック変換は諦め、`blockConversion:
 * 'fallback'`として**ページ全体の元の完全なHTML**（{@link toRawFallback}が組み立てる、
 * adapter未介入のプレーンHTML）を書き出す（品質判断によるページ全体フォールバックは
 * 行わない — 個別ブロックの低信頼度は`blockConversion: 'partial'`として扱い、ページ全体
 * は諦めない）:
 *
 * - {@link resolvePageLayouts}がそのページについて完全に失敗した（`missing` outcome。
 *   ライブURL到達不可等）
 * - 事前生成JSON（`--layout-json`）使用時、anatomistが検出したmain要素と
 *   `extractMainContent`がマッチした要素の`tagName`/`id`/`classList`が一致しない
 *   （{@link isMainConsistent}、#978。ライブ実行時は`resolvePageLayouts`呼び出し時に
 *   `extractMainContent`のマッチ結果から構築したセレクタを`mainContentSelector`として
 *   渡し、anatomistに同じ要素を解析させているため構造的に整合が保証されており、この
 *   チェックは行わない）
 * - `options.adapter.classify`が`{kind: 'fatal'}`を返した（構造化できる構造が見つから
 *   なかった等、理由はアダプタ実装依存）
 * - `options.adapter.render`または{@link mergeMainContent}が例外を投げた
 *
 * Output layout per file:
 *
 * - A `---\n…\n---\n` YAML frontmatter block is prepended. It always carries
 *   the page's integer `id` assigned by {@link assignPageIds}, plus any
 *   non-empty meta from the DB. The id is the only mandatory field.
 * - The body that follows depends on the outcome:
 *   - `extracted`（`blockConversion: 'converted'`/`'partial'`）— main要素の`outerHTML`
 *     フラグメント。子要素はadapterが生成したブロック群に置き換わり、`contentClass`が
 *     main要素自身の`classList`に追加されている。
 *   - `extracted`（`blockConversion: 'fallback'`）／`fallback` — the entire original
 *     document, DOCTYPE included.
 * - In both cases same-origin URLs are rewritten: `<a href>` / `<form action>`
 *   pointing at a known page → `{{<id>}}<query><fragment>`; other same-origin
 *   asset references → root-relative paths. Cross-origin URLs are left
 *   untouched. ブロック変換したページ（`converted`/`partial`）は`adapter.rewriteRefs`が
 *   アイテム種別ごとにページ参照/アセット参照を判定する（詳細は使用中のアダプタ実装の
 *   JSDoc参照。例: {@link import('./burger-editor-adapter.js').burgerEditorAdapter}）。
 *
 * Rewrite failure is fail-soft: the original HTML body is written and
 * `rewriteError` is set on the result so the caller can log a warning without
 * losing the page.
 * @param options
 */
export async function extractPages<TBlocks>(
	options: ExtractPagesOptions<TBlocks>,
): Promise<void> {
	const {
		session,
		items,
		outputDir,
		contentClass,
		adapter,
		layoutJsonPath,
		idUrls,
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

	// Build the URL → id map up front from `idUrls` — the full archive page
	// list when the caller filters `items` down to a subset (see
	// MigrateOptions.include) — or, by default, from the full items list.
	// Each page's id stays stable even when only a subset of pages runs or
	// succeeds, because the map is computed from this invariant population
	// before any page worker runs. Build the pre-keyed lookup once alongside
	// it so per-page rewritePageRefs calls don't pay an O(N²) rebuild.
	const pageIds = assignPageIds(idUrls ?? items.map((item) => item.url));
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
			items: matchedStates.map((state) => ({
				url: state.entry.url,
				mainContentSelector: buildMainContentSelector(parseMainTag(state.extractedHtml)),
			})),
			layoutJsonPath,
			limit,
			signal,
			onResult: (event) => {
				layoutResultsByUrl.set(event.url, event);
			},
		});
	}

	// --- Resolve each matched page's TBlocks (or the fatal reason it can't be
	// produced), independent of rendering. ---
	const blockOutcomeByUrl = new Map<string, BlockOutcome<TBlocks>>();
	for (const state of matchedStates) {
		blockOutcomeByUrl.set(
			state.entry.url,
			resolveBlockOutcome(state, layoutResultsByUrl, adapter),
		);
	}

	// --- download-file dedupe + real DL, batched across every page that has a
	// usable TBlocks tree (fatal pages have nothing to scan). ---
	const blocksByUrl = new Map<string, TBlocks>();
	for (const [url, outcome] of blockOutcomeByUrl) {
		if (outcome.kind !== 'fatal') {
			blocksByUrl.set(url, outcome.blocks);
		}
	}
	if (blocksByUrl.size > 0) {
		await adapter.downloadFiles?.(blocksByUrl, {
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
					const fallback = toRawFallback(state);
					let bodyHtml = fallback.html;
					let rewriteError: Error | undefined;
					try {
						bodyHtml = await rewritePageRefs({
							html: fallback.html,
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
				const built = await buildExtractedBody(
					state,
					blockOutcome,
					contentClass,
					entry.url,
					pageIdLookup,
					adapter,
				);

				let bodyHtml = built.body;
				let rewriteError: Error | undefined;
				if (built.alreadyRewritten) {
					// rewriteBlockRefsが既にbuilt.bodyを完全に書き換え済み。ここで
					// rewritePageRefsをbody全体へ再適用すると、既に埋め込まれた`{{<id>}}`
					// トークンが通常URLとして再解釈され文字化けするため、二重適用を避ける
					// （buildExtractedBodyのJSDoc参照）。
					rewriteError = aggregateBlockRewriteErrors(built.blockRewriteErrors);
				} else {
					try {
						bodyHtml = await rewritePageRefs({
							html: built.body,
							baseUrl: entry.url,
							pageIdLookup,
						});
					} catch (error) {
						rewriteError = toError(error);
					}
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
 * `TBlocks`の形に依存しないmain要素検出結果の整合チェック（#978）はこの関数自身が行い、
 * それを通過したものだけを`adapter.classify`（アダプタ実装依存の構造化可否判定）へ渡す。
 *
 * main要素検出結果の整合チェックは`resolved-from-json`のときのみ行う。`resolved-live`は
 * ライブ解析の呼び出し時点で`extractMainContent`のマッチ結果から構築したセレクタを
 * `mainContentSelector`として渡し、anatomistに同じ要素を解析させているため
 * （`extract-pages.ts`の`resolvePageLayouts`呼び出し箇所参照）、構造的に整合が保証されて
 * おり追加チェックは不要。
 * @param state
 * @param state.entry
 * @param state.entry.url
 * @param state.extractedHtml
 * @param layoutResultsByUrl
 * @param adapter
 */
function resolveBlockOutcome<TBlocks>(
	state: {
		readonly entry: { readonly url: string };
		readonly extractedHtml: string;
	},
	layoutResultsByUrl: ReadonlyMap<string, ResolvePageLayoutResult>,
	adapter: BlockTargetAdapter<TBlocks>,
): BlockOutcome<TBlocks> {
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

	const { results, outcome } = layoutEvent;
	if (outcome === 'resolved-from-json') {
		const primary = selectPrimary(results, DEFAULT_PRIMARY_VIEWPORT_NAME);
		const matchedTag = parseMainTag(state.extractedHtml);
		if (!isMainConsistent(matchedTag, primary?.root ?? null)) {
			return {
				kind: 'fatal',
				error: new Error(
					'anatomist(事前生成JSON)とextractMainContentのmain要素検出結果が不整合です（tagName/id/classList比較、#978）',
				),
			};
		}
	}

	return adapter.classify(results);
}

/**
 * 「変換が一切行われない」2つのケース（main非検出／main検出はできたがadapterが構造化
 * できなかった）を統一的に表す内部ヘルパー値（adapterの公開型ではなく、この関数自身の
 * 実装詳細）。常に元の完全なHTML（DOCTYPE含む）を持つ。
 */
interface RawFallback {
	readonly html: string;
}

/**
 * @param state
 * @param state.originalHtml
 * @param state.extractedHtml
 * @param state.matched
 */
function toRawFallback(state: {
	readonly originalHtml: string;
	readonly extractedHtml: string;
	readonly matched: boolean;
}): RawFallback {
	// main非検出時（`!matched`）は`extractMainContent`が不一致で`extractedHtml`に元のHTML
	// 全体そのものを返すため、`originalHtml`/`extractedHtml`のどちらを使っても値は一致する
	// が、意図を明示するため分岐する。
	return { html: state.matched ? state.originalHtml : state.extractedHtml };
}

/**
 * `blockOutcome`から本文HTMLと`blockConversion`分類を組み立てる。ブロック変換できた
 * ページ（`converted`/`partial`）は`adapter.render`を呼ぶ**前**に`adapter.rewriteRefs`で
 * `TBlocks`内の同一オリジンURLを書き換えるため、返す`body`はこの時点で既に書き換え済み
 * （`alreadyRewritten: true`）— 呼び出し側は`rewritePageRefs`を`body`全体へ重ねて適用しては
 * ならない（`{{<id>}}`トークンの二重処理による文字化けを防ぐため）。`adapter.render`/
 * {@link mergeMainContent}が例外を投げた場合もここでfatalとして扱い、{@link toRawFallback}
 * が組み立てるページ全体の元の完全なHTMLへフォールバックする（この場合
 * `alreadyRewritten: false`— 元の完全なHTMLは未書き換えのため、呼び出し側の従来通りの
 * `rewritePageRefs`適用が必要）。
 * @param state
 * @param state.originalHtml
 * @param state.extractedHtml
 * @param state.matched
 * @param blockOutcome
 * @param contentClass
 * @param baseUrl
 * @param pageIdLookup
 * @param adapter
 */
async function buildExtractedBody<TBlocks>(
	state: {
		readonly originalHtml: string;
		readonly extractedHtml: string;
		readonly matched: boolean;
	},
	blockOutcome: BlockOutcome<TBlocks>,
	contentClass: string,
	baseUrl: string,
	pageIdLookup: PageIdLookup,
	adapter: BlockTargetAdapter<TBlocks>,
): Promise<{
	body: string;
	blockConversion: 'converted' | 'partial' | 'fallback';
	blockConversionError?: Error;
	alreadyRewritten: boolean;
	blockRewriteErrors?: readonly Error[];
}> {
	if (blockOutcome.kind === 'fatal') {
		return {
			body: toRawFallback(state).html,
			blockConversion: 'fallback',
			blockConversionError: blockOutcome.error,
			alreadyRewritten: false,
		};
	}
	try {
		const rewritten = await adapter.rewriteRefs(
			blockOutcome.blocks,
			baseUrl,
			pageIdLookup,
		);
		const wrapperHtml = await adapter.render(rewritten.blocks, contentClass);
		const merged = mergeMainContent({
			mainHtml: state.extractedHtml,
			wrapperHtml,
			contentClass,
		});
		return {
			body: merged,
			blockConversion: blockOutcome.kind,
			alreadyRewritten: true,
			...(rewritten.errors.length > 0 ? { blockRewriteErrors: rewritten.errors } : {}),
		};
	} catch (error) {
		return {
			body: toRawFallback(state).html,
			blockConversion: 'fallback',
			blockConversionError: toError(error),
			alreadyRewritten: false,
		};
	}
}

/**
 * `adapter.rewriteRefs`が返す複数の項目単位のエラー（どのアイテムが失敗したかの詳細は
 * `error.message`にアダプタ側が整形済みで含める契約、{@link BlockTargetAdapter}参照）を、
 * 既存の`rewriteError?: Error`（1ページにつき1個）という`ExtractPageResult`の形へ合わせる
 * ため単一の`Error`へ集約する。
 * @param errors
 */
function aggregateBlockRewriteErrors(
	errors: readonly Error[] | undefined,
): Error | undefined {
	if (!errors || errors.length === 0) {
		return undefined;
	}
	const detail = errors.map((e) => e.message).join('; ');
	return new Error(`adapter.rewriteRefs failed for ${errors.length} item(s): ${detail}`);
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
