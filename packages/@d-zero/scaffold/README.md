# D-ZERO フロントエンド標準開発環境

詳細は[ガイドライン](https://guidelines.d-zero.co.jp)を参照してください。

## コマンド

| コマンド      | 実行される内容                                                                        |
| ------------- | ------------------------------------------------------------------------------------- |
| `yarn`        | 必要なパッケージのインストール                                                        |
| `yarn dev`    | 開発用ローカル環境の起動（ http://localhost:8000/ ）                                  |
| `yarn ui`     | ページ情報の編集画面の起動（ http://localhost:8001/ ）。[使い方](./docs/kamado-ui.md) |
| `yarn pages`  | 全ページの一覧を JSON で出力（`yarn pages --out <ファイル>`でファイルに書き出す）     |
| `yarn lint`   | リントチェック                                                                        |
| `yarn build`  | ビルド                                                                                |
| `yarn update` | 依存パッケージのアップデート                                                          |

## ディレクトリ構成

サイトは[kamado](https://github.com/d-zero-dev/kamado)でビルドします。編集するのは`__assets/`で、`htdocs/`はビルドの出力です。

| パス                        | 役割                                                    |
| --------------------------- | ------------------------------------------------------- |
| `__assets/htdocs/`          | ページと、CSS・JS のエントリポイント                    |
| `__assets/_libs/layouts/`   | レイアウト（ページの枠組み）                            |
| `__assets/_libs/component/` | コンポーネント                                          |
| `__assets/_libs/page/`      | ページごとの CSS                                        |
| `__assets/_libs/style/`     | 全体の CSS                                              |
| `__assets/_libs/data/`      | ページに渡すデータファイル                              |
| `htdocs/`                   | ビルドの出力。`htdocs/img/`の画像だけは、ここに直接置く |

### ページと URL

`__assets/htdocs/`の中の置き場所が、そのまま URL になります。

| ファイル                            | URL                   |
| ----------------------------------- | --------------------- |
| `__assets/htdocs/index.tsx`         | `/`                   |
| `__assets/htdocs/about/index.tsx`   | `/about/`             |
| `__assets/htdocs/about/history.tsx` | `/about/history.html` |

ページのタイトルとレイアウトは、ページと同じ名前の`.json`に書きます（`history.tsx`に対する`history.json`）。ページを移すときは、この`.json`も一緒に移します。

```json
{
	"layout": "l-sub",
	"title": "沿革"
}
```

タイトルや URL は、[Kamado UI](./docs/kamado-ui.md)（`yarn ui`）の表でも書き換えられます。

## Nix で使う場合

Node/Yarn は基本的に[Volta](https://volta.sh/)（`package.json`の`volta`/`packageManager`）で管理していますが、[Nix](https://nixos.org/)経由で同じバージョンを再現したい場合は`flake.nix`/`flake.lock`を使えます。

```sh
nix build .#toolchain
```

`result/bin`に`node`と`yarn`が展開されます。Volta を使う場合はこの手順は不要です。

## AIスキル（Claude Code）

`.claude/skills/`にあります。`/`に続けて名前を入力すると実行されます。

| スキル                     | 説明                                                           |
| -------------------------- | -------------------------------------------------------------- |
| `/git`                     | Gitの操作ルールに従ったコミット作成                            |
| `/release`                 | リリースブランチの作成・マージ・プッシュ手順                   |
| `/fix-component [引数]`    | コンポーネント名やクラス名を指定してコーディング修正           |
| `/debug-diff [引数]`       | 2つの環境のページを比較してデバッグ                            |
| `/grill-me`                | 計画や設計を質問で詰める                                       |
| `/organizing-kamado-pages` | ページの追加・移動・改名・削除、URL の変更、ディレクトリの整理 |

`/organizing-kamado-pages`と`/grill-me`は、「ページを整理して」「このページを`/company/`の下に移して」のように頼むだけでも使われます。
