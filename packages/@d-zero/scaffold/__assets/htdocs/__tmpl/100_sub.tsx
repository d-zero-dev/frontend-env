import type { PageProps } from 'kamado/jsx';

export default function Page100Sub({ data }: Pick<PageProps, 'data'>) {
	return (
		<div className="p-sub-default">
			<div className="p-sub-default__main">
				<div
					className="c-content-main"
					dangerouslySetInnerHTML={{ __html: data['bge-blocks'] }}
				/>
			</div>
		</div>
	);
}
