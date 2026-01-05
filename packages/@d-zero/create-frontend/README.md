# ディーゼロ フロントエンド開発環境インストーラー

## 使い方

### 環境のインストール

空のリポジトリで次のパッケージを実行します。

```shell
yarn create @d-zero/frontend

# 非推奨: `.gitignore`が生成ができない
npx @d-zero/create-frontend
```

### オプション

| オプション  | 短縮形 | 説明                                                                           | デフォルト値              |
| ----------- | ------ | ------------------------------------------------------------------------------ | ------------------------- |
| `--type`    | `-t`   | プロジェクトのタイプを指定します。指定した場合、対話モードはスキップされます。 | `static`                  |
| `--dir`     | `-d`   | 出力先ディレクトリを指定します。                                               | `.`（現在のディレクトリ） |
| `--install` | -      | スキャフォールディング後にyarnで依存関係をインストールします。                 | `true`                    |

#### プロジェクトタイプ

##### `static` - 静的サイト

- **用途**: 静的なWebサイトの開発
- **特徴**:
  - [BurgerEditor Local App](https://github.com/d-zero-dev/BurgerEditor) v4 が組み込まれており、ローカル環境でのビジュアル編集が可能
  - [kamado](https://github.com/kamado-io/kamado) による静的サイトジェネレーター
- **開発コマンド**:
  - `yarn dev`: 開発サーバー起動（http://localhost:8000/）
  - `yarn bge`: BurgerEditor Local App 起動（http://localhost:8100/）
  - `yarn build`: 本番用ビルド

##### `basercms4` - baserCMS v4

- **用途**: [baserCMS](https://basercms.net/) v4 のテーマ開発
- **特徴**:
  - BurgerEditor v2 対応のテーマファイル
  - baserCMS 固有のテンプレート構造
  - jQuery および関連ライブラリが自動で依存関係に追加
  - baserCMS のテンプレート変数やヘルパー関数に対応
  - BurgerEditor のブロック定義ファイル（`bge-blocks-v2.html`）を使用
- **追加される依存関係**:
  - `jquery`: 最新版
  - `jquery-colorbox`: v1.5

### 使用例

```shell
# 対話モードで実行
npx @d-zero/create-frontend

# 静的サイトプロジェクトを指定ディレクトリに作成し、依存関係をインストール
npx @d-zero/create-frontend --type static --dir ./my-project --install

# baserCMS v4プロジェクトを作成（依存関係のインストールはスキップ）
yarn create @d-zero/frontend --type basercms4 --dir ./my-cms --no-install
```

### 注意事項

オプションを指定せずにコマンドを実行すると、対話モードが開始され、プロジェクトを段階的に設定できます。

インストールで展開されるファイルは[`@d-zero/scaffold`](https://github.com/d-zero-dev/frontend-env/blob/main/packages/%40d-zero/scaffold/)に格納されています。
