import type { PageProps } from 'kamado/jsx';

import { breadcrumbLabel, isTopPage } from '../helpers/breadcrumb.ts';

type Props = Pick<PageProps, 'breadcrumbs' | 'site'>;

const HOME_TITLE = 'Home';

export default function CNavBreadcrumb({ breadcrumbs, site }: Props) {
	return (
		<div className="c-nav-breadcrumb">
			<ol itemScope itemType="https://schema.org/BreadcrumbList">
				{breadcrumbs.map((link, index) => (
					<li
						className="c-nav-breadcrumb__item"
						itemScope
						itemProp="itemListElement"
						itemType="https://schema.org/ListItem"
						data-breadcrumb={isTopPage(link, site.baseURL) ? 'home' : undefined}>
						<a
							href={link.href}
							itemScope
							itemProp="item"
							itemType="https://schema.org/WebPage"
							itemID={link.href}>
							<span itemProp="name">
								{isTopPage(link, site.baseURL) ? HOME_TITLE : breadcrumbLabel(link)}
							</span>
						</a>
						<meta itemProp="position" content={String(index + 1)} />
						{index < breadcrumbs.length - 1 && (
							<span className="c-nav-breadcrumb__separetor"></span>
						)}
					</li>
				))}
			</ol>
		</div>
	);
}
