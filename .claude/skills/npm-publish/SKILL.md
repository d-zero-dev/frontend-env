---
name: npm-publish
description: npm パッケージのリリース（dev→main マージ、バージョニング、tag push、publish workflow 監視、publish 結果検証、dev への同期）
when_to_use: ユーザーが「リリースして」「publish して」「バージョン上げて」「/npm-publish」と指示した場合
disable-model-invocation: true
---

# 前提

- リリースは `main` ブランチから行う。`dev` の変更を `main` にマージしてから実行する
- タグ push で publish workflow が発火し、npm へ自動 publish される（OIDC Trusted Publishing）
- **publish は取り消せない**。各ステップでユーザーの確認を取る
- **`yarn release` / `git push --tags` / `git push origin dev` はユーザーが実行する**。エージェントは実行せず `!` プレフィックス付きのコマンドを提示し、完了報告を待つ

# 対象パッケージ

このリポジトリが publish するパッケージ（fixed モードのため全パッケージが同一バージョンで上がる）:

| ディレクトリ                          | npm パッケージ名             |
| ------------------------------------- | ---------------------------- |
| `packages/@d-zero/check-frontend-env` | `@d-zero/check-frontend-env` |
| `packages/@d-zero/create-frontend`    | `@d-zero/create-frontend`    |
| `packages/@d-zero/custom-components`  | `@d-zero/custom-components`  |
| `packages/@d-zero/postcss-config`     | `@d-zero/postcss-config`     |
| `packages/@d-zero/scaffold`           | `@d-zero/scaffold`           |

`packages/@d-zero/site-migrator` は `private: true` のため publish 対象外。

# 手順

## 1. ワーキングツリーの状態確認

`git status` で未コミットの変更・未追跡ファイルがないか確認する。

- クリーンなら次へ
- 変更があればユーザーに報告し、`git stash` / コミット / 中断のいずれかを尋ねる。指示に従ってから次へ

汚れたまま先に進むとマージ・バージョニングが意図しない差分を巻き込むため、ここは省略しない。

## 2. main と dev の最新化

```bash
git fetch origin
git checkout main
git pull origin main
git checkout dev
git pull origin dev
git checkout main
```

両ブランチをローカルで最新にしてから `main` に戻る。`dev` をローカルで最新にしておくのは、手順 10 の `main` → `dev` 同期でそのまま使うため。

いずれかの `pull` がコンフリクトやリジェクトで失敗したらユーザーに報告して指示を仰ぐ。

## 3. 未マージ PR の確認

リリースに含めるべき PR が残っていないか確認し、あればユーザーに提示して続行可否を尋ねる。

```bash
gh pr list --base dev --state open
```

## 4. dev → main マージ

`dev` が `main` より進んでいる場合、差分コミットをユーザーに提示してからマージする。

```bash
git log --oneline main..dev
git merge dev --no-edit
```

コンフリクトが発生したらユーザーに報告して指示を仰ぐ。

## 5. lockfile の同期確認

```bash
yarn install
git diff yarn.lock
```

差分が出たらユーザーに報告し、コミットしてから次へ。CI の `yarn install --immutable` が失敗するのを防ぐため必須。

## 6. 事前チェック

```bash
yarn lint
yarn build
yarn test
```

すべてパスすること。失敗があれば修正してから次へ。`main` の CI が green かも併せて確認する。

```bash
gh run list --branch main --limit 5
```

## 7. リリース内容の提示

現在のバージョンと前回タグからの差分をユーザーに提示する。

```bash
git describe --tags --abbrev=0
git log --oneline $(git describe --tags --abbrev=0)..HEAD
```

fixed モードのため全パッケージが同一バージョンで上がる。現在のバージョンは `lerna.json` の `version` を確認する。`yarn release` は conventional commits からバージョンを自動決定するため、**リリース種別（graduate / alpha / beta / rc）をユーザーに確認する必要はない**。差分は「何が入るか」の確認材料として提示するだけでよい。

## 8. バージョニングと tag push（ユーザー実行）

`lerna version` は選択・確認のプロンプトを出すインタラクティブコマンドで、Claude Code の `!` 経由では対話できない（プロンプトが表示されても入力できず止まる）。ユーザーに次の手順を依頼する:

