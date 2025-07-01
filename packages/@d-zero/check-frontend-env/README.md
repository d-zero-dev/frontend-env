# @d-zero/check-frontend-env

Check Frontend Environment for D-ZERO

フロントエンド開発環境のチェックツールです。Node.js、npm、yarn、Husky、Voltaのインストール状況とバージョンを確認できます。

## Installation

```bash
npm install @d-zero/check-frontend-env
```

## Usage

### CLI として使用

```bash
# 環境チェックを実行
npx check-frontend-env

# Voltaのインストールテストを実行
npx check-frontend-env --test
```

### プログラムとして使用

```typescript
import { volta } from '@d-zero/check-frontend-env';

// Voltaのインストール状況をチェック
const voltaInfo = volta.checkVolta();
console.log('Volta installed:', voltaInfo.present);
console.log('Version:', voltaInfo.version);

// Voltaのインストールテストを実行
const isInstalled = volta.testVoltaInstallation();
if (isInstalled) {
	console.log('✅ Volta is properly installed');
} else {
	console.log('❌ Volta is not installed or has issues');
}
```

## チェック項目

- **Husky設定**: v8とv9の両方のバージョンの設定ファイルを確認
- **Node.js**: 現在のバージョンを表示
- **npm**: 現在のバージョンを表示
- **yarn**: インストールされている場合のバージョンを表示
- **Volta**: インストール状況、バージョン、実行ファイルの場所を確認

## Testing

### ローカルテスト

```bash
# 依存関係をインストール
yarn install

# ビルド
yarn build

# ユニットテストを実行
yarn test

# Voltaインストールテストを実行
yarn test:volta
```

### GitHub Actions

このパッケージは[volta-cli/action](https://github.com/volta-cli/action)を使用してGitHub Actionsでテストされます。

テストは以下の環境で実行されます：

- **OS**: Ubuntu、macOS、Windows
- **Volta**: 1.1.1、latest

## License

MIT
