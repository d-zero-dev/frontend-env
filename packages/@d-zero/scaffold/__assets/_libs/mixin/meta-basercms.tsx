import { html } from 'kamado/jsx';

// baserCMS に組み込むときに削除する`link`と`script`。
// 削除の目印の`⚠️`属性は JSX の属性名として書けないので、HTML の文字列で出力する。
export default function MetaBasercms() {
	return (
		<>
			{html(
				'<link rel="stylesheet" href="/__tmpl/__burger_editor/css/colorbox.css" ⚠️="baserCMS組み込み時は削除してください">',
			)}
			<script src="/js/jquery.min.js"></script>
			{html(
				'<script src="https://maps.google.com/maps/api/js?key=AIzaSyDc3Vko3MvdrlJuQyEmo0WiT50RIMMtk5g" ⚠️="baserCMS組み込み時は削除してください"></script>',
			)}
			{html(
				'<script src="/__tmpl/__burger_editor/js/bge_modules/jquery.colorbox-min.js" ⚠️="baserCMS組み込み時は削除してください"></script>',
			)}
			{html(
				'<script src="/__tmpl/__burger_editor/js/bge_modules/bge_functions.min.js" ⚠️="baserCMS組み込み時は削除してください"></script>',
			)}
		</>
	);
}
