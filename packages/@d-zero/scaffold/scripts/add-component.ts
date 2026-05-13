import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { loadScaffdog } from 'scaffdog';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htdocsDir = path.resolve(packageRoot, '__assets/htdocs');

const targetCssFiles = ['css/style.css'];

const { values } = parseArgs({
	options: { name: { type: 'string', short: 'n' } },
});

const name = values.name;
if (!name) {
	process.stderr.write('使い方: yarn add-component --name <コンポーネント名>\n');
	process.exit(1);
}

const scaffdog = await loadScaffdog(path.resolve(packageRoot, '.scaffdog'));
const documents = await scaffdog.list();
const document = documents.find((d) => d.name === 'component');
if (!document) {
	process.stderr.write('エラー: component テンプレートが見つかりませんでした\n');
	process.exit(1);
}

const files = await scaffdog.generate(
	document,
	path.resolve(packageRoot, '__assets/_libs'),
	{
		inputs: { name },
	},
);

for (const file of files) {
	if (!file.skip) writeFileSync(file.path, file.content);
	process.stdout.write(`生成: ${file.path}\n`);
}

const importLine = `@import '@/component/c-${name}.css' layer(component);`;
const componentRe = /^@import '@\/component\/[^']+' layer\(component\);$/;

for (const cssFile of targetCssFiles) {
	const cssPath = path.resolve(htdocsDir, cssFile);
	const lines = readFileSync(cssPath, 'utf8').split('\n');

	if (lines.includes(importLine)) {
		process.stdout.write(`スキップ (${cssPath}): "${importLine}" はすでに存在します\n`);
		continue;
	}

	const lastComponentIdx = lines.findLastIndex((l) => componentRe.test(l));
	if (lastComponentIdx === -1) {
		process.stderr.write(
			`エラー (${cssPath}): 既存の component import が見つからないため挿入位置を特定できませんでした\n`,
		);
		process.exit(1);
	}

	lines.splice(lastComponentIdx + 1, 0, importLine);
	writeFileSync(cssPath, lines.join('\n'), 'utf8');
	process.stdout.write(`追加 (${cssPath}): ${importLine}\n`);
}
