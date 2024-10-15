# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.23](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.22...v5.0.0-alpha.23) (2024-10-15)

**Note:** Version bump only for package @d-zero/fontend-env

# [5.0.0-alpha.22](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.21...v5.0.0-alpha.22) (2024-10-11)

### Bug Fixes

- **builder:** disable donDiff when using `options.ssi` ([2b1afde](https://github.com/d-zero-dev/frontend-env/commit/2b1afde08c675e3054b1f836100e09038353342e))

# [5.0.0-alpha.21](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.20...v5.0.0-alpha.21) (2024-10-11)

### Bug Fixes

- **builder:** fix passing charset to the attribute ([6e2fd17](https://github.com/d-zero-dev/frontend-env/commit/6e2fd179a237c0b29c424654b0922ba46dc9525f))
- **builder:** fix regex pointer to reset ([6aba522](https://github.com/d-zero-dev/frontend-env/commit/6aba522fb84c64d872955d199e4e499f033201ab))
- **builder:** fix to return original file content according to the path ([397b4af](https://github.com/d-zero-dev/frontend-env/commit/397b4af981fa187146e83a6d9c92f990cf7fb2b4))

### Features

- **builder:** enable live reload on path transfer ([e3392ee](https://github.com/d-zero-dev/frontend-env/commit/e3392eecd2df506924576c7f217954a2358ca1c0))

# [5.0.0-alpha.20](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.19...v5.0.0-alpha.20) (2024-10-11)

### Bug Fixes

- **builder:** fix to refer `pathFormat` option ([d4a3473](https://github.com/d-zero-dev/frontend-env/commit/d4a3473f1034bf81cd0e22ef039c1287779c28bc))

# [5.0.0-alpha.19](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.18...v5.0.0-alpha.19) (2024-10-11)

### Bug Fixes

- **builder:** fix `minifier` option default value ([1864f9d](https://github.com/d-zero-dev/frontend-env/commit/1864f9de0ea2567ccee900228b069e77d692289e))

### Features

- **builder:** change options ([419bc27](https://github.com/d-zero-dev/frontend-env/commit/419bc27b0c65be9b12067eeadeca3de993fb0307))
- **scaffold:** add `lint:text` command ([59ff16e](https://github.com/d-zero-dev/frontend-env/commit/59ff16eb99ccccec667ada4d030041d1c5e98c20))
- **scaffold:** add Textlint PRH setting ([635a9d2](https://github.com/d-zero-dev/frontend-env/commit/635a9d2adaca43d6dbbd6eb4865f2a7ecd115205))

### BREAKING CHANGES

- **builder:** `@d-zero/builder/11ty`のオプションの受け取りを`addGlobalData`から第2引数に変更

# [5.0.0-alpha.18](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.17...v5.0.0-alpha.18) (2024-10-11)

### Bug Fixes

- **builder:** fix path transforming on request ([efe5644](https://github.com/d-zero-dev/frontend-env/commit/efe5644a79e3ce514fbcfe11b65b8e1ab16c7d6c))
- **scaffold:** fix `build` command ([1a12364](https://github.com/d-zero-dev/frontend-env/commit/1a12364aa593ae9074e8496730982ee47759ccea))

### Features

- **builder:** rename package command name ([b7c5db3](https://github.com/d-zero-dev/frontend-env/commit/b7c5db318287a0db1f7c2a75f4887e6c80951e5e))
- **scaffold:** add `test` command ([6df437e](https://github.com/d-zero-dev/frontend-env/commit/6df437eed5ac86947db3fea0e90557da7644fa8c))
- **scaffold:** add TS compile checker as `lint:ts` command ([a330265](https://github.com/d-zero-dev/frontend-env/commit/a330265447568acf8aef6eb1bc454b4de6061ffb))
- **scaffold:** remove `release` command ([7e1c8df](https://github.com/d-zero-dev/frontend-env/commit/7e1c8dfecf6c7705d432e48f0c3a5100adad4f6e))

### BREAKING CHANGES

- **scaffold:** remove `release` command
- **builder:** rename `build` command to `dzbuild` command

# [5.0.0-alpha.17](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.16...v5.0.0-alpha.17) (2024-10-10)

### Features

- **builder:** add `autoDecode` option ([501f6a2](https://github.com/d-zero-dev/frontend-env/commit/501f6a272259381fdb3958733f117bb4ce3808c9))
- **builder:** add `ssi` option ([c52bfc5](https://github.com/d-zero-dev/frontend-env/commit/c52bfc5d6529d584db3afe1eadec1c9d00001e8d))

# [5.0.0-alpha.16](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.15...v5.0.0-alpha.16) (2024-10-09)

### Bug Fixes

- **builder:** fix detection of doctype ([4ea90de](https://github.com/d-zero-dev/frontend-env/commit/4ea90de41238bf65b29afa740847614cb4813e0b))
- **builder:** fix to prevent deletion of index.html ([deaf2dc](https://github.com/d-zero-dev/frontend-env/commit/deaf2dc6e58841dc4ba45d0c16dea5325446650e))
- **builder:** support non-TS scripts ([d463dad](https://github.com/d-zero-dev/frontend-env/commit/d463dad065b5e90b1d9ffb70d01abd7ef961e429))
- **scaffold:** add `--fix` option to lint commands ([78208e3](https://github.com/d-zero-dev/frontend-env/commit/78208e3bb482391c5e3fea2eb44c2447fb8f1a0f))

### Features

- **builder:** add `pathTransformRouter` feature ([24f538c](https://github.com/d-zero-dev/frontend-env/commit/24f538c39e3751c36dc4c81607dd2f2e8f33f9ba))
- **builder:** support ESM configuration ([65cde74](https://github.com/d-zero-dev/frontend-env/commit/65cde74acc00e7595606da3f28e02aafb4f66dfc))
- **builder:** support Prettier options ([b5dc432](https://github.com/d-zero-dev/frontend-env/commit/b5dc4323b936324d51878750e1c1e33d25462829))
- **builder:** update 11ty v3.0.0 ([6da098a](https://github.com/d-zero-dev/frontend-env/commit/6da098a389c90db71a3b289287cf1cc5d0b2a513))
- **postcss:** replace `postcss-color-function` with `postcss-color-mod-function` ([0dc805e](https://github.com/d-zero-dev/frontend-env/commit/0dc805e45b93c07ee2232a6898dcb30048708816))

### BREAKING CHANGES

- **postcss:** use `color-mod()` instead of `color()`
- **builder:** support ESM configuration only
- **builder:** update 11ty

# [5.0.0-alpha.15](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.14...v5.0.0-alpha.15) (2024-10-01)

### Bug Fixes

- **builder:** apply `pathFormat` option ([89b2bc7](https://github.com/d-zero-dev/frontend-env/commit/89b2bc7cfe5cd76f88769d5ae46a213ee5a30e27))
- **builder:** fix to output from paths ([ccfa0f5](https://github.com/d-zero-dev/frontend-env/commit/ccfa0f5f7a3cc9be89d53ad9d00627295a162adc))

### Features

- **builder:** html-minifier-terserで設定したhtmlの変換をローカルサーバーでも確認できるようにする ([2c129aa](https://github.com/d-zero-dev/frontend-env/commit/2c129aa67fb4a62990b74b767e500569275179b1))

# [5.0.0-alpha.14](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.13...v5.0.0-alpha.14) (2024-07-31)

### Features

- **builder:** css,js,画像ファイルのアウトプット先ディレクトリを指定できるようにする ([bd6028b](https://github.com/d-zero-dev/frontend-env/commit/bd6028b501c872e5667878b754f48938db39e130))

# [5.0.0-alpha.13](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.12...v5.0.0-alpha.13) (2024-07-22)

### Features

- **builder:** add to support to build multiple CSS ([94dcb2c](https://github.com/d-zero-dev/frontend-env/commit/94dcb2c3aff6e06ad093b2bf07a57c3a2fc7599a))

# [5.0.0-alpha.12](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.11...v5.0.0-alpha.12) (2024-07-05)

### Bug Fixes

- **scaffold:** fix ignore path within lint-staged ([c62c532](https://github.com/d-zero-dev/frontend-env/commit/c62c5327bd7f142960950fbe4300905301d34a6f))

# [5.0.0-alpha.11](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.10...v5.0.0-alpha.11) (2024-07-05)

### Bug Fixes

- **repo:** fix deprecated husky command on prepare script ([d72833b](https://github.com/d-zero-dev/frontend-env/commit/d72833bcc90cdf3abb649a5e865551fadccf72ee))
- **scaffold:** fix to ignore `htdocs` on lint staged process ([8292cc9](https://github.com/d-zero-dev/frontend-env/commit/8292cc90098076ad613c33162610e8536bd89ff7))

### Features

- **scaffold:** 301_form_confirmテンプレートに「入力画面に戻る」ボタンを追加 ([7aa3614](https://github.com/d-zero-dev/frontend-env/commit/7aa3614ffd8f1e7cebe64c97428c0d830f9abb70))
- **scaffold:** add `@d-zero/component` stylelint rule ([7c42f10](https://github.com/d-zero-dev/frontend-env/commit/7c42f10fc01edf42082844c5334447025cc81bda))
- **scaffold:** huskyの追加 ([7f485dc](https://github.com/d-zero-dev/frontend-env/commit/7f485dcb28cfaf5ff78eec9e93bcd0a56ff52b95))

# [5.0.0-alpha.10](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.9...v5.0.0-alpha.10) (2024-06-11)

### Bug Fixes

- **scaffold:** 生成ファイルや静的ファイルがリント対象となっていたため除外設定を追加 ([0938636](https://github.com/d-zero-dev/frontend-env/commit/0938636ec260337914eaa4d0ab98aead709164fc))
- **scaffold:** 文字選択の背景色が表示できない設定になっていたので削除 ([5b7a559](https://github.com/d-zero-dev/frontend-env/commit/5b7a559adb103a868901cfe7ab8dc7ef2f5d5e12))

### Features

- **scaffold:** リセットを`destyle.css`に変更 ([10f05c7](https://github.com/d-zero-dev/frontend-env/commit/10f05c79f54b41114c3d26194ad1ba84b15fd61d))

# [5.0.0-alpha.9](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2024-06-10)

### Bug Fixes

- **builder:** inline-scriptが削除できない問題を修正 ([1eef9ba](https://github.com/d-zero-dev/frontend-env/commit/1eef9ba083aed28ebf19a5d237b413765f8e7fc8))
- **builder:** pugがコピーされない実験用コードが残っていたため削除 ([0dee05c](https://github.com/d-zero-dev/frontend-env/commit/0dee05ca3881e66c3640ccbb6dd3d2dcbf36ca70))

### Features

- **builder:** `empty`ファイルをコピーしないように変更 ([218c0c1](https://github.com/d-zero-dev/frontend-env/commit/218c0c160dfe0de6952d58a960fb37292a17ad9a))
- **builder:** `publicDir`を`eleventyConfig.addGlobalData`に設定できるように追加 ([26e2740](https://github.com/d-zero-dev/frontend-env/commit/26e2740c8df32cc60cb4e407fe4cfc20919a7e5a))
- **builder:** 静的ファイルフォルダを`[@static](https://github.com/static)`として定義 ([c9668c2](https://github.com/d-zero-dev/frontend-env/commit/c9668c2f6b5de991e3fec5fbf684c27b264a52ed))
- **scaffold:** `[@static](https://github.com/static)`フォルダを空フォルダとして予め準備 ([7fe485b](https://github.com/d-zero-dev/frontend-env/commit/7fe485b2ef4d5a13e23e494c1d2c5422ef3fdc3b))

# [5.0.0-alpha.8](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2024-05-23)

### Bug Fixes

- **builder:** fix stdout first line ([d059f44](https://github.com/d-zero-dev/frontend-env/commit/d059f4479f34378d2ed260d270b10552f4ef6e97))
- **github:** remove build command ([addd137](https://github.com/d-zero-dev/frontend-env/commit/addd137c54d593a73c045eadd743e36263f227eb))

# [5.0.0-alpha.7](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.6...v5.0.0-alpha.7) (2024-05-14)

### Bug Fixes

- **postcss:** fix dependency type ([3e70032](https://github.com/d-zero-dev/frontend-env/commit/3e70032d86f376cc08ec17ec00f5a1c7019d773a))

# [5.0.0-alpha.6](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.5...v5.0.0-alpha.6) (2024-05-14)

### Bug Fixes

- **repo:** fix each version ([50d50ad](https://github.com/d-zero-dev/frontend-env/commit/50d50adc605b700389e2945d03b72c5c4a00495a))

# [5.0.0-alpha.5](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2024-05-14)

### Bug Fixes

- **scaffold:** fix published files ([f35ae2b](https://github.com/d-zero-dev/frontend-env/commit/f35ae2b9c46f14efda206acf518d10bd3b4a582f))

# [5.0.0-alpha.4](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.2...v5.0.0-alpha.4) (2024-05-14)

**Note:** Version bump only for package @d-zero/fontend-env

# [5.0.0-alpha.2](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2024-05-14)

### Bug Fixes

- **create-frontend:** fix to read `.gitignore` safely ([b192aa4](https://github.com/d-zero-dev/frontend-env/commit/b192aa4655413b75ee8830163198f016754277c9))
- **scaffold:** fix to include `.gitignore` in package ([e432294](https://github.com/d-zero-dev/frontend-env/commit/e43229418c0cd7c97100bc421fb277dd53883284))

### Features

- **create-frontend:** transform `package.json` as private package ([d0bcbb5](https://github.com/d-zero-dev/frontend-env/commit/d0bcbb57ecb06d850e826b3fb43781aa6716f1e3))

# 5.0.0-alpha.1 (2024-05-14)

### Features

- **repo:** first commit ([8d3d8e5](https://github.com/d-zero-dev/frontend-env/commit/8d3d8e54ba047d5431b958d7f28af026357a4886))
