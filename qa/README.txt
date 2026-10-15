LEVEL1-BETA-05 コード・ブラウザ検証

教材ルートで実行する。
python3 qa/static_check.py
node qa/check.cjs
node --check script.js

check.cjs：DOM/event/sessionStorage/時計の模擬環境。68項目合格。
static_check.py：HTML構造・参照・ARIA・中立名・JS/CSS・画像比較等。
実際のHTMLから*.html.jsonのテスト入力を更新するため、
HTML変更時はstatic_check.pyの後にcheck.cjsを実行する。
旧版比較はQA_REFERENCE_ZIPで指定可能。既定は隣のLEVEL1-BETA-04.zip。
ない場合は比較をスキップする。旧版ZIPは配布物に重複同梱しない。
保存ログはBeta 04との画像・キャンペーン比較を含む9項目合格。

browser_check.cjs：PlaywrightとChrome/Chromiumが必要。教材本体の依存ではない。
PLAYWRIGHT_MODULEでモジュール、BROWSER_EXECUTABLEで実行ファイルを指定可能。
node qa/browser_check.cjs
既定は教材を127.0.0.1:8765だけで一時配信し、終了時に閉じる。
既存のローカルサーバーを使う場合はQA_BASE_URLを指定する。
QA_SCREENSHOT_DIRを指定した場合だけ内部確認用の画像を作る。
内部確認画像は配布・保存しない。
Chrome headlessで196項目合格。完了ログはbrowser-results.txt。
TOTAL行までの到達と終了状態を確かめ、途中の出力を完了と扱わない。

今回の追加監査：6体験の復習開始・完了・再読み込み・復帰で講座保存不変。
ヒント3段階、表示中の完了遮断、フォーカス、待機中の時計と文面更新、
未完了の再試行、完了した過去の体験の復習、未到達のガード、講師モード、
記事をスクロールした後も復習の戻り口が見えることを確認。

静的・模擬監査だけでは描画・実タップは確認できない。
Chromeの幅・タッチ対応設定もiPhone SafariやAdGuardの実機確認ではない。
実機チェック表と学習判定の限界はQA_REPORT.md参照。
