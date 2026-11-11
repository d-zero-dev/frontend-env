# D-ZERO フロントエンド開発プロジェクト

## ルール

- ビルドの出力先（`kamado.config.jsonc`の`dir.output`。`htdocs/`か`htdocs/webroot/`）は直接編集せず、`__assets/`のソースファイルを編集すること（ただし、画像の`img/`など、ビルドが作らないファイルは直接扱ってよい）
- ブラウザチェック・実装チェック（表示・動作・インタラクションの確認）には DevTools MCP（`chrome-devtools`。`.mcp.json`に設定済み）を用いること
  - ネットワークアクセスやプロセス起動に制限のあるサンドボックス環境では、`.mcp.json`の`chrome-devtools`/`figma-remote-mcp`が動作しないことがある。動作しない場合は、実行環境に応じた代替手段（スクリーンショット取得ツール、Figma 連携の別経路など）を検討すること
- `main`ブランチでの作業は禁止
- パッケージマネージャーは`yarn`を使用すること（`npm`は使わない）
- コミットメッセージはAIが作成するため、Conventional Commitsに従い適切な内容を記述すること
- D-ZERO コーディングガイドラインに従うこと。各ガイドラインのインデックスから詳細ページを参照できる:
  - [命名規則](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/naming/index.md)
  - [HTML](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/html/index.md)
  - [CSS](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/css/index.md)
  - [JavaScript](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/js/index.md)
  - [Git](https://raw.githubusercontent.com/d-zero-dev/frontend-guidelines/dev/src/git/index.md)

## サイト構成（kamado）

- ページは`__assets/htdocs/`の`*.tsx`と`*.html`。置き場所がそのまま URL になる（`about/index.tsx` → `/about/`、`about/history.tsx` → `/about/history.html`）
- ページのメタ（`title`、`layout`など）は、ページと同じ名前の`.json`（sidecar）に書く。同じキーがページ内の`export const meta`にもあるときは、sidecar の値が使われる
- `layout`には`__assets/_libs/layouts/`のファイル名を拡張子なしで書く
- `@/`は`__assets/_libs/`を指す
- 全ページの一覧は`yarn kamado pages`で JSON として得られる（ビルドしない）
- **ページの追加・移動・改名・削除、URL の変更、ディレクトリの整理に着手する前に、必ず`.claude/skills/organizing-kamado-pages/SKILL.md`を読み、その手順で作業すること**
- `yarn dir`（Kamado UI）は、人がブラウザでページのメタと URL を編集する画面。エージェントは起動しない。使い方は`docs/kamado-ui.md`

## AIエージェントスキル

`.claude/skills/`に、このプロジェクトのスキルと、D-ZERO 共通のコーディングスキル（`dzero-*`）が配置されている。

- **UI・機能の実装に着手する前に、必ず`.claude/skills/dzero-tech-selection`を読み、実装レイヤー（HTML/CSS/JS）を決定してから作業すること**
- デザインデータ（Figma 等）を参照して実装するときは`.claude/skills/dzero-design-to-code`に従うこと
- スキルの更新は`yarn skills:sync`で行い、`.claude/skills/`と`skills-lock.json`の差分をコミットすること（取得元は[frontend-guidelines](https://github.com/d-zero-dev/frontend-guidelines)の`main`ブランチ）。`yarn skills:sync`は、取得したスキルと同じ名前のディレクトリだけを置き換える。このプロジェクトのスキルは、取得元に同じ名前のスキルが無い限り残る

## コマンド制約

- **yarn のみ使用**: npm/pnpm/bun/deno によるコマンド実行は禁止
- **コマンドの連続実行禁止**: `&&`、`;`、改行によるコマンド連結をしない。1回の Bash 呼び出しで1コマンドのみ実行する。連結されたコマンドは settings.json の permissions allow/deny でパターンマッチできず、毎回ユーザーの手動承認が必要になり効率が大幅に低下する

## セキュリティ

### 機密情報の取り扱い

- `.env`、`.env.*`等の機密ファイルを読み取り・編集・コミットしない（機密ファイルの判断は`.gitignore`を参考にすること）
- コミット前に`git diff --staged`で機密情報（API キー、トークン、パスワード、企業名、顧客情報）が含まれていないか確認する
- 環境変数やシークレットをコード内にハードコードしない

### サプライチェーン保護

- **yarn dlx は完全禁止**: ローカルパッケージを使わずリモートから直接実行するため、サプライチェーン攻撃に脆弱
- **npx は原則使わない**: package.json の scripts で定義されたコマンドを`yarn <script>`で実行すること（既存 scripts 内の`npx`呼び出しはそのまま）
- 新しい依存パッケージの追加は慎重に。既存の依存で解決できないか先に確認する
- `yarn add`する前にパッケージの信頼性（ダウンロード数、メンテナンス状況、既知の脆弱性）を確認する
- `yarn add`する場合はバージョンを固定する（例: `yarn add foo@1.2.3`）
- lockfile（yarn.lock）の手動編集は禁止
