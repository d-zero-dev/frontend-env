import type { LayoutBlock } from '@d-zero/anatomist/types';

import { describe, expect, test, vi } from 'vitest';

import { classifyBlockItem } from './classify-block-item.js';

/**
 * @param overrides
 */
function sampleBlock(overrides: Partial<LayoutBlock> = {}): LayoutBlock {
	return {
		layoutType: 'leaf',
		tagName: 'DIV',
		id: null,
		classList: [],
		boundingBox: { x: 0, y: 0, width: 100, height: 100 },
		innerHTML: '',
		confidence: 0,
		signals: {},
		children: [],
		...overrides,
	};
}

describe('classifyBlockItem', () => {
	test('layoutType unknown はカテゴリカルゲートで即wysiwygになる（中身を見ない）', () => {
		const block = sampleBlock({
			layoutType: 'unknown',
			tagName: 'DIV',
			innerHTML: '<h2>見出し</h2>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('leaf/table以外のlayoutTypeは中身にimgを含んでいてもルールを試さずwysiwygになる', () => {
		const block = sampleBlock({
			layoutType: 'complex-grid',
			confidence: 0.6,
			tagName: 'DIV',
			innerHTML: '<img src="a.jpg" alt="a">',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('単一のh2要素（ブロック自身）はtitle-h2になる', () => {
		const block = sampleBlock({ tagName: 'H2', innerHTML: '見出し' });
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({ name: 'title-h2', data: { titleH2: '見出し' } });
	});

	test('単一のh3要素（フラグメント内）はtitle-h3になる', () => {
		const block = sampleBlock({ tagName: 'DIV', innerHTML: '<h3>小見出し</h3>' });
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({ name: 'title-h3', data: { titleH3: '小見出し' } });
	});

	test('見出し内に内部マークアップがあっても常にtextContentで抽出する', () => {
		const block = sampleBlock({ tagName: 'H2', innerHTML: '<span>About</span>会社概要' });
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'title-h2',
			data: { titleH2: 'About会社概要' },
		});
	});

	test('見出し要素に加えて他の要素が混在する場合はwysiwygになる', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<h2>見出し</h2><p>本文</p>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('見出し要素に加えて周囲にテキストがある場合はwysiwygになる', () => {
		const block = sampleBlock({ tagName: 'DIV', innerHTML: '前置き<h2>見出し</h2>' });
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('thead/tbodyの単純構造を持つtableはth/tdを正しく抽出する', () => {
		const block = sampleBlock({
			layoutType: 'table',
			tagName: 'TABLE',
			innerHTML:
				'<thead><tr><th>名前</th><th>年齢</th></tr></thead><tbody><tr><td>太郎</td><td>20</td></tr></tbody>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'table',
			data: { caption: '', th: ['名前', '年齢'], td: ['太郎', '20'], scrollable: false },
		});
	});

	test('captionを持つtableはcaptionのテキストを抽出する', () => {
		const block = sampleBlock({
			layoutType: 'table',
			tagName: 'TABLE',
			innerHTML:
				'<caption>料金表</caption><thead><tr><th>プラン</th></tr></thead><tbody><tr><td>A</td></tr></tbody>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'table',
			data: { caption: '料金表', th: ['プラン'], td: ['A'], scrollable: false },
		});
	});

	test('フラグメント内にネストしたtableがある場合も抽出できる', () => {
		const block = sampleBlock({
			layoutType: 'leaf',
			tagName: 'DIV',
			innerHTML:
				'<table><thead><tr><th>項目</th></tr></thead><tbody><tr><td>値</td></tr></tbody></table>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'table',
			data: { caption: '', th: ['項目'], td: ['値'], scrollable: false },
		});
	});

	test('rowspanを含むtableはwysiwygにフォールバックする', () => {
		const block = sampleBlock({
			layoutType: 'table',
			tagName: 'TABLE',
			innerHTML:
				'<thead><tr><th>名前</th></tr></thead><tbody><tr><td rowspan="2">太郎</td></tr></tbody>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('theadが無いtableはwysiwygにフォールバックする', () => {
		const block = sampleBlock({
			layoutType: 'table',
			tagName: 'TABLE',
			innerHTML: '<tbody><tr><td>値</td></tr></tbody>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('pictureのsource複数+fallback imgからimageを正しく抽出する（コードの正しさを検証する理想ケース）', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML:
				'<picture><source srcset="a.webp" media="(min-width: 768px)"><img src="b.jpg" alt="説明" width="100" height="50" loading="lazy"></picture>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'image',
			data: {
				path: ['a.webp', 'b.jpg'],
				alt: ['説明', '説明'],
				width: [100, 100],
				height: [50, 50],
				media: ['(min-width: 768px)', ''],
				loading: ['lazy', 'lazy'],
			},
		});
	});

	test('picture無しの単一imgは1要素配列のimageになる', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<img src="b.jpg" alt="説明" width="100" height="50">',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'image',
			data: {
				path: ['b.jpg'],
				alt: ['説明'],
				width: [100],
				height: [50],
				media: [''],
				loading: ['eager'],
			},
		});
	});

	test('srcsetがdescriptor付き・複数候補の場合は先頭候補のURLのみを採用する', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML:
				'<picture><source srcset="a.webp 640w, b.webp 1280w"><img src="c.jpg" alt=""></picture>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'image',
			data: {
				path: ['a.webp', 'c.jpg'],
				alt: ['', ''],
				width: [0, 0],
				height: [0, 0],
				media: ['', ''],
				loading: ['eager', 'eager'],
			},
		});
	});

	test('picture配下のsourceにsrc/srcsetのいずれも無く有効なpathが1件も取れない場合はwysiwygにフォールバックする', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<picture><source media="(min-width: 768px)"></picture>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('collapseによりimg自身がブロックになった場合（innerHTMLが空、属性取得不能）はwysiwygにフォールバックする', () => {
		// 実データで高頻度に起きるケース: anatomistのcollapseロジックによりpicture/figure等の
		// ラッパー情報が失われ、img自身（void要素、innerHTMLは空）だけがLayoutBlockとして残る。
		const block = sampleBlock({ tagName: 'IMG', innerHTML: '' });
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('iframe（youtube）はidを抽出し、thumb/urlをBurgerEditor正規形で生成する', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<iframe src="https://www.youtube.com/embed/XXXX"></iframe>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'youtube',
			data: {
				id: 'XXXX',
				title: 'YouTube動画',
				thumb: '//img.youtube.com/vi/XXXX/maxresdefault.jpg',
				url: '//www.youtube.com/embed/XXXX?rel=0&loop=1&autoplay=1&autohide=1&start=0',
			},
		});
	});

	test('iframe（youtube）にtitle属性があればそれを使う', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<iframe src="https://youtu.be/YYYY" title="紹介動画"></iframe>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'youtube',
			data: {
				id: 'YYYY',
				title: '紹介動画',
				thumb: '//img.youtube.com/vi/YYYY/maxresdefault.jpg',
				url: '//www.youtube.com/embed/YYYY?rel=0&loop=1&autoplay=1&autohide=1&start=0',
			},
		});
	});

	test('iframe（google-maps、@lat,lng形式・zoom指定なし）はlat/lngを抽出しzoomは既定16になる', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<iframe src="https://www.google.com/maps?q=35.1,139.1"></iframe>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'google-maps',
			data: {
				lat: 35.1,
				lng: 139.1,
				zoom: 16,
				url: '//maps.apple.com/?q=35.1,139.1',
				img: '',
			},
		});
	});

	test('iframe（google-maps、@lat,lng,<zoom>z形式）はzoomも抽出する', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<iframe src="https://www.google.com/maps/@35.1,139.1,14z"></iframe>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'google-maps',
			data: {
				lat: 35.1,
				lng: 139.1,
				zoom: 14,
				url: '//maps.apple.com/?q=35.1,139.1',
				img: '',
			},
		});
	});

	test('iframe（google-maps、@lat,lng形式とq=lat,lng形式が両方含まれる場合は@形式を優先する）', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML:
				'<iframe src="https://www.google.com/maps/@35.1,139.1,10z?q=1.1,2.2"></iframe>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'google-maps',
			data: {
				lat: 35.1,
				lng: 139.1,
				zoom: 10,
				url: '//maps.apple.com/?q=35.1,139.1',
				img: '',
			},
		});
	});

	test('iframe（google-maps、新形式embed?pb=...）はパース不能としてwysiwygにフォールバックする', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!2m3"></iframe>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('既知拡張子かつボタン風クラスを持つaはdownload-fileが勝つ（button優先順位テスト）', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<a href="file.pdf" class="c-btn">資料</a>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'download-file',
			data: {
				path: 'file.pdf',
				download: '',
				name: 'file.pdf',
				formatedSize: '',
				size: '',
				downloadCheck: false,
			},
		});
	});

	test('クエリ文字列・フラグメント付きのhrefでも拡張子とファイル名を正しく抽出する', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<a href="/docs/file.pdf?v=1#top">資料</a>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'download-file',
			data: {
				path: '/docs/file.pdf?v=1#top',
				download: '',
				name: 'file.pdf',
				formatedSize: '',
				size: '',
				downloadCheck: false,
			},
		});
	});

	test('ボタン風クラス名は大文字小文字を無視して判定する', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<a href="/contact" class="c-Button">お問い合わせ</a>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('button');
	});

	test('拡張子なしのボタン風クラスを持つaはbuttonになる', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<a href="/contact" class="c-btn">お問い合わせ</a>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'button',
			data: {
				link: '/contact',
				target: '',
				text: 'お問い合わせ',
				subtext: '',
				kind: 'primary',
				beforeIcon: 'none',
				afterIcon: 'none',
			},
		});
	});

	test('a自身にはクラスが無くても親（包むブロック）のクラス名にbtnがあればbuttonになる', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			classList: ['btn-wrap'],
			innerHTML: '<a href="/contact">お問い合わせ</a>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('button');
	});

	test('ブロック自身がaの場合、collapseによりhrefが取得できずbuttonに倒れる', () => {
		const block = sampleBlock({
			tagName: 'A',
			classList: ['c-btn'],
			innerHTML: 'お問い合わせ',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'button',
			data: {
				link: '',
				target: '',
				text: 'お問い合わせ',
				subtext: '',
				kind: 'primary',
				beforeIcon: 'none',
				afterIcon: 'none',
			},
		});
	});

	test('button要素は分類対象外でwysiwygになる', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<button class="c-btn">送信</button>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('ボタンらしさの無いaはwysiwygになる', () => {
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<a href="/about">会社概要</a>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('wysiwygフォールバック時はブロック自身のタグ/class/idを再構築してinnerHTMLを包む', () => {
		const block = sampleBlock({
			layoutType: 'unknown',
			tagName: 'SECTION',
			id: 'news',
			classList: ['news', 'is-active'],
			innerHTML: '<p>本文</p>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'wysiwyg',
			data: {
				wysiwyg: '<section class="news is-active" id="news"><p>本文</p></section>',
			},
		});
	});

	test('class/idが無いブロックのwysiwygフォールバックは属性無しの開きタグになる', () => {
		const block = sampleBlock({
			layoutType: 'unknown',
			tagName: 'DIV',
			innerHTML: '<p>本文</p>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'wysiwyg',
			data: { wysiwyg: '<div><p>本文</p></div>' },
		});
	});

	test('id/classListにダブルクォート・アンパサンドが含まれる場合、属性境界を壊さずエスケープする', () => {
		const block = sampleBlock({
			layoutType: 'unknown',
			tagName: 'DIV',
			id: 'a"b&c',
			classList: ['x"y', 'p&q'],
			innerHTML: '<p>本文</p>',
		});
		const result = classifyBlockItem(block);
		expect(result).toStrictEqual({
			name: 'wysiwyg',
			data: {
				wysiwyg: '<div class="x&quot;y p&amp;q" id="a&quot;b&amp;c"><p>本文</p></div>',
			},
		});
	});

	test('2個以上の要素が並ぶfragmentはwysiwygになる（クラッシュしない）', () => {
		const block = sampleBlock({ tagName: 'DIV', innerHTML: '<p>a</p><p>b</p>' });
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('空のinnerHTMLはwysiwygになる（クラッシュしない）', () => {
		const block = sampleBlock({ tagName: 'DIV', innerHTML: '' });
		const result = classifyBlockItem(block);
		expect(result.name).toBe('wysiwyg');
	});

	test('download-file分類はfetchを一切呼ばない（純粋関数であることの回帰テスト）', () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const block = sampleBlock({
			tagName: 'DIV',
			innerHTML: '<a href="doc.pdf">資料</a>',
		});
		const result = classifyBlockItem(block);
		expect(result.name).toBe('download-file');
		expect(fetchSpy).not.toHaveBeenCalled();
		fetchSpy.mockRestore();
	});
});
