# `@d-zero/site-migrator`

`.nitpicker` アーカイブを入力とするウェブサイト移植ツールキット。サブリソースをローカルへ DL する CLI と、後続の変換処理で使うユーティリティ関数群を提供する。

## Installation

```sh
yarn add @d-zero/site-migrator
```

## CLI

```sh
npx dz-migrate <archive.nitpicker> -o <htdocs-dir> [--limit <n>]
```

- `<archive.nitpicker>` — [nitpicker](https://github.com/d-zero-dev/nitpicker) で生成済みのアーカイブファイル
- `-o, --output <htdocs-dir>` — リソース DL 先。URL の pathname をそのままミラーする（例: `https://example.com/img/a.png` → `<htdocs-dir>/img/a.png`）
- `--limit <n>` — 並列 DL 数（デフォルト 10）

`.nitpicker` 内に格納された HTML スナップショットはディスクには落とさない（原本は `.nitpicker` が保持する）。HTML を扱う後続処理は本パッケージの API を経由して on-demand に取得する。

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
} from '@d-zero/site-migrator';
```

主要 API:

| 関数                    | 概要                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `migrate`               | アーカイブを開き、リソースを並列 DL する CLI のロジック本体 |
| `openArchive`           | `.nitpicker` を開いてセッションを返す（要 `close()`）       |
| `listInternalPages`     | 内部ページ URL を順に yield する非同期イテラブル            |
| `listInternalResources` | 内部リソース URL を順に yield する非同期イテラブル          |
| `getPageHtml`           | レンダリング後 HTML を全長で取得（truncate なし）           |
| `downloadResources`     | URL リストを並列 fetch してローカルへ保存                   |
| `urlToOutputPath`       | URL を `<htdocs-dir>` 配下のローカルパスへ変換              |
| `rewriteAssetRefs`      | HTML 内のアセット参照を resolver で書き換える（streaming）  |
| `extractFrontmatter`    | `<head>` のメタ情報を構造化オブジェクトへ抽出               |

`extractFrontmatter` の出力構造は [`Frontmatter`](./src/types.ts) を参照。`title` / `og.title` / `twitter.title` は `｜` `|` で分割して最初の非空セグメントを採用し、raw と異なる場合のみ `rawTitle` 等に raw を保持する。

## 設計上の注意

`extractFrontmatter` と `rewriteAssetRefs` は parse5 を内部で使うが、外部 API としては「HTML 文字列 → 構造化データ／HTML 文字列」の純関数。将来 nitpicker がメタを DB カラムとして保持した場合に差し替えやすいよう、parse5 に依存するコードは `src/html/` 配下に閉じている。
