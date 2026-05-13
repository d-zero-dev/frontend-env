---
description: 2つのページを比較してデバッグする
disable-model-invocation: true
argument-hint: [相談内容・比較対象URL等]
---

# ページ比較デバッグコマンド

`$ARGUMENTS` の内容に応じて、2つの環境のページを比較し差分を特定する。

## 比較対象の例

- 本番サイト vs ステージングサイト
- 本番サイト vs テストサイト（デモサイト）
- テストサイト vs ローカルサイト（`http://localhost:8000/`）
- リリース前後の差分確認

## 判断フロー

`$ARGUMENTS` の相談内容から、適切な比較手法を選択する。

### ビジュアル差分が必要な場合

見た目の崩れ・レイアウトずれ・画像の違いなど。

`@d-zero/archaeologist` を使用する:

```bash
# 2つのURLを直接比較
npx @d-zero/archaeologist <URL_A> <URL_B>

# 画像差分のみ
npx @d-zero/archaeologist <URL_A> <URL_B> -t image

# DOM差分のみ
npx @d-zero/archaeologist <URL_A> <URL_B> -t dom

# 生HTMLソース差分のみ（ブラウザ不要、高速）
npx @d-zero/archaeologist <URL_A> <URL_B> -t code

# 特定要素に絞る
npx @d-zero/archaeologist <URL_A> <URL_B> -s ".c-header"

# 合成画像で左右比較
npx @d-zero/archaeologist <URL_A> <URL_B> --combined

# デバイスを指定
npx @d-zero/archaeologist <URL_A> <URL_B> -d desktop,tablet,mobile
```

結果は `.archaeologist/` ディレクトリに出力される。出力された画像を `Read` で確認する。

### 文字列差分だけで済む場合

テキストの違い・HTMLソースの差異・メタ情報の違いなど。

`@d-zero/archaeologist` の `-t code` で生HTMLソース差分を取得するか、DevTools MCPで両ページのHTMLを取得して比較する。

### ファイル一致確認が必要な場合

CSS・JS・画像などのアセットが同一かどうかの確認。

`@d-zero/filematch` を使用する:

```bash
# 2つのファイル/URLを比較（一致/不一致の判定）
npx @d-zero/filematch <URL_OR_PATH_A> <URL_OR_PATH_B>
```

差分の中身が必要な場合は、両方を `WebFetch` や `curl` で取得して内容を比較する。

### ブラウザで詳細調査が必要な場合

算出スタイルの確認・JS実行結果の違い・動的コンテンツの差異など。

chrome-devtools MCPを使用して両ページを調査する:

1. `navigate_page` で一方のページを開く
2. `take_screenshot` / `take_snapshot` で状態を記録
3. `evaluate_script` で算出スタイルやDOM状態を取得
4. もう一方のページで同じ操作を行い、結果を比較

**注意**: ローカルサイト（`localhost:8000`）を比較対象にする場合、dev serverが起動していなければバックグラウンドで `yarn dev` を起動する。

## CSS・JSの差分深掘り

ページの差分原因がCSS・JSにある可能性がある場合:

1. 両ページが参照しているCSS・JSのURLを `evaluate_script` や HTMLソースから特定する
2. `@d-zero/filematch` でファイルが同一か確認する
3. 不一致の場合、両方を取得して差分を確認する

## 複数ページの一括比較

比較対象が複数ページにわたる場合、AskUserQuestionツールでURLリストの提供を求め、`@d-zero/archaeologist` の `-f` オプションを使用する。
