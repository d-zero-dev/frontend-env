# ディーゼロ フロントエンド標準開発環境ビルドツール

[フロントエンド標準開発環境（`@d-zero/scaffold`）](https://github.com/d-zero-dev/frontend-env/blob/main/packages/%40d-zero/scaffold/)のビルド処理をパッケージしたものです。
Scaffoldに含めている`package.json`の`devDependencies`に記載してあるため、追加のインストールは基本的に不要です。

<details>
<summary>他の環境へのインストール</summary>

他の環境にインストールする場合は次のように追加します。

```sh
yarn add @d-zero/builder
```

</details>

## 使用方法

`build`というコマンドが登録されるので、それを実行することでビルド処理が実行されます。

```sh
build
```

### 環境変数

引数を受け取りませんが、`NODE_ENV`の値によってビルド処理が変えることができます。

| `NODE_ENV`の値 | ビルド処理                                           | Scaffoldに登録されているコマンド                       |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| なし           | 通常のビルドが実行されます。                         | `yarn build` (`build`)                                 |
| `production`   | 本番用のビルドが実行されます。                       | `yarn release` (`cross-env NODE_ENV=production build`) |
| `serve`        | 開発用サーバーが起動し、ファイルの変更を監視します。 | `yarn dev` (`cross-env NODE_ENV=serve build`)          |

## 利用技術

- [Eleventy](https://www.11ty.dev/)
- [Vite](https://vitejs.dev/)
- [@11ty/eleventy-plugin-vite](https://github.com/11ty/eleventy-plugin-vite)

## 設定

ベースがEleventyとなるので、Eleventyの設定ファイルを利用することができます。Scaffoldでは`eleventy.config.cjs`を用意しています。

```js
const path = require('node:path');

const eleventy = require('@d-zero/builder/11ty');

module.exports = function (eleventyConfig) {
	eleventyConfig.addGlobalData('alias', {
		'@': path.resolve(__dirname, '__assets', '_libs'),
	});

	if (process.env.NODE_ENV === 'production') {
		eleventyConfig.addGlobalData('prettier', true);
		// eleventyConfig.addGlobalData('minifier', { minifyJS: false });
		// eleventyConfig.addGlobalData('lineBreak', '\r\n');
		// eleventyConfig.addGlobalData('charset', 'shift_jis');
		// eleventyConfig.addGlobalData('pathFormat', 'preserve');
	}

	return eleventy(eleventyConfig);
};
```

基本的なビルド設定は`@d-zero/builder/11ty`に規定されているため、それに追加の設定を行うことでビルド処理をカスタマイズすることができます。

### カスタマイズ設定

`addGlobalData`メソッドを利用することで、ビルド処理に必要な設定を上書きします。

| オプションID | 説明                             |
| ------------ | -------------------------------- |
| `alias`      | パスのエイリアスを設定します。   |
| `prettier`   | Prettierを有効にします。         |
| `minifier`   | Minifierを有効にします。         |
| `lineBreak`  | 改行コードを設定します。         |
| `charset`    | 文字コードを設定します。         |
| `pathFormat` | パスのフォーマットを設定します。 |

詳細は[コーディングガイドライン](https://guidelines.d-zero.co.jp/html.html#builder)を確認してください。

その他、`eleventyConfig`変数にEleventyの設定を追加することで、ビルド処理をカスタマイズすることができます。

ViteやRollupに関する設定、その他ディレクトリ構成の変更などは`@d-zero/builder/11ty`で行うのは現状難しいため、Eleventyの設定ファイルで一から設定することになります。または、[Issue](https://github.com/d-zero-dev/frontend-env/issues)もしくは[プルリクエスト](https://github.com/d-zero-dev/frontend-env/pulls)変更可能なオプションをリクエストしてください。

## 現状の問題点

- JSファイルのエントリーポイントを複数指定できない
- インラインスクリプトを外部化したゴミファイルが生成される（ビルド処理の最後に削除される）
- 設定上HTMLプリプロセッサーがPugのみ

## ロードマップ

静的サイトもしくはCMSのテンプレートを素早く構築するため、利用技術についてこだわりがあるわけではありません。そのため、利用技術の変更や追加を行うことがあります。現状、EleventyとViteを利用している理由はちょうどよかっただけです。

### 技術採用のポイント

- HTML/CSS/JSの切り離しが容易であること
- HTMLに余計な要素・属性・コードが挿入されないこと
- ビルド処理が高速であること

### 予定

- Eleventy v3の対応
- Eleventy以外の選択肢の検討
