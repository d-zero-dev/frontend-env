import type { LengthUnit, BorderStyle } from './style-values.js';

export class HamburgerMenu extends HTMLElement {
	#button: HTMLButtonElement | null = null;
	#lineCount: number;
	#slot: HTMLSlotElement | null = null;

	get lineCount(): number {
		return this.#lineCount;
	}

	set lineCount(value: number) {
		if (value < 1) {
			throw new RangeError('lineCount must be greater than 0');
		}
		if (Math.floor(value) !== value) {
			throw new TypeError('lineCount must be an integer');
		}

		this.#lineCount = value;
		this.setAttribute('line-count', value.toString());
		this.#render();
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.#lineCount = 3;
		this.#render();
	}

	attributeChangedCallback(name: string, _: string, newValue: string) {
		switch (name) {
			case 'line-count': {
				this.#lineCount = Number.parseInt(newValue);
				break;
			}
		}
		this.#render();
	}

	connectedCallback() {
		this.#slot?.addEventListener('slotchange', () => {
			const realNodes = this.#slot?.assignedNodes({ flatten: true });

			const dialog = realNodes?.find((node) => node instanceof HTMLDialogElement);
			if (dialog) {
				// @ts-ignore
				this.#button.commandForElement = dialog;

				const closeButton = dialog.querySelector<HTMLButtonElement>(
					'button[command="close"]',
				);
				if (closeButton) {
					// @ts-ignore
					closeButton.commandForElement = dialog;
				}
			}
		});
	}

	#render() {
		this.shadowRoot!.innerHTML = `
		<style>
			:is(:host, *) {
				box-sizing: border-box;
			}
			:host {
				--line-width: ${HamburgerMenu.defaultStyle.lineWidthValue}${HamburgerMenu.defaultStyle.lineWidthUnit};
				--line-height: ${HamburgerMenu.defaultStyle.lineHeightValue}${HamburgerMenu.defaultStyle.lineHeightUnit};
				--line-color: ${HamburgerMenu.defaultStyle.lineColor};
				--border-radius: ${HamburgerMenu.defaultStyle.borderRadiusValue}${HamburgerMenu.defaultStyle.borderRadiusUnit};
				--border-width: ${HamburgerMenu.defaultStyle.borderWidthValue}${HamburgerMenu.defaultStyle.borderWidthUnit};
				--border-style: ${HamburgerMenu.defaultStyle.borderStyle};
				--border-color: ${HamburgerMenu.defaultStyle.borderColor};
				--padding-block: ${HamburgerMenu.defaultStyle.paddingBlockValue}${HamburgerMenu.defaultStyle.paddingBlockUnit};
				--padding-inline: ${HamburgerMenu.defaultStyle.paddingInlineValue}${HamburgerMenu.defaultStyle.paddingInlineUnit};
				container: hamburger-menu / inline-size;
				display: block;
				inline-size: 5em;
				block-size: 5em;
			}
			button {
				display: block;
				width: 100%;
				height: 100%;
				border: none;
				background: none;
				padding: 0;
				margin: 0;
				cursor: pointer;
				border-radius: var(--border-radius);
				border: var(--border-width) var(--border-style, solid) var(--border-color);
				overflow: hidden;
				appearance: none;
				-webkit-appearance: none;
				-moz-appearance: none;
				-ms-appearance: none;

				> span {
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					align-items: center;
					width: 100%;
					height: 100%;
					padding: var(--padding-block) var(--padding-inline);

					> span {
						display: block;
						width: var(--line-width);
						max-width: 100%;
						height: var(--line-height);
						flex: 0 0 var(--line-height);
						background-color: var(--line-color);
					}
				}
			}
		</style>
		<button type="button" aria-label="メニュー" command="show-modal">
			<span>
				${Array.from({ length: this.#lineCount })
					.map(() => `<span></span>`)
					.join('')}
			</span>
		</button>
		<slot></slot>
	`;

		this.#button = this.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
		this.#slot = this.shadowRoot!.querySelector<HTMLSlotElement>('slot')!;

		this.connectedCallback();
	}

	static defaultStyle = Object.freeze({
		lineCount: 3,
		lineWidthValue: 80,
		lineWidthUnit: 'cqi' as const satisfies LengthUnit,
		lineHeightValue: 2,
		lineHeightUnit: 'px' as const satisfies LengthUnit,
		lineColor: 'currentColor',
		borderRadiusValue: 0,
		borderRadiusUnit: 'px' as const satisfies LengthUnit,
		borderWidthValue: 1,
		borderWidthUnit: 'px' as const satisfies LengthUnit,
		borderStyle: 'solid' as const satisfies BorderStyle,
		borderColor: 'currentColor',
		paddingBlockValue: 25,
		paddingBlockUnit: 'cqi' as const satisfies LengthUnit,
		paddingInlineValue: 20,
		paddingInlineUnit: 'cqi' as const satisfies LengthUnit,
	} as const);
}

/**
 *
 * @param prefix
 */
export function defineHamburgerMenu(prefix: string): string {
	const tagName = `${prefix}-hamburger-menu`;
	if (!customElements.get(tagName)) {
		customElements.define(tagName, HamburgerMenu);
	}
	return tagName;
}
