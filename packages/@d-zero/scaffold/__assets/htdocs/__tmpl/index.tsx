import { html } from 'kamado/jsx';

export const meta = { title: 'テンプレート一覧' };

export default function Index() {
	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta httpEquiv="X-UA-Compatible" content="ie=edge" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>テンプレート一覧</title>
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
				/>
				<style
					dangerouslySetInnerHTML={{
						__html: '.list-group-item a {\n\tdisplay: block flow;\n}',
					}}
				/>
			</head>
			<body>
				<div className="c-content-main">
					<main className="container">
						<h1 className="my-5">テンプレート</h1>
						<div className="alert alert-warning">
							<h2 className="alert-heading">⚠️ コーディング時の注意</h2>
							<h3 className="mt-4">デザイン確認</h3>
							<ul>
								<li>ブレイクポイントは確認しましたか？</li>
								<li>必要なパーツは揃っていますか？</li>
								<li>PCの横の最大幅が大きすぎないですか？</li>
								<li>本文の1行の文字数は適切ですか？読みにくくないですか？</li>
								<li>
									ウィンドウサイズを変更したときに、見切れる設計になっていませんか？
								</li>
								<li>SPでの文字が小さすぎないですか？実寸で読みにくくないですか？</li>
								<li>CMS要件に合っていますか？</li>
							</ul>
							<hr />
							<h3>コーディング確認</h3>
							<ul>
								<li>
									<a href="https://guidelines.d-zero.co.jp/#%F0%9F%8C%90-%E5%AF%BE%E5%BF%9C%E3%83%95%E3%82%99%E3%83%A9%E3%82%A6%E3%82%B5%E3%82%99%E3%81%A8%E3%83%86%E3%82%99%E3%83%8F%E3%82%99%E3%82%A4%E3%82%B9">
										対応ブラウザ
									</a>
									は確認しましたか？
								</li>
								<li>メタ情報の手配は済んでいますか？</li>
								<li>
									利用するJavaScriptライブラリは把握できていますか？ライセンスは確認しましたか？
								</li>
								<li>画像のファイルサイズを気にしていますか？拡張子は適切ですか？</li>
								<li>
									<a href="https://guidelines.d-zero.co.jp/js.html#%F0%9F%90%8E-%E3%83%8F%E3%82%9A%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%B3%E3%82%B9%E3%82%92%E6%84%8F%E8%AD%98%E3%81%97%E3%81%9F%E5%AE%9F%E8%A3%85">
										パフォーマンスに影響を及ぼす処理
									</a>
									を書いていませんか？
								</li>
								<li>フォーカスインジケーターを消していませんか？</li>
								<li>
									OSのスクロールバー表示をオンにして、スクロールバーの発生を確認していますか？
								</li>
							</ul>
						</div>
						<div className="list-group">
							{html(
								'<!-- ⚠️ 注意: ページを増やす場合、番号は重複しないようにしてください。-->',
							)}
							{html('<!-- トップページは000番台-->')}
							<div className="list-group-item">
								<a href="000_home.html">トップページ</a>
							</div>
							{html('<!-- 詳細ページは100番台-->')}
							<div className="list-group-item">
								<a href="100_sub.html">下層固定ページ・ブログ詳細ページ</a>
							</div>
							{html('<!-- インデックスページは200番台-->')}
							{html('<!-- メールフォームは300番台-->')}
							<div className="list-group-item">
								<a href="300_form_input.html">メールフォーム入力ページ</a>
							</div>
							<div className="list-group-item">
								<a href="301_form_confirm.html">メールフォーム確認ページ</a>
							</div>
							<div className="list-group-item">
								<a href="302_form_complete.html">メールフォーム完了ページ</a>
							</div>
							{html('<!-- その他は400番台-->')}
						</div>
						<div className="list-group mt-5">
							<div className="list-group-item">
								<a href="https://guidelines.d-zero.co.jp" target="_blank">
									📖 コーディングガイドライン
								</a>
							</div>
						</div>
					</main>
				</div>
			</body>
		</html>
	);
}
