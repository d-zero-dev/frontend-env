# `@d-zero/site-migrator`

`.nitpicker` アーカイブを入力とするウェブサイト移植ツールキット。サブリソースのローカル DL、ページ HTML のレイアウト剥がし、`.nitpicker` DB のページメタと採番した整数 id を YAML frontmatter として prepend する CLI、同一オリジン参照を後段パイプライン向けに書き換えるリライタ、および周辺ユーティリティ関数群を提供する。

## Installation

```sh
yarn add @d-zero/site-migrator
```

## CLI

```sh
npx dz-migrate <archive.nitpicker> -o <htdocs-dir> [--limit <n>] [--extract-limit <n>]
```

- `<archive.nitpicker>` — [nitpicker](https://github.com/d-zero-dev/nitpicker) で生成済みのアーカイブファイル
- `-o, --output <htdocs-dir>` — 出力先。URL の pathname をそのままミラーする（例: `https://example.com/img/a.png` → `<htdocs-dir>/img/a.png`、`https://example.com/about/` → `<htdocs-dir>/about/index.html`）
- `--limit <n>` — 並列 DL 数（デフォルト 10）
- `--extract-limit <n>` — 並列ページ抽出数（デフォルト 10）

リソースは fetch で DL、ページ HTML はアーカイブ内のスナップショットを読み、`extractMainContent` でレイアウト共通部分を剥がし、`assignPageIds` で URL → 整数 id の写像を組み立てて `.nitpicker` DB のページメタと併せて `formatFrontmatter` が生成する `---\n…\n---\n` YAML ブロックを先頭に prepend、本文中の同一オリジン参照を `rewritePageRefs` が書き換えてから `.html` として書き出す。

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
} from '@d-zero/site-migrator';
```

主要 API:

| 関数 | 概要 |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------ |
| `migrate` | アーカイブを開き、リソース DL とページ抽出を並列実行する全体フロー |
| `openArchive` | `.nitpicker` を開いてセッションを返す（要 `close()`） |
| `listInternalPages` | 内部ページ URL を順に yield する非同期イテラブル |
| `listInternalResources` | 内部リソース URL を順に yield する非同期イテラブル |
| `getPageHtml` | レンダリング後 HTML を全長で取得（truncate なし） |
| `getFrontmatter` | `.nitpicker` DB の flat meta カラムを `Frontmatter` へマップ |
| `downloadResources` | URL リストを並列 fetch してローカルへ保存 |
| `urlToOutputPath` | URL を `<htdocs-dir>` 配下のローカルパスへ変換 |
| `rewriteAssetRefs` | HTML 内のアセット参照を resolver で書き換える（streaming） |
| `extractMainContent` | レイアウト共通部分を剥がして本文要素の `outerHTML` を返す |
| `extractPages` | ページ一覧に `extractMainContent` + `getFrontmatter` を適用して書き出す |
| `formatFrontmatter` | `Frontmatter` を後段パイプライン互換の `---\n…\n---\n` YAML ブロック文字列にする |
| `splitTitle` | タイトル文字列を `｜` / `                                                                |`で分割し`{title, rawTitle?}` を返す純関数 |
| `assignPageIds` | URL リストから ディレクトリグループ採番ルールに従って `Map<url, id>` を組み立てる純関数 |
| `buildPageIdLookup` | `assignPageIds` の結果から `rewritePageRefs` 用ルックアップ表を一度だけ構築する純関数 |
| `rewritePageRefs` | 同一オリジンの asset/page 参照を root-relative path / `{{<id>}}` テンプレートに書き換える |

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

`rewritePageRefs` が例外を投げた場合は fail-soft で書き換え前の HTML を出力し、`onResult` の `extracted` / `fallback` outcome に `rewriteError` フィールドを乗せてレポートする（`migrate()` の `pagesRewriteFailed` で集計）。フロントマター付与・id 採番は HTML 書き換えと独立して走るので、片方が失敗してももう片方は影響を受けない。

### Frontmatter（DB ベース）

`getFrontmatter` は `.nitpicker` DB の flat meta カラムを `Frontmatter` 型にマップする。`title` / `og.title` / `twitter.title` は `splitTitle` を通り、`｜` / `|` で先頭セグメントが抜き出されたら元文字列を `rawTitle` 等に保持する（DB に rawTitle カラムが存在しないため `title` 全文から生成）。空文字列 / null / whitespace-only カラムは出力から落とすので、`description: ""` のような placeholder は発生しない。

`formatFrontmatter` は後続の scaffold パイプラインがそのまま消費できる YAML を生成する。og.\* / twitter.\* は nested map で、サブオブジェクト全体が空なら親キーも省略される。`twitter.url` は DB に対応カラムがないため型・出力ともに非対応（`og.url` で代替する慣習に従う）。

`extractPages` は `extractMainContent` と `getFrontmatter` を並列実行し、生成した YAML ブロックを抽出 HTML の先頭に prepend してから書き出す。整数 id は常に付与されるので「DB 行なし」のページでも `---\nid: <number>\n---\n` ブロックは出る。`getFrontmatter` が例外を投げた場合は fail-soft で id-only frontmatter と本文を書き出し、`onResult` の outcome に `metaError` を載せて警告する（`migrate()` レポートでは `pagesMetaFailed` として集計される）。

### 設計上の注意

`extractMainContent` / `rewriteAssetRefs` は parse5 を内部で使う純関数、`getFrontmatter` は `@nitpicker/query` の DB 読み出しに依存する。両者の責務分離は `src/html/` (parse5) と `src/archive/` (`@nitpicker/query`) のディレクトリ構造で表現している。
