# ディーゼロ フロントエンド開発環境

## 使い方

### 環境のインストール

空のリポジトリで次のパッケージを実行します。

```shell
npx @d-zero/create-frontend

# もしくは

yarn create @d-zero/frontend
```

インストールで展開されるファイルは[`@d-zero/scaffold`](./packages/%40d-zero/scaffold/)に格納されています。

## パッケージ

| パッケージ名                                                       | 内容                                                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| [`@d-zero/create-frontend`](./packages/%40d-zero/create-frontend/) | [`@d-zero/scaffold`](./packages/%40d-zero/scaffold/)の中身をコマンドから展開するパッケージ                        |
| [`@d-zero/postcss-config`](./packages/%40d-zero/postcss-config/)   | [`@d-zero/scaffold`](./packages/%40d-zero/scaffold/)で利用している[_PostCSS_](https://postcss.org/)の設定ファイル |
| [`@d-zero/scaffold`](./packages/%40d-zero/scaffold/)               | フロントエンド開発ボイラープレートファイル郡                                                                      |

### スキャフォールドパッケージの配布戦略

`@d-zero/scaffold` パッケージは create-package として配布されるため、特殊な依存関係管理を採用しています：

- **yarn.lock なし管理**: scaffold ディレクトリには yarn.lock を配置せず、ワークスペースの依存解決を利用
- **Explicit Version 指定**: package.json で依存関係は範囲指定ではなく固定バージョンを使用
- **配布時の安定性**: packageManager フィールドと volta 設定により、配布先で安定したバージョン管理を実現

---

## メンテナンス環境

- [Volta](https://volta.sh/)によって管理しています。
  - [Node.js](https://nodejs.org/)のバージョンは[`package.json`](./package.json)に記載しています。
  - [yarn](https://yarnpkg.com/)のバージョンは[`package.json`](./package.json)に記載しています。
  - このバージョンは[Renovate](https://www.mend.io/renovate/)によってアップデートされます。
- [Commitizen](https://github.com/commitizen/cz-cli)を利用してコミットメッセージを作ります。メッセージは[_commitlint_](https://commitlint.js.org/)によってチェックされます。

### メンテ用コマンド

| コマンド    | 内容                                      |
| ----------- | ----------------------------------------- |
| `yarn tsc`  | TypeScriptのコンパイルを実行します        |
| `yarn lint` | リント（各種リントを実行します）          |
| `yarn co`   | Gitコミットを*Commitizen*経由で実行します |
