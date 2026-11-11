import type { PageProps } from '../types/kamado.ts';

import { pageTitle } from '../helpers/breadcrumb.ts';

import MetaBasercms from './meta-basercms.tsx';

type Props = Pick<PageProps, 'page' | 'meta' | 'site' | 'breadcrumbs'>;

export default function Meta({ page, meta, site, breadcrumbs }: Props) {
	const { description, ogType, ogDescription, ogImage, ogCard } = meta;
	const host = site.host ?? '';
	const url = host + page.url;
	const metaTitle = pageTitle(breadcrumbs, site);
	const imageUrl = host + (ogImage || '/img/ogp.png');
	const summary = ogDescription || description || '';

	return (
		<>
			<meta charSet="utf-8" />
			<meta name="viewport" content="width=device-width" />
			<title>{metaTitle}</title>
			<meta name="format-detection" content="telephone=no" />
			<meta name="description" content={description || ''} />
			<meta property="og:type" content={ogType || 'website'} />
			{site.siteName && <meta property="og:site_name" content={site.siteName} />}
			{summary && <meta property="og:description" content={summary} />}
			{host && (
				<>
					<meta property="og:url" content={url} />
					<meta property="og:image" content={imageUrl} />
				</>
			)}
			<meta name="twitter:card" content={ogCard || 'summary_large_image'} />
			<meta name="twitter:url" content={url} />
			{site.siteName && <meta name="twitter:title" content={site.siteName} />}
			{summary && <meta name="twitter:description" content={summary} />}
			{host && <meta name="twitter:image" content={imageUrl} />}
			<link rel="icon" href="/favicon.png" />
			<link rel="apple-touch-icon" href="/img/apple-touch-icon.png" />
			<link href="/css/style.css" rel="stylesheet" />
			<MetaBasercms />
			<script src="/js/script.js" type="module"></script>
		</>
	);
}
