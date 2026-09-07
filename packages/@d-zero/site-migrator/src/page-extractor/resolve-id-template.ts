export interface ResolveIdTemplateOptions {
	/** HTML (or any text) containing `{{<id>}}` tokens to resolve. */
	readonly html: string;
	/** Mapping from page id to its resolved URL. */
	readonly idMap: ReadonlyMap<number, string>;
	/**
	 * Invoked once per unresolved token. The token is left untouched in the
	 * output; the callback is the channel callers use to warn / collect /
	 * escalate without coupling the resolver to any specific log sink.
	 */
	readonly onUnresolved?: (id: number) => void;
}

/**
 * Matches the `{{<id>}}` tokens that {@link rewritePageRefs} emits. The
 * integer body is captured so the resolver never has to re-parse it. Non-digit
 * mustaches (e.g. `{{name}}` from other templating layers) are deliberately
 * skipped — id tokens are always digits because they originate from
 * {@link assignPageIds}.
 */
const TOKEN_RE = /\{\{(\d+)\}\}/g;

/**
 * Replaces every `{{<id>}}` token in `html` with the URL registered for that
 * id in `idMap`. Unknown ids are left as `{{<id>}}` so the broken link is
 * visible at runtime instead of disappearing silently; `onUnresolved` is the
 * notification channel for those.
 *
 * Side-channel suffixes added by {@link rewritePageRefs} (`{{42}}?q=foo#frag`)
 * sit *outside* the token and survive unchanged — the resolver swaps only the
 * `{{42}}` portion, so the resulting `<resolved>/about/?q=foo#frag` is
 * concatenated for free. If the resolved URL itself contains a query (e.g.
 * `/list?p=1`) and the source token also carried `?q=foo`, the concatenation
 * yields two `?` separators; callers that need to merge query strings must do
 * it themselves before calling.
 *
 * Pure function — no I/O, no globals — so it composes equally well in build
 * hooks, dev-server transforms, or tests.
 * @param options
 * @example
 * resolveIdTemplate({
 *   html: '<a href="{{42}}?q=foo#top">about</a>',
 *   idMap: new Map([[42, '/about/']]),
 * });
 * // → '<a href="/about/?q=foo#top">about</a>'
 */
export function resolveIdTemplate(options: ResolveIdTemplateOptions): string {
	const { html, idMap, onUnresolved } = options;
	return html.replaceAll(TOKEN_RE, (match, idDigits: string) => {
		const id = Number(idDigits);
		const url = idMap.get(id);
		if (url === undefined) {
			onUnresolved?.(id);
			return match;
		}
		return url;
	});
}
