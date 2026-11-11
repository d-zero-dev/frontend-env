import type { LayoutProps } from 'kamado/jsx';

import CFooter from '../component/c-footer.tsx';
import CHeader from '../component/c-header.tsx';
import Meta from '../mixin/meta.tsx';

export default function LHome({ content, page, meta, site, breadcrumbs }: LayoutProps) {
	return (
		<html lang={meta.lang || 'ja'}>
			<head>
				<Meta page={page} meta={meta} site={site} breadcrumbs={breadcrumbs} />
			</head>
			<body className="l-home">
				<div className="l-home__base">
					<div className="l-home__header">
						<CHeader isHome />
					</div>
					<div className="l-home__main">
						<main dangerouslySetInnerHTML={{ __html: content }} />
					</div>
					<div className="l-home__footer">
						<CFooter />
					</div>
				</div>
			</body>
		</html>
	);
}
