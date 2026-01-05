import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
	stories: ['../src/*.mdx', '../src/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: [
		'@storybook/experimental-addon-test',
		'@storybook/addon-docs',
		'@chromatic-com/storybook',
	],
	framework: {
		name: '@storybook/web-components-vite',
		options: {},
	},
};

export default config;
