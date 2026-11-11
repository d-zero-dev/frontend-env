export default function Page301FormConfirm() {
	return (
		<div className="p-form">
			<div className="p-form__main">
				<div className="c-content-main">
					<div className="cc-form-description">
						<p>以下の内容を送信します。</p>
					</div>
					<form
						className="cc-form"
						id="MailMessageIndexForm"
						action="__PATH_TO__"
						encType="multipart/form-data"
						method="post"
						acceptCharset="utf-8"
						noValidate>
						<input type="hidden" name="_method" value="POST" />
						<input
							id="Token__TOKEN__"
							type="hidden"
							name="data[_Token][key]"
							value="__TOKEN__"
						/>
						<input id="MailMessageMode" type="hidden" name="data[MailMessage][mode]" />
						<div className="cc-form-field-list">
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>フィールドグループ名</span>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">前見出し</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment"></span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>単体フィールド名</span>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">前見出し</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>氏名</span>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">姓</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">名</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>フリガナ</span>
										<span className="optional">任意</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">セイ</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">メイ</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>住所</span>
										<span className="optional">任意</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">〒</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
										<div className="mail-field" data-type="select">
											<span className="mail-before-attachment">都道府県</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">市区町村</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">番地</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>チェックボックス単体</span>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="checkbox">
											<span className="mail-before-attachment">
												チェックボックス前見出し
											</span>
											<div>
												<ul>
													<li>__選択項目1__</li>
													<li>__選択項目2__</li>
												</ul>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>チェックボックス</span>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="checkbox">
											<div>
												<ul>
													<li>__選択項目1__</li>
													<li>__選択項目2__</li>
												</ul>
											</div>
										</div>
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment">その他</span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>電話番号</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment"></span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>メールアドレス</span>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="text">
											<span className="mail-before-attachment"></span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>生まれ年</span>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="select">
											<span className="mail-before-attachment"></span>
											<span className="mail-input">__入力内容__</span>
											<span className="mail-after-attachment"></span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>性別</span>
										<span className="optional">任意</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="radio">
											<span className="mail-before-attachment"></span>
											<div className="mail-radio">
												<span className="mail-input">__選択項目__</span>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>テキストエリア</span>
										<span className="optional">任意</span>
									</div>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="textarea">
											<span className="mail-before-attachment"></span>
											<p className="mail-input">__入力内容__</p>
											<span className="mail-after-attachment"></span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>テキストエリア</span>
										<span className="optional">任意</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="textarea">
											<span className="mail-before-attachment">前見出し</span>
											<p className="mail-input">__入力内容__</p>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset">
								<div>
									<div className="cc-form-fieldset-heading">
										<span>ファイル添付</span>
										<span className="optional">任意</span>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" data-type="file">
											<span className="mail-before-attachment">前見出し</span>
											<span className="mail-input">__ファイル名__</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="cc-form-submit">
							<button type="submit">
								<span>入力画面に戻る</span>
							</button>
							<button type="submit">
								<span>送信する</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
