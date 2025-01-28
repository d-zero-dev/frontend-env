import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { argv } from 'node:process';

import { globSync } from 'glob';
import ignore from 'ignore';
import meow from 'meow';

import { t } from './locale.js';
import { readFileSafe } from './read-file-safe.js';

const cli = meow(
	`
	Usage
	  $ yarn create @d-zero/frontend
	  or
	  $ npx @d-zero/create-frontend

	Options
	  --type, -t  Specify the type of project. Then, no interactive mode will be shown.
	  --dir,  -d  Specify the destination directory. Default is the current directory.
	  --install   Install dependencies with yarn after scaffolding.

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
				default: 'burger',
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
			debug: {
				type: 'boolean',
				default: false,
			},
		},
	},
);

/**
 * @param {import('plop').NodePlopAPI} plop
 */
export default function (plop) {
	const scaffoldDir = path.normalize(
		path.dirname(import.meta.resolve('@d-zero/scaffold').replace('file:', '')),
	);

	const gitignore = readFileSafe(path.resolve(scaffoldDir, '.gitignore'));
	const ignoreFiles = gitignore?.split('\n').filter(Boolean) ?? [];
	const hasArgs = argv.length > 2;
	const interactive = !hasArgs;

	const ig = ignore()
		// Ignore files in .gitignore
		.add(ignoreFiles)
		// Ignore test files
		.add([
			// Test directories
			'**/*.test/**/*',
		])
		.add(
			// BurgerEditor
			cli.flags.type === 'burger' ? [] : ['**/bge-*', '**/bge_*'],
		)
		.add(
			// static
			cli.flags.type === 'static' ? ['**/__tmpl/**/*'] : [],
		);

	const scaffoldFiles = ig.filter(
		globSync('**/*', {
			cwd: scaffoldDir,
			nodir: true,
			dot: true,
		}),
	);

	plop.setActionType('Install dependencies', (answers) => {
		const { dest, doInstall } = answerToConfig(answers);

		const { promise, resolve, reject } = Promise.withResolvers();

		if (doInstall) {
			const child = spawn('yarn', ['install'], {
				cwd: path.resolve(process.cwd(), dest),
				stdio: 'inherit',
			});

			child.on('exit', (code) => {
				if (code === 0) {
					resolve(': success');
				} else {
					reject(new Error('Failed to install dependencies'));
				}
			});

			process.on('SIGINT', () => {
				child.kill('SIGINT');
			});
		} else {
			resolve(': skipped');
		}

		return promise;
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
						name: 'Static',
						value: 'static',
					},
					'CMS (WordPress etc.)',
					{
						name: 'CMS (baserCMS with BurgerEditor)',
						value: 'burger',
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

			return [
				...scaffoldFiles.map(
					/**
					 * @see https://plopjs.com/documentation/#add
					 * @type {import('plop').AddActionConfig}
					 */
					(originFile) => {
						return {
							type: 'add',
							path: path.resolve(config.dest, originFile),
							templateFile: path.resolve(scaffoldDir, originFile),
							transform(content) {
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
										content = JSON.stringify(pkg, null, '\t');
										break;
									}
									case '__assets/_libs/data/blocks.cjs': {
										if (config.type === 'burger') {
											content = content.replace("blocks.html'", "bge-blocks.html'");
										}
										break;
									}
									case '__assets/htdocs/index.pug': {
										if (config.type === 'static') {
											content = fs.readFileSync(
												path.resolve(scaffoldDir, '__assets/htdocs/__tmpl/000_home.pug'),
												'utf8',
											);
										}
									}
								}
								return content;
							},
						};
					},
				),
				{
					type: 'Install dependencies',
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

	return { type, dest, doInstall };
}
