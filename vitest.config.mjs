import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		exclude: [
			...configDefaults.exclude,
			// `*.test.*`はビルド確認用のページで、テストではない
			'packages/@d-zero/scaffold/__assets/**',
		],
	},
});
