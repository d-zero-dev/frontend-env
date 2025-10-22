import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { compileCss } from './css.js';

describe('compileCss', () => {
	describe('Basic CSS transformation (string input → string output)', () => {
		it('should minify simple CSS', async () => {
			const css = `
				.button {
					color: red;
					background-color: blue;
					margin: 10px 20px;
				}
			`;

			const result = await compileCss(css, 'test.css', {
				alias: {},
			});

			// Verify cssnano minification
			expect(result.css).not.toContain('\n');
			expect(result.css).not.toContain('  ');
			expect(result.css).toContain('.button');
			expect(result.css).toContain('color:red');
			expect(result.css).toContain('background-color:blue');
			expect(result.css).toContain('margin:10px 20px');
		});

		it('should handle CSS comments properly', async () => {
			const css = `
				/* Regular comment */
				.test { color: red; }
				/*! Important comment */
				.important { color: blue; }
			`;

			const result = await compileCss(css, 'test.css', {
				alias: {},
			});

			expect(result.css).not.toContain('Regular comment');
			expect(result.css).toContain('Important comment');
		});

		it('should process complex CSS selectors and values', async () => {
			const css = `
				.card > .header::before {
					content: "";
					display: block;
					width: 100%;
					height: 2px;
					background: linear-gradient(to right, #ff0000, #0000ff);
				}

				@media (min-width: 768px) {
					.card {
						grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
					}
				}
			`;

			const result = await compileCss(css, 'test.css', {
				alias: {},
			});

			expect(result.css).toContain('.card>.header:before'); // ::before gets minified to :before
			expect(result.css).toContain('content:""');
			expect(result.css).toContain('linear-gradient(90deg,red,#00f)'); // Actual minification result
			expect(result.css).toContain('@media (min-width:768px)');
		});

		it('should handle empty CSS', async () => {
			const css = '';

			const result = await compileCss(css, 'test.css', {
				alias: {},
			});

			expect(result.css).toBe('');
		});

		it('should handle CSS with only comments', async () => {
			const css = `
				/* This is comment only */
				/* Another comment */
			`;

			const result = await compileCss(css, 'test.css', {
				alias: {},
			});

			expect(result.css).toBe('');
		});

		it('should preserve only important comments', async () => {
			const css = `
				/*! License information */
				/* Regular comment */
				/*! Copyright information */
			`;

			const result = await compileCss(css, 'test.css', {
				alias: {},
			});

			expect(result.css).toContain('License information');
			expect(result.css).toContain('Copyright information');
			expect(result.css).not.toContain('Regular comment');
		});
	});

	describe('Invalid CSS syntax handling', () => {
		it('should return empty string for invalid syntax', async () => {
			const css = '.test { color: ; }'; // Missing value

			const result = await compileCss(css, 'test.css', {
				alias: {},
			});

			expect(result.css).toBe('');
		});

		it('should throw error for unclosed block syntax', async () => {
			const css = '.test { color: red'; // Missing closing brace

			await expect(
				compileCss(css, 'test.css', {
					alias: {},
				}),
			).rejects.toThrow('Unclosed block');
		});
	});

	describe('Options testing', () => {
		it('should not perform file operations when alias is set but no @import exists', async () => {
			const css = `
				.component {
					color: green;
				}
			`;

			const result = await compileCss(css, 'test.css', {
				alias: {
					'@components': '/some/path',
					'@utils': '/another/path',
				},
			});

			expect(result.css).toContain('.component');
			expect(result.css).toContain('color:green');
		});
	});
});

// Tests for file import functionality (separated)
describe('compileCss - File import functionality', () => {
	const testDir = path.join(process.cwd(), 'test-temp-import');
	const cssDir = path.join(testDir, 'css');

	beforeEach(() => {
		mkdirSync(cssDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	it('should resolve alias-based @import', async () => {
		// Create test file
		const buttonCssPath = path.join(cssDir, 'components', 'button.css');
		mkdirSync(path.dirname(buttonCssPath), { recursive: true });
		writeFileSync(buttonCssPath, '.button { padding: 1rem; }');

		const css = '@import "@components/button.css";';

		const result = await compileCss(css, path.join(cssDir, 'main.css'), {
			alias: {
				'@components': path.join(cssDir, 'components'),
			},
		});

		expect(result.css).toContain('.button');
		expect(result.css).toContain('padding:1rem');
	});

	it('should throw error when importing non-existent file', async () => {
		const css = '@import "./non-existent.css";';

		await expect(
			compileCss(css, path.join(cssDir, 'main.css'), {
				alias: {},
			}),
		).rejects.toThrow();
	});
});
