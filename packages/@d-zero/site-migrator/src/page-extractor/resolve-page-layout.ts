import type { LayoutAnalysisResult } from '@d-zero/anatomist/types';
import type { ErrorKind } from '@nitpicker/query';
import type { Browser } from 'puppeteer';

import { readFile } from 'node:fs/promises';

import { analyzePageLayout } from '@d-zero/anatomist';
import { deal } from '@d-zero/dealer';
import { classifyErrorKind } from '@nitpicker/query';
import { launch } from 'puppeteer';

/**
 * Single page to resolve a layout for. Wrapped as an object so
 * `@d-zero/dealer` (which requires `T extends WeakKey`) can track progress
 * against it (same reason as `ExtractPageItem` in `extract-pages.ts`).
 */
export interface ResolvePageLayoutItem {
	url: string;
}

export type ResolvePageLayoutResult =
	| { url: string; outcome: 'resolved-from-json'; results: LayoutAnalysisResult[] }
	| { url: string; outcome: 'resolved-live'; results: LayoutAnalysisResult[] }
	| { url: string; outcome: 'missing'; error: Error; kind: ErrorKind };

export interface ResolvePageLayoutsOptions {
	items: readonly ResolvePageLayoutItem[];
	/**
	 * Path to a pre-generated anatomist JSONL file. URLs present in it are
	 * used as-is; URLs absent from it (or when this option is omitted
	 * entirely) fall back to live analysis.
	 */
	layoutJsonPath?: string;
	/**
	 * Maximum concurrent live analyses. Intended to share the caller's
	 * `--extract-limit` value rather than introduce a separate flag.
	 * Defaults to 10, matching {@link import('./extract-pages.js').extractPages}.
	 */
	limit?: number;
	onResult?: (event: ResolvePageLayoutResult) => void;
	signal?: AbortSignal;
}

/**
 * Narrows `unknown` to `LayoutAnalysisResult` by checking the shape of the
 * fields this module reads (`url`, `viewport.name`/`.width`, `mainSelector`,
 * presence of `root`). Does not recurse into `root`'s `LayoutBlock` tree —
 * anatomist owns that shape, and re-validating it here would just duplicate
 * anatomist's own type without adding safety.
 * @param value
 */
function isLayoutAnalysisResult(value: unknown): value is LayoutAnalysisResult {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	if (typeof candidate.url !== 'string') {
		return false;
	}
	if (typeof candidate.viewport !== 'object' || candidate.viewport === null) {
		return false;
	}
	const viewport = candidate.viewport as Record<string, unknown>;
	if (typeof viewport.name !== 'string' || typeof viewport.width !== 'number') {
		return false;
	}
	if (candidate.mainSelector !== null && typeof candidate.mainSelector !== 'string') {
		return false;
	}
	// `root` is `LayoutBlock | null`; only check it's present as one of those
	// two shapes (`typeof null === 'object'` covers both in one check).
	return typeof candidate.root === 'object';
}

/**
 * Parses anatomist's JSONL layout format (one `LayoutAnalysisResult` per
 * line, one line per URL × viewport) into a map keyed by URL. Multiple
 * lines for the same URL (one per viewport) accumulate into that URL's
 * array, in file order.
 *
 * Fails fast: `--layout-json` files are machine-generated input, so a
 * malformed line (invalid JSON or wrong shape) throws immediately with a
 * 1-based line number rather than being skipped — it signals a
 * misconfiguration (wrong file, stale format) rather than a per-page
 * condition to recover from.
 * @param content
 */
export function parseLayoutJsonl(content: string): Map<string, LayoutAnalysisResult[]> {
	const map = new Map<string, LayoutAnalysisResult[]>();
	const lines = content.split('\n');
	for (const [index, rawLine] of lines.entries()) {
		const line = rawLine.trim();
		if (line === '') {
			continue;
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(line);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`${index + 1}行目: JSONとして解析できません (${message})`);
		}
		if (!isLayoutAnalysisResult(parsed)) {
			throw new Error(`${index + 1}行目: LayoutAnalysisResultの形状が不正です`);
		}
		const bucket = map.get(parsed.url);
		if (bucket === undefined) {
			map.set(parsed.url, [parsed]);
		} else {
			bucket.push(parsed);
		}
	}
	return map;
}

