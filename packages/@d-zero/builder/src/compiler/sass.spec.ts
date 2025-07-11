import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { compileSass } from './sass.js';

const testFileDir = path.join(import.meta.dirname, '..', '..', 'test-files');

beforeEach(() => {
	mkdirSync(testFileDir, { recursive: true });
});

afterEach(() => {
	rmSync(testFileDir, { recursive: true });
});

describe('compileSass', () => {
	it('should minify simple CSS', async () => {
		const css = `
				.c-component {
					&__element {
						color: red;
						background-color: blue;
						margin: 10px 20px;
					}
				}
			`;

		const inputPath = path.join(testFileDir, 'test.scss');
		writeFileSync(inputPath, css);

		const result = await compileSass(inputPath, {
			minify: true,
			alias: {},
			tmpDir: testFileDir,
		});

		// Verify cssnano minification
		expect(result).toBe(
			`.c-component__element{color:red;background-color:#00f;margin:10px 20px}`,
		);
	});
});
