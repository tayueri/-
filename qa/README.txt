LEVEL1-BETA-04 コード・ブラウザ検証

教材ルートで実行する。
python3 qa/static_check.py
node qa/check.cjs
node --check script.js

check.cjs：DOM/event/sessionStorage/時計の模擬環境。68項目合格。
static_check.py：HTML構造・参照・ARIA・内部名・JS/CSS・画像比較等の静的監査。
静的監査は実際のHTMLから*.html.jsonのテスト入力を更新する。
HTML変更時はstatic_check.pyの後にcheck.cjsを実行する。
旧版ZIPとの比較はQA_REFERENCE_ZIPで場所を指定できる。
指定がなければ隣のLEVEL1-BETA-03.zipを探す。ない場合は比較をスキップする。
配布ZIPには旧版ZIPを重複同梱しない。保存ログは旧版比較を含む9項目合格。

browser_check.cjs：PlaywrightとChrome/Chromiumが必要。教材本体の依存ではない。
PLAYWRIGHT_MODULEでモジュール、BROWSER_EXECUTABLEで実行ファイルを指定可能。
node qa/browser_check.cjs
既定は教材を127.0.0.1:8765だけで一時配信し、終了時に閉じる。
既存のローカルサーバーを使う場合はQA_BASE_URLを指定する。
QA_SCREENSHOT_DIRを指定した場合だけ内部確認用の画像を作る。
画像を配布・保存するための設定ではない。
Chrome headlessで102項目合格。結果はbrowser-results.txt。

静的監査や模擬テストだけでは描画・実タップは確認できない。
Chromeの幅・タッチ対応設定もiPhone SafariやAdGuardの実機確認ではない。
実機チェック表と学習判定の限界はQA_REPORT.md参照。
