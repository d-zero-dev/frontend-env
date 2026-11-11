---
name: organizing-kamado-pages
description: kamado のサイトでページの追加・移動・改名・削除・URL の変更・ディレクトリの整理を行う手順と規則。ページの整理整頓、ディレクトリ構成や URL 設計の変更、`__assets/htdocs`の再構成、ページのタイトルやレイアウトの付け替えを頼まれたときに使う
---

# kamado のページ整理

## 常に守ること

- ビルドの出力先（`kamado.config.jsonc`の`dir.output`。`htdocs/`か`htdocs/webroot/`）は、移動も編集もしない。ページのソースは`__assets/htdocs/`
- ページのファイル（`.tsx`/`.html`）と、同じ名前の`.json`（sidecar）は、常に一緒に移す。`.json`を置いていくと、ページはタイトルとレイアウトを失い、あとから同じ場所に来たページがその`.json`を自分のものとして読む
- URL が変わる変更と削除は、実行する前に計画の表を見せて承認を得る
- 承認された計画に無いページを動かさない
- `yarn dir`（Kamado UI）は人が使う画面。起動しない。ユーザーが Kamado UI で作業しているあいだは、同じファイルを編集しない
- `pages.overrides`を`kamado.config.jsonc`に足さない。メタは`.json`（sidecar）に書く
- 同じ場所に、同じ名前の`.tsx`と`.html`を置かない。出力先が重なり、片方が警告だけで消える

規則の詳細は[kamado-rules.md](kamado-rules.md)にある。URL の決まり方、メタの優先順位、移動で自動では直らないものを確かめるときに読む。

## URL の決まり方

`__assets/htdocs/`からのパスが、そのまま URL になる。

| ソース                                 | URL                    |
| -------------------------------------- | ---------------------- |
| `__assets/htdocs/index.tsx`            | `/`                    |
| `__assets/htdocs/about/index.tsx`      | `/about/`              |
| `__assets/htdocs/about/history.tsx`    | `/about/history.html`  |
| `__assets/htdocs/__tmpl/100_sub.tsx`   | `/__tmpl/100_sub.html` |

ファイル名の番号（`100_`）は URL に残る。

## 手順

このチェックリストを応答に書き写し、進めながらチェックを付ける。

```
- [ ] 1. 現状の一覧を保存した
- [ ] 2. 計画の表を見せ、承認を得た
- [ ] 3. ファイルを移した・足した・消した
- [ ] 4. 変更後の一覧を保存した（warning: の行が無い）
- [ ] 5. diff-pages.mjs が終了コード 0 で終わった。または、残った行をすべてユーザーに説明した
- [ ] 6. ビルドと lint が通り、ブラウザで確かめた
```

### 1. 現状の一覧を保存する

```bash
yarn kamado pages --out .tmp/pages-before.json
```

`.tmp/pages-before.json`を読み、対象のページの`url`・`inputPath`・`meta.title`・`meta.layout`を把握する。

`unknown command: pages`か`Unknown option '--out'`で止まるときは、`kamado`が古い。ユーザーに伝えて、ここで止まる（`pages`の無い`kamado`では、この手順の検証ができない）。

### 2. 計画の表を見せ、承認を得る

| 操作 | 今のファイル | 新しいファイル | 今の URL | 新しい URL |
| ---- | ------------ | -------------- | -------- | ---------- |

表に続けて、次を書く。

- URL が変わる、または消えるページの数
- 公開済みのサイトなら、外部からのリンクとブックマークが切れること。リダイレクトが要るかはユーザーが決める
- 新しい階層に`index`ページを作らない場合、その階層がパンくずと`<title>`に出ないこと

### 3. 実行する

**移動・改名**

1. 移し先のディレクトリが無ければ、先に作る（`mkdir -p`）。`git mv`はディレクトリを作らない
2. ページのファイルと sidecar を移す（1回の実行で1ファイル）。Git が追跡しているファイルは`git mv`、追跡していないファイル（作ったばかりのページ）は`mv`を使う
3. 移した`.tsx`の相対パスの`import`を、新しい場所から同じファイルを指すように直す。`@/`で始まる`import`は直さない
4. 移したページの本文にある相対パスのリンクと参照（`href="detail.html"`、`src="img/pict.png"`など）を、新しい場所から同じものを指すように直す

**追加**

1. ページのファイルと sidecar を作る。`__assets/htdocs/__tmpl/100_sub.tsx`と`100_sub.json`があれば、それを写す。無ければ、次の2つを作る

   ```tsx
   // __assets/htdocs/about/history.tsx
   export default function PageAboutHistory() {
   	return (
   		<div className="p-sub-default">
   			<div className="p-sub-default__main">
   				<div className="c-content-main">
   					<p>本文</p>
   				</div>
   			</div>
   		</div>
   	);
   }
   ```

   ```json
   {
   	"layout": "l-sub",
   	"title": "沿革"
   }
   ```

