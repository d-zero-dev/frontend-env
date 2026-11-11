export default function CPagination() {
	return (
		<nav className="c-pagination" aria-label="ページ番号">
			<div className="c-pagination__prev">
				<a data-disabled="true">prev</a>
			</div>
			<div className="c-pagination__next">
				<a href="___NEXT_PAGE___" rel="next">
					next
				</a>
			</div>
			<ol className="c-pagination__numbers">
				<li className="c-pagination__number">
					<a aria-current="page">1</a>
				</li>
				<li className="c-pagination__number">
					<a href="___NEXT_PAGE___">2</a>
				</li>
				<li className="c-pagination__number">
					<a href="___NEXT_PAGE___">3</a>
				</li>
				<li className="c-pagination__number">
					<a href="___NEXT_PAGE___">4</a>
				</li>
			</ol>
		</nav>
	);
}
