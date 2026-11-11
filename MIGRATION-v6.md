# v6 移行ガイド

`@d-zero/create-frontend` v5 で展開したプロジェクトを、v6 の構成に移す手順です。v6 で新しく展開するプロジェクトには、この作業は要りません。

v6 では次の3つが変わります。

- ページ・レイアウト・コンポーネントを Pug から TSX に変え、kamado を v1 から v3 にする
- lint と整形を、ESLint と Prettier から oxlint と oxfmt に変える（linters の`@d-zero/*-config` v6）
- PostCSS を使わない（CSS は kamado v3 が処理する）

このほかに、AI エージェント向けの設定とドキュメントが変わります（§7）。ビルドには影響しません。

kamado と linters の変更の詳細は、それぞれの移行ガイドにあります。このガイドは、展開済みのプロジェクトでやることの順番と、scaffold での対応を書きます。リンク先は開発中のブランチなので、プロジェクトに入れた版のタグのガイドを読んでください。

- kamado: [`docs/v3/MIGRATION.md`](https://github.com/d-zero-dev/kamado/blob/dev/docs/v3/MIGRATION.md)
- linters: [`MIGRATION-v6.md`](https://github.com/d-zero-dev/linters/blob/v6/MIGRATION-v6.md)

kamado のガイドは v2 から v3 への手順で、設定の名前も v2 のもの（`createPageCompiler`など）で書かれています。v5 の scaffold は kamado v1 なので、設定はこのガイドの §2 の対応で読み替えます。v1 から直接移すときに出る差は、kamado のガイドの §11 の末尾にあります。

## 0. 始める前に

- プロジェクトには Node.js 24.11 以上が要ります（kamado v3 の要件。Markuplint v5 は 24 以上）
- 移す前に、今の構成で`yarn build`を実行し、`htdocs`を別の場所にコピーしておきます。移したあとの出力と比べる基準になります（§6）
- v6 の scaffold を手元に用意すると、ファイルの中身をそのまま参考にできます。`--type`は、移すプロジェクトと同じ種類にします。baserCMS 向けの書き換え（`kamado.config.jsonc`の`devServer.startPath`と`dir.output`、`meta.tsx`、`100_sub.tsx`）は、種類によって変わるためです

  ```sh
  yarn create @d-zero/frontend --type <static|basercms4|basercms5> --dir ./v6-reference --no-install
  ```

  v6 が npm の`latest`になる前は、このコマンドは v5 を展開します。そのあいだは、このリポジトリの`v6`ブランチの`packages/@d-zero/scaffold`を参考にします

## 1. 依存を入れ替える

`package.json`の`devDependencies`を次のように変えます。版は v6 の scaffold の`package.json`に合わせます。

| 操作 | パッケージ                                                                                                                                                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 削除 | `@d-zero/eslint-config`、`@d-zero/prettier-config`、`@d-zero/pug-lint-config`、`@d-zero/postcss-config`、`@prettier/plugin-pug`、`@kamado-io/page-compiler`、`@kamado-io/pug-compiler`、`@kamado-io/script-compiler`、`@kamado-io/style-compiler` |
| 追加 | `@d-zero/oxlint-config`、`@d-zero/oxlint-plugin`、`oxlint`、`oxfmt`、`@markuplint/jsx-parser`、`@markuplint/react-spec`、`@types/react`                                                                                                           |
| 更新 | `kamado`（v3）、`@d-zero/cspell-config`、`@d-zero/lint-staged-config`、`@d-zero/markuplint-config`、`@d-zero/stylelint-config`、`@d-zero/textlint-config`（v6）                                                                                   |

`scripts`も v6 の scaffold に合わせます。v5 の列は先頭だけを書いています。

| script               | v5                              | v6                                                                          |
| -------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `build`              | `yarn lint && npx kamado build` | `yarn lint && kamado build`                                                 |
| `build:only` / `dev` | `npx kamado …`                  | `kamado build` / `kamado server`                                            |
| `lint:html`          | `npx markuplint …`              | `npx markuplint --no-allow-warnings "./__assets/**/*.{tsx,html}"`           |
| `lint:pug`           | `npx pug-lint …`                | 削除                                                                        |
| `lint:js`            | `npx eslint … --fix`            | `oxlint --fix __assets`                                                     |
| `lint:format`        | `npx prettier --write …`        | `oxfmt --write "{*,**/*}.{js,mjs,cjs,jsx,ts,tsx,css,html,json,jsonc,yaml}"` |
| `lint:text`          | `npx textlint …`                | `npx textlint "./__assets/**/*.html"`                                       |

textlint は TSX を読めないので、TSX に書いた文章は検査されません。

## 2. 設定ファイルを置き換える

v6 の scaffold に合わせます。

| v5                                                 | v6                                                                                                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kamado.config.ts`                                 | `kamado.config.jsonc`（下の対応と、kamado のガイドの §2）                                                                                                                   |
| `eslint.config.js`                                 | `oxlint.config.mts`                                                                                                                                                         |
| `.prettierrc.mjs`、`.prettierignore`               | `.oxfmtrc.json`（無視するファイルは`ignorePatterns`に書く）                                                                                                                 |
| `.pug-lintrc`                                      | 削除                                                                                                                                                                        |
| `.postcssrc.js`                                    | 削除                                                                                                                                                                        |
| `.stylelintrc`                                     | v6 の scaffold に合わせる（`at-rule-prelude-no-invalid`と`declaration-property-value-no-unknown`を無効にし、`c-content-main`の`files`を`**/c-content-main/**/*.css`にする） |
| `.vscode/extensions.json`、`.vscode/settings.json` | v6 の scaffold に合わせる（Prettier・ESLint・puglint の拡張を、oxc の拡張（`oxc.oxc-vscode`）にする。`[typescriptreact]`も oxc で整形する）                                 |

`kamado.config.ts`（kamado v1）の設定は、`kamado.config.jsonc`で次のように書きます。

- `dir: { root, input, output }` → `dir: { input, output }`。`root`は書かない（設定ファイルの場所が基準になる）。`path.resolve(import.meta.dirname, ...)`の絶対パスは、設定ファイルからの相対パスにする
- `pageCompiler`の`layouts.dir` → `pages.layouts.dir`
- `pageCompiler`の`globalData.dir` → `data.dir`
- `createCompileHooks`の`pathAlias`と、`styleCompiler`・`scriptCompiler`の`alias` → `pages.alias`、`styles.alias`、`scripts.alias`
- `scriptCompiler`の`minifier: true` → `scripts.minify: true`

baserCMS 向けのプロジェクトは、`devServer.startPath`（`"__tmpl/"`）と、baserCMS 5 の`dir.output`（`"htdocs/webroot"`）も移します。

`markuplint.config.js`は`extends`に`@d-zero/markuplint-config/jsx`を足します。Markuplint v4 のルール名（`required-attr`など）は Markuplint v5 でも動きますが、非推奨の警告でコミットが止まるので、新しい名前（`require-attr`）に直します。ディレクトリごとの`.markuplintrc`（`__assets/_libs/.markuplintrc`など）も同じです（linters のガイドの「Markuplint v5」）。

`tsconfig.json`には次の項目を足します。ほかの項目はそのままにします。

```jsonc
{
	"compilerOptions": {
		"allowImportingTsExtensions": true,
		"jsx": "preserve",
	},
	"include": ["**/*.ts", "**/*.tsx"],
}
```

## 3. Pug を TSX に変換する

kamado の`scripts/pug-to-tsx.mjs`で変換します。スクリプトは npm の`kamado`に入っていないので、kamado のリポジトリを、プロジェクトに入れた`kamado`と同じ版のタグで取り出して使います。kamado のリポジトリには Node.js 26 と Yarn 4 が要ります（kamado のガイドの §3.4）。

```sh
node <kamado のリポジトリ>/scripts/pug-to-tsx.mjs <プロジェクト> <出力先>
```

変換したあとに手で直すものは、scaffold では次のとおりでした。

- **props の型**: 変換結果は`any`を使います。v6 の scaffold の`__assets/_libs/types/kamado.ts`を写すと、`page`・`meta`・`site`・`data`・`breadcrumbs`に型が付きます。`meta`のキーと`data`のファイル名は、プロジェクトに合わせて足します。Invoker Commands の`command`/`commandfor`を書くなら、`__assets/_libs/types/react.d.ts`も写します（`@types/react`に無いため）
- **`<title>`とパンくず**: v6 の scaffold は、`__assets/_libs/helpers/breadcrumb.ts`で`<title>`とパンくずの表示名を組み立てます（§6）。同じ形にするなら、これと`meta.tsx`・`c-nav-breadcrumb.tsx`を写します
- **レイアウトの指定**: sidecar の JSON の`"layout": "home.pug"`は`"home"`（拡張子なし）にします。変換スクリプトは、書き換えた写しを出力先に書きます。v6 の scaffold はレイアウトを`l-home`/`l-sub`に、CSS を`component/c-page-*.css`から`layouts/l-*.css`と`page/p-*.css`に改名していますが、移行に改名は要りません。改名するなら、sidecar の`layout`と CSS の`@import`も合わせます
- **`blocks.js`**: kamado v3 は JavaScript のデータファイルを読みません。`blocks.js`を削除し、ページで`data`からブロックの HTML を読みます。静的サイトは`data['bge-blocks']`（`_libs/data/bge-blocks.html`）、baserCMS 向けは`data['bge-blocks-v2']`（`_libs/data/bge-blocks-v2.html`）です
- **`⚠️`属性**: baserCMS 用の`link`・`script`に付けた`⚠️`属性は、JSX の属性名にできません。`kamado/jsx`の`html()`で、要素ごと HTML の文字列として書きます。`.markuplintrc`で`⚠️`を許していた`invalid-attr`の`nodeRules`は要らなくなります
- **HTML のコメント**: Pug の`//`コメントは出力に残っていましたが、JSX には書けません。出力に残すものは`{html('<!-- … -->')}`で書きます
- **`<html static>`と`kdStatic`**: 変換スクリプトは、Pug と同じ順で出力するためにこれらを書きます。v6 の scaffold では外しています。外すと、`head`の要素の順序と`form`・`input`・`button`の属性の順序が変わり（§6）、`onclick`などの`on*`属性は出力から消えます。`on*`属性を使うページでは外しません

## 4. CSS を確かめる

kamado v3 は PostCSS のプラグインを使いません。`@custom-media`は kamado に組み込まれているので、そのまま使えます。v5 の`@d-zero/postcss-config`が入れていた次のプラグインに頼っていたら、書き換えが要ります（kamado のガイドの §6）。

- `@extend`（`postcss-extend-rule`）、`base64()`（`postcss-base64`）、`color-mod()`（`postcss-color-mod-function`）、`math()`（`postcss-math`）
- `clip-path`のポリフィル（`postcss-clip-path-polyfill`）と、`calc()`の畳み込み（`postcss-calc`）
- autoprefixer が足していたベンダープレフィックス（v3 は足しも消しもしない）

## 5. lint と整形を通す

`yarn lint:format`で整形し直すと、oxfmt が`package.json`のキーを並べ替えます。整形だけの差分は、移行の変更と別のコミットにすると、レビューしやすくなります。

markuplint の JSX の検査で、次の報告が出ることがあります。v6 の scaffold では、それぞれ次のように対応しています（Markuplint 5.5 で確認）。

| 報告                                                                                                      | 対応                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<head><Meta /></head>`で`title`・`meta[charset]`が必要と報告される（コンポーネントの中身を読まないため） | `markuplint.config.js`の`nodeRules`で、`head:has(> Meta)`に対して`html-standard/permitted-contents`、`html-standard/head-charset-utf8`、`performance/head-charset-utf8`を無効にする        |
| 固定の`id`がハードコーディングと報告される（`react/no-hard-code-id`）                                     | 固定の`id`が要件のファイル（baserCMS のメールフォームなど）だけ、`.markuplintrc`の`overrides`で`"no-hardcoded-id": false`にする。表示名の`react/no-hard-code-id`を指定しても無効にならない |
| `acceptCharset`と`accept-charset`のどちらも、知らない属性と報告される                                     | `form`に対して`no-unknown-attr`を無効にする                                                                                                                                                |

## 6. 出力を比べる

`yarn build`を実行し、§0 で保存した出力と比べます。kamado の`benchmarks/v3/compare-outputs.ts --semantic`を使うと、意味の変わらない差（空白、属性の順序など）をそろえて比べられます（kamado のガイドの §10）。

v6 の scaffold を写すと、次の差が出ます。どれも意図した差です。

- インライン要素の間の空白と、`head`内の要素の順序
- `<title>`の形式: v5 は`ページ | 親__サイト名__`（サイト名を区切りなしで続ける）で、トップページはサイト名が2回並んだ（`__サイト名____サイト名__`）。v6 の scaffold は`ページ | 親 | __サイト名__`で、トップページは`__サイト名__`だけ
- `display: block flow`が`display: block`になる
- CSS の圧縮結果（ファイルサイズがわずかに変わる）

タイトルの無いページのパンくずと`<title>`は、v5 も v6 の scaffold も URL の最後の部分です（v5 は kamado v1 の`fileSlug`で、`index`ページはディレクトリ名）。kamado v3 自体はこれを`__NO_TITLE__`にするので、v6 の scaffold の`breadcrumb.ts`を写さない場合は、`__NO_TITLE__`が出ます。

## 7. AI 設定とドキュメントを写す

v6 の scaffold は、AI エージェント向けの設定を次のように変えています。ビルドには影響しません。

| ファイル                                  | v6 の scaffold での変更                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `.claude/commands/<名前>.md`              | `.claude/skills/<名前>/SKILL.md`へ移す（`/git`などの呼び出し名は同じ）         |
| `.claude/skills/organizing-kamado-pages/` | 新しく足す（ページの追加・移動・改名・削除の手順と、kamado の規則）            |
| `docs/kamado-ui.md`                       | 新しく足す（ページ情報の編集画面の使い方）                                     |
| `AGENTS.md`                               | 「サイト構成（kamado）」の節を足す                                             |
| `README.md`                               | 「ディレクトリ構成」の節と、`yarn ui`・`yarn pages`を足す                      |
| `.claude/settings.json`の`allow`          | `Bash(yarn pages:*)`、`Bash(git mv __assets/:*)`、`diff-pages.mjs`の実行を足す |

- `.claude/commands/`と`.claude/skills/`に同じ名前があると、スキルが使われます。写したあとは`.claude/commands/`の同名のファイルを削除します
- `fix-component`は、TSX と sidecar の JSON に合わせて書き直しています。v5 の内容に手を入れていた場合は、v6 のものに同じ変更を入れ直します
- `package.json`の`scripts`に`"ui": "kamado ui"`と`"pages": "kamado pages"`を足します。`kamado`は、v6 の scaffold の`package.json`と同じ版にします（この2つのコマンドは 3.0.0-alpha.4 には入っていません）
- `organizing-kamado-pages`は、`__assets/htdocs`をページの置き場、`__assets/_libs`を alias `@`の先として書いています。構成を変えているプロジェクトでは、`SKILL.md`と`kamado-rules.md`のパスを合わせます。`pages.overrides`を使っているプロジェクトでは、`SKILL.md`の「`pages.overrides`を足さない」と、`kamado-rules.md`の「使っていない」を、実際の運用に書き換えます
- スキルは、ページの一覧を`.tmp/`に書き出します。`.tmp`が`.gitignore`に入っていることを確かめます
