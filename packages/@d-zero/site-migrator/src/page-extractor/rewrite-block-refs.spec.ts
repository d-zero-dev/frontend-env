import type {
	ButtonItemData,
	DownloadFileItemData,
	GoogleMapsItemData,
	ImageEntryData,
	TableItemData,
	TitleH2Data,
	TitleH3Data,
	WysiwygItemData,
	YoutubeItemData,
} from './classify-block-item.js';
import type { BlockData, BlockItem } from '@burger-editor/core';

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { rewriteBlockRefs } from './rewrite-block-refs.js';

type RewritePageRefsModule = typeof import('./rewrite-page-refs.js');

vi.mock('./rewrite-page-refs.js', async (importOriginal) => {
	const actual = await importOriginal<RewritePageRefsModule>();
	return {
		...actual,
		rewritePageRefs: vi.fn(actual.rewritePageRefs),
	};
});

const { buildPageIdLookup, rewritePageRefs } = await import('./rewrite-page-refs.js');
const rewritePageRefsMock = vi.mocked(rewritePageRefs);

const BASE = 'https://example.com/about/';

const lookupFrom = (entries: readonly (readonly [string, number])[]) =>
	buildPageIdLookup(new Map(entries));

/**
 *
 * @param items
 */
function block(items: BlockItem[][]): BlockData {
	return { name: 'migrated', containerProps: { type: 'grid', columns: 1 }, items };
}

/**
 *
 * @param html
 */
function wysiwygItem(html: string): BlockItem {
	return { name: 'wysiwyg', data: { wysiwyg: html } satisfies WysiwygItemData };
}

/**
 *
 * @param link
 */
function buttonItem(link: string): BlockItem {
	return {
		name: 'button',
		data: {
			link,
			target: '',
			text: '',
			subtext: '',
			kind: 'primary',
			beforeIcon: 'none',
			afterIcon: 'none',
		} satisfies ButtonItemData,
	};
}

/**
 *
 * @param path
 */
function imageItem(path: string[]): BlockItem {
	return {
		name: 'image',
		data: {
			path,
			alt: path.map(() => ''),
			width: path.map(() => 0),
			height: path.map(() => 0),
			media: path.map(() => ''),
			loading: path.map(() => 'eager'),
		} satisfies ImageEntryData,
	};
}

/**
 *
 * @param path
 */
function downloadFileItem(path: string): BlockItem {
	return {
		name: 'download-file',
		data: {
			path,
			download: '',
			name: 'file',
			formatedSize: '',
			size: '',
			downloadCheck: false,
		} satisfies DownloadFileItemData,
	};
}

/**
 *
 * @param url
 */
function googleMapsItem(url: string): BlockItem {
	return {
		name: 'google-maps',
		data: { lat: 0, lng: 0, zoom: 16, url, img: '' } satisfies GoogleMapsItemData,
	};
}

/**
 *
 * @param url
 */
function youtubeItem(url: string): BlockItem {
	return {
		name: 'youtube',
		data: { id: '', title: '', thumb: '', url } satisfies YoutubeItemData,
	};
}

/**
 *
 */
function titleH2Item(): BlockItem {
	return { name: 'title-h2', data: { titleH2: '見出し' } satisfies TitleH2Data };
}

/**
 *
 */
function titleH3Item(): BlockItem {
	return { name: 'title-h3', data: { titleH3: '見出し' } satisfies TitleH3Data };
}

/**
 *
 */
function tableItem(): BlockItem {
	return {
		name: 'table',
		data: { caption: '', th: [], td: [], scrollable: false } satisfies TableItemData,
	};
}

/**
 * @param item
 */
function dataOf<T>(item: BlockItem): T {
	if (typeof item === 'string' || !item.data) {
		throw new Error('unexpected bare-string or data-less BlockItem in test assertion');
	}
	return item.data as T;
}

