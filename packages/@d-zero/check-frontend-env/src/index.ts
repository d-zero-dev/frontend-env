#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

interface EnvironmentInfo {
	huskyConfig: {
		v8Present: boolean;
		v9Present: boolean;
		paths: string[];
	};
	versions: {
		node: string;
		npm: string;
		yarn?: string;
	};
	volta: {
		present: boolean;
		version?: string;
		path?: string;
		homeDir?: string;
	};
}

/**
 * Husky設定をチェックする
 */
function checkHuskyConfig(): EnvironmentInfo['huskyConfig'] {
	const homeDir = os.homedir();
	const v9Path = path.join(homeDir, '.config', 'husky', 'init.sh');
	const v8Path = path.join(homeDir, '.husky');

	return {
		v8Present: fs.existsSync(v8Path),
		v9Present: fs.existsSync(v9Path),
		paths: [v8Path, v9Path].filter((p) => fs.existsSync(p)),
	};
}

/**
 * 各ソフトウェアのバージョンを取得する
 */
function getVersions(): EnvironmentInfo['versions'] {
	const versions: EnvironmentInfo['versions'] = {
		node: process.version,
		npm: execSync('npm --version').toString().trim(),
	};

	try {
		versions.yarn = execSync('yarn --version').toString().trim();
	} catch {
		// yarn is not installed
	}

	return versions;
}

/**
 * Voltaのインストール状況をチェックする
 */
function checkVolta(): EnvironmentInfo['volta'] {
	const homeDir = os.homedir();
	const platform = os.platform();
	const isWindows = platform === 'win32';
	const executableName = isWindows ? 'volta.exe' : 'volta';

	// OS固有の標準的なインストール場所
	const possiblePaths: string[] = isWindows
		? [
				// Windows: %LOCALAPPDATA%\Volta\volta.exe
				...(process.env.LOCALAPPDATA
					? [path.join(process.env.LOCALAPPDATA, 'Volta', executableName)]
					: []),
				// Windows: %USERPROFILE%\.volta\bin\volta.exe
				path.join(homeDir, '.volta', 'bin', executableName),
			]
		: [
				// Unix系: /usr/local/bin/volta (Homebrewなどでグローバルインストール)
				'/usr/local/bin/volta',
				// Unix系: ~/.volta/bin/volta (標準的なインストール場所)
				path.join(homeDir, '.volta', 'bin', 'volta'),
			];

	// PATHからvoltaを探す
	try {
		let commandOutput: string;
		if (isWindows) {
			// Windows: whereコマンドを使用
			commandOutput = execSync('where volta', {
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'ignore'],
			})
				.toString()
				.trim();
		} else {
			// Unix系: whichコマンドを使用
			commandOutput = execSync('which volta', {
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'ignore'],
			})
				.toString()
				.trim();
		}

		// 複数行の結果がある場合（Windowsのwhereは複数のパスを返すことがある）
		const paths = commandOutput
			.split('\n')
			.map((p) => p.trim())
			.filter((p) => p.length > 0);

		for (const foundPath of paths) {
			if (!possiblePaths.includes(foundPath)) {
				possiblePaths.push(foundPath);
			}
		}
	} catch {
		// which/whereコマンドが失敗した場合は無視
	}

	// Voltaのホームディレクトリ
	const voltaHome = process.env.VOLTA_HOME || path.join(homeDir, '.volta');

	for (const voltaPath of possiblePaths) {
		if (fs.existsSync(voltaPath)) {
			try {
				// Windowsでは実行ファイルパスをクォートする必要がある場合がある
				const command = isWindows ? `"${voltaPath}" --version` : `${voltaPath} --version`;
				const version = execSync(command, {
					encoding: 'utf8',
					stdio: ['ignore', 'pipe', 'ignore'],
				})
					.toString()
					.trim();
				return {
					present: true,
					version,
					path: voltaPath,
					homeDir: voltaHome,
				};
			} catch {
				// 実行権限がない場合など
				continue;
			}
		}
	}

	return {
		present: false,
		homeDir: voltaHome,
	};
}

/**
 * メイン処理
 */
function main() {
	const info: EnvironmentInfo = {
		huskyConfig: checkHuskyConfig(),
		versions: getVersions(),
		volta: checkVolta(),
	};

	console.log('環境チェック結果:');
	console.log('-------------------------');
	console.log('Husky設定:');
	console.log(`  v8 (.huskyrc): ${info.huskyConfig.v8Present ? '✅' : '❌'}`); // cspell:disable-line
	console.log(
		`  v9 (.config/husky/init.sh): ${info.huskyConfig.v9Present ? '✅' : '❌'}`,
	);
	if (info.huskyConfig.paths.length > 0) {
		console.log('  発見場所:');
		for (const p of info.huskyConfig.paths) console.log(`    - ${p}`);
	}

	console.log('\n各バージョン:');
	console.log(`  Node.js: ${info.versions.node}`);
	console.log(`  npm: ${info.versions.npm}`);
	if (info.versions.yarn) {
		console.log(`  yarn: ${info.versions.yarn}`);
	}

	console.log('\nVolta:');
	console.log(`  インストール: ${info.volta.present ? '✅' : '❌'}`);
	if (info.volta.version) {
		console.log(`  バージョン: ${info.volta.version}`);
	}
	if (info.volta.path) {
		console.log(`  実行ファイル: ${info.volta.path}`);
	}
	console.log(`  ホームディレクトリ: ${info.volta.homeDir}`);
}

// テスト用にエクスポート
export const volta = {
	checkVolta,
};

export const husky = {
	checkHuskyConfig,
};

export const versions = {
	getVersions,
};

export const utils = {
	main,
};

// CLIとして直接実行された場合のみmainを実行
const isCli =
	process.argv[1] &&
	(process.argv[1].endsWith('check-frontend-env') ||
		process.argv[1].endsWith('index.js') ||
		import.meta.url === `file://${process.argv[1]}`);

if (isCli) {
	main();
}
