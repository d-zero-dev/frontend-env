# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

D-ZERO 株式会社のフロントエンド開発環境パッケージ群（`@d-zero/frontend-env`）。Lerna + Yarn Workspaces のモノレポ構成で、ビルダー、フロントエンド環境チェッカー、共通カスタム要素、PostCSS 設定、スキャフォールドツールなどを `@d-zero/` スコープで提供する（fixed バージョンモード）。

## プロジェクト構成

作業前に以下のファイルを確認し、プロジェクトの状態を把握すること:

- `package.json` — scripts、devDependencies、Volta（Node 24 / Yarn 4）
- `lerna.json` — fixed バージョンモード、`packages/@d-zero/*`
- `README.md` — リポジトリ概要
- `tsconfig.json` — TypeScript 設定
- 各パッケージの構成は `packages/@d-zero/*/package.json` を参照

## コマンド

- `yarn build` — `@d-zero/builder`、`@d-zero/check-frontend-env`、`@d-zero/custom-components` のみビルド（lerna run build --scope）
- `yarn dev` — `lerna run dev`
- `yarn test` — Vitest でテスト（test-timeout 60000）
- `yarn lint` — eslint / prettier / textlint / cspell を直列実行
- `yarn storybook` — `@d-zero/custom-components` の Storybook を起動
- `yarn release` / `yarn release:alpha` 等 — `lerna version`（push なし）。リリース手順は `.claude/skills/npm-publish/SKILL.md` 参照

### コマンド制約

- **yarn のみ使用**: npm / pnpm / bun / deno によるコマンド実行は禁止
- **パッケージディレクトリに cd しない**: 常にリポジトリルートから実行
- **ビルドは `yarn build` のみ**: `npx tsc`、`lerna run build --scope` の個別指定は禁止
- **コマンドの連続実行禁止**: `&&`、`;`、改行によるコマンド連結をしない。1回の Bash 呼び出しで1コマンドのみ実行する。連結されたコマンドは settings.json の permissions allow/deny でパターンマッチできず、毎回ユーザーの手動承認が必要になり効率が大幅に低下する
- **main / dev ブランチでの作業・コミット禁止**: 作業開始前に `git branch --show-current` で現ブランチを確認し、`main` / `master` / `dev` / `develop` にいる場合は `git switch -c <topic>` でトピックブランチを作ってから作業する。これらのブランチでの直接コミットはリポジトリのルールで禁止されている

## ドキュメント原則

情報は置き場で役割が決まる。**コードには How、テストコードには What、コミットログには Why、コードコメントには Why not**（Why が必要なときは Why も書く）。

- **JSDoc = 公開 API（export）の API ユーザー向け文書**: IDE ホバーで実装を読まない読者に届くため、WHAT / HOW / WHY を適切に書き、`@example` を必須とする
- **非公開 API の JSDoc は必須にしない**: ただし複雑な内部モジュールの設計 WHY / Why not はファイルレベル JSDoc が推奨置き場
- **計画相対概念の禁止**: 実装計画に由来する相対概念（Phase/Step 番号、「本 PR」「今回」「旧実装」「導入予定」）を JSDoc・テスト名・ドキュメントに書かない。現在の挙動と意図的な不在（Why not）として自己完結に書く。外部参照は issue / PR 番号のみ可
- **ドキュメントと実装の矛盾**: 実装が正としてドキュメントを直す

## セキュリティ

### 機密情報の取り扱い

- `.env`、`.env.*` 等の機密ファイルを読み取り・編集・コミットしない（機密ファイルの判断は `.gitignore` を参考にすること）
- コミット前に `git diff --staged` で機密情報（API キー、トークン、パスワード、企業名、顧客情報）が含まれていないか確認する
- **サンプル値は予約済み慣例に従う**: ドメインは `example.com` / `*.example` / `*.test` 等（RFC 2606/6761）、IP は TEST-NET。実在の無関係ドメイン、未取得の創作ドメイン、案件識別子、実データ・実コーパスの断片を成果物に残さない（詳細は `.claude/skills/git/SKILL.md` のサンプル値慣例チェック）
- 環境変数やシークレットをコード内にハードコードしない

### サプライチェーン保護

- **yarn dlx は完全禁止**: ローカルパッケージを使わずリモートから直接実行するため、サプライチェーン攻撃に脆弱
- **npx は原則使わない**: package.json の scripts で定義されたコマンドを `yarn <script>` で実行すること
- 新しい依存パッケージの追加は慎重に。既存の依存で解決できないか先に確認する
- `yarn add` する前にパッケージの信頼性（ダウンロード数、メンテナンス状況、既知の脆弱性）を確認する
- `yarn add` する場合はバージョンを固定する（例: `yarn add foo@1.2.3`）
- lockfile（yarn.lock）の手動編集は禁止

## スキル

タスクに応じて `.claude/skills/` 配下のスキルを参照すること。

| スキル          | パス                                      | 用途                                                                   |
| --------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| Product Manager | `.claude/skills/product-manager/SKILL.md` | リポジトリ分析、ドキュメント生成・レビュー、PR レビュー                |
| QA Engineer     | `.claude/skills/qa-engineer/SKILL.md`     | コードレビュー、テスト品質チェック、カバレッジ改善                     |
| Impl            | `.claude/skills/impl/SKILL.md`            | 合意済み計画の実装 → レビュー → コミット → PR 作成                     |
| git             | `.claude/skills/git/SKILL.md`             | コミット作成ルール（粒度、メッセージ形式、コミット前チェック）         |
| pr              | `.claude/skills/pr/SKILL.md`              | PR 作成（プリフライト、base 追従、CI 監視）                            |
| grill-me        | `.claude/skills/grill-me/SKILL.md`        | 計画・設計の合意形成（実装前の徹底質問）                               |
| npm publish     | `.claude/skills/npm-publish/SKILL.md`     | リリース（dev→main、バージョニング、tag push、publish 検証、dev 同期） |

コミットは必ず `.claude/skills/git/SKILL.md`、PR 作成は `.claude/skills/pr/SKILL.md`、リリースは `.claude/skills/npm-publish/SKILL.md` の手順に従うこと。
