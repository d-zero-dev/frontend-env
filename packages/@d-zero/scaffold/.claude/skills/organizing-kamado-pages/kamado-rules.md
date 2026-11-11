# kamado の規則

`kamado.config.jsonc`の設定を前提に書いている。パスが違うときは、`kamado.config.jsonc`の値が正しい。

## 目次

- ディレクトリの役割
- ページの探索
- URL と出力先
- メタ（タイトル、レイアウトなど）
- レイアウト
- データファイル
- 並び順
- パンくずと`<title>`
- ファイルを移したときに、自分で直すもの
- ビルドと dev server
- Kamado UI がすること

## ディレクトリの役割

| パス                        | 役割                                                           |
| --------------------------- | -------------------------------------------------------------- |
| `__assets/htdocs/`          | ページと、CSS・JS のエントリポイント（`dir.input`）            |
| `__assets/_libs/layouts/`   | レイアウト（`pages.layouts.dir`）                              |
| `__assets/_libs/component/` | コンポーネントの TSX と CSS                                    |
| `__assets/_libs/page/`      | ページごとの CSS                                               |
| `__assets/_libs/style/`     | 全体の CSS                                                     |
| `__assets/_libs/mixin/`     | `head`の中身など、レイアウトが読み込む部品                     |
| `__assets/_libs/helpers/`   | パンくずと`<title>`を組み立てる関数                            |
| `__assets/_libs/data/`      | ページに渡すデータファイル（`data.dir`）                       |
| `__assets/_libs/types/`     | ページとレイアウトが受け取る値の型                             |
| `__assets/_libs/script/`    | JS のエントリポイントが読み込むモジュール                      |
| `dir.output`のディレクトリ  | ビルド出力。`htdocs/`か、baserCMS 5 向けでは`htdocs/webroot/`  |

- `@/`は`__assets/_libs/`を指す（`pages.alias`、`styles.alias`、`scripts.alias`）
- 出力先には、ビルドが作らないファイルも置かれている（画像の`img/`、`files/`、BurgerEditor の`__tmpl/__burger_editor/`など）。`.gitignore`が追跡対象にしているものが、それに当たる

## ページの探索

- `__assets/htdocs/`の下の`**/*.{html,tsx}`が、すべてページになる
- `.md`はページにならない
- `_`や`__`で始まる名前に、kamado の上での意味は無い。`__assets/htdocs/__tmpl/`の中もページになり、`/__tmpl/…`で出力される
- `.`で始まるディレクトリとファイルは探索されない
- 大文字と小文字は区別される

## URL と出力先

- 入力のディレクトリ構成が、そのまま出力に写る。拡張子は`.html`になる
- `index.tsx`の URL は`/dir/`。それ以外は`/dir/name.html`
- ファイル名の番号や記号は、そのまま URL に残る
- 同じ場所の、同じ名前の`.tsx`と`.html`は、出力先が重なる。先に読まれたほうだけが出力され、もう一方は警告だけで消える。sidecar も2つで共有になる
- ビルドは、古い出力を消さない

## メタ（タイトル、レイアウトなど）

メタは3か所に書ける。同じキーは、上にあるものが下を丸ごと置き換える（オブジェクトの中身を混ぜない）。

1. `pages.overrides`の JSON（scaffold の構成では使っていない）
2. sidecar: ページと同じディレクトリの、同じ名前の`.json`（`about.tsx`に対する`about.json`）
3. ページのファイルの中: `.tsx`は`export const meta = { … }`、`.html`は先頭の YAML front matter

- scaffold の構成では、`title`と`layout`を sidecar に書く
- `export const meta`に書けるのはリテラルだけ。変数、関数呼び出し、スプレッドはビルドエラーになる
- sidecar が不正な JSON だと、ビルドエラーになる
- メタのキーは`__assets/_libs/types/kamado.ts`の`PageMeta`に宣言してある。キーを足すときは、型にも足す
- メタを1つ変えると、差分ビルドでは TSX の全ページが作り直される

## レイアウト

- `layout`には、`__assets/_libs/layouts/`にあるファイルの名前を拡張子なしで書く（`l-sub`）
- 存在しない名前はビルドエラーになる（`layout "x" not found`）。`yarn pages`では検出されない
- `layout`の無い`.tsx`のページは、ページ自身が`<html>`から書く（`__tmpl/index.tsx`）

