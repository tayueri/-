LEVEL1-BETA-03 コード検証
教材ルートで実行：
node qa/check.cjs
python3 qa/static_check.py
node --check script.js

check.cjs：DOM/event/sessionStorage/時計の模擬環境。54項目合格。
static_check.py：HTML構造・参照・ARIA・内部名・JS/CSS・画像比較等の静的監査。
static_check.pyは実際のHTMLから*.html.jsonのテスト入力も更新する。
HTML変更時はstatic_check.pyの後にcheck.cjsを実行する。
同階層../audit-source/LEVEL1-BETA-02.zipが存在する場合は、承認済み画像とL1-5/6のHTMLの比較も行う。
配布ZIPには旧版ZIPを重複同梱しないため、旧版がない場合は比較をスキップする。
同梱static-results.txtは旧版を用いた比較実施時の9項目合格ログ。

実ブラウザの描画、横スクロール、実タップ、iPhone Safari、AdGuard、VoiceOverは未確認。
実機のチェック表と学習判定の限界はQA_REPORT.md参照。
