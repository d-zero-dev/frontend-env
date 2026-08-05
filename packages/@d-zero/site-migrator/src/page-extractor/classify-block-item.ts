import type { LayoutBlock } from '@d-zero/anatomist/types';
import type { DefaultTreeAdapterMap } from 'parse5';

import { parseFragment } from 'parse5';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['childNode'];

export type ImageEntryData = {
	path: string[];
	alt: string[];
	width: number[];
	height: number[];
	media: string[];
	loading: ('eager' | 'lazy')[];
};
export type TitleH2Data = { titleH2: string };
export type TitleH3Data = { titleH3: string };
export type YoutubeItemData = { id: string; title: string; thumb: string; url: string };
export type GoogleMapsItemData = {
	lat: number;
	lng: number;
	zoom: number;
	url: string;
	img: string;
};
export type DownloadFileItemData = {
	path: string;
	download: string;
	name: string;
	formatedSize: string;
	size: string;
	downloadCheck: boolean;
};
export type ButtonItemData = {
	link: string;
	target: string;
	text: string;
	subtext: string;
	kind: string;
	beforeIcon: string;
	afterIcon: string;
};
export type TableItemData = {
	caption: string;
	th: string[];
	td: string[];
	scrollable: boolean;
};
export type WysiwygItemData = { wysiwyg: string };

export type ClassifiedBlockItem =
	| { name: 'image'; data: ImageEntryData }
	| { name: 'title-h2'; data: TitleH2Data }
	| { name: 'title-h3'; data: TitleH3Data }
	| { name: 'youtube'; data: YoutubeItemData }
	| { name: 'google-maps'; data: GoogleMapsItemData }
	| { name: 'download-file'; data: DownloadFileItemData }
	| { name: 'button'; data: ButtonItemData }
	| { name: 'table'; data: TableItemData }
	| { name: 'wysiwyg'; data: WysiwygItemData };

/**
 * ダウンロード対象とみなす拡張子（大文字小文字無視、`.`込みで比較）。
 * 追加・変更はこの1箇所のみで行う。
 */
const DOWNLOADABLE_EXTENSIONS: ReadonlySet<string> = new Set([
	'.pdf',
	'.zip',
	'.doc',
	'.docx',
	'.xls',
	'.xlsx',
	'.ppt',
	'.pptx',
	'.csv',
	'.tsv',
	'.lzh',
	'.7z',
	'.rar',
]);

/** ボタン然としたクラス名判定のトークン（部分文字列・大文字小文字無視）。 */
const BUTTON_CLASS_TOKENS = ['btn', 'button'];

const YOUTUBE_HOST_PATTERN = /youtube\.com|youtu\.be/;
const GOOGLE_MAPS_HOST_PATTERN = /google\.\w+\/maps/;