/**
 * Resolves each page's layout analysis, preferring a pre-generated anatomist
 * JSONL file (`layoutJsonPath`) and falling back to a live Puppeteer-driven
 * `analyzePageLayout` call for any URL absent from it.
 *
 * A JSONL hit is used as-is even when its `root` is `null` (anatomist ran
 * but found no main-content element) — that's itself a valid analysis
 * outcome, and re-running it live would likely reproduce the same result
 * while adding an unnecessary hit against the live site. Interpreting
 * `root: null` is left to the caller (the BlockData conversion step).
 *
 * Live failures — including a `browser.newPage()`/`page.close()` failure,
 * not just `analyzePageLayout` itself — are classified via
 * `@nitpicker/query`'s `classifyErrorKind` and reported as `missing` through
 * `onResult` rather than thrown. `@d-zero/dealer`'s `deal()` requires every
 * worker to settle without rejecting (see its `Dealer#deal()` contract:
 * a rejected worker never signals completion, hanging the whole run) — so
 * the entire per-item body, not just the `analyzePageLayout` call, is inside
 * the try/catch. Mirrors
 * {@link import('./extract-pages.js').extractPages}'s fail-soft design.
 *
 * Reading and parsing `layoutJsonPath` is fail-fast by contrast (see
 * {@link parseLayoutJsonl}): it's machine-generated input, and a parse
 * failure should stop the whole run rather than be reported per-page.
 *
 * The browser is launched lazily, on the first URL that actually needs live
 * analysis — a run where every URL is covered by `layoutJsonPath` never
 * pays for a browser at all.
 * @param options
 */
export async function resolvePageLayouts(
	options: ResolvePageLayoutsOptions,
): Promise<void> {
	const { items, layoutJsonPath, limit = 10, onResult, signal } = options;
	if (items.length === 0 || signal?.aborted) {
		// Short-circuit before launching a browser for work that will never run.
		return;
	}

	const jsonMap =
		layoutJsonPath === undefined
			? new Map<string, LayoutAnalysisResult[]>()
			: parseLayoutJsonl(await readFile(layoutJsonPath, 'utf8'));

	// Lazily launched, and launched at most once: concurrent workers all read
	// the same cached promise instead of racing separate `launch()` calls.
	let browserPromise: Promise<Browser> | undefined;
	const getBrowser = (): Promise<Browser> => {
		browserPromise ??= launch({ headless: true });
		return browserPromise;
	};

	try {
		await deal(
			items,
			(item) => async () => {
				const hit = jsonMap.get(item.url);
				if (hit !== undefined) {
					onResult?.({ url: item.url, outcome: 'resolved-from-json', results: hit });
					return;
				}
				let page: Awaited<ReturnType<Browser['newPage']>> | undefined;
				try {
					const browser = await getBrowser();
					page = await browser.newPage();
					const results = await analyzePageLayout(page, item.url);
					onResult?.({ url: item.url, outcome: 'resolved-live', results });
				} catch (error) {
					const err = error instanceof Error ? error : new Error(String(error));
					onResult?.({
						url: item.url,
						outcome: 'missing',
						error: err,
						kind: classifyErrorKind(err.message),
					});
				} finally {
					// Best-effort cleanup: a close failure (sync throw or
					// rejection) must not reject this worker (see the dealer
					// contract note above).
					try {
						await page?.close();
					} catch {
						/* ignore */
					}
				}
			},
			{ limit, signal },
		);
	} finally {
		if (browserPromise !== undefined) {
			const browser = await browserPromise;
			await browser.close();
		}
	}
}
