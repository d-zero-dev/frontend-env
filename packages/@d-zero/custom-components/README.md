# @d-zero/custom-components

D-ZEROカスタムWebコンポーネントライブラリです。

## 概要

このパッケージは、再利用可能なWeb Componentsを提供します。すべてのコンポーネントは標準のWeb Components APIを使用して実装されており、フレームワークに依存しません。

## 提供コンポーネント

### Breadcrumbs

パンくずリストを表示するWeb Componentsです。区切り文字やスタイルをCSSカスタムプロパティでカスタマイズでき、Schema.orgのマイクロデータにも対応しているため、SEO対策にも有効です。

**詳細**: [Storybook - Breadcrumbs](https://components.d-zero.co.jp/?path=/docs/components-breadcrumbs--docs)

### HamburgerMenu

ハンバーガーメニューアイコンを表示し、クリックすると指定されたダイアログを開くWeb Componentsです。アイコンのスタイルや外枠のスタイルをCSSカスタムプロパティでカスタマイズできます。

**詳細**: [Storybook - HamburgerMenu](https://components.d-zero.co.jp/?path=/docs/components-hamburgermenu--docs)

## インストール

```bash
yarn add @d-zero/custom-components
```

## 使い方

### Breadcrumbs

```js
import { defineBreadcrumbs } from '@d-zero/custom-components/breadcrumbs';

// カスタム要素を登録
defineBreadcrumbs('x'); // 'x-breadcrumbs'を登録
```

```html
<x-breadcrumbs>
	<a href="/">ホーム</a>
	<a href="/category">カテゴリA</a>
	<a href="/category/subcategory/items">アイテム一覧</a>
	<a href="/category/subcategory/items/current" aria-current="page">現在のアイテム</a>
</x-breadcrumbs>
```

### HamburgerMenu

```js
import { defineHamburgerMenu } from '@d-zero/custom-components/hamburger-menu';

// カスタム要素を登録
defineHamburgerMenu('x'); // 'x-hamburger-menu'を登録
```

```html
<x-hamburger-menu>
	<dialog>
		<h1>メニュー</h1>
		<ul>
			<li><a href="#">項目1</a></li>
			<li><a href="#">項目2</a></li>
		</ul>
		<button command="close">閉じる</button>
	</dialog>
</x-hamburger-menu>
```

## Storybook

各コンポーネントの詳細なドキュメントとサンプルはStorybookで確認できます。

**公開URL**: [https://components.d-zero.co.jp/](https://components.d-zero.co.jp/)

ローカルでStorybookを起動する場合：

```bash
yarn dev
```

Storybookは `http://localhost:6006` で起動します。

## エクスポート

このパッケージは以下のエクスポートを提供します：

- `@d-zero/custom-components/breadcrumbs` - Breadcrumbsコンポーネント
- `@d-zero/custom-components/hamburger-menu` - HamburgerMenuコンポーネント

各エクスポートには、コンポーネントクラス（`Breadcrumbs`、`HamburgerMenu`）と定義関数（`defineBreadcrumbs`、`defineHamburgerMenu`）が含まれています。通常は定義関数を使用してカスタム要素を登録しますが、コンポーネントクラスを直接インポートして使用することも可能です。

## ライセンス

MIT
