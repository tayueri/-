const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync('script.js','utf8');
let checks=0;
function ok(cond,label){assert.ok(cond,label); checks++; console.log('PASS '+label);}
function make(page='index.html',data=new Map(),query=''){
 const rows=JSON.parse(fs.readFileSync('qa/'+page+'.json'));let focused;
 const elements=rows.map(({tag,attrs})=>({tag,attrs,dataset:Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,s)=>s.toUpperCase()),v])),style:{},events:{},textContent:'',innerHTML:'',inert:false,isConnected:true,
 classList:{set:new Set((attrs.class||'').split(/\s+/)),add(v){this.set.add(v)},remove(v){this.set.delete(v)},contains(v){return this.set.has(v)},toggle(v,on){if(on)this.add(v);else this.remove(v)}},
 addEventListener(k,fn){(this.events[k]??=[]).push(fn)},dispatch(k,event={}){for(const fn of this.events[k]||[])fn(event)},click(){focused=this;this.dispatch('click')},focus(){focused=this},scrollIntoView(){},getBoundingClientRect(){return this.rect||{top:5000,bottom:5100,height:100}},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]}
 }));
 const byId=id=>elements.find(e=>e.attrs.id===id),body=elements.find(e=>e.tag==='body');
 const doc={body,getElementById:byId,querySelectorAll:s=>elements.filter(e=>s.startsWith('[')&&s.slice(1,-1) in e.attrs),querySelector(s){return this.querySelectorAll(s)[0]},documentElement:{clientHeight:844},get activeElement(){return focused}};
 const events={},frames=[],timeouts=[];let now=0;
 const win={innerHeight:844,addEventListener(k,fn){(events[k]??=[]).push(fn)},scrollTo(){}};
 const loc={search:query,pathname:'/'+page,hash:'',href:page,replace(u){this.href=u}};
 const storage={getItem:k=>data.get(k)??null,setItem(k,v){data.set(k,v);storage[k]=v},removeItem(k){data.delete(k);delete storage[k]}};
 for(const [k,v] of data)storage[k]=v;
 const context={document:doc,window:win,location:loc,history:{replaceState(a,b,url){loc.href=url;loc.search=url.includes('?')?'?'+url.split('?')[1]:''}},sessionStorage:storage,URLSearchParams,performance:{now:()=>now},requestAnimationFrame:fn=>frames.push(fn),setTimeout(fn){timeouts.push(fn);return timeouts.length},clearTimeout(){}};
 vm.runInNewContext(code,context);
 return {byId,data,loc,doc,click:id=>byId(id).click(),hit:attr=>elements.find(e=>attr in e.attrs).click(),visible:id=>!byId(id).classList.contains('is-hidden'),scroll(){for(const fn of events.scroll||[])fn()},advance(ms){now+=ms;for(const fn of frames.splice(0))fn(now)},key(k){byId('feedbackLayer').dispatch('keydown',{key:k,preventDefault(){}})},state:()=>data.get('level1Training.stage'),done:k=>data.get('level1Training.'+k),elements};
}
let a=make();ok(a.visible('introScreen')&&!a.visible('teacherResetButton'),'通常開始・講師ボタン非表示');a.click('startButton');
a.byId('lesson1Goal').rect={top:100,bottom:300,height:200};for(let i=0;i<100;i++)a.scroll();ok(a.state()==='1'&&!a.done('l1done')&&!a.visible('feedbackLayer'),'本文が見えても100回のscrollで成功しない');
a.click('lesson1Card');a.click('lesson1Card');ok(a.state()==='1'&&a.byId('feedbackTitle').textContent==='広告の部分を押しました','広告連打で進捗不変・中立説明');ok(a.byId('trainingScreen').inert,'説明中は背景操作を遮断');a.key('Tab');ok(a.doc.activeElement===a.byId('feedbackButton'),'説明中のキーボードフォーカス');a.click('lesson1ContinueButton');ok(a.state()==='1','説明中の本文操作は成功させない');a.click('feedbackButton');ok(!a.byId('trainingScreen').inert&&!a.visible('feedbackLayer'),'記事へ戻り操作を再開');
a=make('index.html',a.data);ok(a.state()==='1'&&!a.visible('introScreen'),'広告クリック後リロードでL1-1継続');a.click('lesson1ContinueButton');a.click('lesson1ContinueButton');ok(a.state()==='2'&&a.done('l1done')==='1','本文操作のみで一度だけL1-1完了');
let restored=make('index.html',new Map(a.data));ok(restored.visible('lesson1Finish')&&restored.visible('lesson2Section')&&!restored.visible('lesson1ContinueButton'),'成功説明中のリロードでも手順4とL1-2復元');a.click('feedbackButton');ok(a.visible('lesson1Finish')&&a.visible('lesson2Section')&&a.doc.activeElement===a.byId('lesson1Finish'),'次の手順を実際に表示してL1-2へ接続');
a.hit('data-promo-story');ok(a.state()==='2'&&a.visible('feedbackLayer'),'L1-2 PR選択は説明のみ');a.click('feedbackButton');a.hit('data-normal-story');a.click('feedbackButton');ok(a.state()==='3'&&a.visible('lesson3Bar'),'L1-2通常記事からL1-3');
restored=make('index.html',new Map(a.data));ok(restored.visible('lesson3Section')&&restored.visible('lesson3Bar'),'L1-3進捗リロード');restored.byId('lesson3Goal').rect={top:100,bottom:300,height:200};restored.scroll();ok(restored.state()==='4'&&restored.done('l3done')==='1','L1-3広告を残して読むルート維持');
a.click('closeLesson3Bar');a.click('feedbackButton');ok(a.state()==='4'&&a.visible('openLesson4Button'),'L1-3閉じるルート維持');a.click('openLesson4Button');a.hit('data-lesson4-hit');ok(a.visible('lesson4Layer'),'L1-4広告クリックで閉じない');a.click('closeLesson4Button');a.click('feedbackButton');ok(a.state()==='5'&&a.visible('siteATransition'),'L1-4からSite B案内');a.click('goSiteBButton');
let b=make('outing.html',a.data);b.click('openLesson5Button');b.advance(2999);ok(!b.visible('lesson5Close'),'L1-5 3秒未満は閉じる非表示');b.advance(1);ok(b.visible('lesson5Close'),'L1-5 3秒で閉じる表示');b.click('lesson5Close');b.click('feedbackButton');ok(b.state()==='6'&&b.visible('outingArticle'),'L1-5から記事へ');b=make('outing.html',b.data);ok(b.visible('outingArticle'),'L1-5後リロード');b.click('openLesson6Button');b.advance(4999);ok(!b.visible('lesson6Skip'),'L1-6 5秒未満はスキップ非表示');b.advance(1);ok(b.visible('lesson6Skip'),'L1-6 5秒でスキップ表示');b.click('lesson6Skip');b.click('feedbackButton');ok(b.done('l6done')==='1'&&b.visible('level1Complete'),'L1-6から全体完了');b=make('outing.html',b.data);ok(b.visible('level1Complete'),'完了後リロード');
let t=make('index.html',new Map(a.data),'?teacher=1');ok(t.visible('teacherResetButton'),'teacher=1で講師操作表示');t.click('teacherResetButton');t.click('teacherResetCancel');ok(!t.visible('teacherResetLayer')&&t.state()==='6','講師リセット取消は保存状態維持');t.click('teacherResetButton');t.click('teacherResetConfirm');ok(t.data.size===0&&t.loc.href==='index.html?start=1','講師リセットの従来動作維持');
let resetData=new Map([['otherApp.key','keep'],['level1Training.stage','6'],['level1Training.started','1']]);t=make('index.html',resetData,'?start=1&teacher=1');ok(t.visible('introScreen')&&t.visible('teacherResetButton')&&!t.done('stage')&&t.data.get('otherApp.key')==='keep','start=1は教材の進捗だけをリセット');ok(t.loc.href==='/index.html?teacher=1','startをURLから除去・teacher保持');
console.log('TOTAL '+checks+' PASS (DOM/event simulation; not a browser/device test)');
