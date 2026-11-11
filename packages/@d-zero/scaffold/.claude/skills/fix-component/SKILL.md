---
name: fix-component
description: コンポーネント名・クラス名から該当するソースを特定し、CSS/TSX を修正してブラウザで検証する。コンポーネント単位の見た目の修正を頼むときに使う
disable-model-invocation: true
argument-hint: [component-or-class] [fix-instructions...]
---

# コンポーネント修正

`$ARGUMENTS`を解析し、該当するソースファイルを特定してコーディング修正を行う。

## 常に守ること

- ビルドの出力先（`kamado.config.jsonc`の`dir.output`。`htdocs/`か`htdocs/webroot/`）は編集しない。編集するのは`__assets/`だけ
- DevTools MCP（`chrome-devtools`）は`http://localhost:8000/`にだけ使う。Figma などの外部 URL をブラウザで開かない
- BurgerEditor の`data-bge-*`/`data-bgi-*`属性の構造を変えない
- ページのメタ（TSX の`export const meta`と、同名の`.json`）は、修正指示に含まれない限り変えない
- CSS はコンポーネント単位のファイルに閉じて修正する

## 1. 引数の解析

`$ARGUMENTS`から次を識別する。

- **コンポーネント名**: `c-button`、`c-local-nav`など
- **クラス名**: `.c-button__label`、`.l-header__nav`など
- **Figma URL**: `figma.com`を含む URL。デザインの参照情報として受け取り、ブラウザでは開かない
- **対象ページの URL/パス**: localhost の URL またはパス
- **修正指示**: 上記以外のテキスト（具体的な CSS 値の変更など）

## 2. dev server の起動

1. `chrome-devtools:navigate_page`で`http://localhost:8000/`を開く
2. 接続拒否（`ERR_CONNECTION_REFUSED`）なら、`yarn dev`を**バックグラウンドで**起動する（`run_in_background: true`）
3. もう一度`chrome-devtools:navigate_page`で接続を確かめる

## 3. 対象ファイルの特定

1. `__assets/_libs`をコンポーネント名で検索する。クラス名が渡されたら、BEM のブロック名（`c-button__label` → `c-button`）で検索する
   - コンポーネントは、ディレクトリ（`component/c-button/c-button.css`）のことも、フラットなファイル（`component/c-local-nav.css`）のこともある
   - `.css`と`.tsx`の両方を読む
   - `component/`に無ければ、`layouts/`、`page/`、`style/`も検索する
2. そのコンポーネントを使うページを`__assets/htdocs/`と`__assets/_libs/layouts/`から検索し、確認用のページを決める

## 4. 現状の把握

1. 特定した CSS/TSX を読む
2. `chrome-devtools:navigate_page`で`http://localhost:8000/{対象ページのパス}`を開き、`chrome-devtools:take_screenshot`で現状を記録する
3. 詳細が要るときは次を使う
   - `chrome-devtools:take_snapshot`で DOM 構造と UID の一覧を取る
   - `chrome-devtools:take_screenshot`に`uid`を渡して、コンポーネントだけを撮る
   - `chrome-devtools:evaluate_script`で算出スタイルを取る

     ```javascript
     () => {
     	const el = document.querySelector('.target-selector');
     	const s = window.getComputedStyle(el);
     	return {
     		minBlockSize: s.minBlockSize,
     		paddingInline: s.paddingInline,
     		gap: s.gap,
     	};
     };
     ```

## 5. 修正

1. デザイン指示と現状の差分を整理してから着手する
2. 対象のファイルを編集する
   - **CSS**: `__assets/_libs/component/`、`__assets/_libs/layouts/`、`__assets/_libs/page/`、`__assets/_libs/style/`
   - **TSX**: `__assets/_libs/component/`、`__assets/_libs/layouts/`、ページは`__assets/htdocs/`
   - **HTML のページ**: `__assets/htdocs/`の`.html`。先頭の front matter（`---`で囲まれた部分）は、修正指示に含まれない限り変えない
3. 修正指示が複数あるときは、まとめて編集してから確認に進む

## 6. 確認

1. ブラウザで確かめる。dev server はリクエストのたびにソースから作るので、ビルドは要らない
   - `chrome-devtools:navigate_page`を`type: "reload"`、`ignoreCache: true`で実行する
   - 再読み込みで UID は無効になる。`chrome-devtools:take_snapshot`で取り直してから`chrome-devtools:take_screenshot`を使う
   - `chrome-devtools:evaluate_script`で算出スタイルを取り、変更が反映されたことを数値で確かめる
2. ナビの状態や子要素の有無で見た目が変わるコンポーネントは、複数のページで確かめる
3. レスポンシブの確認は`chrome-devtools:emulate`でビューポートを変える
   - PC: `1440x900x1`
   - タブレット: `768x1024x1,touch`
   - スマートフォン: `375x667x1,mobile,touch`
4. 問題があれば、修正 → 確認を繰り返す
5. `yarn lint:css`と`yarn lint:html`を実行し、エラーを直す

ビルドの出力をコミットするプロジェクトでは、最後に dev server を止めてから、修正したソースを読み込むエントリポイントをビルドする（kamado は、同じプロジェクトでビルドと dev server を同時に動かせない）。

```bash
yarn build:only "__assets/htdocs/css/style.css"
```

- 渡すパスは`__assets/htdocs/`の中のファイル。コンポーネントの CSS（`__assets/_libs/component/`）ではなく、それを読み込む`__assets/htdocs/css/style.css`などを渡す
- `Build completed`が出て、`warning:`の行が無ければ成功。`warning: build target … matched no page, stylesheet or script`は、渡したパスがエントリポイントでないことを表す

## 報告

- 修正したファイルの一覧と、各変更の概要
- ビルド結果（成功/失敗）
- ブラウザ確認のスクリーンショット
- `chrome-devtools:evaluate_script`による算出スタイルの検証結果