1. Claude Code のセッションを終了する（`exit`）
2. ターミナルで直接 `yarn release` を実行し、プロンプトに対話的に回答する
3. 完了したら `claude --continue` で会話に戻る

```
yarn release          # graduate（正式リリース。通常はこれだけで十分）
```

alpha / beta / rc のプレリリースが必要な場合は、ユーザーが会話の中で明示的に指示したときだけ、上記と同じ exit → 実行 → `--continue` の手順で該当コマンドを案内する。

```
yarn release:alpha    # alpha プレリリース
yarn release:beta     # beta プレリリース
yarn release:rc       # RC プレリリース
```

`lerna version` は自動 push しないため、コミットとタグの push が**必須**。ユーザーから完了報告を受けたら、続けて以下を依頼する。

```
! git push origin main --follow-tags
```

実際にタグが push されたことを確認してから次へ進む。

```bash
git ls-remote --tags origin
```

## 9. publish workflow の監視

`v*` タグ push で `publish.yml` が発火する。バックグラウンド実行で完了を待つ。

```bash
gh run watch --exit-status
```

失敗したらログ URL をユーザーに提示し、「11. 失敗時の対処」へ。

## 10. publish 結果の検証

workflow が success でも publish が意図通りとは限らない。**全パッケージについて**実際の npm 上の状態を確認する（fixed でも部分 publish は起きうる）。

```bash
npm view @d-zero/check-frontend-env version
npm view @d-zero/create-frontend version
npm view @d-zero/custom-components version
npm view @d-zero/postcss-config version
npm view @d-zero/scaffold version
```

確認項目:

- バージョンが手順 8 で上げた値と一致しているか（全パッケージ同一バージョンのはず）
- dist-tag が意図通りか（正式リリースは `latest`、プレリリースは `alpha` / `beta` / `rc` / `next`。`.github/workflows/publish.yml` の `Determine dist-tag` ステップ参照）
- provenance が付与されているか（npm の該当バージョンページ、または `npm view <package> --json` の `dist.attestations`）

**ここが success の判定点**。npm 上の状態を確認するまでリリース完了と判断してはいけない。

## 11. main → dev の同期

publish の成功を確認した後、バージョン更新コミットを `dev` に取り込む。

```bash
git checkout dev
git merge main --no-edit
```

コンフリクトが発生したらユーザーに報告して指示を仰ぐ。マージできたら push をユーザーに依頼する。

```
! git push origin dev
```

`dev` はブランチ保護がかかっており、`maintain` ロールでは直接 push できない場合がある。push が拒否されたら、`dev` への取り込みを PR 経由に切り替える（`git checkout -b chore/sync-main` してから `.claude/skills/pr/SKILL.md` の手順へ）。

## 12. 失敗時の対処

- **sigstore の transient 409**: workflow 側に retry ステップがあるため、まず retry の結果を確認する。それでも失敗する場合は `gh run rerun` で再実行
- **部分 publish**: 成功したパッケージは publish 済みで巻き戻せない。未 publish のパッケージのみを対象に、タグを打ち直して workflow を再発火させる（`lerna publish from-git` は未 publish のバージョンのみを対象にするため、成功済みパッケージは二重 publish されない）
- **誤ったバージョンを publish した**: unpublish は原則不可。`npm deprecate <package>@<version> "<理由>"` で非推奨化し、修正版を新バージョンとして publish する。この判断は必ずユーザーに確認を取る
- **publish が失敗したまま中断する場合**: 手順 11 の `dev` 同期は行わない。`main` にバージョン更新コミットだけが残るため、次回リリース時にそこから再開する

# 注意

- **`v*` タグの作成・削除は CODEOWNERS のみ**（GitHub Rulesets で保護）。権限がない場合は手順 8 で失敗するため、実行者がタグ権限者か事前に確認する
- **publish は取り消せない**。手順 5・6 の事前チェックを省略しない
- **`yarn release` は `prerelease` スクリプト経由で build / test を再度走らせる**ことがある。手順 6 と重複するが、`lerna version` の途中で失敗するより事前に落としたほうが安全なので省略しない
