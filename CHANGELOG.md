# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-beta.11](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.10...v5.0.0-beta.11) (2025-10-20)

### Features

- **create-frontend:** improve command execution and add volta setup ([e54a526](https://github.com/d-zero-dev/frontend-env/commit/e54a526da7629a9b86fb6d5a53f0aaba72118d9b))

# [5.0.0-beta.10](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.9...v5.0.0-beta.10) (2025-10-20)

### Bug Fixes

- **create-frontend:** correct file extension from .cjs to .js in blocks data path ([b425f76](https://github.com/d-zero-dev/frontend-env/commit/b425f76b9fb51302a0b26f0149407787679f33ac))
- update prettier glob patterns for rc files ([80231cb](https://github.com/d-zero-dev/frontend-env/commit/80231cb5af39cbcbd8c5d4c5d08bb3e5ac80a350))

### Features

- **create-frontend:** add gitignore rewrite functionality ([e2a6e75](https://github.com/d-zero-dev/frontend-env/commit/e2a6e75ad6d58416cee8b35642ccdc542532ab73))
- **create-frontend:** add library copying functionality for baserCMS projects ([8e73300](https://github.com/d-zero-dev/frontend-env/commit/8e73300a730aa7dcdcc2f19bb57b99eb5f4d561c))
- **create-frontend:** update project type options and remove unused blocks.html ([b003628](https://github.com/d-zero-dev/frontend-env/commit/b00362847c11493ab14f8c87c01f9577563f2e07))
- **scaffold:** add baserCMS-specific meta template and conditional inclusion ([885fe35](https://github.com/d-zero-dev/frontend-env/commit/885fe352ecb692cd1ccf3ca4ee1d82749193a60d))

# [5.0.0-beta.9](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.8...v5.0.0-beta.9) (2025-10-05)

- feat(builder)!: support multiple root elements in DOM serialization ([b00904c](https://github.com/d-zero-dev/frontend-env/commit/b00904c83995386f46712e5e0e0f681bf17f01e6))

### BREAKING CHANGES

- afterSerialize hook now receives

elements array as first parameter instead of window object

# [5.0.0-beta.8](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.7...v5.0.0-beta.8) (2025-10-05)

### Bug Fixes

- **builder:** execute replace option during serve mode ([600a73a](https://github.com/d-zero-dev/frontend-env/commit/600a73a8641f8dc85dcba99907d26bb6ecca4fe7))

### Features

- **builder:** enable pug template caching for better performance ([ce01ff2](https://github.com/d-zero-dev/frontend-env/commit/ce01ff2e0daadb24dd59b15e344931a12ac063f4))

# [5.0.0-beta.7](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.6...v5.0.0-beta.7) (2025-10-03)

### Features

- **builder:** add --clear-cache option to CLI ([a09aa0b](https://github.com/d-zero-dev/frontend-env/commit/a09aa0b304a7c693a2b856314a39ffa25f35141e))
- **builder:** add clearAllContentCache function ([d434ed8](https://github.com/d-zero-dev/frontend-env/commit/d434ed887ea44aa59cba4931f20dc8ff193fa789))
- **builder:** add content cache functionality ([91c231d](https://github.com/d-zero-dev/frontend-env/commit/91c231d1d1608b24a5c2a0115e31ea2e99fabfaf))
- **builder:** integrate content cache into domSerialize ([e21548d](https://github.com/d-zero-dev/frontend-env/commit/e21548d51240cfdbe9083e7723d2dfbcd20eb1ff))
- **builder:** integrate content cache into html plugin ([7329bb3](https://github.com/d-zero-dev/frontend-env/commit/7329bb3e05b65ea220f1116b63d79bafb3eb31f0))

# [5.0.0-beta.6](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.5...v5.0.0-beta.6) (2025-10-03)

### Bug Fixes

- **scaffold:** filter empty strings in breadcrumb depth calculation ([02d5ffc](https://github.com/d-zero-dev/frontend-env/commit/02d5ffc7935b055d22fbb9dbf0cf2ee7767fc60a))

### Features

- **builder:** add early return for preserve path format ([76cebc0](https://github.com/d-zero-dev/frontend-env/commit/76cebc0fad551e6d87eea04297f2fca8ef03e286))

# [5.0.0-beta.5](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.4...v5.0.0-beta.5) (2025-09-17)

### Bug Fixes

- **scaffold:** add dotenv ([f9e09fb](https://github.com/d-zero-dev/frontend-env/commit/f9e09fbc1e32f99dd0529b5fba40cc8c205471cb))
- **scaffold:** add missing dotenv dependency ([79abde5](https://github.com/d-zero-dev/frontend-env/commit/79abde5199f9f5bca2cd7d8a5b4e96f53e14a2f8))
- **scaffold:** remove unnecessary async keyword from breadcrumbs function ([2e1e11f](https://github.com/d-zero-dev/frontend-env/commit/2e1e11f29face454705de7b359ab1bc598c549cf))
- **scaffold:** use rel="icon" for favicon ([af6c9e8](https://github.com/d-zero-dev/frontend-env/commit/af6c9e83c2bd2b454bf54745de0b8275063450d5))

### Features

- **builder:** change default permalink ([0c17797](https://github.com/d-zero-dev/frontend-env/commit/0c17797dc4a16cbba684e99cf976db7699f99dc8))
- **scaffold:** add dynamic breadcrumb generation ([4816002](https://github.com/d-zero-dev/frontend-env/commit/4816002823cb0698cac60858db26bffe081ab8e0))
- **scaffold:** add dynamic title generation using breadcrumbs ([39fd107](https://github.com/d-zero-dev/frontend-env/commit/39fd1076cd7d722bb97942751bc6f65826f93c1a))
- **scaffold:** update c-title-page component ([77d8bbe](https://github.com/d-zero-dev/frontend-env/commit/77d8bbe534392b1ae2bd82ea0e0da02287f32ff0))
- **scaffold:** update layout and template files ([6f95978](https://github.com/d-zero-dev/frontend-env/commit/6f9597865bf66e9d8f336a4e5e9db0462953116b))
- **scaffold:** update meta mixin, sample page and package config ([f97f141](https://github.com/d-zero-dev/frontend-env/commit/f97f1416ddd2053cdfab38823fe66adfdf3ef5f9))
- **scaffold:** update template data with Japanese titles ([7c60679](https://github.com/d-zero-dev/frontend-env/commit/7c606797db4a94b527de69b3ec79980fed275f61))

# [5.0.0-beta.4](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.3...v5.0.0-beta.4) (2025-08-14)

### Bug Fixes

- **scaffold:** update burger-editor config and sample file format ([e45030d](https://github.com/d-zero-dev/frontend-env/commit/e45030d19b8adbc63ad4aef4d8abb42dcf84aff1))
- **scaffold:** update CSS to use logical properties and fix formatting ([d2339db](https://github.com/d-zero-dev/frontend-env/commit/d2339db25cd4f227a1476af4b533b69d39c0ccb3))

### Features

- **builder:** change layouts directory to \_libs/layouts ([6e9b5f0](https://github.com/d-zero-dev/frontend-env/commit/6e9b5f016b4594cae0195c2f1aa67c6d222f0aa7))
- **builder:** resolve prettier config automatically for HTML formatting ([b071f9d](https://github.com/d-zero-dev/frontend-env/commit/b071f9dc93cd0b9859bdad70929aa09dea281a39))
- **scaffold:** add 11ty layout files ([fafeb55](https://github.com/d-zero-dev/frontend-env/commit/fafeb557c47d372a3037c94d5d093873ad47b84a))
- **scaffold:** add sample page for static file production ([f2cacbd](https://github.com/d-zero-dev/frontend-env/commit/f2cacbdf90c237aa7dc80e7bae2a8b80c8732088))
- **scaffold:** enable prettier by default in eleventy config ([ba539bd](https://github.com/d-zero-dev/frontend-env/commit/ba539bd0228fc86a0e126bd48cd04df41da91f3d))
- **scaffold:** integrate lint check into build process ([9c99c22](https://github.com/d-zero-dev/frontend-env/commit/9c99c22eeb986ed07a774e82467c82e1403da1fe))
- **scaffold:** update burger-editor dependencies to 4.0.0-alpha.14 ([3bec3a5](https://github.com/d-zero-dev/frontend-env/commit/3bec3a594af622aff826cd3c9ef29704ad95306b))

# [5.0.0-beta.3](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.2...v5.0.0-beta.3) (2025-07-11)

### Features

- **builder:** restore SASS compilation functionality as hidden feature ([f4deb58](https://github.com/d-zero-dev/frontend-env/commit/f4deb58094fb87ef8ab130c4574e497e0addac39))

# [5.0.0-beta.2](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.1...v5.0.0-beta.2) (2025-07-11)

### Features

- **scaffold:** introduce @burger-editor/local for local development ([1524937](https://github.com/d-zero-dev/frontend-env/commit/15249370d68aeeb9c5b20d7c29dd4c8dfc0d000e))

# [5.0.0-beta.1](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-beta.0...v5.0.0-beta.1) (2025-07-01)

### Bug Fixes

- **builder:** resolve npm packages starting with @ symbol ([d2f0817](https://github.com/d-zero-dev/frontend-env/commit/d2f0817e7c3295e2790ecfceb383c989947aba5b))
- **builder:** update eslint rule from import to import-x ([2a71dbf](https://github.com/d-zero-dev/frontend-env/commit/2a71dbfb2b1343641db0857c12ac49b56d0fb84f))

### Features

- **scaffold:** add CSS layer structure and burger-editor integration ([89b4fa6](https://github.com/d-zero-dev/frontend-env/commit/89b4fa63209e43a130d592f729962b1a4a2876ca))

# [5.0.0-beta.0](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.46...v5.0.0-beta.0) (2025-06-20)

### Bug Fixes

- resolve Yarn v4 compatibility issues in tests ([c83d417](https://github.com/d-zero-dev/frontend-env/commit/c83d4172356b816133eb0e2bb30da30f5cf42083))
- **scaffold:** remove independent yarn.lock for workspace consistency ([3099cf7](https://github.com/d-zero-dev/frontend-env/commit/3099cf71c16b2828a092c2e32ba15f0479a1ad66))
- **scaffold:** replace SCSS comments with CSS comments in component styles ([ff1345f](https://github.com/d-zero-dev/frontend-env/commit/ff1345fb0fd219c00ca956e4dc7f00705d03c95f))

### Features

- **builder:** add CSS compiler with minification support ([e260d0a](https://github.com/d-zero-dev/frontend-env/commit/e260d0a958bcde62bdebcb81fe93d54ff1e6e562))
- **postcss:** add postcss-extend-rule plugin and migrate to ES imports ([b0fe263](https://github.com/d-zero-dev/frontend-env/commit/b0fe263007898beeae347e1501ca0cdbbb8f8639))
- **repo:** add release:beta:latest script ([5c904d0](https://github.com/d-zero-dev/frontend-env/commit/5c904d06cdcca6a84e5eff7ae91cf3277cbc0ae8))
- **scaffold:** add `print` command ([355a71a](https://github.com/d-zero-dev/frontend-env/commit/355a71a89a7c404d5483e05ca6a38dedb464f5d4))
- **scaffold:** リセットCSSにdestyle.cssからkiso.cssを採用 ([c2ed37d](https://github.com/d-zero-dev/frontend-env/commit/c2ed37dc628c8d97278117a9ff8bc831e2544698))

### Reverts

- Revert "chore(repo): migrate to Yarn v4" ([d9d6623](https://github.com/d-zero-dev/frontend-env/commit/d9d66235d04bc0b7c423a9d2a0678bfedd6022b3))

### BREAKING CHANGES

- **scaffold:** destyle.cssを廃止

# [5.0.0-alpha.46](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.45...v5.0.0-alpha.46) (2025-05-19)

### Bug Fixes

- **builder:** rename tsc script to build ([cd535c3](https://github.com/d-zero-dev/frontend-env/commit/cd535c375c3a7a47e66e5e85994a8a606dbf008d))
- **github:** update CI compile step to use yarn build ([229b911](https://github.com/d-zero-dev/frontend-env/commit/229b9112d4b7a521c3ad3ec981c9e624cdd10233))
- **repo:** exclude dist and storybook-static directories from linting ([2e19fa0](https://github.com/d-zero-dev/frontend-env/commit/2e19fa0cdb5daab89c566b52d9cede517b053c5f))

### Features

- **builder:** add HTML extension customization feature ([42b8fde](https://github.com/d-zero-dev/frontend-env/commit/42b8fdef30de00d4d8fb070fa1cef9a24d8f1fd9))
- **builder:** add HTML hooks functionality for custom processing ([6698f58](https://github.com/d-zero-dev/frontend-env/commit/6698f58832b678197aa60a2b6eab5cf8c5f1afed))
- **builder:** add isServe flag to HTML hooks ([9126ae1](https://github.com/d-zero-dev/frontend-env/commit/9126ae1c59fe5885b3f83a495d9eb3f2f3880152))
- **builder:** expose window object in dom-serialize hook ([b3750b7](https://github.com/d-zero-dev/frontend-env/commit/b3750b77c74d2f8e055fdfed6f85c02a87590731))
- **custom-components:** add Breadcrumbs component ([18ca2a5](https://github.com/d-zero-dev/frontend-env/commit/18ca2a558309403f31fe6a7c129f23cc78c503e6))
- **scaffold:** add ai tasks and enhance rules ([db109a8](https://github.com/d-zero-dev/frontend-env/commit/db109a8d268dee572431d1865d870a5bb30c7193))

# [5.0.0-alpha.45](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.44...v5.0.0-alpha.45) (2025-04-11)

### Bug Fixes

- **custom-components:** adjust hamburger-menu button styles ([2e31071](https://github.com/d-zero-dev/frontend-env/commit/2e31071cfc9bbb9e02e0598fbd0a639f539451a1))

### Features

- **custom-components:** add `custom-components` ([1eb7b04](https://github.com/d-zero-dev/frontend-env/commit/1eb7b04b12d0aeec457a32e8c2b398374b8bca89))
- **scaffold:** clinerulesの改善 ([154348b](https://github.com/d-zero-dev/frontend-env/commit/154348bbd6e59adc60a0d43fc404de3225665c82))
- **scaffold:** remove SASS variables and theme files ([f48f60f](https://github.com/d-zero-dev/frontend-env/commit/f48f60f243b19ad7aac704f59fb473eb3842b568))

### BREAKING CHANGES

- **scaffold:** remove SASS variables

# [5.0.0-alpha.44](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.43...v5.0.0-alpha.44) (2025-03-12)

### Features

- **scaffold:** add dialog and invokers polyfills ([eee8c7b](https://github.com/d-zero-dev/frontend-env/commit/eee8c7bf8fecbe6eb10b5e4a5ddee0dce7421988))

# [5.0.0-alpha.43](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.42...v5.0.0-alpha.43) (2025-03-12)

### Features

- **scaffold:** add AI prompt behavior and coding guidelines ([522752f](https://github.com/d-zero-dev/frontend-env/commit/522752f171d2afad212cedd5ffbfd68098ab0e57))

# [5.0.0-alpha.42](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.41...v5.0.0-alpha.42) (2025-03-06)

### Bug Fixes

- **builder:** update image-size v2 retrieval to use async function and improve type handling ([7d65c2e](https://github.com/d-zero-dev/frontend-env/commit/7d65c2e79b22f23611544742c2b67080a12b02be))
- **scaffold:** update .gitignore to reflect correct temporary directory ([aa17c0c](https://github.com/d-zero-dev/frontend-env/commit/aa17c0caee9c01792b9ef15de78ce50919ce5b78))

### Features

- **create-frontend:** add pattern for test files in plop configuration ([97e1f1e](https://github.com/d-zero-dev/frontend-env/commit/97e1f1e36f43cc98cadf18c71d304290fac74bce))

# [5.0.0-alpha.41](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.40...v5.0.0-alpha.41) (2025-03-03)

**Note:** Version bump only for package @d-zero/fontend-env

# [5.0.0-alpha.40](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.39...v5.0.0-alpha.40) (2025-03-03)

### Features

- **builder:** add option `outDir` ([a3d0843](https://github.com/d-zero-dev/frontend-env/commit/a3d0843afd50db2305661a65a863c0c9fa2223fd))

# [5.0.0-alpha.39](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.38...v5.0.0-alpha.39) (2025-02-12)

**Note:** Version bump only for package @d-zero/fontend-env

# [5.0.0-alpha.38](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.37...v5.0.0-alpha.38) (2025-02-05)

**Note:** Version bump only for package @d-zero/fontend-env

# [5.0.0-alpha.37](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.36...v5.0.0-alpha.37) (2025-02-03)

### Bug Fixes

- **scaffold:** .bge-contentsクラス名のsが抜けていたので修正 ([c9b4757](https://github.com/d-zero-dev/frontend-env/commit/c9b4757e16aa35178883fed8e8e0fb5a34b24c90))
- **scaffold:** 301_form_confirmテンプレートの最初の.cc-form-fieldset直下にdiv要素追加 ([32aba92](https://github.com/d-zero-dev/frontend-env/commit/32aba92639dacae38579c5a5e3b0966de57a97d0))
- **scaffold:** bge-style.scssのファイル名を変更 ([071dc15](https://github.com/d-zero-dev/frontend-env/commit/071dc15ae0647455bb25f707c6edf537c89e2058))
- **scaffold:** bge-style.scssのファイル名変更に伴う周辺処理の更新 ([bcca3a1](https://github.com/d-zero-dev/frontend-env/commit/bcca3a18d560694da914b207c01b9309c184ef39))

### Features

- **scaffold:** componentsレイヤーの廃止 ([024eda3](https://github.com/d-zero-dev/frontend-env/commit/024eda3e417396b0f33637f6803f346c822503dd))
- **scaffold:** componentsレイヤーの廃止 ([1339a56](https://github.com/d-zero-dev/frontend-env/commit/1339a565655d8ed6e168dc6eb790a2d21b543718))

### BREAKING CHANGES

- **scaffold:** componentsレイヤーの廃止
- **scaffold:** componentsレイヤーの廃止

# [5.0.0-alpha.36](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.35...v5.0.0-alpha.36) (2025-01-06)

### Bug Fixes

- **scaffold:** fix markuplint config ([e302169](https://github.com/d-zero-dev/frontend-env/commit/e302169a04d5e45afe0b5f6b3b080846e9fe496b))

# [5.0.0-alpha.35](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.34...v5.0.0-alpha.35) (2024-12-23)

### Bug Fixes

- **builder:** fix to strip CSS comments on no-minify ([c7a1f05](https://github.com/d-zero-dev/frontend-env/commit/c7a1f055202f4bfe04b86c5972dc3e75c0c67005))

# [5.0.0-alpha.34](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.33...v5.0.0-alpha.34) (2024-12-16)

### Features

- **builder:** add `banner` option ([1f56212](https://github.com/d-zero-dev/frontend-env/commit/1f5621292e39f7ca4d124913209c16330758478a))
- **builder:** add `createBanner` API ([513a45c](https://github.com/d-zero-dev/frontend-env/commit/513a45c7d099ac4791eec7e3786c5657fe37a4b9))

# [5.0.0-alpha.33](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.32...v5.0.0-alpha.33) (2024-12-10)

### Features

- **builder:** add `characterEntities` option ([4db7534](https://github.com/d-zero-dev/frontend-env/commit/4db7534e439c13bcfad6577973667ee4cec6d653))

# [5.0.0-alpha.32](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.31...v5.0.0-alpha.32) (2024-12-10)

### Features

- **scaffold:** update eslint config to flat ([c423fab](https://github.com/d-zero-dev/frontend-env/commit/c423fabe7f0cbd1240ef533cb6e657aef94f6e7a))
- **scaffold:** クラス名をMarkuplintに追加しやすいようにコンフィグファイルを改善 ([33dc4c8](https://github.com/d-zero-dev/frontend-env/commit/33dc4c89a4c02bc0a34779d7eda1ca14528de4eb))

# [5.0.0-alpha.31](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.30...v5.0.0-alpha.31) (2024-11-06)

### Bug Fixes

- **builder:** remove `console.log` ([df89cd2](https://github.com/d-zero-dev/frontend-env/commit/df89cd27fb6f7b11a7b1c7898e686afe5935ec7d))

# [5.0.0-alpha.30](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.29...v5.0.0-alpha.30) (2024-11-06)

### Features

- **builder:** add `charset.overrides` option ([9afeaaf](https://github.com/d-zero-dev/frontend-env/commit/9afeaaf1591a4f01e11ea82b3344ad118c4d5a4d))
- **builder:** expose declaration type files ([f17e294](https://github.com/d-zero-dev/frontend-env/commit/f17e294223a8adca501dc48155f34dfb76f83176))
- **builder:** improve `charset` type ([741d080](https://github.com/d-zero-dev/frontend-env/commit/741d080da6af3d018ae6a277fe7cf770339ef948))
- **builder:** use custom Pug extension instead of `@11ty/eleventy-plugin-pug` ([df94f82](https://github.com/d-zero-dev/frontend-env/commit/df94f822e551adf770f1d6011db92bdf47794cf4))

# [5.0.0-alpha.29](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.28...v5.0.0-alpha.29) (2024-11-06)

### Bug Fixes

- **builder:** fix publish target files ([60f2905](https://github.com/d-zero-dev/frontend-env/commit/60f290541d01e77a7afee6f1567d90a7f5d3e92c))

# [5.0.0-alpha.28](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.27...v5.0.0-alpha.28) (2024-11-05)

### Bug Fixes

- **builder:** fix condition of external URL ([a104747](https://github.com/d-zero-dev/frontend-env/commit/a1047470ad8b1b905b829115e03a52580331cf48))
- **builder:** fix default boolean of options ([7e1360f](https://github.com/d-zero-dev/frontend-env/commit/7e1360f1d6d27d20254095dacd1d6293dd461d12))
- **builder:** fix DOM serialization ([234f955](https://github.com/d-zero-dev/frontend-env/commit/234f9558f6b7a30b550a37bb858ef61835b46c2b))
- **builder:** support 11ty generated path on dev server ([b61cb2d](https://github.com/d-zero-dev/frontend-env/commit/b61cb2d6b7ea186e24c72573b246439321845ed2))
- **repo:** fix textlint command ([192818d](https://github.com/d-zero-dev/frontend-env/commit/192818d130908a0f1577398d9a0afef4284fba67))

# [5.0.0-alpha.27](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.26...v5.0.0-alpha.27) (2024-10-31)

### Features

- **builder:** add `imageSizes` option ([4ddeab7](https://github.com/d-zero-dev/frontend-env/commit/4ddeab786a6f67dd94378a63be6e84a73cc922bb))

# [5.0.0-alpha.26](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.25...v5.0.0-alpha.26) (2024-10-31)

**Note:** Version bump only for package @d-zero/fontend-env

# [5.0.0-alpha.25](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.24...v5.0.0-alpha.25) (2024-10-29)

### Features

- **create-frontend:** add `--debug` option ([835529e](https://github.com/d-zero-dev/frontend-env/commit/835529e798d634ed75dbb5ec8d7e3e75f58b0fae))
- **create-frontend:** add interactive mode ([e0cf69d](https://github.com/d-zero-dev/frontend-env/commit/e0cf69daca825b26fd490ea0ea6bc10a3f258c58))
- **create-frontend:** add settings for `type=burger` ([b755336](https://github.com/d-zero-dev/frontend-env/commit/b755336b704086adcc67af8111a49a0bcb5b82cd))
- **create-frontend:** add settings for `type=static` ([7298f7e](https://github.com/d-zero-dev/frontend-env/commit/7298f7edbda2cfdf267cd9145686be7cb125587f))
- **scaffold:** add `.bge-content` styles with `bge-style.css` ([081f7ee](https://github.com/d-zero-dev/frontend-env/commit/081f7ee9e03b659ec9b964f0bcb17dee2b3be9ec))
- **scaffold:** add `checkJs=false` to tsconfig ([1fb9ed1](https://github.com/d-zero-dev/frontend-env/commit/1fb9ed1d1d34004748f3fd7c1caeebcc6ade597d))

# [5.0.0-alpha.24](https://github.com/d-zero-dev/frontend-env/compare/v5.0.0-alpha.23...v5.0.0-alpha.24) (2024-10-24)

### Bug Fixes

- **builder:** fix the condition regarding the presence or absence of `doctype` ([4dea2e9](https://github.com/d-zero-dev/frontend-env/commit/4dea2e9296d01a5c018cfbfae554f47d2ea60ce8))

### Features

- **scaffold:** コンポーネントファイル名を`_c-*`から`c-*`に変更 ([ae6d450](https://github.com/d-zero-dev/frontend-env/commit/ae6d4507f37f7f674c8f70026910bf260fc53334))

### BREAKING CHANGES

- **scaffold:** コンポーネントファイル名を`_c-*`から`c-*`に変更

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
