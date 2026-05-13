---
description: コンポーネントのコーディング修正
disable-model-invocation: true
argument-hint: [component-or-class] [fix-instructions...]
---

# コンポーネント修正コマンド

`$ARGUMENTS` を解析し、該当するソースファイルを特定してコーディング修正を行う。

## 実行フロー

### 1. 引数の解析

`$ARGUMENTS` から以下を識別する：

- **コンポーネント名**: `c-button`, `c-local-nav` など
- **クラス名**: `.c-button__label`, `.l-header__nav` など
- **Figma URL**: `figma.com` を含むURL
- **修正指示**: 上記以外のテキスト（具体的なCSS値の変更指示など）
- **対象ページURL/パス**: localhost またはパスの指定

### 2. dev serverの起動

1. chrome-devtools MCPで `navigate_page` を試行し、`http://localhost:8000/` にアクセスできるか確認
2. 接続拒否（`ERR_CONNECTION_REFUSED`）の場合、**バックグラウンドで** `yarn dev` を起動:

```bash
# run_in_background: true で実行
yarn dev
```

3. 起動後、再度 `navigate_page` で接続確認してから次のステップへ

### 3. 対象ファイルの特定

#### コンポーネント名・クラス名から特定

1. まず `Grep` で `__assets/_libs` 配下を検索:

   ```
   Grep: pattern="{コンポーネント名}", path="__assets/_libs"
   ```

   - コンポーネントは **ディレクトリ**（`component/c-button/c-button.css`）の場合と **フラットファイル**（`component/c-local-nav.css`）の場合がある
   - `.css` と `.pug` の両方を読み込む

2. クラス名が渡された場合:
   - BEM命名規則からブロック名を抽出（`c-button__label` → `c-button`）
   - 上記と同じく検索
   - コンポーネント配下に見つからない場合は `__assets/_libs/style/` 配下も検索

3. 該当コンポーネントが使われているページを `Grep` でビルド済み `htdocs/` から検索し、確認用ページを特定

#### Figma URL

Figma URLはデザインの参照情報として受け取る。**ブラウザで開いたりはしない。**
ユーザーが提供するデザイン指示・具体的なCSS値をもとに修正内容を判断する。

### 4. 現状把握（DevTools MCP — localhost:8000 専用）

**DevTools MCPは `http://localhost:8000/` のローカルサーバーに対してのみ使用する。外部URLには使用しない。**

1. 特定したCSS/Pugファイルを `Read` で読み込み、現状のスタイルを把握
2. chrome-devtools MCPで確認用ページを開く:
   - `navigate_page` で `http://localhost:8000/{対象ページパス}` を開く
   - `take_screenshot` で現状のスクリーンショットを取得
3. 対象コンポーネントの詳細確認が必要な場合:
   - `take_snapshot` でDOM構造とUID一覧を取得
   - `take_screenshot` に `uid` を指定して対象コンポーネント部分だけのスクリーンショットを取得
   - `evaluate_script` で算出スタイル（computedStyle）を取得して現在の値を正確に把握:
     ```javascript
     () => {
     	const el = document.querySelector('.target-selector');
     	const s = window.getComputedStyle(el);
     	return {
     		minBlockSize: s.minBlockSize || s.minHeight,
     		paddingInline: s.paddingInline || `${s.paddingLeft} ${s.paddingRight}`,
     		gap: s.gap,
     		// 確認したいプロパティを必要に応じて追加
     	};
     };
     ```

### 5. 修正の実施

1. ユーザーのデザイン指示と現状の差分を分析し、変更箇所を整理してから着手
2. 修正対象のファイルを編集:
   - **CSS**: `__assets/_libs/component/` 配下、または `__assets/_libs/style/` 配下
   - **Pug**: `__assets/_libs/component/` 配下
   - **HTML**: `__assets/htdocs/` 配下（BurgerEditorブロック構造を壊さないよう注意）
3. 複数の修正指示がある場合は、一括で編集してからビルド・確認にまとめて進む

### 6. ビルド・確認

1. 修正したソースファイルをビルド:

   ```bash
   yarn build:only "__assets/htdocs/css/style.css"
   ```

   - `build:only` に渡すパスは `__assets/htdocs/` 配下のファイル（エントリポイント）。コンポーネントのCSS（`__assets/_libs/component/`）を直接指定するのではなく、それを読み込んでいる `__assets/htdocs/css/style.css` 等を指定する
   - 末尾のエラー（`process.stdin.setRawMode is not a function`）は表示系の問題で無害。`Done!` が出ていればビルド成功

2. chrome-devtools MCPで確認:
   - `navigate_page` で `type: "reload"`, `ignoreCache: true` でリロード
   - **注意**: リロード後は以前のUIDが無効になるので、`take_snapshot` でUID一覧を再取得してから `take_screenshot(uid)` を使う
   - `evaluate_script` で算出スタイルを取得し、変更が正しく反映されていることを数値で検証

3. 必要に応じて複数ページで確認（ナビ状態の違い、子要素の有無など）

4. レスポンシブ確認が必要な場合は `emulate` でビューポートを変更:
   - PC: `1440x900x1`
   - タブレット: `768x1024x1,touch`
   - スマートフォン: `375x667x1,mobile,touch`

5. 問題があれば修正→ビルド→確認を繰り返す

## 注意事項

- BurgerEditorの `data-bge-*` / `data-bgi-*` 属性構造は変更しない
- HTMLのFrontMatter（`---` で囲まれた部分）は慎重に扱う
- CSSはコンポーネント単位のファイルに閉じた修正を心がける
- `yarn dev` はバックグラウンドで実行すること（`run_in_background: true`）
- **DevTools MCPは localhost:8000 のみに使用する。Figma等の外部URLをブラウザで開かない**

## 出力形式

修正後は以下を報告：

- 修正したファイル一覧と各変更の概要
- ビルド結果（成功/失敗）
- ブラウザ確認スクリーンショット
- `evaluate_script` による算出スタイルの検証結果
