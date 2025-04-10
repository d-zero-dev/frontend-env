import type { Meta, StoryObj } from '@storybook/web-components';

import { defineHamburgerMenu, HamburgerMenu } from './hamburger-menu.js';
import { lengthUnits, borderStyles } from './style-values.js';

// Define the custom element with a prefix upfront
const tagName = defineHamburgerMenu('x'); // Use 'x' as prefix

const meta = {
	title: 'Components/HamburgerMenu',
	component: tagName,
	argTypes: {
		lineCount: {
			control: 'number',
			name: 'line-count',
			description: 'ハンバーガーメニューの線の数',
			defaultValue: HamburgerMenu.defaultStyle.lineCount,
			min: 1,
		},
		lineColor: {
			control: 'color',
			name: '--line-color',
			description: 'ハンバーガーメニューの線の色',
			defaultValue: HamburgerMenu.defaultStyle.lineColor,
		},
		// --line-width
		lineWidthValue: {
			control: 'number',
			name: '--line-width (数値)',
			description: '線の幅（数値部分）',
			defaultValue: HamburgerMenu.defaultStyle.lineWidthValue,
			step: 0.1, // 細かい調整用
			min: 0,
		},
		lineWidthUnit: {
			control: 'select',
			name: '--line-width (単位)',
			options: lengthUnits,
			description: '線の幅（単位）',
			defaultValue: HamburgerMenu.defaultStyle.lineWidthUnit,
		},
		// --line-height
		lineHeightValue: {
			control: 'number',
			name: '--line-height (数値)',
			description: '線の高さ（数値部分）',
			defaultValue: HamburgerMenu.defaultStyle.lineHeightValue,
			step: 1,
			min: 0,
		},
		lineHeightUnit: {
			control: 'select',
			name: '--line-height (単位)',
			options: lengthUnits,
			description: '線の高さ（単位）',
			defaultValue: HamburgerMenu.defaultStyle.lineHeightUnit,
		},
		borderRadiusValue: {
			control: 'number',
			name: '--border-radius (数値)',
			description: '外枠の角丸（数値部分）',
			defaultValue: HamburgerMenu.defaultStyle.borderRadiusValue,
			min: 0,
		},
		borderRadiusUnit: {
			control: 'select',
			name: '--border-radius (単位)',
			options: lengthUnits,
			description: '外枠の角丸（単位）',
			defaultValue: HamburgerMenu.defaultStyle.borderRadiusUnit,
		},
		borderWidthValue: {
			control: 'number',
			name: '--border-width (数値)',
			description: '外枠の線の太さ（数値部分）',
			defaultValue: HamburgerMenu.defaultStyle.borderWidthValue,
			min: 0,
		},
		borderWidthUnit: {
			control: 'select',
			name: '--border-width (単位)',
			options: lengthUnits,
			description: '外枠の線の太さ（単位）',
			defaultValue: HamburgerMenu.defaultStyle.borderWidthUnit,
		},
		borderStyle: {
			control: 'select',
			name: '--border-style',
			options: borderStyles,
			description: '外枠の線の種類',
			defaultValue: HamburgerMenu.defaultStyle.borderStyle,
		},
		borderColor: {
			control: 'color',
			name: '--border-color',
			description: '外枠の線の色',
			defaultValue: HamburgerMenu.defaultStyle.borderColor,
		},
		paddingBlockValue: {
			control: 'number',
			name: '--padding-block (数値)',
			description: 'パディングの上下（数値部分）',
			defaultValue: HamburgerMenu.defaultStyle.paddingBlockValue,
			min: 0,
		},
		paddingBlockUnit: {
			control: 'select',
			name: '--padding-block (単位)',
			options: lengthUnits,
			description: 'パディングの上下（単位）',
			defaultValue: HamburgerMenu.defaultStyle.paddingBlockUnit,
		},
		paddingInlineValue: {
			control: 'number',
			name: '--padding-inline (数値)',
			description: 'パディングの左右（数値部分）',
			defaultValue: HamburgerMenu.defaultStyle.paddingInlineValue,
			min: 0,
		},
		paddingInlineUnit: {
			control: 'select',
			name: '--padding-inline (単位)',
			options: lengthUnits,
			description: 'パディングの左右（単位）',
			defaultValue: HamburgerMenu.defaultStyle.paddingInlineUnit,
		},
	},
	render(args) {
		const element = document.createElement(tagName) as HamburgerMenu;
		element.lineCount = args.lineCount;
		element.style.setProperty('--line-color', args.lineColor);
		element.style.setProperty(
			'--line-width',
			`${args.lineWidthValue}${args.lineWidthUnit}`,
		);
		element.style.setProperty(
			'--line-h	eight',
			`${args.lineHeightValue}${args.lineHeightUnit}`,
		);
		element.style.setProperty(
			'--border-radius',
			`${args.borderRadiusValue}${args.borderRadiusUnit}`,
		);
		element.style.setProperty(
			'--border-width',
			`${args.borderWidthValue}${args.borderWidthUnit}`,
		);
		element.style.setProperty('--border-style', args.borderStyle);
		element.style.setProperty('--border-color', args.borderColor);
		element.style.setProperty(
			'--padding-block',
			`${args.paddingBlockValue}${args.paddingBlockUnit}`,
		);
		element.style.setProperty(
			'--padding-inline',
			`${args.paddingInlineValue}${args.paddingInlineUnit}`,
		);
		element.innerHTML = `
	<dialog>
		<h1>メニュー</h1>
		<ul>
			<li><a href="#">項目1</a></li>
			<li><a href="#">項目2</a></li>
		</ul>
		<button command="close">閉じる</button>
	</dialog>
`;
		return element;
	},
} satisfies Meta;

export default meta;
type Story = StoryObj;

const defaultArgs = Object.fromEntries(
	Object.entries(meta.argTypes).map(([key, value]) => [key, value.defaultValue]),
);

export const Default: Story = {
	args: defaultArgs,
};

export const Pattern01: Story = {
	args: {
		...defaultArgs,
		lineCount: 2,
		lineWidthValue: 100,
		lineHeightValue: 6,
		borderRadiusValue: 5,
		borderWidthValue: 1,
		borderColor: '#000',
		paddingBlockValue: 32,
		paddingBlockUnit: 'cqi',
		paddingInlineValue: 20,
		paddingInlineUnit: 'cqi',
	},
};
