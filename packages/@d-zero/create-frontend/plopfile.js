import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { argv } from 'node:process';

import prettierConfig from '@d-zero/prettier-config/base';
import ignore from 'ignore';
import { generateCode, parseModule } from 'magicast';
import meow from 'meow';
import { minimatch } from 'minimatch';
import { format as prettierFormat } from 'prettier';

import { command } from './command.js';
import { copyLibraries } from './libraries.js';
import { t } from './locale.js';
import { readFileSafe } from './read-file-safe.js';
import { voltaInstallNode } from './volta-install-node.js';

const cli = meow(
	`
	Usage
	  $ yarn create @d-zero/frontend
	  or
	  $ npx @d-zero/create-frontend

	Options
	  --type, -t             Specify the type of project. Then, no interactive mode will be shown.
	  --dir,  -d             Specify the destination directory. Default is the current directory.
	  --ignore-document-root Ignore document root files in .gitignore. Use --no-ignore-document-root to track them. Default is true.
	  --install              Install dependencies with yarn after scaffolding.

	Examples
	  $ yarn create @d-zero/frontend
	  $ yarn create @d-zero/frontend --type cms --dir ./my-cms --install

	Note
	  Running the command without any options will start in interactive mode, allowing you to configure the project step-by-step.
`,
	{
		importMeta: import.meta,
		flags: {
			type: {
				type: 'string',
				shortFlag: 't',
				default: 'static',
			},
			dir: {
				type: 'string',
				shortFlag: 'd',
				default: '.',
			},
			install: {
				type: 'boolean',
				default: true,
			},
			ignoreDocumentRoot: {
				type: 'boolean',
				default: true,
			},
			debug: {
				type: 'boolean',
				default: false,
			},
		},
	},
);

/**
 * Recursively get all files in a directory
 * @param {string} dir - Directory to search
 * @param {string} rootDir - Root directory for relative paths
 * @returns {Promise<string[]>} Array of relative file paths
 */
async function getAllFiles(dir, rootDir) {
	const files = [];
	const entries = await fsp.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relativePath = path.relative(rootDir, fullPath);

		if (entry.isDirectory()) {
			const subFiles = await getAllFiles(fullPath, rootDir);
			files.push(...subFiles);
		} else {
			files.push(relativePath);
		}
	}

	return files;
}

/**
 * @param {import('plop').NodePlopAPI} plop
 */
