import type { PageProps } from '@/types/kamado.ts';

import Meta from '@/mixin/meta.tsx';

export const meta = { title: 'テストページ' };

export default function Index({
	page,
	meta,
	site,
	titleList,
}: Pick<PageProps, 'page' | 'meta' | 'site' | 'titleList'>) {
	return (
		<html lang="ja">
			<head>
				<Meta page={page} meta={meta} site={site} titleList={titleList} />
			</head>
			<body>
				<main>
					<h1>Hello World!</h1>
				</main>
			</body>
		</html>
	);
}