describe('rewriteBlockRefs', () => {
	beforeEach(async () => {
		rewritePageRefsMock.mockReset();
		const real = await vi.importActual<RewritePageRefsModule>('./rewrite-page-refs.js');
		rewritePageRefsMock.mockImplementation(real.rewritePageRefs);
	});

	test('wysiwyg: 既知ページへの<a href>を{{id}}化する（rewritePageRefsへの委譲）', async () => {
		const blocks = [block([[wysiwygItem('<a href="/news/">news</a>')]])];
		const { blocks: result, errors } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/news/', 42]]),
		});
		expect(dataOf<WysiwygItemData>(result[0]!.items[0]![0]!).wysiwyg).toBe(
			'<a href="{{42}}">news</a>',
		);
		expect(errors).toEqual([]);
	});

	test('wysiwyg: 同一オリジンの<img src>をroot-relative化する', async () => {
		const blocks = [block([[wysiwygItem('<img src="../img/a.png">')]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(dataOf<WysiwygItemData>(result[0]!.items[0]![0]!).wysiwyg).toBe(
			'<img src="/img/a.png">',
		);
	});

	test('button: 既知ページへのlinkを{{id}}化する（query/fragment保持）', async () => {
		const blocks = [block([[buttonItem('/news/?q=1#top')]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/news/', 42]]),
		});
		expect(dataOf<ButtonItemData>(result[0]!.items[0]![0]!).link).toBe('{{42}}?q=1#top');
	});

	test('button: 同一オリジンだが未知ページのlinkはroot-relative化する', async () => {
		const blocks = [block([[buttonItem('/unknown/')]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(dataOf<ButtonItemData>(result[0]!.items[0]![0]!).link).toBe('/unknown/');
	});

	test('button: クロスオリジンのlinkは無変更（参照同一性も維持）', async () => {
		const original = buttonItem('https://other.example/x');
		const blocks = [block([[original]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(dataOf<ButtonItemData>(result[0]!.items[0]![0]!).link).toBe(
			'https://other.example/x',
		);
		expect(result[0]!.items[0]![0]).toBe(original);
	});

	test('image: pathnameが既知ページのidと一致していても{{id}}化しない（アセット扱い保証）', async () => {
		const blocks = [block([[imageItem(['/news/'])]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/news/', 42]]),
		});
		expect(dataOf<ImageEntryData>(result[0]!.items[0]![0]!).path).toEqual(['/news/']);
	});

	test('download-file: pathnameが既知ページのidと一致していても{{id}}化しない（アセット扱い保証・回帰防止の核）', async () => {
		const blocks = [block([[downloadFileItem('/news/')]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/news/', 42]]),
		});
		expect(dataOf<DownloadFileItemData>(result[0]!.items[0]![0]!).path).toBe('/news/');
	});

	test('google-maps/youtubeのurlフィールドは完全に無変更（対象外）', async () => {
		const maps = googleMapsItem('https://maps.apple.com/?q=35,139');
		const yt = youtubeItem('//www.youtube.com/embed/abc?rel=0');
		const blocks = [block([[maps, yt]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(result[0]!.items[0]![0]).toBe(maps);
		expect(result[0]!.items[0]![1]).toBe(yt);
	});

	test('title-h2/title-h3/table は参照同一性を維持したままパススルーする', async () => {
		const h2 = titleH2Item();
		const h3 = titleH3Item();
		const table = tableItem();
		const blocks = [block([[h2, h3, table]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(result[0]!.items[0]![0]).toBe(h2);
		expect(result[0]!.items[0]![1]).toBe(h3);
		expect(result[0]!.items[0]![2]).toBe(table);
	});

	test('bare-stringのBlockItemはそのまま通す', async () => {
		const blocks = [block([['plain-item-name' as unknown as BlockItem]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(result[0]!.items[0]![0]).toBe('plain-item-name');
	});

	test('dataを持たないBlockItem（name のみ）はそのまま通す', async () => {
		const original: BlockItem = { name: 'button' };
		const blocks = [block([[original]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(result[0]!.items[0]![0]).toBe(original);
	});

	test('button: mailto:等の対象外スキームは無変更（参照同一性も維持）', async () => {
		const original = buttonItem('mailto:info@example.com');
		const blocks = [block([[original]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/news/', 42]]),
		});
		expect(dataOf<ButtonItemData>(result[0]!.items[0]![0]!).link).toBe(
			'mailto:info@example.com',
		);
		expect(result[0]!.items[0]![0]).toBe(original);
	});

	test('button: 空文字・bare-fragmentのlinkは無変更', async () => {
		const blocks = [block([[buttonItem(''), buttonItem('#top')]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(dataOf<ButtonItemData>(result[0]!.items[0]![0]!).link).toBe('');
		expect(dataOf<ButtonItemData>(result[0]!.items[0]![1]!).link).toBe('#top');
	});

	test('image: 全pathがクロスオリジン等で無変更の場合はitem参照をそのまま維持する（button/download-fileとの不変条件統一）', async () => {
		const original = imageItem(['https://other.example/a.png']);
		const blocks = [block([[original]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(result[0]!.items[0]![0]).toBe(original);
	});

	test('image: 複数pathのうち同一オリジン/クロスオリジンが混在しても個別に解決する', async () => {
		const blocks = [block([[imageItem(['/img/a.png', 'https://other.example/b.png'])]])];
		const { blocks: result } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([]),
		});
		expect(dataOf<ImageEntryData>(result[0]!.items[0]![0]!).path).toEqual([
			'/img/a.png',
			'https://other.example/b.png',
		]);
	});

	test('入力blocksを変更しない（純粋関数）', async () => {
		const original = block([[buttonItem('/news/')]]);
		const blocks = [original];
		const snapshot = structuredClone(blocks);

		await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/news/', 42]]),
		});

		expect(blocks).toEqual(snapshot);
	});

	test('不正なbaseUrlの場合は無変更・例外なしで返す', async () => {
		const blocks = [block([[buttonItem('/news/')]])];
		const { blocks: result, errors } = await rewriteBlockRefs({
			blocks,
			baseUrl: 'not a url',
			pageIdLookup: lookupFrom([]),
		});
		expect(result).toEqual(blocks);
		expect(errors).toEqual([]);
	});

	test('fail-soft: wysiwygのrewritePageRefs失敗時は元の内容を保持しerrorsに記録し、他アイテムは処理を継続する', async () => {
		const okItem = buttonItem('/news/');
		const failingWysiwyg = '<a href="/broken/">broken</a>';
		const blocks = [
			block([[wysiwygItem(failingWysiwyg), okItem]]),
			block([[wysiwygItem('<a href="/news/">ok</a>')]]),
		];

		rewritePageRefsMock.mockImplementationOnce(() => {
			throw new Error('boom');
		});

		const { blocks: result, errors } = await rewriteBlockRefs({
			blocks,
			baseUrl: BASE,
			pageIdLookup: lookupFrom([['https://example.com/news/', 42]]),
		});

		expect(dataOf<WysiwygItemData>(result[0]!.items[0]![0]!).wysiwyg).toBe(
			failingWysiwyg,
		);
		expect(errors).toEqual([
			{ blockIndex: 0, rowIndex: 0, itemIndex: 0, error: new Error('boom') },
		]);
		expect(dataOf<ButtonItemData>(result[0]!.items[0]![1]!).link).toBe('{{42}}');
		expect(dataOf<WysiwygItemData>(result[1]!.items[0]![0]!).wysiwyg).toBe(
			'<a href="{{42}}">ok</a>',
		);
	});
});
