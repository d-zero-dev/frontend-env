# D-ZERO フロントエンド標準開発環境

詳細は[ガイドライン](https://guidelines.d-zero.co.jp)を参照してください。

## コマンド

| コマンド      | 実行される内容                                       |
| ------------- | ---------------------------------------------------- |
| `yarn`        | 必要なパッケージのインストール                       |
| `yarn dev`    | 開発用ローカル環境の起動（ http://localhost:8000/ ） |
| `yarn lint`   | リントチェック                                       |
| `yarn build`  | ビルド                                               |
| `yarn update` | 依存パッケージのアップデート                         |

## Nix で使う場合

Node/Yarn は基本的に [Volta](https://volta.sh/)（`package.json` の `volta` / `packageManager`）で管理していますが、[Nix](https://nixos.org/) 経由で同じバージョンを再現したい場合は `flake.nix` / `flake.lock` を使えます。

```sh
nix build .#toolchain
```

`result/bin` に `node` と `yarn` が展開されます。Volta を使う場合はこの手順は不要です。

## AIコマンド（Claude Code）

| コマンド                | 説明                                                 |
| ----------------------- | ---------------------------------------------------- |
| `/git`                  | Gitの操作ルールに従ったコミット作成                  |
| `/release`              | リリースブランチの作成・マージ・プッシュ手順         |
| `/fix-component [引数]` | コンポーネント名やクラス名を指定してコーディング修正 |
| `/debug-diff [引数]`    | 2つの環境のページを比較してデバッグ                  |
