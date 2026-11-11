import { html } from 'kamado/jsx';

export default function Page300FormInput() {
	return (
		<div className="p-form">
			<div className="p-form__main">
				<div className="c-content-main">
					{html('<!-- CMS要件: メールフォーム概要-->')}
					<div className="cc-form-description">
						<p>
							こちらのフォームよりご応募ください。記入いただいた内容を検討の上、弊社人事担当者よりメールにてご返信いたします。
						</p>
					</div>
					{html('<!-- CMS要件: メールフォーム概要ここまで-->')}
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
							{html('<!-- CMS要件: グループ化している場合は fieldset/legend の構造-->')}
							<div className="cc-form-fieldset" id="GroupMailMessageField1">
								<fieldset>
									<legend className="cc-form-fieldset-heading">
										<span>フィールドグループ名</span>
										<span className="required">必須</span>
									</legend>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										{html('<!-- CMS要件: 入力タイプによって data-type 属性を変更-->')}
										<div
											className="mail-field"
											id="FieldMailMessageField1"
											data-type="text">
											{html(
												'<!-- CMS要件: グループ化している場合は 前見出し は labelとする-->',
											)}
											<label
												className="mail-before-attachment"
												htmlFor="MailMessageField1">
												前見出し
											</label>
											<span className="mail-input">
												<input
													id="MailMessageField1"
													type="text"
													name="data[MailMessage][field1]"
													maxLength={255}
													required
												/>
											</span>
											<span className="mail-after-attachment">後見出し</span>
											<div className="mail-description">説明文</div>
											<div className="error-message">エラーメッセージ</div>
										</div>
										<div
											className="mail-field"
											id="FieldMailMessageField2"
											data-type="text">
											<span className="mail-before-attachment"></span>
											<span className="mail-input">
												<input
													id="MailMessageField2"
													type="text"
													name="data[MailMessage][field2]"
													maxLength={255}
													required
												/>
											</span>
											{html(
												'<!-- CMS要件: グループ化している場合は 前見出しが空であれば 後見出しを labelとする-->',
											)}
											<label
												className="mail-after-attachment"
												htmlFor="MailMessageField2">
												後見出し
											</label>
											<div className="mail-description">説明文</div>
											<div className="error-message">エラーメッセージ</div>
										</div>
									</div>
								</fieldset>
							</div>
							{html('<!-- CMS要件: グループ化していない場合は div/label の構造-->')}
							<div className="cc-form-fieldset" id="GroupMailMessageField3">
								<div>
									<div className="cc-form-fieldset-heading">
										<label htmlFor="MailMessageField3">単体フィールド名</label>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div
											className="mail-field"
											id="FieldMailMessageField3"
											data-type="text">
											{html(
												'<!-- CMS要件: グループ化していない場合は 前見出しも後見出しも label にはならない-->',
											)}
											<span className="mail-before-attachment">前見出し</span>
											<span className="mail-input">
												<input
													id="MailMessageField3"
													type="text"
													name="data[MailMessage][field3]"
													maxLength={255}
													required
												/>
											</span>
											<span className="mail-after-attachment">後見出し</span>
											<div className="mail-description">説明文</div>
											<div className="error-message">エラーメッセージ</div>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset" id="GroupMailMessageName">
								<fieldset>
									<legend className="cc-form-fieldset-heading">
										<span>氏名</span>
										<span className="required">必須</span>
									</legend>
									<div className="cc-form-fieldset-body">
										<div
											className="mail-field"
											id="FieldMailMessageLastName"
											data-type="text">
											<label
												className="mail-before-attachment"
												htmlFor="MailMessageLastName">
												姓
											</label>
											<span className="mail-input">
												<input
													id="MailMessageLastName"
													type="text"
													name="data[MailMessage][LastName]"
													required
												/>
											</span>
											<span className="mail-after-attachment"></span>
											<div className="mail-description"></div>
										</div>
										<div
											className="mail-field"
											id="FieldMailMessageFirstName"
											data-type="text">
											<label
												className="mail-before-attachment"
												htmlFor="MailMessageFirstName">
												名
											</label>
											<span className="mail-input">
												<input
													id="MailMessageFirstName"
													type="text"
													name="data[MailMessage][FirstName]"
													required
												/>
											</span>
											<span className="mail-after-attachment"></span>
											<div className="mail-description"></div>
										</div>
									</div>
								</fieldset>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageNameKana1">
								<fieldset>
									<legend className="cc-form-fieldset-heading">
										<span>フリガナ</span>
										<span className="optional">任意</span>
									</legend>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">カタカナで入力してください</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div
											className="mail-field"
											id="FieldMailMessageLastNameKana"
											data-type="text">
											<label
												className="mail-before-attachment"
												htmlFor="MailMessageLastNameKana">
												セイ
											</label>
											<span className="mail-input">
												<input
													id="MailMessageLastNameKana"
													type="text"
													name="data[MailMessage][LastNameKana]"
													required
												/>
											</span>
											<span className="mail-after-attachment"></span>
											<div className="mail-description"></div>
										</div>
										<div
											className="mail-field"
											id="FieldMailMessageFirstNameKana"
											data-type="text">
											<label
												className="mail-before-attachment"
												htmlFor="MailMessageFirstNameKana">
												メイ
											</label>
											<span className="mail-input">
												<input
													id="MailMessageFirstNameKana"
													type="text"
													name="data[MailMessage][FirstNameKana]"
													required
												/>
											</span>
											<span className="mail-after-attachment"></span>
											<div className="mail-description"></div>
										</div>
									</div>
								</fieldset>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageZip">
								<fieldset>
									<legend className="cc-form-fieldset-heading">
										<span>住所</span>
										<span className="optional">任意</span>
									</legend>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" id="FieldMessageZip" data-type="text">
											<label className="mail-before-attachment" htmlFor="MailMessageZip">
												〒
											</label>
											<span className="mail-input">
												<input
													id="MailMessageZip"
													name="data[MailMessage][zip]"
													size={10}
													maxLength={8}
													type="text"
												/>
											</span>
											<span className="mail-after-attachment"></span>
											<div className="mail-description">
												ハイフンを除く半角数字で入力してください
											</div>
										</div>
										<div
											className="mail-field"
											id="FieldMessageAddress1"
											data-type="select">
											<label
												className="mail-before-attachment"
												htmlFor="MailMessageAddress1">
												都道府県
											</label>
											<span className="mail-input">
												<select
													id="MailMessageAddress1"
													name="data[MailMessage][address_1]">
													<option value="">選択してください</option>
													<option value="北海道">北海道</option>
													<option value="青森県">青森県</option>
													<option value="岩手県">岩手県</option>
													<option value="宮城県">宮城県</option>
													<option value="秋田県">秋田県</option>
													<option value="山形県">山形県</option>
													<option value="福島県">福島県</option>
													<option value="茨城県">茨城県</option>
													<option value="栃木県">栃木県</option>
													<option value="群馬県">群馬県</option>
													<option value="埼玉県">埼玉県</option>
													<option value="千葉県">千葉県</option>
													<option value="東京都">東京都</option>
													<option value="神奈川県">神奈川県</option>
													<option value="新潟県">新潟県</option>
													<option value="富山県">富山県</option>
													<option value="石川県">石川県</option>
													<option value="福井県">福井県</option>
													<option value="山梨県">山梨県</option>
													<option value="長野県">長野県</option>
													<option value="岐阜県">岐阜県</option>
													<option value="静岡県">静岡県</option>
													<option value="愛知県">愛知県</option>
													<option value="三重県">三重県</option>
													<option value="滋賀県">滋賀県</option>
													<option value="京都府">京都府</option>
													<option value="大阪府">大阪府</option>
													<option value="兵庫県">兵庫県</option>
													<option value="奈良県">奈良県</option>
													<option value="和歌山県">和歌山県</option>
													<option value="鳥取県">鳥取県</option>
													<option value="島根県">島根県</option>
													<option value="岡山県">岡山県</option>
													<option value="広島県">広島県</option>
													<option value="山口県">山口県</option>
													<option value="徳島県">徳島県</option>
													<option value="香川県">香川県</option>
													<option value="愛媛県">愛媛県</option>
													<option value="高知県">高知県</option>
													<option value="福岡県">福岡県</option>
													<option value="佐賀県">佐賀県</option>
													<option value="長崎県">長崎県</option>
													<option value="熊本県">熊本県</option>
													<option value="大分県">大分県</option>
													<option value="宮崎県">宮崎県</option>
													<option value="鹿児島県">鹿児島県</option>
													<option value="沖縄県">沖縄県</option>
												</select>
											</span>
											<span className="mail-after-attachment"></span>
											<div className="mail-description"></div>
										</div>
										<div
											className="mail-field"
											id="FieldMessageAddress2"
											data-type="text">
											<label
												className="mail-before-attachment"
												htmlFor="MailMessageAddress2">
												市区町村
											</label>
											<span className="mail-input">
												<input
													id="MailMessageAddress2"
													name="data[MailMessage][address_2]"
													size={30}
													maxLength={200}
													type="text"
												/>
											</span>
											<span className="mail-after-attachment"></span>
											<div className="mail-description"></div>
										</div>
										<div
											className="mail-field"
											id="FieldMessageAddress3"
											data-type="text">
											<label
												className="mail-before-attachment"
												htmlFor="MailMessageAddress3">
												番地
											</label>
											<span className="mail-input">
												<input
													id="MailMessageAddress3"
													name="data[MailMessage][address_3]"
													size={30}
													maxLength={200}
													type="text"
												/>
											</span>
											<span className="mail-after-attachment"></span>
											<div className="mail-description"></div>
										</div>
									</div>
								</fieldset>
							</div>
							{html(
								'<!-- CMS要件: グループ化していない場合でも チェックボックスでは fieldset/legend の構造-->',
							)}
							<div className="cc-form-fieldset" id="GroupMessageCategory">
								<fieldset>
									<legend className="cc-form-fieldset-heading">
										<span>チェックボックス単体</span>
										<span className="required">必須</span>
									</legend>
									<div className="cc-form-fieldset-body">
										<div
											className="mail-field"
											id="FieldMessageCategory"
											data-type="checkbox">
											<span className="mail-before-attachment">
												チェックボックス前見出し
											</span>
											<input
												id="MailMessageCategory"
												type="hidden"
												name="data[MailMessage][category]"
												value=""
											/>
											<div className="checkbox">
												<input
													id="MailMessageCategoryItem1"
													type="checkbox"
													name="data[MailMessage][category][]"
													value="Item1"
												/>
												&nbsp;
												<label htmlFor="MailMessageCategoryItem1">項目1</label>
											</div>
											<div className="checkbox">
												<input
													id="MailMessageCategoryItem2"
													type="checkbox"
													name="data[MailMessage][category][]"
													value="Item2"
												/>
												&nbsp;
												<label htmlFor="MailMessageCategoryItem2">項目2</label>
											</div>
											<div className="checkbox">
												<input
													id="MailMessageCategoryItem3"
													type="checkbox"
													name="data[MailMessage][category][]"
													value="Item3"
												/>
												&nbsp;
												<label htmlFor="MailMessageCategoryItem3">項目3</label>
											</div>
											<span className="mail-after-attachment">
												チェックボックス後見出し
											</span>
											<div className="mail-description"></div>
										</div>
									</div>
								</fieldset>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageContents">
								<fieldset>
									<legend className="cc-form-fieldset-heading">
										<span>チェックボックス</span>
										<span className="required">必須</span>
									</legend>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div
											className="mail-field"
											id="FieldMessageContents"
											data-type="checkbox">
											<span className="mail-before-attachment">前見出し</span>
											<input
												id="MailMessageField4"
												type="hidden"
												name="data[MailMessage][contents]"
												value=""
											/>
											<div className="checkbox">
												<input
													id="MailMessageField41"
													type="checkbox"
													name="data[MailMessage][contents][]"
													value="1"
												/>
												&nbsp;
												<label htmlFor="MailMessageField41">生麦生米生卵</label>
											</div>
											<div className="checkbox">
												<input
													id="MailMessageField42"
													type="checkbox"
													name="data[MailMessage][contents][]"
													value="2"
												/>
												&nbsp;
												<label htmlFor="MailMessageField42">
													赤パジャマ黄パジャマ茶パジャマ
												</label>
											</div>
											<div className="checkbox">
												<input
													id="MailMessageField43"
													type="checkbox"
													name="data[MailMessage][contents][]"
													value="3"
												/>
												&nbsp;
												<label htmlFor="MailMessageField43">青巻紙赤巻紙黄巻紙</label>
											</div>
											<div className="checkbox">
												<input
													id="MailMessageField44"
													type="checkbox"
													name="data[MailMessage][contents][]"
													value="4"
												/>
												&nbsp;
												<label htmlFor="MailMessageField44">隣の客はよく柿食う客だ</label>
											</div>
											<div className="checkbox">
												<input
													id="MailMessageField45"
													type="checkbox"
													name="data[MailMessage][contents][]"
													value="5"
												/>
												&nbsp;
												<label htmlFor="MailMessageField45">
													かえるぴょこぴょこ3ぴょこぴょこ
													あわせてぴょこぴょこ6ぴょこぴょこ
												</label>
											</div>
											<div className="checkbox">
												<input
													id="MailMessageField46"
													type="checkbox"
													name="data[MailMessage][contents][]"
													value="6"
												/>
												&nbsp;
												<label htmlFor="MailMessageField46">東京特許許可局許可局長</label>
											</div>
											<div className="checkbox">
												<input
													id="MailMessageField47"
													type="checkbox"
													name="data[MailMessage][contents][]"
													value="7"
												/>
												&nbsp;
												<label htmlFor="MailMessageField47">その他</label>
											</div>
											<span className="mail-after-attachment"></span>
										</div>
										<div
											className="mail-field"
											id="FieldMessageContentsOther"
											data-type="text">
											<label
												className="mail-before-attachment"
												htmlFor="MailMessageContentsOther">
												その他
											</label>
											<span className="mail-input">
												<input
													id="MailMessageContentsOther"
													name="data[MailMessage][contents_other]"
													size={30}
													maxLength={255}
													type="text"
												/>
											</span>
											<span className="mail-after-attachment">後見出し</span>
											<div className="mail-description">
												その他を選択された場合は内容をご入力ください。
											</div>
										</div>
									</div>
								</fieldset>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageTel">
								<div>
									<div className="cc-form-fieldset-heading">
										<label htmlFor="MailMessageTel">電話番号</label>
									</div>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" id="FieldMessageTel" data-type="text">
											<span className="mail-before-attachment">前見出し</span>
											<span className="mail-input">
												<input
													id="MailMessageTel"
													name="data[MailMessage][tel]"
													size={15}
													maxLength={13}
													type="text"
												/>
											</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageEmail1">
								<div>
									<div className="cc-form-fieldset-heading">
										<label htmlFor="MailMessageEmail1">メールアドレス</label>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" id="FieldMessageEmail1" data-type="text">
											<span className="mail-before-attachment">前見出し</span>
											<span className="mail-input">
												<input
													id="MailMessageEmail1"
													name="data[MailMessage][email_1]"
													maxLength={255}
													type="text"
												/>
											</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageBirth">
								<div>
									<div className="cc-form-fieldset-heading">
										<label htmlFor="MailMessageBirth">生まれ年</label>
										<span className="required">必須</span>
									</div>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" id="FieldMessageBirth" data-type="select">
											<span className="mail-before-attachment">前見出し</span>
											<span className="mail-input">
												<select id="MailMessageBirth" name="data[MailMessage][birth]">
													<option value="">選択してください</option>
													<option value="1">1923年</option>
													<option value="2">1924年</option>
													<option value="3">1925年</option>
													<option value="4">1926年</option>
													<option value="5">1927年</option>
													<option value="6">1928年</option>
													<option value="7">1929年</option>
													<option value="8">1930年</option>
													<option value="9">1931年</option>
													<option value="10">1932年</option>
													<option value="11">1933年</option>
													<option value="12">1934年</option>
													<option value="13">1935年</option>
													<option value="14">1936年</option>
													<option value="15">1937年</option>
													<option value="16">1938年</option>
													<option value="17">1939年</option>
													<option value="18">1940年</option>
													<option value="19">1941年</option>
													<option value="20">1942年</option>
													<option value="21">1943年</option>
													<option value="22">1944年</option>
													<option value="23">1945年</option>
													<option value="24">1946年</option>
													<option value="25">1947年</option>
													<option value="26">1948年</option>
													<option value="27">1949年</option>
													<option value="28">1950年</option>
													<option value="29">1951年</option>
													<option value="30">1952年</option>
													<option value="31">1953年</option>
													<option value="32">1954年</option>
													<option value="33">1955年</option>
													<option value="34">1956年</option>
													<option value="35">1957年</option>
													<option value="36">1958年</option>
													<option value="37">1959年</option>
													<option value="38">1960年</option>
													<option value="39">1961年</option>
													<option value="40">1962年</option>
													<option value="41">1963年</option>
													<option value="42">1964年</option>
													<option value="43">1965年</option>
													<option value="44">1966年</option>
													<option value="45">1967年</option>
													<option value="46">1968年</option>
													<option value="47">1969年</option>
													<option value="48">1970年</option>
													<option value="49">1971年</option>
													<option value="50">1972年</option>
													<option value="51">1973年</option>
													<option value="52">1974年</option>
													<option value="53">1975年</option>
													<option value="54">1976年</option>
													<option value="55">1977年</option>
													<option value="56">1978年</option>
													<option value="57">1979年</option>
													<option value="58">1980年</option>
													<option value="59">1981年</option>
													<option value="60">1982年</option>
													<option value="61">1983年</option>
													<option value="62">1984年</option>
													<option value="63">1985年</option>
													<option value="64">1986年</option>
													<option value="65">1987年</option>
													<option value="66">1988年</option>
													<option value="67">1989年</option>
													<option value="68">1990年</option>
													<option value="69">1991年</option>
													<option value="70">1992年</option>
													<option value="71">1993年</option>
													<option value="72">1994年</option>
													<option value="73">1995年</option>
													<option value="74">1996年</option>
													<option value="75">1997年</option>
													<option value="76">1998年</option>
													<option value="77">1999年</option>
													<option value="78">2000年</option>
													<option value="79">2001年</option>
													<option value="80">2002年</option>
													<option value="81">2003年</option>
													<option value="82">2004年</option>
													<option value="83">2005年</option>
													<option value="84">2006年</option>
													<option value="85">2007年</option>
													<option value="86">2008年</option>
													<option value="87">2009年</option>
													<option value="88">2010年</option>
													<option value="89">2011年</option>
													<option value="90">2012年</option>
													<option value="91">2013年</option>
													<option value="92">2014年</option>
													<option value="93">2015年</option>
													<option value="94">2016年</option>
													<option value="95">2017年</option>
												</select>
											</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageSex">
								<fieldset>
									<legend className="cc-form-fieldset-heading">
										<span>性別</span>
										<span className="optional">任意</span>
									</legend>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" id="FieldMessageSex" data-type="radio">
											<span className="mail-before-attachment">前見出し</span>
											<input
												id="MailMessageSex_"
												type="hidden"
												name="data[MailMessage][sex]"
												value=""
											/>
											<div className="mail-group-radio">
												<span>
													<input
														id="MailMessageSex1"
														type="radio"
														name="data[MailMessage][sex]"
														value="1"
													/>
													<label htmlFor="MailMessageSex1">男性</label>
												</span>
												<span>
													<input
														id="MailMessageSex2"
														type="radio"
														name="data[MailMessage][sex]"
														value="2"
													/>
													<label htmlFor="MailMessageSex2">女性</label>
												</span>
											</div>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</fieldset>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageMessage">
								<div>
									<div className="cc-form-fieldset-heading">
										<label htmlFor="MailMessageMessage">テキストエリア</label>
										<span className="optional">任意</span>
									</div>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div
											className="mail-field"
											id="FieldMessageMessage"
											data-type="textarea">
											<span className="mail-before-attachment">前見出し</span>
											{html(
												'<!-- CMS要件: サイズ指定がないときは cols属性を出力しない-->',
											)}
											<span className="mail-input">
												<textarea
													id="MailMessageMessage"
													name="data[MailMessage][message]"
													rows={10}></textarea>
											</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageMessage2">
								<div>
									<div className="cc-form-fieldset-heading">
										<label htmlFor="MailMessageMessage2">テキストエリア</label>
										<span className="optional">任意</span>
									</div>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div
											className="mail-field"
											id="FieldMessageMessage2"
											data-type="textarea">
											<span className="mail-before-attachment">前見出し</span>
											<span className="mail-input">
												<textarea
													id="MailMessageMessage2"
													name="data[MailMessage][message2]"
													rows={10}
													cols={20}></textarea>
											</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
							<div className="cc-form-fieldset" id="GroupMessageFile">
								<div>
									<div className="cc-form-fieldset-heading">
										<label htmlFor="MailMessageFile">ファイル添付</label>
										<span className="optional">任意</span>
									</div>
									<div className="cc-form-fieldset-attention">
										<div className="mail-attention">注意書き</div>
									</div>
									<div className="cc-form-fieldset-body">
										<div className="mail-field" id="FieldMessageFile" data-type="file">
											<span className="mail-before-attachment">前見出し</span>
											<span className="mail-input">
												<input
													id="MailMessageFile"
													name="data[MailMessage][File]"
													type="file"
												/>
											</span>
											<span className="mail-after-attachment">後見出し</span>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="cc-form-agreement">
							<p>
								送信前に
								<a href="__PATH_TO__">個人情報保護方針</a>
								をご確認ください。
							</p>
						</div>
						<div className="cc-form-submit">
							<button id="BtnMessageConfirm" type="submit">
								<span>送信内容を確認</span>
							</button>
						</div>
						<input
							id="TokenFields__TOKEN"
							type="hidden"
							name="data[_Token][fields]"
							value="__TOKEN__"
						/>
						<input
							id="TokenUnlocked__TOKEN"
							type="hidden"
							name="data[_Token][unlocked]"
							value="__TOKEN__"
						/>
					</form>
				</div>
			</div>
		</div>
	);
}