## データファイル

- `__assets/_libs/data/`の直下のファイルだけが読まれる。サブディレクトリは読まれない
- キーは、拡張子を除いたファイル名（`bge-blocks.html` → `data['bge-blocks']`）
- 読まれる形式は`.json`・`.yml`・`.yaml`と、文字列として読む`.html`・`.htm`・`.txt`
- `.jsonc`・`.json5`・`.toml`・`.csv`・`.js`・`.mjs`・`.cjs`・`.ts`を置くと、エラーになる
- それ以外の拡張子のファイルと、`.`で始まるファイルは、読まれずに無視される
- 同じキーになるファイルを2つ置くと、エラーになる
- ファイルを足したら、`__assets/_libs/types/kamado.ts`の`GlobalData`にも足す

## 並び順

- ページの一覧は、パスの辞書順
- ファイル名の番号（`000_`、`100_`）は、辞書順をそろえるためのもの。kamado は番号を読まない

## パンくずと`<title>`

- パンくずは、祖先のディレクトリの`index`ページと、そのページ自身でできる
- 表示名は`meta.title`。`title`の無いページは、URL の最後の部分（`news`など）が出る（`__assets/_libs/helpers/breadcrumb.ts`）
- 祖先のディレクトリに`index`ページが無いと、その階層はパンくずに出ない
- `<title>`は、深いページから順にタイトルを`|`でつなぎ、最後にサイト名を付ける

## ファイルを移したときに、自分で直すもの

`git mv`や`mv`は、ファイルを移すだけで、何も書き換えない。次のものを自分で直す。

- 移した`.tsx`の中の、相対パスの`import`
- 移したページの本文にある、相対パスのリンク
- ほかのページの本文にある、移したページへのリンク
- ヘッダー・フッター・ナビのリンク
- `__tmpl/index.tsx`の一覧
- 移したファイルを`import`している、ほかのモジュール
- `kamado.config.jsonc`の`html.rules`などに書いた、ページを選ぶ glob

sidecar を一緒に移さないと、移したページは`title`と`layout`を失う。置いていった`.json`は、あとから同じ場所に同じ名前で来たページの sidecar として読まれる。

## ビルドと dev server

- 同じプロジェクトで、ビルド（`yarn build`、`yarn build:only`）と dev server（`yarn dev`）を同時に動かさない。互いのコンパイル結果を消し合って壊れる
- dev server は、リクエストのたびにソースから作る。ソースを直したら、ブラウザの再読み込みだけで反映される。ビルドは要らない
- `yarn dev`は、起動するたびにブラウザを開く（`devServer.open`）
- `yarn build:only <パス>`は、渡したエントリだけをビルドする。エントリでないファイル（`__assets/_libs/`の中）を渡すと、`warning: build target "…" matched no page, stylesheet or script`が出て、何もビルドされないまま`Build completed`で終わる

## Kamado UI がすること

`yarn ui`の画面で URL やファイルの場所を変えると、kamado は次のことをする。ユーザーが画面で移したあとの状態を調べるときの手がかりになる。

- ページのファイルと sidecar を移す
- 移した`.tsx`の、相対パスの`import`を書き換える
- 空になった元のディレクトリを消す
- ほかのページのリンク、ナビ、移したファイルを`import`しているモジュールは、書き換えない

ページを追加・削除したときは、次のようになる。

- 追加: `inputPath`の場所に、空のページ（`.tsx`は`export default function Page() { return null; }`だけのファイル）を作る。`title`と`layout`は入らない。sidecar も作らない
- 削除: ページのファイルと sidecar を消す。ページの本文も一緒に消え、画面からは戻せない（コミットしていれば Git から戻せる）。リンクなどの参照は書き換えない
- 仮想ページ（ファイルが無く、URL とメタだけがあるページ）にするには、`pages.overrides`が要る。scaffold は設定していないので、使えない

ユーザーが画面で追加・削除したあとの状態を引き継ぐときは、`git status`で消えたファイルを確かめ、そのページへのリンクが残っていないかを手順 5 で検証する。

画面は、本文とコンポーネントの編集をしない。
