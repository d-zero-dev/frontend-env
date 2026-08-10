# D-ZERO フロントエンド開発プロジェクト

## ルール

- `htdocs/` はビルド出力。直接編集せず `__assets/` のソースファイルを編集すること（ただし `htdocs/img/` は直接扱ってよい）
- `main` ブランチでの作業は禁止
- パッケージマネージャーは `yarn` を使用すること（`npm` は使わない）
- コミットメッセージはAIが作成するため、Conventional Commitsに従い適切な内容を記述すること
- D-ZERO コーディングガイドラインに従うこと。各ガイドラインのインデックスから詳細ページを参照できる:
  - [命名規則](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/naming/index.md)
  - [HTML](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/html/index.md)
  - [CSS](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/css/index.md)
  - [JavaScript](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/js/index.md)
  - [Git](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/git/index.md)

## コマンド制約

- **yarn のみ使用**: npm / pnpm / bun / deno によるコマンド実行は禁止
- **コマンドの連続実行禁止**: `&&`、`;`、改行によるコマンド連結をしない。1回の Bash 呼び出しで1コマンドのみ実行する。連結されたコマンドは settings.json の permissions allow/deny でパターンマッチできず、毎回ユーザーの手動承認が必要になり効率が大幅に低下する

## セキュリティ

### 機密情報の取り扱い

- `.env`、`.env.*` 等の機密ファイルを読み取り・編集・コミットしない（機密ファイルの判断は `.gitignore` を参考にすること）
- コミット前に `git diff --staged` で機密情報（API キー、トークン、パスワード、企業名、顧客情報）が含まれていないか確認する
- 環境変数やシークレットをコード内にハードコードしない

### サプライチェーン保護

- **yarn dlx は完全禁止**: ローカルパッケージを使わずリモートから直接実行するため、サプライチェーン攻撃に脆弱
- **npx は原則使わない**: package.json の scripts で定義されたコマンドを `yarn <script>` で実行すること（既存 scripts 内の `npx` 呼び出しはそのまま）
- 新しい依存パッケージの追加は慎重に。既存の依存で解決できないか先に確認する
- `yarn add` する前にパッケージの信頼性（ダウンロード数、メンテナンス状況、既知の脆弱性）を確認する
- `yarn add` する場合はバージョンを固定する（例: `yarn add foo@1.2.3`）
- lockfile（yarn.lock）の手動編集は禁止
