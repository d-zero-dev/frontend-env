import type { Meta, StoryObj } from '@storybook/web-components';

import { defineBreadcrumbs, Breadcrumbs } from './breadcrumbs.js';
import { lengthUnits } from './style-values.js';

// Define the custom element with a prefix upfront
const tagName = defineBreadcrumbs('x'); // Use 'x' as prefix

const meta = {
	title: 'Components/Breadcrumbs',
	component: tagName,
	argTypes: {
		separator: {
			control: 'text',
			name: 'separator',
			description: 'パンくずリストの区切り文字',
			defaultValue: Breadcrumbs.defaultSeparator,
		},
		separatorColor: {
			control: 'color',
			name: '--separator-color',
			description: '区切り文字の色',
			defaultValue: Breadcrumbs.defaultStyle.separatorColor,
		},
		separatorSpacingValue: {
			control: 'number',
			name: '--separator-spacing (数値)',
			description: '区切り文字の間隔（数値部分）',
			defaultValue: Breadcrumbs.defaultStyle.separatorSpacingValue,
			step: 0.1,
			min: 0,
		},
		separatorSpacingUnit: {
			control: 'select',
			name: '--separator-spacing (単位)',
			options: lengthUnits,
			description: '区切り文字の間隔（単位）',
			defaultValue: Breadcrumbs.defaultStyle.separatorSpacingUnit,
		},
		color: {
			control: 'color',
			name: '--color',
			description: 'リスト全体のデフォルト文字色',
			defaultValue: Breadcrumbs.defaultStyle.color,
		},
		currentColor: {
			control: 'color',
			name: '--current-color',
			description: '現在位置を示すアイテムの色',
			defaultValue: Breadcrumbs.defaultStyle.currentColor,
		},
		font: {
			control: 'text',
			name: '--font (ショートハンド)',
			description: '全体のフォントスタイル (例: italic bold 1.2em sans-serif)',
			defaultValue: Breadcrumbs.defaultStyle.font,
		},
		currentFont: {
			control: 'text',
			name: '--current-font (ショートハンド)',
			description: '現在のアイテムのフォントスタイル',
			defaultValue: Breadcrumbs.defaultStyle.currentFont,
		},
		separatorPartStyle: {
			control: 'text',
			name: '::part(separator)',
			description:
				'::part(separator) に適用するCSS（例: background: yellow; padding: 2px;）',
			defaultValue: '',
			rows: 5, // Make textarea taller
		},
	},
	render(args) {
		const container = document.createElement('div'); // Container for element and style

		// Create the component instance
		const element = document.createElement(tagName) as Breadcrumbs;

		// Apply separator attribute
		element.separator = args.separator;

		// Apply CSS Custom Properties
		element.style.setProperty('--separator-color', args.separatorColor);
		element.style.setProperty(
			'--separator-spacing',
			`${args.separatorSpacingValue}${args.separatorSpacingUnit}`,
		);
		element.style.setProperty('--color', args.color);
		element.style.setProperty('--current-color', args.currentColor);

		// Apply font shorthands
		if (args.font) {
			element.style.setProperty('--font', args.font);
		}
		if (args.currentFont) {
			element.style.setProperty('--current-font', args.currentFont);
		}

		// Set inner HTML
		element.innerHTML = `
	<a href="/">ホーム</a>
	<a href="/category">カテゴリA</a>
	<a href="/category/subcategory/items">アイテム一覧</a>
	<a href="/category/subcategory/items/current" aria-current="page">現在のアイテム</a>
`;

		container.append(element);

		// Apply ::part styles if provided
		if (args.separatorPartStyle && args.separatorPartStyle.trim()) {
			const style = document.createElement('style');
			// Scope the style to the specific instance using the tag name
			style.textContent = `
${tagName}::part(separator) {
	${args.separatorPartStyle}
}
`;
			container.append(style); // Append style next to the element
		}

		return container; // Return the container with element + style
	},
} satisfies Meta;

export default meta;
type Story = StoryObj;

const getDefaultArgs = () => {
	const args: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(meta.argTypes)) {
		// Skip the individual value/unit controls for composite props
		if (!key.endsWith('Value') && !key.endsWith('Unit')) {
			args[key] = value.defaultValue;
		}
	}
	return args;
};

const defaultArgs = getDefaultArgs();

export const Default: Story = {
	args: defaultArgs,
};

export const CustomSeparator: Story = {
	args: {
		...defaultArgs,
		separator: '>',
		separatorSpacingValue: 0.8,
		separatorSpacingUnit: 'em',
	},
};

export const LongPath: Story = {
	args: defaultArgs,
	render: (args) => {
		const element = meta.render(args);
		const breadcrumbsElement =
			element instanceof HTMLElement && element.tagName.toLowerCase() === tagName
				? element
				: element.querySelector(tagName);

		if (breadcrumbsElement) {
			breadcrumbsElement.innerHTML = `
	<a href="/">ホーム</a>
	<a href="/category">カテゴリA</a>
	<a href="/category/subcategory">サブカテゴリB</a>
	<a href="/category/subcategory/subsubcategory">サブサブカテゴリC</a>
	<a href="/category/subcategory/subsubcategory/items">アイテム一覧</a>
	<a href="/category/subcategory/subsubcategory/items/123" aria-current="page">現在のアイテム</a>
`;
		}
		return element;
	},
};

// Story to demonstrate font shorthands
export const CustomFonts: Story = {
	args: {
		...defaultArgs,
		font: 'italic 1em "Times New Roman", serif',
		currentFont: 'bold 1.1em Arial, sans-serif',
		separator: '→',
		color: '#555',
		currentColor: 'darkred',
	},
	render: (args) => {
		const element = meta.render(args);
		const breadcrumbsElement =
			element instanceof HTMLElement && element.tagName.toLowerCase() === tagName
				? element
				: element.querySelector(tagName);

		if (breadcrumbsElement) {
			breadcrumbsElement.innerHTML = `
	<a href="/">Home (Serif)</a>
	<a href="/products">Products (Serif)</a>
	<a href="/products/special" aria-current="page">Special Offer (Arial Bold)</a>
`;
		}
		return element;
	},
};

// New story to demonstrate ::part styling
export const PartStyling: Story = {
	args: {
		...defaultArgs,
		separator: '::',
		separatorPartStyle: `
	background-color: gold;
	border: 1px dashed red;
	padding: 0 5px;
	border-radius: 4px;
	font-weight: bold;
	box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
	min-block-size: 1em;
`,
	},
	render: (args) => {
		const element = meta.render(args);
		const breadcrumbsElement =
			element instanceof HTMLElement && element.tagName.toLowerCase() === tagName
				? element
				: element.querySelector(tagName);

		if (breadcrumbsElement) {
			breadcrumbsElement.innerHTML = `
	<a href="/">Home</a>
	<a href="/section">Section</a>
	<a href="/section/current" aria-current="page">Current Page</a>
`;
		}
		return element;
	},
};
