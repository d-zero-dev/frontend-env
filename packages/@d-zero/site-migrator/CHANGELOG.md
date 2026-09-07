# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.3.0](https://github.com/d-zero-dev/frontend-env/compare/v5.2.0...v5.3.0) (2026-08-24)

### Bug Fixes

- **site-migrator:** adapt YAML frontmatter dump to js-yaml v5 ([2cfd7ed](https://github.com/d-zero-dev/frontend-env/commit/2cfd7ed89d8e48133d8f0401df10445f9a0b98f6))
- **site-migrator:** resolve TS2345 by aligning puppeteer with anatomist ([1744248](https://github.com/d-zero-dev/frontend-env/commit/17442489397b51e78783393edfad7b3e817d4d79))
- **site-migrator:** set publishConfig access to public for scoped package ([0871fc6](https://github.com/d-zero-dev/frontend-env/commit/0871fc68fe676be0f7852caadaafb749e36df225))

### Features

- **site-migrator:** make package publishable ([7153f73](https://github.com/d-zero-dev/frontend-env/commit/7153f7336433a76e2d7d7572af93c177ba04fd05))

# [5.2.0](https://github.com/d-zero-dev/frontend-env/compare/v5.1.1-alpha.1...v5.2.0) (2026-08-12)

### Bug Fixes

- **site-migrator:** make toNumberOrFallback's fallback param optional ([f8b6c1c](https://github.com/d-zero-dev/frontend-env/commit/f8b6c1c124c4d7bda24ddda12fe0560085f11a6e))
- **site-migrator:** replace function {[@link](https://github.com/link)} refs with backticks in types JSDoc ([6cbdb38](https://github.com/d-zero-dev/frontend-env/commit/6cbdb3807dfea49422fa642785c5ec1ea3751ccf))
- **site-migrator:** wire rewriteBlockRefs into extractPages before renderBlocks ([466a202](https://github.com/d-zero-dev/frontend-env/commit/466a202127dcc21fec2241a368154d2a565f9260))

- feat(site-migrator)!: extract BlockTargetAdapter to decouple BurgerEditor conversion ([68cee5a](https://github.com/d-zero-dev/frontend-env/commit/68cee5aa5e17dbd71989cededb46ea30e6ff466a))
- feat(site-migrator)!: integrate BurgerEditor block conversion into extractPages ([71cd4cb](https://github.com/d-zero-dev/frontend-env/commit/71cd4cb3480cbf48150b1448f662d987f1d70d33))

### Features

- **site-migrator:** add --include option to dz-migrate ([0fc5deb](https://github.com/d-zero-dev/frontend-env/commit/0fc5debd4b417bda96392544553945d9b311b488)), closes [#967](https://github.com/d-zero-dev/frontend-env/issues/967)
- **site-migrator:** add resolveIdTemplate pure function for downstream id token resolution ([a24265f](https://github.com/d-zero-dev/frontend-env/commit/a24265f325e9869891c0adbd32deec3ebd2f85ce))
- **site-migrator:** add website migration toolkit driven by .nitpicker archive ([a053530](https://github.com/d-zero-dev/frontend-env/commit/a0535306a3ca86da5a36e989b3b27684672bf96f))
- **site-migrator:** classify collapsed a/img/iframe blocks via anatomist attributes ([c691161](https://github.com/d-zero-dev/frontend-env/commit/c691161f765203d38baae95b4abeb0c6139860b5)), closes [d-zero-dev/tools#941](https://github.com/d-zero-dev/tools/issues/941)
- **site-migrator:** convert LayoutBlock tree to BurgerEditor BlockData ([40bdd21](https://github.com/d-zero-dev/frontend-env/commit/40bdd2118b11d22bfba5c0b83c99f2f4549a3e1a))
- **site-migrator:** generate BurgerEditor data-bge-* HTML via render() ([3fadb99](https://github.com/d-zero-dev/frontend-env/commit/3fadb991daaee9df1eac5c1f0f7cfe3466a7f3fb))
- **site-migrator:** generate YAML frontmatter from nitpicker DB and prepend to extracted pages ([3a03c6d](https://github.com/d-zero-dev/frontend-env/commit/3a03c6ddb69bf4801a8582275ed6ab2c14bef90f))
- **site-migrator:** reconcile anatomist and extractMainContent main detection ([7bba6bf](https://github.com/d-zero-dev/frontend-env/commit/7bba6bf70406b8cd32560c796d915c930ce316bc)), closes [#976](https://github.com/d-zero-dev/frontend-env/issues/976)
- **site-migrator:** resolve page layout via anatomist JSONL or live analysis ([e24a511](https://github.com/d-zero-dev/frontend-env/commit/e24a511bb5567c9b5e0f8252d413bf575dbb95e7))
- **site-migrator:** rewrite same-origin refs in BurgerEditor block data ([05fb8c3](https://github.com/d-zero-dev/frontend-env/commit/05fb8c3ab5a9d72ec0c20d3281a3a8d8dcfa6d5e)), closes [#979](https://github.com/d-zero-dev/frontend-env/issues/979)
- **site-migrator:** rewrite same-origin URL refs and assign per-page integer ids ([d125c60](https://github.com/d-zero-dev/frontend-env/commit/d125c6031815e7d165307dff5796c3d3c5a828fd))
- **site-migrator:** strip shared layouts from archive page snapshots ([1ac3bda](https://github.com/d-zero-dev/frontend-env/commit/1ac3bda93609596d8bf5fb63c20aec0be0580110))
- **site-migrator:** verify rendered blocks round-trip through parseHTMLToBlockData ([b3dd87e](https://github.com/d-zero-dev/frontend-env/commit/b3dd87ef454d70e1814afe67db6c50b82ddf460c))

### BREAKING CHANGES

- `adapter` is now a required option on `extractPages` and
  `migrate`. Existing callers (including `dz-migrate`) must pass `burgerEditorAdapter`
  explicitly. No migration guide is provided (package is still 5.x-alpha and unused
  by any consumer).
- extractPages/migrate/dz-migrate now require a
  --content-class / contentClass value (no default), since block conversion
  is no longer optional.