/**
 * 1個の {@link LayoutBlock}（BlockItem 1コマ相当のノード）を、`tagName`/`classList`/
 * `innerHTML`/`layoutType` だけを根拠に BurgerEditor のアイテム種別へ意味分類する純粋関数。
 * `children`/`boundingBox`/`confidence` は一切参照しない。
 *
 * `confidence` を参照しない理由: `leaf` ノードの `confidence` は anatomist の
 * `classify-layout-tree.ts`（`toLeafBlock`）により常に `0` 固定であり、これは「意味分類が
 * 困難」というシグナルではなく「anatomistが子への再帰を止めた」というだけの意味。
 * image/title/youtube 等の分類対象は通常この `leaf` として現れるため、ここで confidence
 * 閾値を適用すると分類対象を全て `wysiwyg` に落とす自己矛盾になる（`layout-to-block-data.ts`
 * 側でコンテナ系 `layoutType` に対して別途 confidence の二重チェックを行う）。
 *
 * 判定順序（`@d-zero/anatomist`の`resolve-layout-type.ts`と同じ、素朴な if-else チェーン
 * ＋JSDocでの優先順位説明のスタイルを踏襲）:
 *
 * 1. `layoutType` が `'leaf'`/`'table'` 以外 → 即 `wysiwyg`。複数の意味ある子を持つ構造で
 *    あることがカテゴリ自体から確定しており、単一アイテムの型に収まらない（`'unknown'` も
 *    ここで自然に包含される）。
 * 2. `layoutType === 'table'` またはフラグメント内に `<table>` がある → th/td抽出を試み、
 *    失敗（rowspan/colspan検出、thead欠如）なら `wysiwyg`。
 * 3. ブロック自身のタグ、またはフラグメント内の唯一の意味ある要素を対象要素として、
 *    image/youtube/google-maps/download-file/button/title-h2/title-h3を試す。
 *    いずれにも該当しなければ `wysiwyg`。
 *
 * **重大な制約**: anatomistの`LayoutBlock`/`RawLayoutNode`は要素の属性（`href`/`src`/
 * `srcset`/`alt`/`width`/`height`等）を保持しない（`tagName`/`id`/`classList`/`boundingBox`/
 * `style`/`innerHTML`/`children`のみ）。加えて`should-recurse.ts`のcollapseロジックにより
 * `<picture><source><img></picture>`のようなラッパー構造は最終的に`img`自身（void要素、
 * `innerHTML`は空）だけが残る。そのため実データでは`image`/`youtube`/`google-maps`/
 * `download-file`/`button.link`の判定条件（src/href）がほぼ常に取得できず、safeに`wysiwyg`
 * へフォールバックする。これはバグではなく、属性情報が存在しないデータに対する意図された
 * 安全側の挙動である。anatomist側の属性キャプチャ拡張は別途フォローアップ課題として扱う。
 * @param block
 * @example
 * ```ts
 * classifyBlockItem({
 *   layoutType: 'leaf',
 *   tagName: 'H2',
 *   id: null,
 *   classList: [],
 *   boundingBox: { x: 0, y: 0, width: 200, height: 40 },
 *   innerHTML: '見出し',
 *   confidence: 0,
 *   signals: {},
 *   children: [],
 * });
 * // => { name: 'title-h2', data: { titleH2: '見出し' } }
 * ```
 */
export function classifyBlockItem(block: LayoutBlock): ClassifiedBlockItem {
	if (block.layoutType !== 'leaf' && block.layoutType !== 'table') {
		return wysiwygItem(block);
	}

	if (block.layoutType === 'table' || fragmentContainsTag(block.innerHTML, 'table')) {
		return extractTable(block) ?? wysiwygItem(block);
	}

	const selfTag = block.tagName.toLowerCase();

	if (selfTag === 'h2' || selfTag === 'h3') {
		return buildTitleItem(selfTag, extractTextContent(parseFragment(block.innerHTML)));
	}

	if (selfTag === 'a') {
		// ブロック自身がaの場合、collapseによりhref/親要素の情報は失われている
		// （LayoutBlockにhrefフィールドが存在しないため常にundefined）。
		return (
			classifyAnchorLike(
				block.classList,
				undefined,
				extractTextContent(parseFragment(block.innerHTML)),
				[],
			) ?? wysiwygItem(block)
		);
	}

	if (selfTag === 'picture') {
		const image = extractImageFromFragment(parseFragment(block.innerHTML));
		if (image) {
			return image;
		}
		return wysiwygItem(block);
	}

	if (selfTag === 'img' || selfTag === 'iframe') {
		// img: void要素なのでinnerHTMLは常に空。iframe: srcはLayoutBlockに保存されない。
		// いずれも属性を読む手段が無いため即フォールバック。
		return wysiwygItem(block);
	}

	const fragment = parseFragment(block.innerHTML);
	const topLevel = collectElements(fragment.childNodes);
	if (topLevel.length !== 1 || hasSignificantText(fragment.childNodes)) {
		return wysiwygItem(block);
	}
	const element = topLevel[0]!;
	const tag = element.tagName;

	if (tag === 'picture' || tag === 'img') {
		const image =
			tag === 'picture'
				? extractImageFromFragment(fragment, element)
				: extractImageFromImgElement(element);
		if (image) {
			return image;
		}
		return wysiwygItem(block);
	}

	if (tag === 'iframe') {
		const src = getAttr(element, 'src');
		if (src === undefined) {
			return wysiwygItem(block);
		}
		if (YOUTUBE_HOST_PATTERN.test(src)) {
			return buildYoutubeItem(src, getAttr(element, 'title'));
		}
		if (GOOGLE_MAPS_HOST_PATTERN.test(src)) {
			const googleMaps = extractGoogleMaps(src);
			if (googleMaps) {
				return googleMaps;
			}
		}
		return wysiwygItem(block);
	}

	if (tag === 'a') {
		return (
			classifyAnchorLike(
				classListOf(element),
				getAttr(element, 'href'),
				extractText(element),
				block.classList,
			) ?? wysiwygItem(block)
		);
	}

	if (tag === 'h2' || tag === 'h3') {
		return buildTitleItem(tag, extractText(element));
	}

	return wysiwygItem(block);
}

