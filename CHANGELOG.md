# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
