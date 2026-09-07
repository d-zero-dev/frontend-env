import type { DownloadFileItemData } from './classify-block-item.js';
import type { BlockData } from '@burger-editor/core';

import { stat } from 'node:fs/promises';

import {
	downloadResources,
	type DownloadResult,
} from '../downloader/download-resources.js';
import { urlToOutputPath } from '../downloader/url-to-output-path.js';

export interface DownloadBlockFilesOptions {
	/**
	 * ページURL → そのページの`BlockData`配列。`download-file`アイテムの`data`は
	 * この関数が直接書き換える（`size`/`formatedSize`を実測値で上書きする）。
	 */
	blocksByUrl: ReadonlyMap<string, readonly BlockData[]>;
	outputDir: string;
	/** 通常のリソースDL（`listInternalResources`由来）で既にカバー済みの絶対URL集合。二重DL回避用。 */
	knownResourceUrls: ReadonlySet<string>;
	/** `downloadResources`へ転送する並列数。 */
	limit?: number;
	onResult?: (event: DownloadResult) => void;
	signal?: AbortSignal;
}

/**
 * 各ページの`BlockData`木を走査して`download-file`アイテムの`path`（href、相対の場合あり）を
 * 集め、ページURLを基準に絶対URLへ解決したうえで`knownResourceUrls`（通常のリソースDLで
 * 既にカバーされるURL集合）と重複しないものだけを`downloadResources`へ追加投入する
 * （fetch処理そのものは再実装せず`downloadResources`に一本化する）。
 *
 * ダウンロード後（または既に`knownResourceUrls`でカバー済みでダウンロードをスキップした場合も
 * 含めて）、出力パスの実ファイルサイズを`stat`で読み、該当する全アイテムの`size`/
 * `formatedSize`を書き戻す。同一ファイルが複数ページ・複数アイテムから参照されていても
 * ダウンロードは1回で済ませ、全参照箇所に反映する。
 *
 * ダウンロードが行われなかった、または失敗した場合は`size`/`formatedSize`を
 * プレースホルダー（空文字列）のまま残す fail-soft 方針（`classifyBlockItem`が生成した時点の
 * 初期値のまま）。
 *
 * 実データでは`classifyBlockItem`がhref/src等の属性欠如によりほぼ常に`wysiwyg`へフォールバック
 * するため（`classify-block-item.ts`のJSDoc参照）、`download-file`アイテムが実際に生成される
 * ケース自体が稀である。それでも型上ありうる経路として実装している。
 * @param options
 */
export async function downloadBlockFiles(
	options: DownloadBlockFilesOptions,
): Promise<void> {
	const { blocksByUrl, outputDir, knownResourceUrls, limit, onResult, signal } = options;

	const targets = new Map<string, DownloadFileItemData[]>();
	for (const [pageUrl, blocks] of blocksByUrl) {
		for (const item of iterateDownloadFileItems(blocks)) {
			let absoluteUrl: string;
			try {
				absoluteUrl = new URL(item.path, pageUrl).href;
			} catch {
				continue;
			}
			const bucket = targets.get(absoluteUrl);
			if (bucket) {
				bucket.push(item);
			} else {
				targets.set(absoluteUrl, [item]);
			}
		}
	}
	if (targets.size === 0) {
		return;
	}

	const toDownload = [...targets.keys()].filter((url) => !knownResourceUrls.has(url));
	if (toDownload.length > 0) {
		await downloadResources({
			items: toDownload.map((url) => ({ url })),
			outputDir,
			limit,
			signal,
			onResult,
		});
	}

	await Promise.all(
		[...targets.entries()].map(async ([url, items]) => {
			let outputPath: string;
			try {
				outputPath = urlToOutputPath(url, outputDir);
			} catch {
				return;
			}
			try {
				const info = await stat(outputPath);
				const formatted = formatBytes(info.size);
				for (const item of items) {
					item.size = String(info.size);
					item.formatedSize = formatted;
				}
			} catch {
				/* ダウンロードされなかった（失敗・スキップ）場合はプレースホルダーのまま。 */
			}
		}),
	);
}

const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/**
 * @param bytes
 */
function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes}B`;
	}
	let value = bytes;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < UNITS.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}
	return `${value.toFixed(1)}${UNITS[unitIndex]}`;
}

/**
 * @param blocks
 * @yields 各`download-file`アイテムの`data`（`BlockData`木を文書順で走査）。
 */
function* iterateDownloadFileItems(
	blocks: readonly BlockData[],
): Generator<DownloadFileItemData> {
	for (const block of blocks) {
		for (const row of block.items) {
			for (const item of row) {
				if (typeof item !== 'string' && item.name === 'download-file' && item.data) {
					yield item.data as DownloadFileItemData;
				}
			}
		}
	}
}
