import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { argv } from 'node:process';

import ignore from 'ignore';
import meow from 'meow';
import { minimatch } from 'minimatch';
import { format as oxfmtFormat } from 'oxfmt';

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

const formattableExtensions = new Set([
	'.js',
	'.mjs',
	'.cjs',
	'.ts',
	'.tsx',
	'.json',
	'.jsonc',
]);

/**
 * Replaces `search` in the scaffold file `file`. A scaffold file that no longer contains
 * `search` means the scaffold was changed without this generator, so it throws instead of
 * silently generating a project with the wrong content.
 * @param {string} content - Content of the scaffold file
 * @param {string} search - Text to replace
 * @param {string} replacement - Text to put in its place
 * @param {string} file - Scaffold-relative path, used in the error message
 * @returns {string} The content with `search` replaced
 * @example
 * replaceOrThrow("port: 8000,", "8000", "3000", "kamado.config.jsonc"); // "port: 3000,"
 */
function replaceOrThrow(content, search, replacement, file) {
	if (!content.includes(search)) {
		throw new Error(
			`${file}: "${search}" not found; update plopfile.js with the scaffold`,
		);
	}
	return content.replace(search, replacement);
}

/**
 * Builds the template option of a plop `add` action for a scaffold file.
 *
 * plop renders every template with Handlebars, which reads the `{{` of JSX
 * (`dangerouslySetInnerHTML={{ __html }}`) as an expression. A scaffold file is a file to
 * copy, not a template, so the `{{` in it is escaped and comes out as written.
 * @param {string} file - Absolute path of the scaffold file
 * @returns {{ template: string } | { templateFile: string }} The option to spread into the action
 * @example
 * templateOption('/scaffold/__assets/_libs/layouts/l-home.tsx');
 */
