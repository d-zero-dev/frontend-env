---
description: リリース手順
disable-model-invocation: true
---

# リリース手順

以下の手順を順番に実行する。

1. `main` ブランチにチェックアウトする
2. `main` ブランチをプルする
3. AskUserQuestionツールでリリースに含めるトピックブランチを質問する
4. `release${YYYYMMDD}` 形式のリリースブランチを作成する（同日に複数リリースがある場合は `release${YYYYMMDD-SUFFIX}` とする）
5. 指定された各トピックブランチをリリースブランチにマージする
6. AskUserQuestionツールでリリースブランチをプッシュしてよいか質問する
7. プッシュ後、リリース担当者にリリースブランチ名を伝えるようユーザーに促す
