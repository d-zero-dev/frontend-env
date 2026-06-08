# D-ZERO フロントエンド標準開発環境

詳細は[ガイドライン](https://guidelines.d-zero.co.jp)を参照してください。

## コマンド

| コマンド                       | 実行される内容                                       |
| ------------------------------ | ---------------------------------------------------- |
| `yarn`                         | 必要なパッケージのインストール                       |
| `yarn dev`                     | 開発用ローカル環境の起動（ http://localhost:8000/ ） |
| `yarn lint`                    | リントチェック                                       |
| `yarn build`                   | ビルド                                               |
| `yarn update`                  | 依存パッケージのアップデート                         |
| `yarn add-component -n <名前>` | コンポーネントのスケルトン生成と style.css への追加  |

### `yarn add-component`

コンポーネントの CSS / Pug スケルトンを生成し、`__assets/htdocs/css/style.css` に該当の `@import` を自動追加します。

```bash
yarn add-component --name hero
# 短縮形
yarn add-component -n hero
```

生成されるファイル:

- `__assets/_libs/component/c-hero.css`
- `__assets/_libs/component/c-hero.pug`

`style.css` の最後の `@import '@/component/...' layer(component);` の直後に、新しい component import が追加されます。すでに同じ import 行がある場合はスキップされます。

対象 CSS を追加・変更したい場合は [`scripts/add-component.ts`](./scripts/add-component.ts) の `targetCssFiles` 配列を編集してください（`__assets/htdocs/` からの相対パスで指定）。

## AIコマンド（Claude Code）

| コマンド                | 説明                                                 |
| ----------------------- | ---------------------------------------------------- |
| `/git`                  | Gitの操作ルールに従ったコミット作成                  |
| `/release`              | リリースブランチの作成・マージ・プッシュ手順         |
| `/fix-component [引数]` | コンポーネント名やクラス名を指定してコーディング修正 |
| `/debug-diff [引数]`    | 2つの環境のページを比較してデバッグ                  |
