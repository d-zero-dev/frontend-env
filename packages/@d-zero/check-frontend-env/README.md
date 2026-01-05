# @d-zero/check-frontend-env

Check Frontend Environment for D-ZERO

フロントエンド開発環境のチェックツールです。Node.js、npm、yarn、Husky、Voltaのインストール状況とバージョンを確認できます。

## Usage

```bash
# 環境チェックを実行
npx @d-zero/check-frontend-env
```

実行すると、以下の情報が表示されます：

- **Husky設定**: v8とv9の両方のバージョンの設定ファイルを確認
- **Node.js**: 現在のバージョンを表示
- **npm**: 現在のバージョンを表示
- **yarn**: インストールされている場合のバージョンを表示
- **Volta**: インストール状況、バージョン、実行ファイルの場所を確認
