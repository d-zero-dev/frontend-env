import type { MainTagInfo } from './parse-main-tag.js';

const ESCAPE_PATTERN = /([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g;

/**
 * Builds a CSS selector that uniquely targets the matched main-content
 * element, for passing into anatomist's `mainContentSelector` option so it
 * analyzes the exact same element {@link import('./extract-main-content.js').extractMainContent}
 * matched, instead of re-resolving one independently via its own
 * heuristics. This is what makes live-analysis structural consistency
 * guaranteed (#978) rather than merely checked after the fact.
 *
 * Shape mirrors anatomist's own `buildDiagnosticSelector`
 * (`tag#id.class1.class2…`) so a live re-fetch that structurally matches
 * the archived snapshot resolves to the same element.
 *
 * Node has no global `CSS.escape`, so special characters in `id`/class
 * tokens (e.g. a Tailwind-style `lg:w-1/2`) are escaped with the same
 * fallback regex anatomist itself falls back to outside a browser realm —
 * without it, such a token would produce an invalid/misinterpreted
 * selector and `querySelector` would silently miss the element.
 * @param tag
 */
export function buildMainContentSelector(tag: MainTagInfo): string {
	const idPart = tag.id === null ? '' : `#${cssEscape(tag.id)}`;
	const classPart = tag.classList.map((token) => `.${cssEscape(token)}`).join('');
	return `${tag.tagName}${idPart}${classPart}`;
}

/**
 * @param value
 */
function cssEscape(value: string): string {
	return value.replaceAll(ESCAPE_PATTERN, '\\$1');
}
