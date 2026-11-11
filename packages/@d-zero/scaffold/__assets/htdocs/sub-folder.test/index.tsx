import type { PageProps } from 'kamado/jsx';

import Meta from '@/mixin/meta.tsx';

export const meta = { title: 'テストページ' };

export default function Index({
	page,
	meta,
	site,
	breadcrumbs,
}: Pick<PageProps, 'page' | 'meta' | 'site' | 'breadcrumbs'>) {
	return (
		<html lang="ja">
			<head>
				<Meta page={page} meta={meta} site={site} breadcrumbs={breadcrumbs} />
			</head>
			<body>
				<main>
					<h1>Hello World!</h1>
				</main>
			</body>
		</html>
	);
}
