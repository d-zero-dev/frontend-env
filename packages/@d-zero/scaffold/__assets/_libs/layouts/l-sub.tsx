import type { LayoutProps } from '../types/kamado.ts';

import CFooter from '../component/c-footer.tsx';
import CHeader from '../component/c-header.tsx';
import CNavBreadcrumb from '../component/c-nav-breadcrumb.tsx';
import CPagination from '../component/c-pagination.tsx';
import CTitlePage from '../component/c-title-page.tsx';
import Meta from '../mixin/meta.tsx';

export default function LSub({ content, page, meta, site, breadcrumbs }: LayoutProps) {
	return (
		<html lang={meta.lang || 'ja'}>
			<head>
				<Meta page={page} meta={meta} site={site} breadcrumbs={breadcrumbs} />
			</head>
			<body className="l-sub">
				<div className="l-sub__base">
					<div className="l-sub__header">
						<CHeader />
					</div>
					<div className="l-sub__main">
						<main>
							<article className="l-sub__content">
								<div className="l-sub__title-page">
									<CTitlePage title={meta.title} />
								</div>
								<div className="l-sub__nav-breadcrumb">
									<CNavBreadcrumb breadcrumbs={breadcrumbs} site={site} />
								</div>
								<div
									className="l-sub__content-body"
									dangerouslySetInnerHTML={{ __html: content }}
								/>
								{meta.hasPagination && (
									<div className="l-sub__pagination">
										<CPagination />
									</div>
								)}
							</article>
						</main>
					</div>
					<div className="l-sub__footer">
						<CFooter />
					</div>
				</div>
			</body>
		</html>
	);
}