2. `layout`は`__assets/_libs/layouts/`にあるファイルの名前（拡張子なし）から選ぶ。`title`は必ず書く
3. 新しい階層を作るときは、その階層の`index.tsx`と`index.json`も作る。パンくずと`<title>`は、祖先の`index`ページの`title`から組み立てられる

**削除**

1. 承認を得てから、ページのファイルと sidecar を`git rm`する

**`__tmpl/`の中**

- ファイル名の番号は重複させない。000 番台はトップページ、100 番台は詳細ページ、200 番台はインデックスページ、300 番台はメールフォーム、400 番台はその他
- ページを足す・移す・消すときは、`__tmpl/index.tsx`の一覧も合わせる

### 4. 変更後の一覧を保存する

```bash
yarn kamado pages --out .tmp/pages-after.json
```

- エラーで止まったら、メッセージが指すファイルを直してやり直す
- `warning:`で始まる行が出たら、内容を読む。ページの出力先が重なっているという警告なら、重なりを解いてやり直す。ほかの警告は、ユーザーに伝える
- ここで確かめられるのは、sidecar と`export const meta`が読めることまで。`layout`の名前と`import`の誤りは、手順 6 で出る

### 5. 差分と、残ったリンクを確かめる

次のスクリプトを実行する（読まずに実行する）。

```bash
node .claude/skills/organizing-kamado-pages/scripts/diff-pages.mjs .tmp/pages-before.json .tmp/pages-after.json
```

出力の見かたと、すること。

| 節                                                                  | 意味                                                               | すること                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `Removed URLs` / `Added URLs`                                       | 消えた URL と増えた URL                                            | 計画の表と一致することを確かめる。一致しなければ手順 3 に戻る            |
| `Links to removed URLs`                                             | 消えた URL へのリンク                                              | 新しい URL に直す。削除したページへのリンクは、どうするかをユーザーに聞く |
| `Relative links of moved or new pages to pages that do not exist`   | 移した・足したページの相対リンクが、無いページを指している         | 新しい場所から正しいページを指すように直す                               |
| `Possible links to removed URLs`                                    | コンポーネントなどの相対パスで、消えた URL の末尾と同じもの        | 消えたページへのリンクなら直す                                           |
| `Warnings of kamado pages`                                          | 手順 4 の`warning:`と同じ                                          | 手順 4 に戻る                                                            |

- 直したら手順 4 からやり直す。終了コードが 0 になるまで繰り返す
- 残った行がリンクではない、または直さなくてよいと判断したら、その行と理由をユーザーに説明する。黙って無視しない
- 終了コード 2 は、引数かファイルの誤り。メッセージに従って直す

このスクリプトが見つけないもの。該当しそうなら、自分で検索して確かめる。

- 消えたトップページ（`/`）へのリンク
- 移したページから、画像や CSS など、ページでないファイルへの相対パス（`src="img/pict.png"`）
- 実行時に文字列をつないで作る URL
- 前後に空白や引用符が無い URL（文末の`/a.html.`、和文に続けて書いた URL）
- `kamado.config.jsonc`に書いた、ページを選ぶ glob（`html.rules`など）
- `__assets/`の外にあるファイル

このスクリプトが、リンクでないのに報告するもの。該当したら、手順どおりユーザーに説明する。

- ほかのサイトの、同じパスの URL（`https://other.example/news/`）
- パスに見える文字列（正規表現の`/news/`など）

ヘッダーとフッターの`href="__URL__"`はプレースホルダー。ユーザーが指示したときだけ、実際の URL に置き換える。

### 6. ビルドして確かめる

1. dev server（`yarn dev`）が動いていたら止める。kamado は、同じプロジェクトでビルドと dev server を同時に動かせない。自分が起動したものは止め、ユーザーが起動したものは、止めてもらうよう頼む
2. `yarn build:only`
3. `yarn lint:ts`
4. `yarn lint:html`
5. `yarn dev`をバックグラウンドで起動し、新しい URL を DevTools MCP（`chrome-devtools`）で開いて、`<title>`、ページのタイトル、パンくずを確かめる

失敗したら直して、失敗した項目からやり直す。

ビルドは、古い出力（移す前の`.html`）を消さない。出力をコミットするプロジェクトでは、残った古いファイルを報告し、消すかどうかをユーザーに聞く。

## 報告

- 計画の表のとおりに終わったこと。違うところがあれば、その違い
- `diff-pages.mjs`の最後の出力
- 手を付けなかったもの（プレースホルダーのリンク、リダイレクト、古い出力、スクリプトが見つけないもの）
