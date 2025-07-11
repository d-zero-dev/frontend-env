import path from 'node:path';

import { config } from 'dotenv';

config();

/**
 * @type {import('@burger-editor/local').LocalServerConfig}
 */
export default {
	documentRoot: path.join(import.meta.dirname, 'htdocs'),
	lang: 'ja',
	stylesheets: ['/css/style.css'],
	classList: ['c-content-main'],
	editableArea: '.c-content-main',
	googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
	sampleImagePath: '/files/images/sample.png',
	filesDir: {
		image: '/files/images',
		other: '/files/others',
	},
	port: 8100,
	open: true,
};
