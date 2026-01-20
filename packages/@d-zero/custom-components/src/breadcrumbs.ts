import type { LengthUnit } from './style-values.js';

export class Breadcrumbs extends HTMLElement {
	#observer: MutationObserver;
	#ol: HTMLOListElement;
	#separator: string;
	#shadowRoot: ShadowRoot;

	get separator(): string {
		return this.#separator;
	}

	set separator(value: string | null) {
		const newValue = value === null ? Breadcrumbs.defaultSeparator : value;

		if (this.#separator === newValue) {
			return;
		}

		this.#separator = newValue;

		const currentAttr = this.getAttribute('separator');
		if (currentAttr !== newValue) {
			if (newValue === Breadcrumbs.defaultSeparator && value === null) {
				this.removeAttribute('separator');
			} else {
				this.setAttribute('separator', newValue);
			}
		}

		this.#updateBreadcrumbs();
	}

	constructor() {
		super();
		this.#shadowRoot = this.attachShadow({ mode: 'open' });

		if (this.hasAttribute('separator')) {
			this.#separator = this.getAttribute('separator') ?? Breadcrumbs.defaultSeparator;
		} else {
			this.#separator = Breadcrumbs.defaultSeparator;
		}

		const style = document.createElement('style');
		style.textContent = `
			:host {
				--separator-color: ${Breadcrumbs.defaultStyle.separatorColor};
				--separator-spacing: ${Breadcrumbs.defaultStyle.separatorSpacingValue}${Breadcrumbs.defaultStyle.separatorSpacingUnit};
				--color: ${Breadcrumbs.defaultStyle.color};
				--current-color: ${Breadcrumbs.defaultStyle.currentColor};
				--font: ${Breadcrumbs.defaultStyle.font};
				--current-font: ${Breadcrumbs.defaultStyle.currentFont};
				display: block flow;
			}
			* {
				box-sizing: border-box;
			}
			ol {
				font: var(--font);
				color: var(--color);
				display: block flex;
				flex-wrap: wrap;
				list-style: none;
				padding: 0;
				margin: 0;
			}
			li {
				display: inline-flex;
				align-items: center;
			}
			:host::part(separator) {
				display: block flow;
				margin: 0 var(--separator-spacing);
				color: var(--separator-color);
			}
			a {
				font: inherit;
				color: inherit;
			}
			a[aria-current="page"] {
				font: var(--current-font);
				color: var(--current-color);
			}
		`;

		this.#ol = document.createElement('ol');
		this.#ol.setAttribute('itemscope', '');
		this.#ol.setAttribute('itemtype', 'https://schema.org/BreadcrumbList');

		this.#shadowRoot.append(style);
		this.#shadowRoot.append(this.#ol);

		this.#observer = new MutationObserver(() => {
			this.#updateBreadcrumbs();
		});
	}

	attributeChangedCallback(name: string, _: string | null, newValue: string | null) {
		if (name === 'separator') {
			const internalValue = newValue === null ? Breadcrumbs.defaultSeparator : newValue;

			if (this.#separator !== internalValue) {
				this.#separator = internalValue;
				this.#updateBreadcrumbs();
			}
		}
	}

	connectedCallback() {
		this.#observer.observe(this, {
			childList: true,
			subtree: false,
			characterData: true,
		});

		this.#updateBreadcrumbs();
	}

	disconnectedCallback() {
		this.#observer.disconnect();
	}

	#checkForInvalidTextNodes(): void {
		for (let i = 0; i < this.childNodes.length; i++) {
			const node = this.childNodes[i];
			if (
				node &&
				node.nodeType === Node.TEXT_NODE &&
				node.textContent &&
				node.textContent.trim()
			) {
				throw new Error(
					'Text nodes are not allowed. All items must be explicitly specified as <a> elements. Example: <a href="/path">text</a>',
				);
			}
		}
	}

	#createBreadcrumbItem({
		text,
		href,
		position,
		isCurrent = false,
		isLast = false,
	}: {
		text: string;
		href: string;
		position: number;
		isCurrent?: boolean;
		isLast?: boolean;
	}): HTMLLIElement {
		const li = document.createElement('li');

		li.setAttribute('itemscope', '');
		li.setAttribute('itemprop', 'itemListElement');
		li.setAttribute('itemtype', 'https://schema.org/ListItem');

		const link = document.createElement('a');
		link.setAttribute('itemscope', '');
		link.setAttribute('itemprop', 'item');
		link.setAttribute('itemtype', 'https://schema.org/WebPage');

		link.setAttribute('href', href);
		link.setAttribute('itemid', href);

		if (isCurrent) {
			link.setAttribute('aria-current', 'page');
		}

		const nameSpan = document.createElement('span');
		nameSpan.setAttribute('itemprop', 'name');
		nameSpan.textContent = text;
		link.append(nameSpan);

		const positionMeta = document.createElement('meta');
		positionMeta.setAttribute('itemprop', 'position');
		positionMeta.setAttribute('content', position.toString());

		li.append(link);
		li.append(positionMeta);

		if (!isLast) {
			const separator = document.createElement('span');
			separator.setAttribute('aria-hidden', 'true');
			separator.part.add('separator');
			separator.textContent = this.separator;
			li.append(separator);
		}

		return li;
	}

	#updateBreadcrumbs() {
		this.#ol.innerHTML = '';

		this.#checkForInvalidTextNodes();

		const links = [...this.querySelectorAll('a')];
		if (links.length === 0) return;

		for (let i = 0; i < links.length; i++) {
			const link = links[i];
			if (!link) continue;

			const isLast = i === links.length - 1;
			const href = link.getAttribute('href');

			if (!href) {
				throw new Error(
					`Breadcrumb link (${link.textContent || 'noname'}) requires href attribute`,
				);
			}

			const isCurrent = isLast || link.hasAttribute('aria-current');

			const li = this.#createBreadcrumbItem({
				text: link.textContent || '',
				href: href,
				position: i + 1,
				isCurrent: isCurrent,
				isLast: isLast,
			});

			this.#ol.append(li);
		}
	}

	static readonly defaultSeparator = '/';

	static defaultStyle = Object.freeze({
		separatorColor: 'currentColor',
		separatorSpacingValue: 0.5,
		separatorSpacingUnit: 'em' as const satisfies LengthUnit,
		color: 'currentColor',
		currentColor: 'currentColor',
		font: 'inherit',
		currentFont: 'inherit',
	} as const);

	static get observedAttributes() {
		return ['separator'];
	}
}

/**
 * @param prefix
 */
export function defineBreadcrumbs(prefix: string): string {
	const tagName = `${prefix}-breadcrumbs`;
	if (!customElements.get(tagName)) {
		customElements.define(tagName, Breadcrumbs);
	}
	return tagName;
}
