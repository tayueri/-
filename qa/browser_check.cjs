/* Chrome/Chromium regression audit. Serves this package locally by default. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:8765';
const shots = process.env.QA_SCREENSHOT_DIR;
let count=0, completed=false;
process.on("beforeExit",()=>{if(!completed){console.error("INCOMPLETE browser audit exited before completion");process.exitCode=1;}});
process.on("exit",()=>{if(!completed){console.error("INCOMPLETE browser audit terminated before completion");process.exitCode=1;}});
function ok(value,label){if(!value)throw new Error(label);console.log('PASS '+label);count++;}
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=process.env.QA_BASE_URL ? null : http.createServer((req,res)=>{
   const requested=decodeURIComponent(new URL(req.url,base).pathname);
   const file=path.resolve(root,'.'+(requested==='/' ? '/index.html' : requested));
   if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   if(requested==='/favicon.ico'){res.writeHead(204);res.end();return;}
   fs.readFile(file,(error,data)=>{
     if(error){res.writeHead(404);res.end();return;}
     const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp'};
     res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
   });
 });
 if(server)await new Promise((resolve,reject)=>{server.on('error',reject);server.listen(8765,'127.0.0.1',resolve);});
 const browser = await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[],external=[],failed=[];
 context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});});
 context.on('request',r=>{if(!r.url().startsWith(base+'/')&&!r.url().startsWith('data:'))external.push(r.url())});
 context.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url())});
 const p=await context.newPage();
 const visible=id=>p.locator('#'+id).isVisible();
 const wait=id=>p.locator('#'+id).waitFor({state:'visible'});
 const click=id=>p.locator('#'+id).click();
 const stage=()=>p.evaluate(()=>sessionStorage.getItem('level1Training.stage'));
 async function shot(name){if(shots){fs.mkdirSync(shots,{recursive:true});await p.screenshot({path:path.join(shots,name+'.png'),fullPage:false});}}
 async function widths(label){
   for(const [width,height] of [[320,740],[375,812],[390,844],[430,932],[844,390],[1280,900]]){
     await p.setViewportSize({width,height});await p.waitForTimeout(100);
     const d=await p.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
     ok(d.doc<=d.viewport+1&&d.body<=d.viewport+1,label+' '+width+'px: 横方向に収まる');
   }
   await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);
 }
 await p.goto(base+'/index.html?start=1');await click('startButton');
 ok(!(await visible('teacherResetButton')),'受講者画面で講師リセット非表示');
 await widths('Site A 本文');
 await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(250);
 ok(await stage()==='1'&&!(await visible('feedbackLayer')),'L1-1: スクロールだけで完了しない');
 await p.locator('#lesson1Card').scrollIntoViewIfNeeded();await shot('01-inline');await click('lesson1Card');
 ok((await p.locator('#feedbackTitle').textContent())==='広告の部分を押しました','L1-1: 中立的な広告説明');
 ok(await p.evaluate(()=>document.getElementById('trainingScreen').inert),'説明中は背景を操作できない');
 ok(!(await visible('feedbackLesson')),'短い説明に空の説明枠を出さない');
 await p.keyboard.press('Tab');ok(await p.evaluate(()=>document.activeElement.id)==='feedbackButton','説明のフォーカスを保持');
 await widths('中立説明');await shot('02-feedback');await click('feedbackButton');await click('lesson1ContinueButton');
 await click('feedbackButton');ok(await visible('lesson2Section')&&await stage()==='2','L1-1: 本文操作からL1-2へ');
 await p.locator('[data-promo-story]').click();ok(await stage()==='2','L1-2: PR選択は進捗を変えない');await click('feedbackButton');
 await p.locator('[data-story="prep"]').click();await click('feedbackButton');
 ok((await p.locator('#storyTitle').textContent())==='忙しい日の作り置きアイデア','L1-2: 選んだ記事の本文を表示');
 await p.reload();ok((await p.locator('#storyTip1Title').textContent())==='1　作るものを絞る','関連記事と本文をリロードで復元');
 await widths('L1-3 固定枠');
 const close3=await p.locator('#closeLesson3Bar').boundingBox();ok(close3.width>=44&&close3.height>=44,'L1-3閉じる領域44px以上');
 await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(200);ok(await stage()==='3','L1-3: スクロールだけで完了しない');
 await click('closeLesson3Bar');ok(await stage()==='3','L1-3: 閉じるだけで完了しない');await p.reload();ok(!(await visible('lesson3Bar')),'固定枠を閉じた状態を復元');
 await click('lesson3ContinueButton');await click('feedbackButton');await click('openLesson4Button');await widths('L1-4 ポップアップ');
 const close4=await p.locator('#closeLesson4Button').boundingBox();ok(close4.width>=44&&close4.height>=44,'L1-4閉じる領域44px以上');
 await p.locator('[data-lesson4-hit]').first().click();
 ok(await p.evaluate(()=>Number(getComputedStyle(document.getElementById('feedbackLayer')).zIndex)>Number(getComputedStyle(document.getElementById('lesson4Layer')).zIndex)),'全画面より説明が手前に表示');
 await click('feedbackButton');ok(await p.evaluate(()=>document.body.style.overflow==='hidden'),'説明から広告へ戻った後も背景スクロールを固定');
 await click('closeLesson4Button');await click('feedbackButton');await click('goSiteBButton');await p.waitForURL('**/outing.html');await widths('Site B 一覧');await shot('03-outing-home');
 await p.locator('.outing-categories [data-topic="outingCafe"]').click();ok(await p.locator('#outingCafe').getAttribute('open')!==null,'Site Bのカテゴリが教材内の読みものを開く');
 const start5=Date.now();await click('openLesson5Button');await p.waitForTimeout(700);ok(!(await visible('lesson5Close')),'L1-5: 待機初期は閉じる非表示');
 await widths('L1-5 全画面');await shot('04-wait-close');await p.locator('[data-lesson5-hit]').first().click();await shot('05-fullscreen-feedback');await click('feedbackButton');
 await wait('lesson5Close');const elapsed5=Date.now()-start5;ok(elapsed5>=9900,'L1-5: 約10秒後に出口表示 ('+elapsed5+'ms)');
 const close5=await p.locator('#lesson5Close').boundingBox();ok(close5.width>=44&&close5.height>=44,'L1-5閉じる領域44px以上');await click('lesson5Close');await click('feedbackButton');
 ok(await visible('outingArticle')&&!(await visible('level1Complete')),'L1-5: 開こうとした散歩記事へ戻る');ok(await p.evaluate(()=>scrollY)===0,'散歩記事へ戻ると先頭を表示');await widths('Site B 散歩記事');await shot('06-route');
 await click('openLesson6Button');await p.waitForTimeout(700);ok(!(await visible('lesson6Skip')),'L1-6: 待機初期はスキップ非表示');await p.reload();
 ok(await visible('lesson6Layer')&&!(await visible('lesson6Skip')),'L1-6: 待機中リロードで同じ場面を復元');
 const start6=Date.now();ok((await p.locator('#lesson6Counter').textContent())==='0:10','復元直後に0:10から待機再開');await widths('L1-6 動画風');await shot('07-wait-skip');
 await wait('lesson6Skip');const elapsed6=Date.now()-start6;ok(elapsed6>=9700,'L1-6: 復元後も約10秒待機 ('+elapsed6+'ms)');
 const skip6=await p.locator('#lesson6Skip').boundingBox();ok(skip6.width>=44&&skip6.height>=44,'スキップ領域44px以上');await click('lesson6Skip');await click('feedbackButton');
 ok(await visible('packingArticle')&&!(await visible('level1Complete')),'スキップ後は持ち物記事へ');ok(await p.evaluate(()=>scrollY)===0,'持ち物記事へ戻ると先頭を表示');await p.reload();ok(await visible('packingArticle'),'持ち物記事の表示をリロードで復元');
 await widths('Site B 持ち物記事');await shot('08-packing');await click('finishLevel1Button');ok(await visible('level1Complete'),'記事の後に振り返りへ');await widths('振り返り');await p.reload();ok(await visible('level1Complete'),'振り返り画面をリロードで復元');
 await p.goto(base+'/outing.html?teacher=1');ok(await visible('teacherResetButton'),'講師モードでリセット表示');await click('teacherResetButton');await click('teacherResetCancel');ok(await visible('level1Complete'),'リセット取消で進捗保持');
 await click('teacherResetButton');await click('teacherResetConfirm');await p.waitForURL('**/index.html?teacher=1');ok(await visible('introScreen'),'講師リセットで入口へ戻る');await click('startButton');ok(await visible('teacherResetButton'),'リセット後も講師モード保持');
 await p.evaluate(()=>{sessionStorage.setItem('otherApp.key','keep');sessionStorage.setItem('level1Training.stage','6')});await p.goto(base+'/index.html?start=1');
 ok(await visible('introScreen')&&await stage()===null&&await p.evaluate(()=>sessionStorage.getItem('otherApp.key'))==='keep','start=1は教材進捗だけを初期化');
 await p.evaluate(()=>{sessionStorage.setItem('level1Training.started','1');sessionStorage.setItem('level1Training.stage','6');sessionStorage.setItem('level1Training.l5done','1');sessionStorage.setItem('level1Training.l6done','1');sessionStorage.removeItem('level1Training.outingView')});await p.goto(base+'/outing.html');
 ok(await visible('level1Complete'),'旧版の完了進捗を維持');

 async function canonical(){return p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(sessionStorage).filter(k=>k.startsWith('level1Training.')).sort().map(k=>[k,sessionStorage.getItem(k)]))));}
 const savedCourse=await canonical();
 for(let n=1;n<=6;n++){
   await p.locator('[data-review-lesson="'+n+'"]').click();await p.waitForURL('**/*practice='+n);await p.waitForTimeout(180);
   ok(await canonical()===savedCourse,'復習'+n+': 開始時に講座進捗不変');
   ok((await p.locator('#progressText').textContent()).includes('復習'),'復習'+n+': 通常進行と区別して表示');
   if(n===1){
     await p.locator('#supportControls [data-support-hint]').click();ok((await p.locator('#supportTitle').textContent())==='ヒント 1 / 3','ヒントは目的の確認から開始');
     await click('supportMoreButton');ok((await p.locator('#supportTitle').textContent())==='ヒント 2 / 3','必要時だけ目印のヒントへ');
     await click('supportMoreButton');ok((await p.locator('#supportTitle').textContent())==='ヒント 3 / 3'&&!(await visible('supportMoreButton')),'3段階目で具体操作、追加ボタンは終了');
     await p.locator('#lesson1ContinueButton').evaluate(el=>el.click());ok(!(await p.evaluate(()=>sessionStorage.getItem('level1Review.1.l1done'))),'ヒント中は本文操作を完了させない');
     await widths('3段階ヒント');await shot('support-hint');await p.keyboard.press('Tab');ok(await p.evaluate(()=>document.activeElement.id)==='supportBackButton','ヒントのフォーカスを保持');
     await p.keyboard.press('Escape');ok(!(await visible('supportLayer')),'Escapeはヒントだけを閉じる');
     await click('lesson1ContinueButton');
   }
   if(n===2){await p.locator('[data-story="prep"]').click();}
   if(n===3){await click('lesson3ContinueButton');}
   if(n===4){await click('openLesson4Button');await widths('復習4 支援欄');await shot('review-popup');await click('closeLesson4Button');}
   if(n===5||n===6){
     await click(n===5?'openLesson5Button':'openLesson6Button');
     await p.locator('#lesson'+n+'Layer [data-support-hint]').click();await click('supportMoreButton');await click('supportMoreButton');
     ok((await p.locator('#supportText').textContent()).startsWith('まだ'),'待機'+n+': 出口が出る前のヒント');
     await widths('復習'+n+' 支援欄');await shot('review-wait-'+n);
     const exit=n===5?'lesson5Close':'lesson6Skip';await wait(exit);
     ok((await p.locator('#supportText').textContent()).includes(n===5?'「閉じる」を押して':'「広告をスキップ」を押して'),'待機'+n+': ヒント中も時計が進み、文面が更新');
     await p.locator('#'+exit).evaluate(el=>el.click());ok(!(await p.evaluate(n=>sessionStorage.getItem('level1Review.'+n+'.l'+n+'done'),n)),'待機'+n+': ヒントを閉じるまで完了操作を遮断');
     await click('supportBackButton');ok(await p.evaluate(()=>document.body.style.overflow)==='hidden','待機'+n+': ヒントから戻っても背景固定');await click(exit);
   }
   await click('feedbackButton');ok(await visible('reviewCompletePanel'),'復習'+n+': 個別復習の完了を表示');
   ok(await canonical()===savedCourse,'復習'+n+': 完了しても講座進捗不変');
   await p.waitForTimeout(250);await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(200);const returnBox=await p.locator('#supportControls [data-review-return]').boundingBox();ok(returnBox&&returnBox.y>=0&&returnBox.y+returnBox.height<=844,'復習'+n+': 記事をスクロールしても講座への戻り口が見える');
   await p.reload();ok(await visible('reviewCompletePanel'),'復習'+n+': 再読み込みでも復習状態を保持');
   await p.locator('#reviewCompletePanel [data-review-return]').click();await p.waitForURL('**/outing.html');await p.waitForTimeout(250);
   ok(await visible('level1Complete')&&await canonical()===savedCourse,'復習'+n+': 元の講座と進捗へ復帰');
 }
 await p.locator('[data-review-lesson="5"]').click();await p.waitForURL('**/*practice=5');await click('openLesson5Button');await p.waitForTimeout(300);
 await p.locator('#lesson5Layer [data-support-restart]').click();await p.waitForURL('**/*practice=5');await p.waitForTimeout(180);
 ok(await visible('outingHome')&&!(await visible('lesson5Layer')),'復習中のやり直しは広告を開く前へ戻る');
 ok(await canonical()===savedCourse,'復習中のやり直しも講座進捗不変');
 await p.locator('#supportControls [data-review-return]').click();await p.waitForURL('**/outing.html');
 // Seed an unfinished ordinary course to test a restart without resetting other work.
 await p.evaluate(()=>{Object.keys(sessionStorage).filter(k=>k.startsWith('level1Training.')).forEach(k=>sessionStorage.removeItem(k));for(const [k,v] of Object.entries({started:1,stage:3,l1done:1,l2done:1,story:'prep',l3closed:1}))sessionStorage.setItem('level1Training.'+k,String(v));});
 await p.goto(base+'/index.html?teacher=1');await p.locator('#supportControls [data-support-restart]').click();ok(await visible('supportLayer'),'未完了のやり直しは確認を表示');await click('supportBackButton');ok(await stage()==='3','やり直し取消は進捗保持');
 await p.locator('#supportControls [data-support-restart]').click();await click('supportConfirmButton');await p.waitForURL('**/index.html?teacher=1');await p.waitForTimeout(250);
 ok(await visible('lesson3Bar'),'未完了L1-3をやり直すと固定枠を再表示');
 ok(await p.evaluate(()=>sessionStorage.getItem('level1Training.l1done')==='1'&&sessionStorage.getItem('level1Training.l2done')==='1'&&sessionStorage.getItem('level1Training.story')==='prep'&&sessionStorage.getItem('level1Training.l3done')===null),'L1-3再試行で前の完了と選択記事を保持');
 ok(await visible('teacherResetButton'),'個別やり直し後も講師モード保持');
 const midCourse=await canonical();await p.locator('#reviewChoicesMenu summary').click();await p.locator('[data-review-choice="1"]').click();await p.waitForURL('**/*practice=1&teacher=1');
 ok(await canonical()===midCourse,'講座の途中でも前の体験を独立して復習');await click('lesson1ContinueButton');await click('feedbackButton');await p.locator('#reviewCompletePanel [data-review-return]').click();await p.waitForURL('**/index.html?teacher=1');await p.waitForTimeout(250);
 ok(await canonical()===midCourse&&await visible('lesson3Bar'),'途中の体験と選択記事へ、進捗を変えずに復帰');
 await p.locator('#supportControls [data-support-hint]').click();await click('supportMoreButton');await p.reload();await p.locator('#supportControls [data-support-hint]').click();ok((await p.locator('#supportTitle').textContent())==='ヒント 2 / 3','ヒントの支援段階を同じタブで保持');await click('supportBackButton');
 await p.goto(base+'/outing.html?practice=6&teacher=1');await p.waitForURL('**/index.html?teacher=1');ok(await stage()==='3','未到達の体験を復習URLで解放しない');
 await p.evaluate(()=>{sessionStorage.setItem('level1Training.stage','6');sessionStorage.setItem('level1Training.l5done','1');sessionStorage.setItem('level1Training.outingView','route');});await p.goto(base+'/outing.html?teacher=1');
 await click('openLesson6Button');await p.locator('#lesson6Layer [data-support-restart]').click();await click('supportConfirmButton');await p.waitForURL('**/outing.html?teacher=1');
 ok(await visible('outingArticle')&&!(await visible('lesson6Layer'))&&await p.evaluate(()=>sessionStorage.getItem('level1Training.l5done'))==='1','未完了L1-6をやり直し、L1-5完了を保持');
 await p.evaluate(()=>sessionStorage.setItem('level1Review.1.started','1'));await p.goto(base+'/index.html?start=1&teacher=1');
 ok(await p.evaluate(()=>Object.keys(sessionStorage).every(k=>!k.startsWith('level1Review.')&&!k.startsWith('level1Training.'))),'新しい講座開始は復習状態も初期化');
 ok(await p.evaluate(()=>sessionStorage.getItem('otherApp.key'))==='keep','全体初期化でも他アプリの保存を保持');
 ok(errors.length===0,'JavaScript/consoleエラーなし '+JSON.stringify(errors));ok(external.length===0,'外部リクエストなし '+JSON.stringify(external));ok(failed.length===0,'画像・ファイル参照エラーなし '+JSON.stringify(failed));
 completed=true;console.log('TOTAL '+count+' PASS (Chrome headless; mobile-size emulation, not iPhone Safari / AdGuard / VoiceOver)');
 }finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error('FAIL '+e.stack);process.exitCode=1;});
