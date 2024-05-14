# `@d-zero/postcss-config`

## 個別インストール

```sh
yarn add -D @d-zero/postcss-config
```

## 使い方

`.postcssrc.js`を作成し、設定を読み込みエクスポートします。

```js
import postcss from '@d-zero/postcss-config';

export default {
	...postcss,
};
```

### 拡張

プロジェクトに合わせて設定を追加します。

```js
import postcss from '@d-zero/postcss-config';

export default {
	...postcss,
	// autoprefixerを無効にする
	autoprefixer: false,
};
```