/**
 * @param tag
 * @param text
 */
function buildTitleItem(
	tag: 'h2' | 'h3',
	text: string,
): { name: 'title-h2'; data: TitleH2Data } | { name: 'title-h3'; data: TitleH3Data } {
	return tag === 'h2'
		? { name: 'title-h2', data: { titleH2: text } }
		: { name: 'title-h3', data: { titleH3: text } };
}

/**
 * `<a>`（BurgerEditorの`<button>`アイテムはこの分類対象外 — ボタン然とした`<a>`のみを
 * `button`として扱う）を`download-file`/`button`/`wysiwyg`へ分類する。`href`の拡張子判定を
 * `button`のクラス名ヒューリスティックより先に試す: 拡張子は構造的・決定論的なシグナルで
 * あり、ボタン風クラス名という曖昧な判定より優先すべきため（例: PDFリンクがボタン風クラスを
 * 持っていても`download-file`としての機能的な意味を優先する）。
 * @param ownClassList
 * @param href
 * @param text
 * @param ancestorClassList - このリンクを包む祖先ブロックのclassList（「親要素のクラス名」も
 *   ボタン判定の手がかりに使う）。ブロック自身がaの場合はcollapseで祖先情報が失われているため空配列。
 * @returns どちらにも該当しなければ`undefined`（呼び出し側が`wysiwygItem(block)`でフォール
 *   バックする — ラッパータグ再構築を一箇所に集約するため、ここでは`wysiwyg`を組み立てない）。
 */
function classifyAnchorLike(
	ownClassList: readonly string[],
	href: string | undefined,
	text: string,
	ancestorClassList: readonly string[],
):
	| { name: 'download-file'; data: DownloadFileItemData }
	| { name: 'button'; data: ButtonItemData }
	| undefined {
	if (href !== undefined) {
		const extension = extractExtension(href);
		if (extension !== undefined && DOWNLOADABLE_EXTENSIONS.has(extension)) {
			return buildDownloadFileItem(href);
		}
	}

	if (hasButtonLikeClass(ownClassList) || hasButtonLikeClass(ancestorClassList)) {
		return {
			name: 'button',
			data: {
				link: href ?? '',
				target: '',
				text,
				subtext: '',
				kind: 'primary',
				beforeIcon: 'none',
				afterIcon: 'none',
			},
		};
	}

	return undefined;
}

/**
 * @param classList
 */
function hasButtonLikeClass(classList: readonly string[]): boolean {
	return classList.some((className) => {
		const lower = className.toLowerCase();
		return BUTTON_CLASS_TOKENS.some((token) => lower.includes(token));
	});
}

/**
 * @param href
 */
function buildDownloadFileItem(href: string): {
	name: 'download-file';
	data: DownloadFileItemData;
} {
	return {
		name: 'download-file',
		data: {
			path: href,
			download: '',
			name: basename(href),
			formatedSize: '',
			size: '',
			downloadCheck: false,
		},
	};
}

/**
 * @param href
 */
