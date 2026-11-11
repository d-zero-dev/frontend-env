---
name: organizing-kamado-pages
description: kamado のサイトでページの追加・移動・改名・削除・URL の変更・ディレクトリの整理を行う手順と規則。ページの整理整頓、ディレクトリ構成や URL 設計の変更、`__assets/htdocs`の再構成、ページのタイトルやレイアウトの付け替えを頼まれたときに使う
---

# kamado のページ整理

## 常に守ること

- `htdocs/`はビルド出力。移動も編集もしない。ページのソースは`__assets/htdocs/`
- ページのファイル（`.tsx`/`.html`）と、同じ名前の`.json`（sidecar）は、常に一緒に`git mv`する。`.json`を置いていくと、タイトルとレイアウトが失われる
- URL が変わる変更と削除は、実行する前に計画の表を見せて承認を得る
- 承認された計画に無いページを動かさない
- `yarn ui`（Kamado UI）は人が使う画面。起動しない。ユーザーが Kamado UI で作業しているあいだは、同じファイルを編集しない
- `pages.overrides`を`kamado.config.jsonc`に足さない。メタは`.json`（sidecar）に書く

規則の詳細は[kamado-rules.md](kamado-rules.md)にある。URL の決まり方、メタの優先順位、移動で自動では直らないものを確かめるときに読む。

## URL の決まり方

`__assets/htdocs/`からのパスが、そのまま URL になる。

| ソース                               | URL                |
| ------------------------------------ | ------------------ |
| `__assets/htdocs/index.tsx`          | `/`                |
| `__assets/htdocs/about/index.tsx`    | `/about/`          |
| `__assets/htdocs/about/history.tsx`  | `/about/history.html` |

ファイル名の番号（`100_sub.tsx`）は URL に残る（`/100_sub.html`）。

## 手順

このチェックリストを応答に書き写し、進めながらチェックを付ける。

```
- [ ] 1. 現状の一覧を保存した
- [ ] 2. 計画の表を見せ、承認を得た
- [ ] 3. ファイルを移した・足した・消した
- [ ] 4. 変更後の一覧を保存した
- [ ] 5. diff-pages.mjs が終了コード 0 で終わった
- [ ] 6. ビルドと lint が通り、ブラウザで確かめた
```

### 1. 現状の一覧を保存する

```bash
yarn pages --out .tmp/pages-before.json
```

`.tmp/pages-before.json`を読み、対象のページの`url`・`inputPath`・`meta.title`・`meta.layout`を把握する。

### 2. 計画の表を見せ、承認を得る

| 操作 | 今のファイル | 新しいファイル | 今の URL | 新しい URL |
| ---- | ------------ | -------------- | -------- | ---------- |

表に続けて、次を書く。

- URL が変わる、または消えるページの数
- 公開済みのサイトなら、外部からのリンクとブックマークが切れること。リダイレクトが要るかはユーザーが決める
- 新しい階層に`index`ページを作らない場合、その階層がパンくずと`<title>`に出ないこと

### 3. 実行する

**移動・改名**

1. ページのファイルと sidecar を`git mv`する（1回の実行で1ファイル）
2. 移した`.tsx`の相対パスの`import`を、新しい場所から同じファイルを指すように直す。`@/`で始まる`import`は直さない

**追加**

1. `__assets/htdocs/__tmpl/100_sub.tsx`と`100_sub.json`を写して作る。`__tmpl/`が無いプロジェクトでは、既存の下層ページを写す
2. sidecar に`layout`（`__assets/_libs/layouts/`のファイル名。拡張子なし）と`title`を書く
3. 新しい階層を作るときは、その階層の`index.tsx`と`index.json`も作る。パンくずと`<title>`は、祖先の`index`ページの`title`から組み立てられる

**削除**

1. 承認を得てから、ページのファイルと sidecar を`git rm`する

**`__tmpl/`の中**

- ファイル名の番号は重複させない。000 番台はトップページ、100 番台は詳細ページ、200 番台はインデックスページ、300 番台はメールフォーム、400 番台はその他
- ページを足す・移す・消すときは、`__tmpl/index.tsx`の一覧も合わせる

### 4. 変更後の一覧を保存する

```bash
yarn pages --out .tmp/pages-after.json
```

エラーで止まったら、メッセージが指すファイルを直してやり直す。

### 5. 差分と、残った参照を確かめる

次のスクリプトを実行する（読まずに実行する）。

```bash
node .claude/skills/organizing-kamado-pages/scripts/diff-pages.mjs .tmp/pages-before.json .tmp/pages-after.json
```

- `Removed URLs`と`Added URLs`が、計画の表と一致することを確かめる。一致しなければ手順 3 に戻る
- `References to removed URLs`に出た行は、消えた URL へのリンク。新しい URL に直す。削除したページへのリンクは、どうするかをユーザーに聞く
- 直したら手順 4 からやり直す。終了コードが 0 になるまで繰り返す
- 出た行がリンクではないと判断したら、その行と理由を報告に書く。黙って無視しない

ヘッダーとフッターの`href="__URL__"`はプレースホルダー。ユーザーが指示したときだけ、実際の URL に置き換える。

### 6. ビルドして確かめる

1. `yarn build:only`
2. `yarn lint:ts`
3. `yarn lint:html`
4. dev server（`yarn dev`をバックグラウンドで起動）の新しい URL を DevTools MCP（`chrome-devtools`）で開き、`<title>`、ページのタイトル、パンくずを確かめる

失敗したら直して、失敗した項目からやり直す。

古い出力（`htdocs/`に残る、移す前の`.html`）は、ビルドでは消えない。出力をコミットするプロジェクトでは、残った古いファイルを報告し、消すかどうかをユーザーに聞く。

## 報告

- 計画の表のとおりに終わったこと。違うところがあれば、その違い
- `diff-pages.mjs`の最後の出力
- 手を付けなかったもの（プレースホルダーのリンク、リダイレクト、古い出力）
