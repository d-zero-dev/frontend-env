import type { Breadcrumb } from '../types/kamado.ts';

interface Props {
	readonly breadcrumbs: readonly Breadcrumb[];
}

const HOME_TITLE = 'Home';

export default function CNavBreadcrumb({ breadcrumbs }: Props) {
	return (
		<div className="c-nav-breadcrumb">
			<ol itemScope itemType="https://schema.org/BreadcrumbList">
				{breadcrumbs.map((link, index) => (
					<li
						className="c-nav-breadcrumb__item"
						itemScope
						itemProp="itemListElement"
						itemType="https://schema.org/ListItem"
						data-breadcrumb={link.href === '/' ? 'home' : undefined}>
						<a
							href={link.href}
							itemScope
							itemProp="item"
							itemType="https://schema.org/WebPage"
							itemID={link.href}>
							<span itemProp="name">
								{link.href === '/' ? HOME_TITLE || link.title : link.title}
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