function templateOption(file) {
	const content = fs.readFileSync(file, 'utf8');
	return content.includes('{{')
		? { template: content.replaceAll('{{', String.raw`\{{`) }
		: { templateFile: file };
}

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

	// Format the generated files with the formatting rules the scaffold itself ships.
	// `ignorePatterns` and `overrides` only apply to the oxfmt CLI, not to `format()`.
	const formatOptions = JSON.parse(
		readFileSafe(path.resolve(scaffoldDir, '.oxfmtrc.json')) ?? '{}',
	);
	delete formatOptions.ignorePatterns;
	delete formatOptions.overrides;

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
		])
		// Ignore type-specific files (handled separately per type)
		.add(['__type/**/*']);

	const scaffoldFiles = ig.filter(await getAllFiles(scaffoldDir, scaffoldDir)).toSorted();

	const typeBaseDir = path.resolve(scaffoldDir, '__type');
	const typeFilesMap = {};
	if (fs.existsSync(typeBaseDir)) {
		for (const entry of fs.readdirSync(typeBaseDir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				const typeDir = path.resolve(typeBaseDir, entry.name);
				typeFilesMap[entry.name] = await getAllFiles(typeDir, typeDir);
			}
		}
	}

	plop.setActionType('Install dependencies', async (answers) => {
		const { dest, doInstall } = answerToConfig(answers);
		if (doInstall) {
			await installDependencies(dest);
			return 'success';
		}
		return 'skipped';
	});

	plop.setActionType('Install agent skills', async (answers) => {
		const { dest, doInstall } = answerToConfig(answers);
		if (!doInstall) {
			return 'skipped';
		}
		return await installAgentSkills(dest);
	});

	plop.setActionType('Finalize', async (answers) => {
		const { dest, type, ignoreDocumentRoot } = answerToConfig(answers);
		rewriteDotGitignore(dest, gitignoreOriginContent, ignoreDocumentRoot);

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
					{
						name: 'baserCMS v5 (with BurgerEditor v2)',
						value: 'basercms5',
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
				ignoredFiles.push('**/bge_style.css', '__assets/_libs/mixin/meta-basercms.tsx');
			}

			if (config.type === 'static') {
				ignoredFiles.push('**/__tmpl/**/*');
			} else {
				ignoredFiles.push('__assets/htdocs/index.tsx', '__assets/htdocs/index.json');
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
						const destFile =
							config.type === 'basercms5' && originFile.startsWith('htdocs/')
								? path.join('htdocs', 'webroot', originFile.slice('htdocs/'.length))
								: originFile;
						return {
							type: 'add',
							path: path.resolve(config.dest, destFile),
							...templateOption(path.resolve(scaffoldDir, originFile)),
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
											pkg.dependencies['jquery'] = '3.7.1'; // colorbox が jQuery 4系と互換性がないため、3系の最新版に固定
											pkg.dependencies['jquery-colorbox'] = '1.5';
										}
										pkg.scripts.postinstall = 'husky';
										content = JSON.stringify(pkg, null, '\t');
										break;
									}
									case '__assets/htdocs/__tmpl/100_sub.tsx': {
										if (config.type === 'basercms4' || config.type === 'basercms5') {
											content = replaceOrThrow(
												content,
												"data['bge-blocks']",
												"data['bge-blocks-v2']",
												originFile,
											);
										}
										break;
									}
									case '__assets/_libs/mixin/meta.tsx': {
										if (!config.type.startsWith('basercms')) {
											content = replaceOrThrow(
												content,
												"import MetaBasercms from './meta-basercms.tsx';\n",
												'',
												originFile,
											);
											content = replaceOrThrow(
												content,
												'<MetaBasercms />\n',
												'',
												originFile,
											);
										}
										break;
									}
									case 'kamado.config.jsonc': {
										if (config.type.startsWith('basercms')) {
											content = replaceOrThrow(
												content,
												'"port": 8000,',
												'"port": 8000,\n"startPath": "__tmpl/",',
												originFile,
											);
										}
										if (config.type === 'basercms5') {
											content = replaceOrThrow(
												content,
												'"output": "htdocs"',
												'"output": "htdocs/webroot"',
												originFile,
											);
										}
										break;
									}
								}

								if (formattableExtensions.has(path.extname(originFile))) {
									const { code, errors } = await oxfmtFormat(
										originFile,
										content,
										formatOptions,
									);
									if (errors.length > 0) {
										throw new Error(
											`${originFile}: ${errors.map((error) => error.message).join('\n')}`,
										);
									}
									content = code;
								}

								return content;
							},
						};
					},
				),
				...(typeFilesMap[config.type] ?? []).map((typeFile) => ({
					type: 'add',
					path: path.resolve(config.dest, typeFile),
					templateFile: path.resolve(scaffoldDir, '__type', config.type, typeFile),
				})),
				{
					type: 'Install dependencies',
				},
				{
					type: 'Install agent skills',
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
 * D-ZERO 共通のエージェントスキルを .claude/skills/ に展開する。
 * 取得元は scaffold の package.json の scripts["skills:sync"] に定義されている
 * （skills CLI 本体は devDependencies としてインストール済み）
 * @param {string} dest
 * @returns {Promise<string>}
 */
async function installAgentSkills(dest) {
	try {
		await command('yarn', ['skills:sync'], {
			cwd: path.resolve(process.cwd(), dest),
			stdio: 'inherit',
		});
		return 'success';
	} catch {
		// オフライン等で失敗しても生成自体は継続する（後から yarn skills:sync で導入できる）
		return 'skipped (failed to fetch skills; run `yarn skills:sync` later)';
	}
}

/**
 * @param {string} dest
 * @param {string} gitignoreOriginContent
 * @param {boolean} ignoreDocumentRoot
 */
function rewriteDotGitignore(dest, gitignoreOriginContent, ignoreDocumentRoot) {
	let gitignore = gitignoreOriginContent;

	if (!ignoreDocumentRoot) {
		const documentRootSection = gitignore.indexOf('\n# Document Root\n');
		if (documentRootSection !== -1) {
			gitignore = gitignore.slice(0, documentRootSection);
		}
	}

	return fs.writeFileSync(path.resolve(dest, '.gitignore'), gitignore);
}
