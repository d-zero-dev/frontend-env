# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-alpha.19](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.18...v5.0.0-alpha.19) (2024-10-11)

### Bug Fixes

- **builder:** fix `minifier` option default value ([1864f9d](https://github.com/d-zero-dev/frontend-env/commit/1864f9de0ea2567ccee900228b069e77d692289e))

### Features

- **builder:** change options ([419bc27](https://github.com/d-zero-dev/frontend-env/commit/419bc27b0c65be9b12067eeadeca3de993fb0307))

### BREAKING CHANGES

- **builder:** `@d-zero/builder/11ty`のオプションの受け取りを`addGlobalData`から第2引数に変更

# [5.0.0-alpha.18](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.17...v5.0.0-alpha.18) (2024-10-11)

### Bug Fixes

- **builder:** fix path transforming on request ([efe5644](https://github.com/d-zero-dev/frontend-env/commit/efe5644a79e3ce514fbcfe11b65b8e1ab16c7d6c))

### Features

- **builder:** rename package command name ([b7c5db3](https://github.com/d-zero-dev/frontend-env/commit/b7c5db318287a0db1f7c2a75f4887e6c80951e5e))

### BREAKING CHANGES

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

### Features

- **builder:** add `pathTransformRouter` feature ([24f538c](https://github.com/d-zero-dev/frontend-env/commit/24f538c39e3751c36dc4c81607dd2f2e8f33f9ba))
- **builder:** support ESM configuration ([65cde74](https://github.com/d-zero-dev/frontend-env/commit/65cde74acc00e7595606da3f28e02aafb4f66dfc))
- **builder:** support Prettier options ([b5dc432](https://github.com/d-zero-dev/frontend-env/commit/b5dc4323b936324d51878750e1c1e33d25462829))
- **builder:** update 11ty v3.0.0 ([6da098a](https://github.com/d-zero-dev/frontend-env/commit/6da098a389c90db71a3b289287cf1cc5d0b2a513))

### BREAKING CHANGES

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

**Note:** Version bump only for package @d-zero/builder

# [5.0.0-alpha.11](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.10...v5.0.0-alpha.11) (2024-07-05)

**Note:** Version bump only for package @d-zero/builder

# [5.0.0-alpha.10](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.9...v5.0.0-alpha.10) (2024-06-11)

**Note:** Version bump only for package @d-zero/builder

# [5.0.0-alpha.9](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.8...v5.0.0-alpha.9) (2024-06-10)

### Bug Fixes

- **builder:** inline-scriptが削除できない問題を修正 ([1eef9ba](https://github.com/d-zero-dev/frontend-env/commit/1eef9ba083aed28ebf19a5d237b413765f8e7fc8))
- **builder:** pugがコピーされない実験用コードが残っていたため削除 ([0dee05c](https://github.com/d-zero-dev/frontend-env/commit/0dee05ca3881e66c3640ccbb6dd3d2dcbf36ca70))

### Features

- **builder:** `empty`ファイルをコピーしないように変更 ([218c0c1](https://github.com/d-zero-dev/frontend-env/commit/218c0c160dfe0de6952d58a960fb37292a17ad9a))
- **builder:** `publicDir`を`eleventyConfig.addGlobalData`に設定できるように追加 ([26e2740](https://github.com/d-zero-dev/frontend-env/commit/26e2740c8df32cc60cb4e407fe4cfc20919a7e5a))
- **builder:** 静的ファイルフォルダを`[@static](https://github.com/static)`として定義 ([c9668c2](https://github.com/d-zero-dev/frontend-env/commit/c9668c2f6b5de991e3fec5fbf684c27b264a52ed))

# [5.0.0-alpha.8](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.7...v5.0.0-alpha.8) (2024-05-23)

### Bug Fixes

- **builder:** fix stdout first line ([d059f44](https://github.com/d-zero-dev/frontend-env/commit/d059f4479f34378d2ed260d270b10552f4ef6e97))

# [5.0.0-alpha.7](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.6...v5.0.0-alpha.7) (2024-05-14)

**Note:** Version bump only for package @d-zero/builder

# [5.0.0-alpha.6](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.5...v5.0.0-alpha.6) (2024-05-14)

**Note:** Version bump only for package @d-zero/builder

# [5.0.0-alpha.5](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.4...v5.0.0-alpha.5) (2024-05-14)

**Note:** Version bump only for package @d-zero/builder

# [5.0.0-alpha.4](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.2...v5.0.0-alpha.4) (2024-05-14)

**Note:** Version bump only for package @d-zero/builder

# [5.0.0-alpha.2](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.1...v5.0.0-alpha.2) (2024-05-14)

**Note:** Version bump only for package @d-zero/builder

# 5.0.0-alpha.1 (2024-05-14)

### Features

- **repo:** first commit ([8d3d8e5](https://github.com/d-zero-dev/frontend-env/commit/8d3d8e54ba047d5431b958d7f28af026357a4886))