export default async function (plop) {
	const scaffoldDir = path.normalize(
		path.dirname(import.meta.resolve('@d-zero/scaffold').replace('file:', '')),
	);

	const gitignoreOriginContent =
		readFileSafe(path.resolve(scaffoldDir, '.gitignore')) ?? '';
	const ignoreFiles = gitignoreOriginContent?.split('\n').filter(Boolean) ?? [];
	const hasArgs = argv.length > 2;
	const interactive = !hasArgs;

	const ig = ignore()
		// Ignore files in .gitignore
		.add(ignoreFiles)
		// Ignore test files
		.add([
			// Test directories
			'**/*.test/**/*',
			// Test Files
			'*.test.*',
		]);

	const scaffoldFiles = ig.filter(await getAllFiles(scaffoldDir, scaffoldDir)).toSorted();

	plop.setActionType('Install dependencies', async (answers) => {
		const { dest, doInstall } = answerToConfig(answers);
		if (doInstall) {
			await installDependencies(dest);
			return 'success';
		}
		return 'skipped';
	});

	plop.setActionType('Finalize', async (answers) => {
		const { dest, type, ignoreDocumentRoot } = answerToConfig(answers);
		rewriteDotGitignore(dest, gitignoreOriginContent, {
			'Document Root': ignoreDocumentRoot,
		});

		if (type.startsWith('basercms')) {
			await copyLibraries(type, dest);
		}
		return 'finalized';
	});

	plop.setGenerator('basic', {
		description: 'Basic scaffolding',
		prompts: [
			{
				type: 'list',
				name: '__d-zero_project_type__',
				message: t`What's the type of project?`,
				choices: [
					{
						name: 'Static Site (with BurgerEditor Local App)',
						value: 'static',
					},
					{
						name: 'baserCMS v4 (with BurgerEditor v2)',
						value: 'basercms4',
					},
				],
				default: cli.flags.type,
				filter: (val) => val.toLowerCase(),
				when: interactive,
			},
			{
				type: 'input',
				name: '__d-zero_scaffold_dest__',
				message: t`Destination path`,
				default: cli.flags.dir,
				when: interactive,
			},
			{
				type: 'confirm',
				name: '__d-zero_scaffold_ignore_document_root__',
				message: t`Ignore document root files in gitignore?`,
				default: cli.flags.ignoreDocumentRoot,
				when: interactive,
			},
			{
				type: 'confirm',
				name: '__d-zero_scaffold_yarn_install__',
				message: t`Install dependencies with yarn?`,
				default: cli.flags.install,
				when: interactive,
			},
		],
		actions: function (answers) {
			const config = answerToConfig(answers);

			if (cli.flags.debug) {
				// eslint-disable-next-line no-console
				console.log(config);
			}

			const ignoredFiles = [];

			if (!config.type.startsWith('basercms')) {
				ignoredFiles.push('**/bge_style.css');
			}

			if (config.type === 'static') {
				ignoredFiles.push('**/__tmpl/**/*');
			} else {
				ignoredFiles.push('__assets/htdocs/index.pug', '__assets/htdocs/index.json');
			}

			const filteredFiles = scaffoldFiles.filter(
				(file) =>
					!ignoredFiles.some((pattern) => minimatch(file, pattern, { dot: true })),
			);

			return [
				...filteredFiles.map(
					/**
					 * @see https://plopjs.com/documentation/#add
					 * @type {import('plop').AddActionConfig}
					 */
					(originFile) => {
						return {
							type: 'add',
							path: path.resolve(config.dest, originFile),
							templateFile: path.resolve(scaffoldDir, originFile),
							async transform(content) {
								const nameCandidate = path.basename(path.resolve(config.dest));

								switch (originFile) {
									case 'package.json': {
										const pkg = JSON.parse(content);
										pkg._createdBy = `${pkg.name}@${pkg.version}`;
										pkg.name = nameCandidate;
										pkg.private = true;
										delete pkg.version;
										delete pkg.description;
										delete pkg.repository;
										delete pkg.author;
										delete pkg.license;
										delete pkg.publishConfig;
										delete pkg.files;
										if (config.type.startsWith('basercms')) {
											delete pkg.scripts.bge;
											delete pkg.devDependencies['@burger-editor/local'];
											pkg.dependencies['@burger-editor/css'] = '2';
											pkg.dependencies['jquery'] = 'latest';
											pkg.dependencies['jquery-colorbox'] = '1.5';
										}
										pkg.scripts.postinstall = 'husky';
										content = JSON.stringify(pkg, null, '\t');
										break;
									}
									case '__assets/_libs/data/blocks.js': {
										if (config.type === 'basercms4') {
											content = content.replace('bge-blocks.html', 'bge-blocks-v2.html');
										}
										break;
									}
									case '__assets/_libs/mixin/meta.pug': {
										if (!config.type.startsWith('basercms')) {
											content = content.replace('\ninclude meta-basercms.pug', '');
										}
										break;
									}
									case 'kamado.config.ts': {
										if (config.type.startsWith('basercms')) {
											const mod = parseModule(content);
											mod.exports.default.devServer.startPath = '__tmpl/';
											content = generateCode(mod).code;
										}
										break;
									}
								}

								const ext = path.extname(originFile);
								const parserMap = {
									'.ts': 'typescript',
									'.js': 'babel',
									'.mjs': 'babel',
									'.cjs': 'babel',
									'.json': 'json',
								};
								const parser = parserMap[ext];
								if (parser) {
									content = await prettierFormat(content, { ...prettierConfig, parser });
								}

								return content;
							},
						};
					},
				),
				{
					type: 'Install dependencies',
				},
				{
					type: 'Finalize',
				},
			];
		},
	});
}

/**
 *
 * @param answers
 */
function answerToConfig(answers) {
	const type = answers['__d-zero_project_type__'] ?? cli.flags.type;
	const dest = answers['__d-zero_scaffold_dest__'] ?? cli.flags.dir;
	const doInstall = answers['__d-zero_scaffold_yarn_install__'] ?? cli.flags.install;
	const ignoreDocumentRoot =
		answers['__d-zero_scaffold_ignore_document_root__'] ?? cli.flags.ignoreDocumentRoot;

	return { type, dest, doInstall, ignoreDocumentRoot };
}

/**
 *
 * @param dest
 */
async function installDependencies(dest) {
	await voltaInstallNode();
	await command('yarn', ['install'], {
		cwd: path.resolve(process.cwd(), dest),
		stdio: 'inherit',
	}).catch(() => {
		throw new Error('Failed to install dependencies');
	});
}

/**
 * @param {string} dest
 * @param {string} gitignoreOriginContent
 * @param {Record<string, boolean>} sections - Section names mapped to whether they should be included
 */
function rewriteDotGitignore(dest, gitignoreOriginContent, sections) {
	let gitignore = gitignoreOriginContent;

	for (const [name, include] of Object.entries(sections)) {
		if (!include) {
			// Remove from "# SectionName" until the next "# UpperCase" section or EOF
			gitignore = gitignore.replace(
				new RegExp(`\\n# ${name}\\n[\\s\\S]*?(?=\\n# [A-Z]|$)`),
				'',
			);
		}
	}

	return fs.writeFileSync(path.resolve(dest, '.gitignore'), gitignore);
}
