import type { AssetResolver } from '../types.js';

import { Readable } from 'node:stream';

import { RewritingStream } from 'parse5-html-rewriting-stream';

import { assetAttributesFor, parseSrcset, serializeSrcset } from './selectors.js';

/**
 * Rewrites asset references inside an HTML document by streaming the source
 * through `parse5-html-rewriting-stream`. The rewriter only touches tag tokens
 * that match {@link assetAttributesFor} — everything else (text, comments,
 * scripts' bodies) is passed through using the raw source representation, so
 * unmodified bytes are bit-identical to the input.
 *
 * `resolver` is invoked once per `(url, attribute, tagName)` triple. Returning
 * `null` leaves the original value untouched. `srcset` is decomposed into its
 * URL candidates; each URL is resolved independently and the descriptor
 * (`2x`, `768w`, etc.) is preserved.
 * @param html
 * @param resolver
 */
export async function rewriteAssetRefs(
	html: string,
	resolver: AssetResolver,
): Promise<string> {
	const rewriter = new RewritingStream();

	rewriter.on('startTag', (startTag) => {
		const attributes = assetAttributesFor(startTag.tagName);
		if (attributes.size > 0) {
			for (const attribute of startTag.attrs) {
				if (!attributes.has(attribute.name)) {
					continue;
				}
				attribute.value = rewriteAttributeValue(
					attribute.value,
					attribute.name,
					startTag.tagName,
					startTag.attrs,
					resolver,
				);
			}
		}
		rewriter.emitStartTag(startTag);
	});

	return await streamToString(html, rewriter);
}

/**
 *
 * @param original
 * @param attributeName
 * @param tagName
 * @param tagAttrs
 * @param resolver
 */
function rewriteAttributeValue(
	original: string,
	attributeName: string,
	tagName: string,
	tagAttrs: readonly { name: string; value: string }[],
	resolver: AssetResolver,
): string {
	if (original === '') {
		return original;
	}
	if (attributeName === 'srcset') {
		const candidates = parseSrcset(original);
		const next = candidates.map(({ url, descriptor }) => {
			const replaced = resolver(url, attributeName, tagName, tagAttrs);
			return { url: replaced ?? url, descriptor };
		});
		return serializeSrcset(next);
	}
	const replaced = resolver(original, attributeName, tagName, tagAttrs);
	return replaced ?? original;
}

/**
 *
 * @param html
 * @param rewriter
 */
async function streamToString(html: string, rewriter: RewritingStream): Promise<string> {
	const chunks: string[] = [];
	rewriter.on('data', (chunk: string | Buffer) => {
		chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
	});

	const source = Readable.from([html]);
	return await new Promise<string>((resolve, reject) => {
		// Forward errors from both ends so the promise always settles.
		const fail = (error: Error) => {
			source.unpipe(rewriter);
			reject(error);
		};
		source.once('error', fail);
		rewriter.once('error', fail);
		rewriter.once('end', () => resolve(chunks.join('')));
		source.pipe(rewriter);
	});
}
