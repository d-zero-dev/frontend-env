import type { ArchiveSession } from '../types.js';

import { describe, expect, test, vi } from 'vitest';

vi.mock('@nitpicker/query', () => ({
	getPageDetail: vi.fn(),
}));

const { getPageDetail } = await import('@nitpicker/query');
const { getFrontmatter } = await import('./get-frontmatter.js');
const getPageDetailMock = vi.mocked(getPageDetail);

const FAKE_SESSION = {
	archiveId: 'test',
	accessor: {} as ArchiveSession['accessor'],
	close: () => Promise.resolve(),
} satisfies ArchiveSession;

/**
 * Builds a PageDetail-shaped stub with every flat meta column set to `null` so
 * each test only has to override the columns it cares about. Cast through
 * `as never` because we deliberately omit DB fields the production code
 * doesn't read (links / jsonLd / tags / etc.).
 * @param overrides
 */
const detail = (overrides: Record<string, string | null>) =>
	({
		url: 'https://example.com/x',
		status: 200,
		statusText: 'OK',
		contentType: 'text/html',
		title: null,
		description: null,
		keywords: null,
		lang: null,
		charset: null,
		canonical: null,
		robotsRaw: null,
		ogTitle: null,
		ogDescription: null,
		ogImage: null,
		ogUrl: null,
		ogType: null,
		ogSiteName: null,
		twitterCard: null,
		twitterTitle: null,
		twitterDescription: null,
		twitterImage: null,
		...overrides,
	}) as never;

describe('getFrontmatter', () => {
	test('returns null when the archive has no row for the URL', async () => {
		getPageDetailMock.mockResolvedValueOnce(null);
		await expect(
			getFrontmatter(FAKE_SESSION, 'https://example.com/missing'),
		).resolves.toBeNull();
	});

	test('maps each non-empty DB column to its Frontmatter field', async () => {
		getPageDetailMock.mockResolvedValueOnce(
			detail({
				title: 'ニュース',
				description: 'desc',
				keywords: 'a, b, c',
				lang: 'ja',
				charset: 'utf8',
				canonical: 'https://example.com/x',
				robotsRaw: 'index, follow',
				ogTitle: 'ogt',
				ogDescription: 'ogd',
				ogImage: 'https://example.com/ogp.png',
				ogUrl: 'https://example.com/x',
				ogType: 'website',
				ogSiteName: 'Example',
				twitterCard: 'summary',
				twitterTitle: 'twt',
				twitterDescription: 'twd',
				twitterImage: 'https://example.com/tw.png',
			}),
		);

		await expect(getFrontmatter(FAKE_SESSION, 'https://example.com/x')).resolves.toEqual({
			title: 'ニュース',
			description: 'desc',
			keywords: 'a, b, c',
			og: {
				title: 'ogt',
				description: 'ogd',
				image: 'https://example.com/ogp.png',
				url: 'https://example.com/x',
				type: 'website',
				siteName: 'Example',
			},
			twitter: {
				card: 'summary',
				title: 'twt',
				description: 'twd',
				image: 'https://example.com/tw.png',
			},
			canonical: 'https://example.com/x',
			lang: 'ja',
			robots: 'index, follow',
			charset: 'utf8',
		});
	});

	test('omits empty-string and null columns', async () => {
		getPageDetailMock.mockResolvedValueOnce(
			detail({
				title: 'T',
				description: '',
				keywords: null,
				ogTitle: 'OG',
				ogDescription: '',
			}),
		);

		await expect(getFrontmatter(FAKE_SESSION, 'https://example.com/x')).resolves.toEqual({
			title: 'T',
			og: { title: 'OG' },
		});
	});

	test('splits title on full-width vertical bar and emits rawTitle', async () => {
		getPageDetailMock.mockResolvedValueOnce(detail({ title: 'ニュース｜製品｜会社' }));

		await expect(getFrontmatter(FAKE_SESSION, 'https://example.com/x')).resolves.toEqual({
			title: 'ニュース',
			rawTitle: 'ニュース｜製品｜会社',
		});
	});

	test('splits og.title independently from title', async () => {
		getPageDetailMock.mockResolvedValueOnce(
			detail({
				title: 'Solo',
				ogTitle: 'OG Head | OG Tail',
				twitterTitle: 'TW Only',
			}),
		);

		await expect(getFrontmatter(FAKE_SESSION, 'https://example.com/x')).resolves.toEqual({
			title: 'Solo',
			og: { title: 'OG Head', rawTitle: 'OG Head | OG Tail' },
			twitter: { title: 'TW Only' },
		});
	});

	test('omits og / twitter blocks entirely when all their columns are empty', async () => {
		getPageDetailMock.mockResolvedValueOnce(detail({ title: 'T' }));

		await expect(getFrontmatter(FAKE_SESSION, 'https://example.com/x')).resolves.toEqual({
			title: 'T',
		});
	});

	test('treats whitespace-only DB columns as empty (no placeholder strings leak)', async () => {
		getPageDetailMock.mockResolvedValueOnce(
			detail({
				title: 'T',
				description: '   ',
				keywords: '\t\n',
				ogTitle: 'OG',
				ogDescription: '   ',
			}),
		);

		await expect(getFrontmatter(FAKE_SESSION, 'https://example.com/x')).resolves.toEqual({
			title: 'T',
			og: { title: 'OG' },
		});
	});
});
