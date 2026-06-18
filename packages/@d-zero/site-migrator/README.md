# `@d-zero/site-migrator`

`.nitpicker` アーカイブを入力とするウェブサイト移植ツールキット。サブリソースのローカル DL とページ HTML のレイアウト剥がしを行う CLI、および後続の変換処理で使うユーティリティ関数群を提供する。

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

リソースは fetch で DL、ページ HTML はアーカイブ内のスナップショットを読み、`extractMainContent` でレイアウト共通部分を剥がしてから `.html` として書き出す。

## Programmatic API

```ts
import {
	migrate,
	openArchive,
	listInternalPages,
	listInternalResources,
	getPageHtml,
	downloadResources,
	urlToOutputPath,
	rewriteAssetRefs,
	extractFrontmatter,
	extractMainContent,
	extractPages,
} from '@d-zero/site-migrator';
```

主要 API:

| 関数                    | 概要                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `migrate`               | アーカイブを開き、リソース DL とページ抽出を並列実行する全体フロー |
| `openArchive`           | `.nitpicker` を開いてセッションを返す（要 `close()`）              |
| `listInternalPages`     | 内部ページ URL を順に yield する非同期イテラブル                   |
| `listInternalResources` | 内部リソース URL を順に yield する非同期イテラブル                 |
| `getPageHtml`           | レンダリング後 HTML を全長で取得（truncate なし）                  |
| `downloadResources`     | URL リストを並列 fetch してローカルへ保存                          |
| `urlToOutputPath`       | URL を `<htdocs-dir>` 配下のローカルパスへ変換                     |
| `rewriteAssetRefs`      | HTML 内のアセット参照を resolver で書き換える（streaming）         |
| `extractFrontmatter`    | `<head>` のメタ情報を構造化オブジェクトへ抽出                      |
| `extractMainContent`    | レイアウト共通部分を剥がして本文要素の `outerHTML` を返す          |
| `extractPages`          | ページ一覧に対して `extractMainContent` を並列適用して書き出す     |

`extractFrontmatter` の出力構造は [`Frontmatter`](./src/types.ts) を参照。`title` / `og.title` / `twitter.title` は `｜` `|` で分割して最初の非空セグメントを採用し、raw と異なる場合のみ `rawTitle` 等に raw を保持する。

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

## 設計上の注意

`extractFrontmatter` / `rewriteAssetRefs` / `extractMainContent` は parse5 を内部で使うが、外部 API としては「HTML 文字列 → 構造化データ／HTML 文字列」の純関数。将来 nitpicker がメタを DB カラムとして保持した場合などに差し替えやすいよう、parse5 に依存するコードは `src/html/` 配下に閉じている。
