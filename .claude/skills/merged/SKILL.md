---
name: merged
metadata:
  internal: true
argument-hint: '[PR 番号]'
description: このリポジトリの PR のマージ後手順。外部作者への完了コメント、owner 以外が立てた issue への報告、デフォルトブランチ以外へのマージで閉じなかった issue のクローズ。ユーザーが「マージした」と言った後に pr スキルが呼ぶか、ユーザーが `/merged <n>` で起動する
---

PR: $ARGUMENTS

# ルール

- **見せずに GitHub へ書き込まない。** コメントもクローズも 1 件ずつユーザーに見せ、`AskUserQuestion`（種別: confirmation）で同意を得てから行う。応答の本文に書いた質問はターンを終わらせ、残りの手順が失われる
- **owner** はこのセッションを動かしているメンテナー。`gh api user --jq .login` で 1 回取得し、`gh pr view <n> --json author --jq .author.login` / `gh issue view <m> --json author --jq .author.login` と比べる。そのログインは有効な `gh` トークンの持ち主（`GH_TOKEN`、bot、別アカウント）なので、投稿文を見せるときに解決したログインも明示する。`gh repo view --json owner` は組織を返すので使わない。bot 作者（`--jq .author.is_bot` が `true`。Renovate 等）は owner と同じ扱い。誰もコメントを待っていない

# 手順

1. **マージを確認する。** 上に PR 番号が無ければユーザーに聞く。`gh pr view <n> --json state,mergedAt,baseRefName,author,closingIssuesReferences` を実行する。`state` が `MERGED` でなければ止めてユーザーに伝える
2. **owner を解決し**、PR 作者と各 linked issue の起票者が owner かどうかを判定する
3. **PR の作者が owner 以外のときだけ、完了コメントを PR に付ける**: 何が入ったか、意図的に外したもの、計画と結果が違う点。PR 本文はレビュー前に書かれたもので、このコメントはマージされた PR が実際に何かを記録する。owner 自身の PR には付けない（PR 本文と会話に記録がある）
4. **linked issue の起票者が owner 以外のときだけ、その issue に報告コメントを付ける**: 何をどの PR で行ったか。owner が立てた issue には報告しない（PR がすでに言っており、owner は返事を待っていない）
   - デフォルトブランチ以外への PR（次メジャーラインの `v6` への PR）では `Fixes #N` が issue を閉じないので、`gh issue view <m> --json state` を確認し、開いていれば `gh issue close <m> --reason completed` で閉じる。報告コメントを付ける issue では `--comment "Fixed by #<n> (merged into <base>)."` としてクローズに畳み込む
5. **報告する。** 投稿したコメントと閉じた issue
