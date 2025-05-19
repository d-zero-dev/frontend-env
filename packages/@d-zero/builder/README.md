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

以下のコマンドを実行することでビルド処理が実行されます。

```sh
npx @d-zero/builder
```

## 利用技術

- [Eleventy](https://www.11ty.dev/): HTMLトランスパイルおよび全体のビルド処理
- [esbuild](https://esbuild.github.io/): JavaScriptトランスパイル
- [Vite](https://vitejs.dev/): CSSトランスパイル

## 設定

ベースがEleventyとなるので、Eleventyの設定ファイルを利用することができます。Scaffoldでは`eleventy.config.mjs`を用意しています。

```js
import path from 'node:path';

import eleventy from '@d-zero/builder/11ty';

export default function (eleventyConfig) {
	return eleventy(eleventyConfig, {
		alias: {
			'@': path.resolve(import.meta.dirname, '__assets', '_libs'),
		},
		outputCssDir: 'css',
		outputJsDir: 'js',
		outputImgDir: 'img',
		imageSizes: { selector: '*' },
		prettier: false,
		minifier: { minifyJS: false },
		lineBreak: '\r\n',
		charset: 'shift_jis',
		characterEntities: true,
		pathFormat: 'directory',
		autoDecode: true,
		ssi: { '**/*': { encoding: 'shift_jis' } },
		htmlHooks: {
			beforeSerialize: (content) => content,
			afterSerialize: (window) => {},
			replace: (content, paths) => content,
		},
		extensions: {
			html: 'html', // html以外の拡張子（例：'php'）も指定可能
		},
	});
}
```

基本的なビルド設定は`@d-zero/builder/11ty`に規定されているため、それに追加の設定を行うことでビルド処理をカスタマイズすることができます。

### フローチャート

```mermaid
flowchart LR
	#inHTML["*.html"]
	#inPug["*.pug"]
	#inSCSS["*.scss"]
	#inJS["*.{js,cjs,mjs}"]
	#inTS["*.ts"]
	#outHTML["*.html"]
	#outCSS["*.css"]
	#outJS["*.js"]

	#inHTML --> #dzBuilder
	#inPug --> #dzBuilder
	#inSCSS --> #dzBuilder
	#inJS --> #dzBuilder
	#inTS --> #dzBuilder
	#dzBuilder --> #outHTML
	#dzBuilder --> #outCSS
	#dzBuilder --> #outJS

	subgraph #dzBuilder["@d-zero/builder"]
		direction LR

		subgraph #eleventy["11ty"]
			#html["*.html"]
			#pug["*.pug"]
			#scss["*.scss"]
			#js["*.{js,cjs,mjs}"]
			#ts["*.ts"]

			subgraph #transformHTML["addTransform"]
				direction TB

				#beforeSerialize(["DOM処理前フック<br>(htmlHooks.beforeSerialize)"])
				#characterEntities(["文字参照変換<br>(characterEntities)"])
				#prettier(["整形<br>(prettier)"])
				#minifier(["最適化<br>(minifier)"])
				#lineBreak(["改行コード変換<br>(lineBreak)"])
				#charset(["文字コード変換<br>(charset)"])
				#afterSerialize(["DOM処理後フック<br>(htmlHooks.afterSerialize)"])
				#replaceHook(["最終出力前フック<br>(htmlHooks.replace)"])

				subgraph #domSerialize["domSerialize"]
					direction TB

					#jsdom(["JSDOM.serialize()"])
					#imageSizes(["画像<br>width/height<br>属性自動付与<br>(imageSizes)"])

					#jsdom --> #imageSizes
				end

				#beforeSerialize --> #domSerialize --> #afterSerialize --> #characterEntities --> #prettier --> #minifier --> #lineBreak --> #charset --> #replaceHook
			end

			subgraph #transpileCSS["addExtension"]
				direction TB

				#vite(["トランスパイル<br>(SASS on Vite)"])
			end

			subgraph #transpileJS["addExtension"]
				direction TB

				#esbuild(["トランスパイル<br>(esbuild)"])
			end

			#html --> #transformHTML
			#pug --> #eleventy-plugin-pug(["Pugプラグイン<br>(eleventy-plugin-pug)"]) --> #transformHTML
			#scss --> #transpileCSS
			#js --> #transpileJS
			#ts --> #transpileJS
		end

		subgraph #pathFormat["出力ファイルのパス変更<br>(pathFormat)"]
		end

		#eleventy --> #pathFormat
	end
```

### カスタマイズ設定

`addGlobalData`メソッドを利用することで、ビルド処理に必要な設定を上書きします。

| オプションID        | 説明                                                 |
| ------------------- | ---------------------------------------------------- |
| `alias`             | パスのエイリアスを設定します。                       |
| `outputCssDir`      | CSSの出力ディレクトリを設定します。                  |
| `outputJsDir`       | JSの出力ディレクトリを設定します。                   |
| `outputImgDir`      | 画像の出力ディレクトリを設定します。                 |
| `imageSizes`        | 画像のwidth/height属性を自動付与します。             |
| `prettier`          | Prettierを有効にします。                             |
| `minifier`          | Minifierを有効にします。                             |
| `lineBreak`         | 改行コードを設定します。                             |
| `charset`           | 文字コードを設定します。                             |
| `characterEntities` | 文字参照を変換します。                               |
| `pathFormat`        | パスのフォーマットを設定します。                     |
| `autoDecode`        | 開発用ローカルサーバーの自動デコードを有効にします。 |
| `ssi`               | 開発用ローカルサーバーのSSIの設定を行います。        |
| `htmlHooks`         | HTML処理のカスタマイズ用フックを設定します。         |
| `extensions`        | ファイル拡張子をカスタマイズします。                 |

詳細は[コーディングガイドライン](https://guidelines.d-zero.co.jp/html.html#builder)を確認してください。

#### htmlHooks

HTML処理の各段階でカスタム処理を挿入するためのフックを提供します。

| フックID          | 説明                                                     |
| ----------------- | -------------------------------------------------------- |
| `beforeSerialize` | DOM処理前のHTML文字列に対して処理を行います。            |
| `afterSerialize`  | DOM処理後のWindowオブジェクトに対して処理を行います。    |
| `replace`         | 最終出力前にHTML文字列とパス情報を使って処理を行います。 |

```js
htmlHooks: {
  // DOM処理前のHTMLを処理
  beforeSerialize: (content) => {
    return content.replace(/特定の文字列/g, '置換後の文字列');
  },
  // DOM処理後にWindowオブジェクトを操作
  afterSerialize: (window) => {
    const elements = window.document.querySelectorAll('.target');
    elements.forEach(el => el.classList.add('modified'));
  },
  // 最終出力前に処理（パス情報も利用可能）
  replace: (content, paths) => {
    const { filePath, dirPath, relativePathFromBase } = paths;
    return content.replace(/{{relativePath}}/g, relativePathFromBase);
  }
}
```

その他、`eleventyConfig`インスタンスのプロパティやメソッドを用いてEleventyの設定を追加することで、ビルド処理をカスタマイズすることができます。

#### extensions

出力されるファイルの拡張子をカスタマイズします。

```js
extensions: {
  html: 'php', // HTMLファイルをPHP拡張子で出力
}
```

現在サポートされている拡張子タイプ：

- `html`: HTMLファイルの拡張子（デフォルト: 'html'）

ViteやRollupに関する設定、その他ディレクトリ構成の変更などは`@d-zero/builder/11ty`で行うのは現状難しいため、Eleventyの設定ファイルで一から設定することになります。または、[Issue](https://github.com/d-zero-dev/frontend-env/issues)もしくは[プルリクエスト](https://github.com/d-zero-dev/frontend-env/pulls)変更可能なオプションをリクエストしてください。

## ロードマップ

静的サイトもしくはCMSのテンプレートを素早く構築するため、利用技術についてこだわりがあるわけではありません。そのため、利用技術の変更や追加を行うことがあります。現状、Eleventy/esbuild/Viteを利用している理由はちょうどよかっただけです。

### 技術採用のポイント

- HTML/CSS/JSの切り離しが容易であること
- HTMLに余計な要素・属性・コードが挿入されないこと
- ビルド処理が高速であること

### 予定

- Eleventy以外の選択肢の検討
