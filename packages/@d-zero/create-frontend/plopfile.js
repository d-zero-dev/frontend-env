import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { globSync } from 'glob';
import ignore from 'ignore';
import meow from 'meow';

import { t } from './locale.js';

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
`,
	{
		importMeta: import.meta,
		flags: {
			type: {
				type: 'string',
				shortFlag: 't',
			},
			dir: {
				type: 'string',
				shortFlag: 'd',
			},
			install: {
				type: 'boolean',
				default: true,
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

	const ignoreFiles = fs
		.readFileSync(path.resolve(scaffoldDir, '.gitignore'), 'utf8')
		.split('\n')
		.filter(Boolean);

	const ig = ignore()
		// Ignore files in .gitignore
		.add(ignoreFiles)
		// Ignore test files
		.add([
			// Test directories
			'**/*.test/**/*',
		]);

	const scaffoldFiles = ig.filter(
		globSync('**/*', {
			cwd: scaffoldDir,
			nodir: true,
			dot: true,
		}),
	);

	plop.setActionType('Install dependencies', (answers) => {
		const dest = answers['__d-zero_scaffold_dest__'] ?? cli.flags.dir ?? '.';
		const doInstall =
			answers['__d-zero_scaffold_yarn_install__'] ?? cli.flags.install ?? true;
		if (doInstall) {
			const child = spawn('yarn', ['install'], {
				cwd: path.resolve(process.cwd(), dest),
				stdio: 'inherit',
			});

			process.on('SIGINT', () => {
				child.kill('SIGINT');
			});
		}
	});

	plop.setGenerator('basic', {
		description: 'Basic scaffolding',
		prompts: [
			{
				type: 'list',
				name: '__d-zero_project_type__',
				message: t`What's the type of project?`,
				choices: [
					//
					'Static',
					'CMS (WordPress etc.)',
					{
						name: 'CMS (baserCMS with BurgerEditor)',
						value: 'burger',
					},
				],
				default: cli.flags.type ?? 'burger',
				filter: (val) => val.toLowerCase(),
				when: !cli.flags.type,
			},
			{
				type: 'input',
				name: '__d-zero_scaffold_dest__',
				message: t`Destination path`,
				default: '.',
				when: !cli.flags.type,
			},
			{
				type: 'confirm',
				name: '__d-zero_scaffold_yarn_install__',
				message: t`Install dependencies with yarn?`,
				default: true,
				when: !cli.flags.type,
			},
		],
		actions: function (answers) {
			return [
				...scaffoldFiles.map(
					/**
					 * @see https://plopjs.com/documentation/#add
					 * @type {import('plop').AddActionConfig}
					 */
					(originFile) => {
						const dest = answers['__d-zero_scaffold_dest__'] ?? cli.flags.dir ?? '.';
						return {
							type: 'add',
							path: path.resolve(dest, originFile),
							templateFile: path.resolve(scaffoldDir, originFile),
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
