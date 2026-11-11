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
	const v8Path = path.join(homeDir, '.huskyrc'); // cspell:disable-line

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

	// 標準的なインストール場所
	const possiblePaths: string[] = [
		// Homebrew などでグローバルインストールした場所
		'/usr/local/bin/volta',
		// Volta のインストーラーが入れる場所
		path.join(homeDir, '.volta', 'bin', 'volta'),
	];

	// PATHからvoltaを探す
	try {
		const foundPath = execSync('which volta', {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		})
			.toString()
			.trim();
		if (foundPath.length > 0 && !possiblePaths.includes(foundPath)) {
			possiblePaths.push(foundPath);
		}
	} catch {
		// PATHにvoltaが無い場合は無視
	}

	// Voltaのホームディレクトリ
	const voltaHome = process.env.VOLTA_HOME || path.join(homeDir, '.volta');

	for (const voltaPath of possiblePaths) {
		if (fs.existsSync(voltaPath)) {
			try {
				const version = execSync(`${voltaPath} --version`, {
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

	const stdout: string[] = [
		'環境チェック結果:',
		'-------------------------',
		'Husky設定:',
		`  v8 (.huskyrc): ${info.huskyConfig.v8Present ? '✅' : '❌'}`, // cspell:disable-line
		`  v9 (.config/husky/init.sh): ${info.huskyConfig.v9Present ? '✅' : '❌'}`,
		...(info.huskyConfig.paths.length > 0
			? ['  発見場所:', ...info.huskyConfig.paths.map((p) => `    - ${p}`)]
			: []),
		'',
		'各バージョン:',
		`  Node.js: ${info.versions.node}`,
		`  npm: ${info.versions.npm}`,
		...(info.versions.yarn ? [`  yarn: ${info.versions.yarn}`] : []),
		'',
		'Volta:',
		`  インストール: ${info.volta.present ? '✅' : '❌'}`,
		...(info.volta.version ? [`  バージョン: ${info.volta.version}`] : []),
		...(info.volta.path ? [`  実行ファイル: ${info.volta.path}`] : []),
		`  ホームディレクトリ: ${info.volta.homeDir}`,
	];

	process.stdout.write(stdout.join('\n'));
}

main();