function extractExtension(href: string): string | undefined {
	const withoutQuery = href.split(/[#?]/u)[0] ?? '';
	const match = /\.[a-z0-9]+$/i.exec(withoutQuery);
	return match?.[0].toLowerCase();
}

/**
 * @param href
 */
function basename(href: string): string {
	const withoutQuery = href.split(/[#?]/u)[0] ?? '';
	const segments = withoutQuery.split('/');
	return segments.at(-1) ?? href;
}

const YOUTUBE_ID_PATTERN = /(?:embed\/|v=|youtu\.be\/)([\w-]+)/;
const YOUTUBE_FALLBACK_TITLE = 'YouTube動画';

/**
 * BurgerEditor本体（`@burger-editor/blocks`の`items/youtube/index.tsx`）の`toItemData`が
 * 生成する正規形（`maxresdefault.jpg`・パラメータ付きembed URL）に合わせる。#975のrender・
 * #980の往復検証が本体の正規形と一致している必要があるため。
 * @param src
 * @param title
 */
function buildYoutubeItem(
	src: string,
	title: string | undefined,
): { name: 'youtube'; data: YoutubeItemData } {
	const match = YOUTUBE_ID_PATTERN.exec(src);
	const id = match?.[1] ?? '';
	return {
		name: 'youtube',
		data: {
			id,
			title: title || YOUTUBE_FALLBACK_TITLE,
			thumb: `//img.youtube.com/vi/${id}/maxresdefault.jpg`,
			url: `//www.youtube.com/embed/${id}?rel=0&loop=1&autoplay=1&autohide=1&start=0`,
		},
	};
}

const GOOGLE_MAPS_AT_PATTERN = /@(-?\d+\.\d+),(-?\d+\.\d+)(?:,(\d+)z)?/;
const GOOGLE_MAPS_Q_PATTERN = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
const DEFAULT_GOOGLE_MAPS_ZOOM = 16;

/**
 * `@lat,lng`または`q=lat,lng`のシンプルな平文embed形式のみ対応する。新形式
 * `embed?pb=...`（実質パース不可能なprotocol bufferエンコード）はいずれのパターンにも
 * マッチせず`undefined`を返し、呼び出し側が`wysiwyg`にフォールバックする。
 * @param src
 */
function extractGoogleMaps(
	src: string,
): { name: 'google-maps'; data: GoogleMapsItemData } | undefined {
	const atMatch = GOOGLE_MAPS_AT_PATTERN.exec(src);
	const match = atMatch ?? GOOGLE_MAPS_Q_PATTERN.exec(src);
	if (!match) {
		return undefined;
	}
	const lat = Number.parseFloat(match[1]!);
	const lng = Number.parseFloat(match[2]!);
	const zoomText = atMatch?.[3];
	const zoom =
		zoomText === undefined ? DEFAULT_GOOGLE_MAPS_ZOOM : Number.parseInt(zoomText, 10);
	return {
		name: 'google-maps',
		data: {
			lat,
			lng,
			zoom,
			url: `//maps.apple.com/?q=${lat},${lng}`,
			img: '',
		},
	};
}

/**
 * `<picture>`配下の`<source>`/`<img>`を文書順に1エントリとして拾い、`path`/`alt`/`width`/
 * `height`/`media`/`loading`の配列を構築する。`path`が1件も取れない場合（属性を持つ
 * `<source>`/`<img>`が実際には無い、実データで高頻度に起きるケース）は`undefined`を返し、
 * 呼び出し側が`wysiwyg`にフォールバックする。
 * @param fragment
 * @param pictureElement - 既に特定済みの`<picture>`要素があれば渡す（child-caseで二重に
 *   トップレベル走査しないため）。無ければ`fragment`のトップレベル`<picture>`を探す。
 */
function extractImageFromFragment(
	fragment: DefaultTreeAdapterMap['documentFragment'],
	pictureElement?: Element,
): { name: 'image'; data: ImageEntryData } | undefined {
	const picture =
		pictureElement ??
		collectElements(fragment.childNodes).find((el) => el.tagName === 'picture');
	const sourceAndImgElements = picture
		? collectElements(picture.childNodes)
		: collectElements(fragment.childNodes);
	const candidates = sourceAndImgElements.filter(
		(el) => el.tagName === 'source' || el.tagName === 'img',
	);
	if (candidates.length === 0) {
		return undefined;
	}

	const fallbackImg = candidates.find((el) => el.tagName === 'img');
	const fallbackAlt = fallbackImg ? (getAttr(fallbackImg, 'alt') ?? '') : '';
	const fallbackLoading = normalizeLoading(
		fallbackImg ? getAttr(fallbackImg, 'loading') : undefined,
	);

	const path: string[] = [];
	const alt: string[] = [];
	const width: number[] = [];
	const height: number[] = [];
	const media: string[] = [];
	const loading: ('eager' | 'lazy')[] = [];

	for (const el of candidates) {
		const isImg = el.tagName === 'img';
		const srcsetOrSrc = isImg
			? getAttr(el, 'src')
			: (firstSrcsetCandidate(getAttr(el, 'srcset')) ?? getAttr(el, 'src'));
		if (srcsetOrSrc === undefined) {
			continue;
		}
		path.push(srcsetOrSrc);
		alt.push(fallbackAlt);
		width.push(
			toNumberOrFallback(
				getAttr(el, 'width'),
				fallbackImg ? getAttr(fallbackImg, 'width') : undefined,
			),
		);
		height.push(
			toNumberOrFallback(
				getAttr(el, 'height'),
				fallbackImg ? getAttr(fallbackImg, 'height') : undefined,
			),
		);
		media.push(isImg ? '' : (getAttr(el, 'media') ?? ''));
		loading.push(fallbackLoading);
	}

	if (path.length === 0) {
		return undefined;
	}

	return { name: 'image', data: { path, alt, width, height, media, loading } };
}

/**
 * @param element
 */
function extractImageFromImgElement(
	element: Element,
): { name: 'image'; data: ImageEntryData } | undefined {
	const src = getAttr(element, 'src');
	if (src === undefined) {
		return undefined;
	}
	return {
		name: 'image',
		data: {
			path: [src],
			alt: [getAttr(element, 'alt') ?? ''],
			width: [toNumberOrFallback(getAttr(element, 'width'))],
			height: [toNumberOrFallback(getAttr(element, 'height'))],
			media: [''],
			loading: [normalizeLoading(getAttr(element, 'loading'))],
		},
	};
}

/**
 * @param srcset
 */
function firstSrcsetCandidate(srcset: string | undefined): string | undefined {
	if (srcset === undefined) {
		return undefined;
	}
	const first = srcset.split(',')[0]?.trim();
	return first?.split(/\s+/u)[0];
}

/**
 * @param value
 * @param fallback
 */
function toNumberOrFallback(
	value: string | undefined,
	fallback: string | undefined,
): number {
	const resolved = value ?? fallback;
	const parsed = resolved === undefined ? Number.NaN : Number.parseInt(resolved, 10);
	return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * @param loading
 */
function normalizeLoading(loading: string | undefined): 'eager' | 'lazy' {
	return loading === 'lazy' ? 'lazy' : 'eager';
}

const THEAD_TH_PATTERN = /<thead[^>]*>[\s\S]*?<\/thead>/i;

/**
 * `<table><thead><tr><th>`/`<tbody><tr><td>`のシンプル構造のみ対応する。`rowspan`/`colspan`、
 * ネストした`thead`無しテーブルは非対応（`TableData`自体rowspan非対応のため自然な制約）で
 * `undefined`を返し、呼び出し側が`wysiwyg`にフォールバックする。
 * @param block
 */
function extractTable(
	block: LayoutBlock,
): { name: 'table'; data: TableItemData } | undefined {
	const fragment = parseFragment(block.innerHTML);
	// `block.tagName==='table'`のとき、`innerHTML`は`<table>`自身の内側（`thead`/`tbody`等）
	// であって`<table>`タグそのものは含まれないため、fragment直下を`table`の子ノードとして
	// 扱う。それ以外（フラグメント内に`<table>`が入れ子で存在するケース）はその子ノードを使う。
	const tableChildNodes =
		block.tagName.toLowerCase() === 'table'
			? fragment.childNodes
			: findElementByTag(fragment.childNodes, 'table')?.childNodes;
	if (!tableChildNodes) {
		return undefined;
	}

	const html = block.innerHTML;
	if (!THEAD_TH_PATTERN.test(html)) {
		return undefined;
	}
	if (/rowspan|colspan/i.test(html)) {
		return undefined;
	}

	const thead = findElementByTag(tableChildNodes, 'thead');
	const tbody = findElementByTag(tableChildNodes, 'tbody');
	if (!thead || !tbody) {
		return undefined;
	}

	const th = findElementsByTag(thead.childNodes, 'th').map((el) => extractText(el));
	const td = findElementsByTag(tbody.childNodes, 'td').map((el) => extractText(el));
	const caption = findElementByTag(tableChildNodes, 'caption');

	return {
		name: 'table',
		data: {
			caption: caption ? extractText(caption) : '',
			th,
			td,
			scrollable: false,
		},
	};
}

/**
 * @param html
 * @param tag
 */
function fragmentContainsTag(html: string, tag: string): boolean {
	const fragment = parseFragment(html);
	return findElementByTag(fragment.childNodes, tag) !== undefined;
}

/**
 * @param nodes
 * @param tag
 */
function findElementByTag(nodes: readonly Node[], tag: string): Element | undefined {
	for (const node of nodes) {
		if (isElement(node)) {
			if (node.tagName === tag) {
				return node;
			}
			const nested = findElementByTag(node.childNodes, tag);
			if (nested) {
				return nested;
			}
		}
	}
	return undefined;
}

/**
 * @param nodes
 * @param tag
 */
function findElementsByTag(nodes: readonly Node[], tag: string): Element[] {
	const result: Element[] = [];
	for (const node of nodes) {
		if (isElement(node)) {
			if (node.tagName === tag) {
				result.push(node);
			}
			result.push(...findElementsByTag(node.childNodes, tag));
		}
	}
	return result;
}

const WHITESPACE_ONLY = /^\s*$/;

/**
 * 直下の要素ノードを文書順に返す（テキスト・コメントノードは除外）。
 * @param nodes
 */
function collectElements(nodes: readonly Node[]): Element[] {
	return nodes.filter((node): node is Element => isElement(node));
}

/**
 * 直下に空白以外のテキストノードが存在するかを判定する。「唯一の意味ある要素」判定で、
 * 要素の個数だけでなく周囲のテキスト（例: `<p>説明文<a>…</a></p>`の"説明文"）の有無も
 * 考慮するために使う。
 * @param nodes
 */
function hasSignificantText(nodes: readonly Node[]): boolean {
	return nodes.some(
		(node) => !isElement(node) && 'value' in node && !WHITESPACE_ONLY.test(node.value),
	);
}

/**
 * @param node
 */
function isElement(node: Node): node is Element {
	return 'tagName' in node && Array.isArray((node as Element).attrs);
}

/**
 * @param element
 * @param name
 */
function getAttr(element: Element, name: string): string | undefined {
	for (const attribute of element.attrs) {
		if (attribute.name === name) {
			return attribute.value;
		}
	}
	return undefined;
}

/**
 * @param element
 */
function classListOf(element: Element): string[] {
	const className = getAttr(element, 'class');
	if (className === undefined) {
		return [];
	}
	return className.split(/\s+/u).filter((token) => token.length > 0);
}

/**
 * 要素配下のテキストノードを文書順に連結する（`textContent`相当）。内部マークアップの
 * 有無に関わらず常にこの方法で見出し等のテキストを抽出する。
 * @param element
 */
function extractText(element: Element): string {
	return extractTextFromNodes(element.childNodes);
}

/**
 * @param fragment
 */
function extractTextContent(fragment: DefaultTreeAdapterMap['documentFragment']): string {
	return extractTextFromNodes(fragment.childNodes);
}

/**
 * @param nodes
 */
function extractTextFromNodes(nodes: readonly Node[]): string {
	let text = '';
	for (const node of nodes) {
		if (isElement(node)) {
			text += extractTextFromNodes(node.childNodes);
		} else if ('value' in node) {
			text += node.value;
		}
	}
	return text.trim();
}

/**
 * ブロック単位のフォールバック（ビューポート不一致、`rowSizes`不正形状等）で
 * `layout-to-block-data.ts` からも使う、無条件の `wysiwyg` ビルダー。
 * @param block
 */
export function wysiwygItem(block: LayoutBlock): {
	name: 'wysiwyg';
	data: WysiwygItemData;
} {
	return { name: 'wysiwyg', data: { wysiwyg: wrapWithOwnTag(block) } };
}

/**
 * ブロック自身のタグ（`tagName`/`id`/`classList`）を再構築して`innerHTML`を包む。
 * `style`/`data-*`等の他の属性はanatomistが捕捉していないため失われるが、構造とCSS
 * フック（class）は保持される。
 * @param block
 */
function wrapWithOwnTag(block: LayoutBlock): string {
	const tag = block.tagName.toLowerCase();
	const attrs: string[] = [];
	if (block.classList.length > 0) {
		attrs.push(`class="${escapeAttribute(block.classList.join(' '))}"`);
	}
	if (block.id) {
		attrs.push(`id="${escapeAttribute(block.id)}"`);
	}
	const openTag = attrs.length > 0 ? `<${tag} ${attrs.join(' ')}>` : `<${tag}>`;
	return `${openTag}${block.innerHTML}</${tag}>`;
}

/**
 * `class`/`id`をダブルクォート属性値として埋め込む前にエスケープする。anatomistが
 * `classList`/`id`をDOMプロパティの生値として捕捉しているため（`"`を含むid等が理論上
 * 可能）、無害化せずに埋め込むと属性境界が壊れHTML構造が破損する。
 * @param value
 */
function escapeAttribute(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}
