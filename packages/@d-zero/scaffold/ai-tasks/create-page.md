# 1

`use_mcp_tool:burger_editor`関連の実行を禁止する。
指示があるまで一切の`list_files`、`search_files`、`read_file`および`write_to_file`を禁止する。
その他余計な推論やファイル読み込み操作はせずに次のステップに進め。

# 2

対象のページと利用するコンポーネントをユーザーに要求せよ。

得られた情報を次のYAMLのように整理し、スレッドに出力しユーザーの承認を待て。
この情報整理をこなすのには`use_mcp_tool:frontend_env:get_coding_guidelines(html)`の知識が必要である。

例1:

```yaml
pagePath: 000_home.pug
pageType: c-page-home
components:
  - c-header
  - c-hero
  - c-section01
  - c-section02
  - c-banners
  - c-footer
```

例2:

```yaml
pageName: 100_sub.pug
pageType: c-page-sub
components:
  - c-header
  - c-page-title
  - c-content-main
  - c-banners
  - c-footer
```

承認を得たら次のステップに進め。

# 3

`list_files`で`__assets/htdocs/_libs/component/`にファイルが存在するか確認せよ。
コンポーネントがない場合はタスクの一切を強制中止せよ。
コンポーネントがすべて揃っていれば次のステップに進め。

# 4

前ステップで得た情報を元に、以下のようなpugファイルを`write_to_file`せよ。

```pug
html(lang="ja")
	head
		include /mixin/meta.pug
		+meta('__サイトタイトル__')
	body.c-page-home
		.c-page-home__base
			.c-page-home__header
				include /component/c-header.pug
			.c-page-home__hero
				include /component/c-hero.pug
			.c-page-home__section01
				include /component/c-section01.pug
			.c-page-home__section02
				include /component/c-section02.pug
			.c-page-home__banners
				include /component/c-banners.pug
			.c-page-home__footer
				include /component/c-footer.pug
```

```pug
html(lang="ja")
	head
		include /mixin/meta.pug
		+meta('__サイトタイトル__')
	body.c-page-sub
		.c-page-sub__base
			.c-page-sub__header
				include /component/c-header.pug
			.c-page-sub__page-title
				include /component/c-page-title.pug
			.c-page-sub__content-main
				include /component/c-content-main.pug
			.c-page-sub__banners
				include /component/c-banners.pug
			.c-page-sub__footer
				include /component/c-footer.pug
```

既に同名のファイルが存在する場合は、**既存のコードは一切参考にせずすべて削除し**指示された構造をそのまま反映せよ。
作成したら、`__assets/htdocs/__tmpl/`に保存せよ。`__assets/htdocs/__tmpl/`の外に作ってはならない。
パスはViteの機能に従い`/component/`で始めことができる。
ファイルのナンバリングは重要である。
保存したら次のステップに進め。

# 5

`__assets/htdocs/_libs/component/`のコンポーネントと対になっているSASSファイルが同フォルダに存在するので、それを`__assets/htdocs/css/style.scss`に追記せよ。
保存したら次のステップに進め。

# 6

タスクは完了である。以下は不要。

- ビルド
- ブラウザチェック
- テスト
