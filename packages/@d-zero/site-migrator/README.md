# `@d-zero/site-migrator`

`.nitpicker` アーカイブを入力とするウェブサイト移植ツールキット。サブリソースのローカル DL、ページ HTML のレイアウト剥がしと BurgerEditor ブロックへの変換、`.nitpicker` DB のページメタと採番した整数 id を YAML frontmatter として prepend する CLI、同一オリジン参照を後段パイプライン向けに書き換えるリライタ、および周辺ユーティリティ関数群を提供する。

## Installation

```sh
yarn add @d-zero/site-migrator
```

## CLI

```sh
npx dz-migrate <archive.nitpicker> -o <htdocs-dir> --content-class <name> [--layout-json <path>] [--limit <n>] [--extract-limit <n>]
```

- `<archive.nitpicker>` — [nitpicker](https://github.com/d-zero-dev/nitpicker) で生成済みのアーカイブファイル
- `-o, --output <htdocs-dir>` — 出力先。URL の pathname をそのままミラーする（例: `https://example.com/img/a.png` → `<htdocs-dir>/img/a.png`、`https://example.com/about/` → `<htdocs-dir>/about/index.html`）
- `--content-class <name>` — **必須**。BurgerEditor の `editableArea` セレクタに対応させるクラス名。生成したブロック群を埋め込む既存 main 要素自身の `classList` に追加する（移行先サイトの BurgerEditor 設定に依存する値のため既定値は無い）
- `--layout-json <path>` — 事前生成済みの anatomist レイアウト解析 JSONL（1 ファイルで対象 URL 全件分）。省略時は全ページをライブ解析する
- `--limit <n>` — 並列 DL 数（デフォルト 10）
- `--extract-limit <n>` — 並列ページ抽出数（デフォルト 10）。ライブレイアウト解析の並列数もこれを共用する

リソースは fetch で DL、ページ HTML はアーカイブ内のスナップショットを読み、`extractMainContent` でレイアウト共通部分を剥がし、そのページのレイアウトを BurgerEditor ブロックへ変換して既存 main 要素へ埋め込み（後述）、`assignPageIds` で URL → 整数 id の写像を組み立てて `.nitpicker` DB のページメタと併せて `formatFrontmatter` が生成する `---\n…\n---\n` YAML ブロックを先頭に prepend、本文中の同一オリジン参照を `rewritePageRefs` が書き換えてから `.html` として書き出す。

## Programmatic API

```ts
import {
	migrate,
	openArchive,
	listInternalPages,
	listInternalResources,
	getPageHtml,
	getFrontmatter,
	downloadResources,
	urlToOutputPath,
	rewriteAssetRefs,
	extractMainContent,
	extractPages,
	formatFrontmatter,
	splitTitle,
	assignPageIds,
	buildPageIdLookup,
	rewritePageRefs,
	resolveIdTemplate,
} from '@d-zero/site-migrator';
```

主要 API:

| 関数                    | 概要                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `migrate`               | アーカイブを開き、リソース DL とページ抽出を並列実行する全体フロー                        |
| `openArchive`           | `.nitpicker` を開いてセッションを返す（要 `close()`）                                     |
| `listInternalPages`     | 内部ページ URL を順に yield する非同期イテラブル                                          |
| `listInternalResources` | 内部リソース URL を順に yield する非同期イテラブル                                        |
| `getPageHtml`           | レンダリング後 HTML を全長で取得（truncate なし）                                         |
| `getFrontmatter`        | `.nitpicker` DB の flat meta カラムを `Frontmatter` へマップ                              |
| `downloadResources`     | URL リストを並列 fetch してローカルへ保存                                                 |
| `urlToOutputPath`       | URL を `<htdocs-dir>` 配下のローカルパスへ変換                                            |
| `rewriteAssetRefs`      | HTML 内のアセット参照を resolver で書き換える（streaming）                                |
| `extractMainContent`    | レイアウト共通部分を剥がして本文要素の `outerHTML` を返す                                 |
| `extractPages`          | ページ一覧に `extractMainContent` + `getFrontmatter` を適用して書き出す                   |
| `formatFrontmatter`     | `Frontmatter` を後段パイプライン互換の `---\n…\n---\n` YAML ブロック文字列にする          |
| `splitTitle`            | タイトル文字列を `｜` / `\|` で分割し `{title, rawTitle?}` を返す純関数                   |
| `assignPageIds`         | URL リストから ディレクトリグループ採番ルールに従って `Map<url, id>` を組み立てる純関数   |
| `buildPageIdLookup`     | `assignPageIds` の結果から `rewritePageRefs` 用ルックアップ表を一度だけ構築する純関数     |
| `rewritePageRefs`       | 同一オリジンの asset/page 参照を root-relative path / `{{<id>}}` テンプレートに書き換える |
| `resolveIdTemplate`     | `{{<id>}}` token を id→URL マップで実 URL に解決する純関数（後段ビルドツール用）          |

`Frontmatter` の出力構造は [`./src/types.ts`](./src/types.ts) を参照。`title` / `og.title` / `twitter.title` は `｜` `|` で分割して最初の非空セグメントを採用し、分割が起きたときだけ `rawTitle` 等に元文字列を保持する。

### `extractMainContent` のヒューリスティクス

精緻な構造推論はせず、以下の優先順位で「ページ内にちょうど 1 個だけ存在する」要素を本文として採用する。

1. `class` のトークンに `main` を含む
2. `class` のトークンに `content` を含む
3. `<main>` 要素
4. `role="main"` を持つ要素
5. `id` に `main` を含む
6. `id` に `content` を含む

各段で 0 個または 2 個以上だった場合は次の段へフォールスルー。6 段すべてで満たさなかった場合は `matched: false` として元の HTML をそのまま返すので、呼び出し側はファイル出力時に空にはならない。マッチ確定後は `serializeOuter` で抽出要素のタグごとフラグメント（DOCTYPE / `<html>` / `<head>` を含まない）を返す。

クラス / ID の判定は大小無視。クラスは whitespace で分割したトークン内の substring 一致（`page-main` は OK だが `domain` のような偽陽性は実用上ほぼ起きない前提）。`role` 属性は WAI-ARIA に従い whitespace 区切りのトークンリストとして扱い、トークンのいずれかが `main` に等しければマッチ。`<html>` / `<head>` / `<body>` は候補から除外しているため `<body class="main">` がページ全体を吸い込む事故は起きない。

#### 既知の制限

- 同一トークン substring の副作用: `class="sitemap-main-link"` のように `main` を含むトークンを持つ要素が複数あると rung 1 が「2 個以上」で失格しフォールスルーする。雑な実装の代償として許容。
- ページ URL が `outputDir` 配下で衝突する場合（例: `/about/` と `/about/index.html` が両方ページとして登録されている）、2 つ目以降は `failed` として報告し書き込まない。
- リソース URL とページ URL が衝突した場合は、ページ書き出しが後勝ちで上書きする（レイアウト剥がし後の HTML を canonical 版とみなすため）。
- 出力 `.html` を直接ブラウザで開くと、frontmatter ブロックがページ先頭に visible text として表示され、DOCTYPE が先頭にないため Quirks Mode に落ちる。これは中間成果物として後続の scaffold パイプラインに渡す前提の挙動で、エンドユーザー向けのレンダリング対象ではない。

### ページ id 採番と参照書き換え

`extractPages` は処理開始時に `items` の全 URL を `assignPageIds` に渡して URL → 整数 id の写像を組み立てる。各ページの frontmatter には `id: <number>` がトップに埋め込まれ、本文中の同一オリジン参照は `rewritePageRefs` が次のルールで書き換える。

採番ルール:

- root セクション（pathname に副ディレクトリを含まない URL — `/`、`/foo.html`、`/foo` 等）: `5, 10, 15, …`
- N 番目の第一階層サブディレクトリセクション（小文字化したディレクトリ名でアルファベット順）: `N×10000, +5, +10, …`

セクション内のページ順序は `@d-zero/shared/sort/path` の `pathComparator`（nitpicker / kamado と同じ自然 URL 順）で安定化させ、サブディレクトリ名の順序は `@d-zero/shared/sort/alphabetical` の `alphabeticalComparator`（locale 非依存）で安定化させているので、同じアーカイブからは Node の ICU ビルドに関わらず毎回同じ id が割り当てられる。サブディレクトリ深さ 2 以上は最上位のディレクトリで section が決まり、それ以下の階層はセクション内の自然 URL 順に吸収される。step 5 / 10000 単位の間隔は、手動で id を挿入する余地を残すための慣習で、後段の scaffold パイプラインの期待値と合わせてある。1 セクションあたり 2000 ページが上限（`SECTION_STEP / PAGE_STEP`）で、超過するとエラーを投げる — 黙って id が次セクションに侵入するより明示的に失敗させる方を採る。

参照書き換えルール（`rewritePageRefs`）:

- ベース URL はページ自身の URL。`<base href>` は無視する。
- 同一オリジン（host 完全一致）のみが書き換え対象。外部オリジン・`mailto:` / `tel:` / `sms:` / `javascript:` / `data:` / `blob:` / `vbscript:` / `file:` スキーム・`#fragment` だけ（先頭空白付きも含む）・空文字は触らない。
- 次のタグ・属性の同一オリジン URL は、id 写像にヒットすれば `{{<id>}}` テンプレートに置換し `?query` / `#fragment` を末尾に保持する（`{{42}}?q=foo#top`）。id がなければ root-relative path にフォールバック。
  - `<a href>`、`<form action>`、`<iframe src>`。
  - `<link href>` のうち `rel` トークンに `canonical` / `alternate` / `prev` / `next` を含むもの（`rel="stylesheet"` / `"icon"` 等は asset 扱い）。
- それ以外のアセット属性（`<img src>`, `<img srcset>`, `<script src>`, `<source src/srcset>`, `<embed src>`, `<video src/poster>`, `<audio src>`, `<track src>`、および `<link>` の非ページ用法）は同一オリジンであれば root-relative path に書き換える。
- id 写像のルックアップは origin+pathname+search の完全一致を先に試し、ヒットしなければ trailing-slash を吸収した origin+pathname にフォールバックする。これにより `/list?p=1` / `/list?p=2` の両方が `pageIds` に登録されていれば各々別の id に解決され、片方しか無ければ pathname-only の fallback で拾われる。`<a href="/about">` と `pageIds` の `/about/` も双方向にマッチする。

`rewritePageRefs`（main 非検出・ブロック変換失敗ページ）または `rewriteBlockRefs`（ブロック変換成功ページ、詳細は後述）が失敗した場合は fail-soft で書き換え前の内容を出力し、`onResult` の `extracted` / `fallback` outcome に `rewriteError` フィールドを乗せてレポートする（`migrate()` の `pagesRewriteFailed` で集計）。フロントマター付与・id 採番は HTML 書き換えと独立して走るので、片方が失敗してももう片方は影響を受けない。

### `{{<id>}}` token の解決（後段ビルドツール）

`rewritePageRefs` が残す `{{<id>}}` token は、後段のビルドツール（scaffold + kamado を想定）が `resolveIdTemplate` を通して実 URL に置換する想定。site-migrator 自身は URL を知らない（出力ディレクトリ構造やビルドツールのルーティング規約は site-migrator のスコープ外）ので、解決はビルド側の責務に切り出した。

`resolveIdTemplate({ html, idMap, onUnresolved? })` は純関数で、`{{42}}?q=foo#frag` のような末尾 `?query#fragment` は `idMap.get(42)` の URL の後ろにそのまま連結される（同じ URL に再度 `?` が含まれる場合のマージはしない — 必要なら呼び出し側で前処理する）。未解決の id は `{{42}}` のまま残し `onUnresolved(42)` を呼ぶことで、リンク切れがログ／例外で早期検出できる。

ビルドツール側の組み込みは別 PR で対応する。

### Frontmatter（DB ベース）

`getFrontmatter` は `.nitpicker` DB の flat meta カラムを `Frontmatter` 型にマップする。`title` / `og.title` / `twitter.title` は `splitTitle` を通り、`｜` / `|` で先頭セグメントが抜き出されたら元文字列を `rawTitle` 等に保持する（DB に rawTitle カラムが存在しないため `title` 全文から生成）。空文字列 / null / whitespace-only カラムは出力から落とすので、`description: ""` のような placeholder は発生しない。

`formatFrontmatter` は後続の scaffold パイプラインがそのまま消費できる YAML を生成する。og.\* / twitter.\* は nested map で、サブオブジェクト全体が空なら親キーも省略される。`twitter.url` は DB に対応カラムがないため型・出力ともに非対応（`og.url` で代替する慣習に従う）。

`extractPages` は `extractMainContent` と `getFrontmatter` を並列実行し、main 要素が見つかったページには続けて BurgerEditor ブロック変換パイプライン（後述）を適用したうえで、生成した YAML ブロックを本文の先頭に prepend してから書き出す。整数 id は常に付与されるので「DB 行なし」のページでも `---\nid: <number>\n---\n` ブロックは出る。`getFrontmatter` が例外を投げた場合は fail-soft で id-only frontmatter と本文を書き出し、`onResult` の outcome に `metaError` を載せて警告する（`migrate()` レポートでは `pagesMetaFailed` として集計される）。

### BurgerEditor ブロック変換パイプライン（`dz-migrate` のデフォルト動作）

`.nitpicker` アーカイブベースのレイアウト剥がしだけでは `data-bge-*` マーカーが無く、BurgerEditor 上では「1 個の wysiwyg フォールバックブロック」としてしか扱えない。site-migrator の存在意義は既存サイトを BurgerEditor で編集可能なブロック構造に変換することなので、このブロック変換はオプトインフラグではなく `extractPages` / `dz-migrate` の既定動作になっている（`--content-class` は必須オプションだが、指定すれば必ず変換が走る）。

処理は次の要素で構成される（いずれも `src/page-extractor/` 配下、統合前は内部 API だったが `extractPages` に組み込まれた現在も `index.ts` からは export していない）:

| 関数                 | 概要                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `resolvePageLayouts` | `--layout-json` の事前生成 JSONL を優先し、無ければ Puppeteer + `@d-zero/anatomist` でライブ解析する。ライブ解析時は `extractMainContent` のマッチ結果から構築した CSS セレクタを anatomist の `mainContentSelector` に渡し、同じ要素を解析対象にする                    |
| `classifyBlockItem`  | anatomist の `LayoutBlock` 1 個を `image`/`title-h2`/`title-h3`/`youtube`/`google-maps`/`download-file`/`button`/`table`/`wysiwyg` へヒューリスティック分類する純関数                                                                                                    |
| `layoutToBlockData`  | 複数ビューポート分の解析結果から `BlockData[]` を組み立てる純関数。ブロック単位の低信頼度は個別に `wysiwyg` へ倒し `fallbacks` に記録する                                                                                                                                |
| `rewriteBlockRefs`   | `BlockData[]` 内の同一オリジン URL を `renderBlocks` 前に書き換える（詳細は後述の専用節）                                                                                                                                                                                |
| `renderBlocks`       | `@burger-editor/core` の公式 `render()` で `BlockData[]` を `data-bge-*` 付き HTML へ変換する。ブロックごとに `render()` 直後に `parseHTMLToBlockData` で逆パースし変換元と構造的に一致するか往復検証し、不一致なら `wysiwyg` 単一アイテムへ倒す（詳細は次のセクション） |
| `mergeMainContent`   | `renderBlocks` のラッパー `<div>` の中身だけを既存 main 要素の子要素として差し替え、`--content-class` を main 要素自身の `classList` に追加する（新規ラッパー要素は追加しない）                                                                                          |
| `isMainConsistent`   | 事前生成 JSON 使用時のみ、anatomist が検出した main 要素（`LayoutBlock`）と `extractMainContent` がマッチした要素の `tagName`/`id`/`classList` を比較する整合性チェック                                                                                                  |
| `downloadBlockFiles` | 生成ブロック内の `download-file` アイテムの `path` を集めて `downloadResources` へ二重 DL を避けつつ追加投入し、実ファイルサイズを `size`/`formatedSize` に反映する                                                                                                      |

`extractPages` はページごとに以下の順で処理する:

1. `getPageHtml` + `extractMainContent` + `getFrontmatter` を全ページ分並列実行し、main が見つかったページ（ブロック変換対象）と見つからなかったページ（`outcome: 'fallback'`）を仕分ける。
2. ブロック変換対象の全 URL をまとめて **1 回**の `resolvePageLayouts` 呼び出しに渡す（ページごとに呼ぶと Puppeteer ブラウザをページ数だけ起動することになり実運用サイト規模では致命的に遅くなるため）。
3. ページごとに（事前生成 JSON 使用時のみ）`isMainConsistent` → `layoutToBlockData` → `downloadBlockFiles`（バッチ） → `rewriteBlockRefs` → `renderBlocks` → `mergeMainContent` → frontmatter 付与 → 書き出し、という順で処理する。ライブ解析時は 2. の時点で `mainContentSelector` により同じ要素を解析対象にしているため構造的に整合が保証されており、`isMainConsistent` は呼ばない。ブロック変換に成功したページ（`converted`/`partial`）はこの時点で本文全体が書き換え済みのため、後段の `rewritePageRefs` は**適用しない**（適用すると `rewriteBlockRefs` が埋め込んだ `{{<id>}}` トークンを通常 URL として再解釈し文字化けする）。main 非検出・ブロック変換失敗（`fallback`）ページは元の HTML に `{{<id>}}` token が無いため、従来通り `rewritePageRefs` を適用する。

#### ブロック単位フォールバックとページ単位フォールバックの区別

- **ブロック単位**（致命的ではない）: `layoutToBlockData` が低信頼度・ビューポート不一致・`rowSizes` 不正形状と判断した個別ブロックだけを `wysiwyg` 単一アイテムに倒す。閾値は設けない。他の高信頼度ブロックはそのまま出力し、ページ全体は諦めない。この場合 `ExtractPageResult.blockConversion` は `'partial'` になる。
- **往復検証によるブロック単位フォールバック**（致命的ではない、Issue #980）: `layoutToBlockData` が高信頼度と判断したブロックでも、`renderBlocks` が `render()` 直後に `parseHTMLToBlockData` で逆パースし直し、`name`/`containerProps.type`/`items` の行数・列数・各アイテムの `name` が変換元と一致するかを確認する。不一致（`render()`/`parseHTMLToBlockData` 側の未知のバグ等）を検出したブロックのみ、`render()` が実際に生成した HTML をそのまま `wysiwyg` 単一アイテムとして包み直す（他ブロックには影響しない）。往復検証の不一致は `renderBlocks` の `onRoundTripMismatch` コールバック（開発時デバッグ用途、既定では未使用）でのみ観測でき、現時点では `ExtractPageResult.blockConversion`／`onResult` には反映されない（パイプライン統合・レポートへの組み込みは Issue #976 の範囲）。
- **ページ単位**（致命的）: 以下のいずれかに該当する場合のみ、そのページ全体を `data-bge-*` マーカー無しのプレーンな元の完全な HTML として出力する（`blockConversion: 'fallback'`、原因は `blockConversionError`）。**品質判断（低信頼度ブロックが多い等）によるページ全体フォールバックは行わない**:
  - `resolvePageLayouts` がそのページについて完全に失敗した（ライブ URL 到達不可等）
  - 事前生成 JSON 使用時、`isMainConsistent` が anatomist の `LayoutBlock`（root）と `extractMainContent` のマッチした要素の `tagName`/`id`/`classList` 不一致と判定した（ライブ解析は `mainContentSelector` により構造的に整合が保証されるためこのチェックを行わない）
  - `layoutToBlockData` が空の `blocks` を返した（anatomist 側で `root` が見つからなかった）
  - `renderBlocks` または `mergeMainContent` が例外を投げた

#### 既知の制限（重要）

anatomist の `LayoutBlock`/`RawLayoutNode` は要素の属性（`href` / `src` / `srcset` / `alt` / `width` / `height` 等）を保持しない（保持されるのは `tagName`/`id`/`classList`/`boundingBox`/`style`/`innerHTML`/`children` のみ）。加えて `should-recurse.ts` の collapse ロジックにより `<picture><source><img></picture>` のようなラッパー構造は最終的に `img` 自身（void 要素、`innerHTML` は空）だけが残る。そのため **実データでは `image` / `youtube` / `google-maps` / `download-file` / `button.link` の判定条件（src/href）がほぼ常に取得できず、safe に `wysiwyg` へフォールバックする**。これはバグではなく、属性情報が存在しないデータに対する意図された安全側の挙動であり、コード自体は正しいロジックを実装している（anatomist が将来属性を捕捉するようになれば自動的に機能する）。anatomist 側の属性キャプチャ拡張は別途フォローアップ課題として扱う。

その他の設計上のポイント:

- `confidence` はコンテナ系 `layoutType`（vertical-stack/horizontal-row/simple-grid/complex-grid/float-wrap）にのみ `0.5` 閾値で二重チェックする。`leaf` の `confidence` は anatomist 側で常に `0` 固定なので、`classifyBlockItem` はこの値を一切参照しない（参照すると分類対象を全て `wysiwyg` に落とす自己矛盾になる）。
- 深さ圧縮（`BlockData.items` は「ブロック → 行×列 → item」の 2 階層まで）は、depth-2 ノードの `children` を一切読まず `classifyBlockItem` に丸投げすることで実現している。`classifyBlockItem` が `innerHTML` 文字列のみを見るため、depth-3 以降の `layoutType` 情報は自動的に破棄される。
- `BlockData.name` は固定値 `'migrated'`（ブロックの見た目上の種別名は未確定のプレースホルダー）。
- `render()` は内部で `document.createElement` / `new Range()` 等の DOM API に依存するため、初回呼び出し時のみ jsdom を起動して `globalThis` へ反映する（既に DOM 環境が存在する場合は何もしない）。
- 生成したブロック内（wysiwyg の `<a href>`、`button.link`、`image.path[]`、`download-file.path`）の URL は `renderBlocks` 前に `rewriteBlockRefs` が書き換える（詳細は次節）。

### 出力先ライブラリ連携（`downloadBlockFiles`）

`downloadBlockFiles` は `migrate()` が事前に収集した通常のリソース URL 集合（`knownResourceUrls`）と重複しない `download-file` アイテムの `path` だけを `downloadResources` へ追加投入する（fetch 処理そのものは再実装しない）。ダウンロード後（または既にカバー済みでスキップした場合も含めて）実ファイルサイズを `stat` で読み、`size`/`formatedSize` を実測値で書き戻す。同一ファイルが複数ページ・複数アイテムから参照されていてもダウンロードは 1 回で済ませる。

### BurgerEditor ブロック内の同一オリジン参照書き換え（`rewriteBlockRefs`）

`layoutToBlockData` が返す `BlockData[]` に含まれる同一オリジン URL（`wysiwyg` 内の `<a href>` 等、`button.link`、`image.path[]`、`download-file.path`）を、既存の `rewritePageRefs` と同じ正規化ルールで書き換える純関数（Issue #979）。`extractPages` が `renderBlocks` を呼ぶ**前**、`BlockData` の段階で書き換える — レンダリング後の HTML 文字列に対して既存の `rewritePageRefs` をタグ名ベースで適用する方式だと、`button`/`download-file` アイテムはどちらも `<a href>` へレンダリングされ、両者を区別する `data-bgi` 属性が `<a>` 自身ではなく祖先要素に付与されるため、「button は page-ref 扱い（`{{<id>}}` 化あり）、download-file は asset 扱い（root-relative のみ）」を確実に区別できない。アイテム種別（`item.name`）が型として確定しているこの段階で書き換えることで、誤判定なく両者を区別する。`classifyBlockItem`/`layoutToBlockData`/`renderBlocks` 同様、`index.ts` からは export していない内部 API（`src/page-extractor/rewrite-block-refs.ts` を直接 import する）。

- `rewriteBlockRefs(options: { blocks: BlockData[], baseUrl: string, pageIdLookup: PageIdLookup }): Promise<{ blocks: BlockData[], errors: RewriteBlockRefsError[] }>` — `wysiwyg` は `rewritePageRefs` へそのまま委譲、`button.link` はページ参照ルール（既知ページなら `{{<id>}}` 化）、`image.path[]`/`download-file.path` はアセットルール（root-relative のみ、`{{<id>}}` 化はしない）、`google-maps`/`youtube` の `url` は外部オリジンのため対象外。`wysiwyg` の `rewritePageRefs` 呼び出しが失敗した場合は fail-soft で元の内容を保持し、`errors` に `{blockIndex, rowIndex, itemIndex, error}` を記録する（他のアイテム・ブロックの処理は継続する）。
- `extractPages` は `errors` が空でなければ、それらを 1 件の `Error`（`ExtractPageResult.rewriteError`）へ集約して報告する — 既存の `rewriteError`（`rewritePageRefs` 由来）と同じフィールドを共有する。

### 設計上の注意

`extractMainContent` / `rewriteAssetRefs` / `mergeMainContent` は parse5 を内部で使う純関数、`getFrontmatter` は `@nitpicker/query` の DB 読み出しに依存する。両者の責務分離は `src/html/` (parse5) と `src/archive/` (`@nitpicker/query`) のディレクトリ構造で表現している。
