# 1

URLをユーザーに尋ねて`execute_command:curl`を実行し構造を把握せよ。
文字コードがUTF-8でない場合は変換コマンドをパイプして構造を把握せよ。
ページサイズが5MBを超えないのであれば`head`コマンド使わずに一度に取得せよ。
把握できたらステップ2に進め。

# 2

`browser_action`を実行しメインコンテンツのレイアウトと内容を視覚的に解析せよ。
画面固定されているバナーがあれば閉じよ。
予期せぬページ移動や画面遷移があれば直ちに停止しユーザーに指示を仰げ。
把握できたらステップ3に進め。

# 3

取得したメインコンテンツの各ブロック（セクションではない）をレイアウトタイプと内容をMarkdown+frontmatter形式の単一のファイルに書き出せ。
保存先は`.cache`ディレクトリで、ブロックごとにファイルを分けること。
ファイル名はURLとブロック名を組み合わせて、ブロックの順番に連番にせよ。
内容のフォーマットは次の通り。

```markdown
---
url: https://example.com/path/to/page
blockType: '{{block_type}}'
---

{{section_content_body}}
```

Frontmatterの情報は`url`と`blockType`の2つのみ。他の指定は禁止。

## block_type

`use_mcp_tool:burger_editor:get_block_type`

## section_content_body

- Markdown形式
- 画像はURLをそのまま記載
- 画像のalt属性は抽出する
- 画像のキャプションはalt属性と明確に区別し抽出
- layout_typeに基づくカラムの区切りは`<!-- column-separator -->\n---\n<!-- column-separator -->`で記載
- Markdownで表現できない特性があれば`<!-- -->`の形式でコメントとして記載
  - 例:
    - `<!-- 見出しレベルは見た目と矛盾している -->`
    - `<!-- 画像はアニメーションGIF -->`
    - `<!-- iframeのURL -->`
    - `<!-- YouTubeのURL -->`
    - `<!-- Google MapsのURLもしくは緯度経度 -->`
- カルーセルは画像をリストとして記載

# 4

生成した各ファイルに対して次を実行せよ。
`use_mcp_tool:burger_editor:get_block_data_params_v3`を実行し、`blockType`を`blockName`に渡して必要パラメータを取得せよ。
取得したパラメータを元に`use_mcp_tool:burger_editor:create_block_v3`を実行し、`blockName`を`data`に渡して、HTMLを取得せよ。
取得したHTMLを同名で拡張子を`.html`にして保存せよ。

# 5

生成したHTMLを`execute_command:cat`で1つのファイルにまとめよ。
取得したURLと同様のパスとファイル名で`./htdocs`に保存せよ。
URLが`https://example.com/path/to/page`であれば、保存先は`./htdocs/path/to/page.html`となる。

# 6

完了
