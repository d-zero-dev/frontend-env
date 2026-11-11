interface Props {
	readonly title?: string;
}

export default function CTitlePage({ title }: Props) {
	return (
		<div className="c-title-page">
			<h1>{title}</h1>
		</div>
	);
}
