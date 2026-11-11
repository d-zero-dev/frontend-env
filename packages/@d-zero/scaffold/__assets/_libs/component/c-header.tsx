interface Props {
	/** トップページのとき、サイト名を`h1`にする */
	readonly isHome?: boolean;
}

export default function CHeader({ isHome = false }: Props) {
	const siteName = (
		<a href="__URL__">
			<span>サイトタイトル</span>
		</a>
	);

	return (
		<header className="c-header">
			<div className="c-header__body">
				<div className="c-header__title">
					<div className="c-header__site-name">
						{isHome ? <h1>{siteName}</h1> : <div>{siteName}</div>}
					</div>
					<p className="c-header__description">
						{/* spell-checker:disable-next-line */}
						Lorem ipsum dolor sit amet, consectetur adipisicing elit.
					</p>
				</div>
				<div className="c-header__info">
					<ul className="c-header__links">
						<li>
							<a href="__URL__">
								<span>会社概要</span>
							</a>
						</li>
						<li>
							<a href="__URL__">
								<span>新着情報</span>
							</a>
						</li>
						<li>
							<a href="__URL__">
								<span>サイトマップ</span>
							</a>
						</li>
					</ul>
					<div className="c-header__tel">
						<a href="tel:0000000000">
							<span>00-0000-0000</span>
						</a>
					</div>
				</div>
			</div>
		</header>
	);
}
