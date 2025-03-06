import type { ImageSizesOptions, ImageSize } from './types.js';

import fs from 'node:fs/promises';
import path from 'node:path';

import { Cache } from '@d-zero/shared/cache';
import { imageSize } from 'image-size';

/**
 * Asynchronously retrieves the dimensions of an image file.
 * @param filePath - The path to the image file to measure
 * @returns A Promise that resolves to an ImageSize object containing the dimensions of the image
 * @throws Will throw an error if the file cannot be read or if the image format is not supported
 */
async function sizeOf(filePath: string): Promise<ImageSize> {
	const buffer = await fs.readFile(filePath);
	const res = imageSize(buffer);
	return res;
}

/**
 *
 * @param documentElement
 * @param options
 * @param options.rootDir
 * @param options.selector
 * @param options.ext
 */
export async function imageSizes(
	documentElement: HTMLElement,
	{
		rootDir,
		selector,
		// https://github.com/image-size/image-size?tab=readme-ov-file#supported-formats
		ext = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'svg'],
	}: ImageSizesOptions,
) {
	const cache = new Cache<ImageSize>('@d-zero/builder/image-sizes');

	const images = [...documentElement.querySelectorAll('img, picture > source')];

	for (const img of images) {
		if (selector && !img.matches(selector)) {
			continue;
		}

		const src = img.getAttribute('src');

		if (
			!src ||
			src.startsWith('data://') ||
			src.startsWith('http://') ||
			src.startsWith('https://') ||
			src.startsWith('//') ||
			!ext.some((e) => src.endsWith(`.${e}`))
		) {
			continue;
		}

		const filePath = path.join(rootDir ?? '', ...src.split('/'));
		const stats = await fs.stat(filePath).catch(() => null);

		if (!stats) {
			continue;
		}

		const size = stats.size;

		const cacheKey = `${src}:${size}`;

		const cached = await cache.load(cacheKey);

		if (cached) {
			// Update the DOM
			img.setAttribute('width', `${cached.width}`);
			img.setAttribute('height', `${cached.height}`);
			continue;
		}

		const imageSize = await sizeOf(filePath);

		if (!imageSize || !(imageSize.width && imageSize.height)) {
			continue;
		}

		img.setAttribute('width', `${imageSize.width}`);
		img.setAttribute('height', `${imageSize.height}`);

		await cache.store(cacheKey, imageSize);
	}
}
