import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { Cache } from '@d-zero/shared/cache';
import ImageSize from 'image-size';

/**
 * @typedef {Object} Size
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} ImageSizesOptions
 * @property {string} rootDir
 * @property {string} selector
 * @property {string[]} ext
 */

const sizeOf = promisify(ImageSize);

/**
 *
 * @param {HTMLElement} documentElement
 * @param {ImageSizesOptions} options
 * @returns
 */
export async function imageSizes(
	documentElement,
	{
		rootDir,
		selector,
		// https://github.com/image-size/image-size?tab=readme-ov-file#supported-formats
		ext = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'svg'],
	},
) {
	/**
	 * @type {Cache<Size>}
	 */
	const cache = new Cache('@d-zero/builder/image-sizes');

	const images = [...documentElement.querySelectorAll('img, picture > source')];

	for (const img of images) {
		if (selector && !img.matches(selector)) {
			continue;
		}

		const src = img.getAttribute('src');

		if (
			!src ||
			src.startsWith('data:') ||
			src.startsWith('http') ||
			src.startsWith('//') ||
			!ext.some((e) => src.endsWith(`.${e}`))
		) {
			continue;
		}

		const filePath = path.join(rootDir, ...src.split('/'));
		const stats = await fs.stat(filePath).catch(() => null);

		if (!stats) {
			continue;
		}

		const size = stats.size;

		const cacheKey = `${src}:${size}`;

		const cached = await cache.load(cacheKey);

		if (cached) {
			// Update the DOM
			img.setAttribute('width', cached.width);
			img.setAttribute('height', cached.height);
			continue;
		}

		const imageSize = await sizeOf(filePath);

		if (!imageSize || !(imageSize.width && imageSize.height)) {
			continue;
		}

		img.setAttribute('width', imageSize.width);
		img.setAttribute('height', imageSize.height);

		await cache.store(cacheKey, imageSize);
	}
}
