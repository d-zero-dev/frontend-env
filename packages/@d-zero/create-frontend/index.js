#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Plop, run } from 'plop';

Plop.prepare(
	{
		configPath: path.join(import.meta.dirname, 'plopfile.js'),
	},
	(env) =>
		Plop.execute(
			{
				...env,
				dest: process.cwd(),
			},
			run,
		),
);
