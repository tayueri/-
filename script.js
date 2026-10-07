(() => {
  "use strict";

  const page = document.body.dataset.page || "main";
  const PREFIX = "level1Training.";
  const store = {
    get(key){ try{return sessionStorage.getItem(PREFIX + key);}catch(e){return null;} },
    set(key,val){ try{sessionStorage.setItem(PREFIX + key,String(val));}catch(e){} },
    remove(key){ try{sessionStorage.removeItem(PREFIX + key);}catch(e){} },
    clear(){ try{Object.keys(sessionStorage).forEach(k=>{if(k.startsWith(PREFIX))sessionStorage.removeItem(k);});}catch(e){} }
  };

  const $ = (id) => document.getElementById(id);
  const show = (el) => { if(el) el.classList.remove("is-hidden"); };
  const hide = (el) => { if(el) el.classList.add("is-hidden"); };
  const lock = () => { document.body.style.overflow = "hidden"; };
  const unlock = () => { document.body.style.overflow = ""; };
  const scrollToEl = (el) => { if(el) setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),120); };

  function handleEntry(){
    const params = new URLSearchParams(location.search);
    if(params.get("start") === "1" || params.get("reset") === "1"){
      store.clear();
      const keepTeacher = params.get("teacher") === "1" ? "?teacher=1" : "";
      history.replaceState({}, "", location.pathname + keepTeacher + location.hash);
    }
  }

  function makeFeedbackController(){
    const layer = $("feedbackLayer"), symbol=$("feedbackSymbol"), title=$("feedbackTitle"), lead=$("feedbackLead"), lesson=$("feedbackLesson"), button=$("feedbackButton");
    let callback = null;
    let lesson1Active = false, returnFocus = null, previousInert = [];
    function open(opts){
      if(!layer) return;
      lesson1Active = opts.lesson1 === true;
      layer.classList.toggle("lesson1-feedback", lesson1Active);
      if(lesson1Active){
        layer.setAttribute("aria-describedby","feedbackLead feedbackLesson");
        returnFocus = document.activeElement;
        previousInert = [$("introScreen"), $("trainingScreen")].filter(Boolean).map(el=>[el,el.inert]);
        previousInert.forEach(([el])=>{el.inert=true;});
      } else layer.removeAttribute("aria-describedby");
      symbol.textContent = opts.symbol || "✓";
      symbol.className = "feedback-symbol " + (opts.kind === "info" ? "info-symbol" : "ok-symbol");
      title.textContent = opts.title || "できました！";
      lead.textContent = opts.lead || "";
      lesson.innerHTML = opts.html || "";
      button.textContent = opts.button || "続ける";
      callback = typeof opts.onClose === "function" ? opts.onClose : null;
      show(layer); lock();
      if(lesson1Active) button.focus({preventScroll:true});
    }
    button?.addEventListener("click",()=>{
      hide(layer); unlock();
      if(lesson1Active){
        previousInert.forEach(([el,value])=>{el.inert=value;});
        previousInert=[];
        if(returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
        returnFocus=null; lesson1Active=false;
      }
      const cb=callback; callback=null; if(cb) cb();
    });
    layer?.addEventListener("keydown",event=>{
      if(!lesson1Active)return;
      if(event.key==="Tab"){event.preventDefault();button.focus({preventScroll:true});}
      if(event.key==="Escape"){event.preventDefault();button.click();}
    });
    return {open};
  }

  function makeToast(){
    const el=$("lessonToast"); let timer=0;
    return (msg)=>{ if(!el)return; clearTimeout(timer); el.textContent=msg; show(el); timer=setTimeout(()=>hide(el),4200); };
  }

  function setProgress(n){ const el=$("progressText"); if(el) el.textContent=`Level 1　${n} / 6`; store.set("stage", n); }

  function isMostlyVisible(el, threshold=.55){
    if(!el)return false; const r=el.getBoundingClientRect(); const vh=window.innerHeight||document.documentElement.clientHeight;
    const visible=Math.max(0, Math.min(r.bottom,vh)-Math.max(r.top,0)); return visible >= Math.min(r.height,vh)*threshold;
  }

  function setupMain(){
    handleEntry();
    const feedback=makeFeedbackController(), toast=makeToast();
    const intro=$("introScreen"), training=$("trainingScreen"), start=$("startButton");
    const teacherBtn=$("teacherResetButton"), teacherLayer=$("teacherResetLayer"), teacherCancel=$("teacherResetCancel"), teacherConfirm=$("teacherResetConfirm");
    const teacherMode = new URLSearchParams(location.search).get("teacher") === "1";
    if(teacherMode) show(teacherBtn);

    const stage=Math.max(1, Math.min(6, Number(store.get("stage"))||1));
    const alreadyStarted = store.get("started") === "1";
    if(alreadyStarted) { hide(intro); show(training); }
    else { show(intro); hide(training); }

    start?.addEventListener("click",()=>{
      store.set("started",1); setProgress(1); hide(intro); show(training); window.scrollTo({top:0});
    });

    teacherBtn?.addEventListener("click",()=>{show(teacherLayer);lock();});
    teacherCancel?.addEventListener("click",()=>{hide(teacherLayer);unlock();});
    teacherConfirm?.addEventListener("click",()=>{store.clear(); location.href="index.html?start=1";});

    let l1Done = stage > 1;
    const l1Continue=$("lesson1ContinueButton"), l1Finish=$("lesson1Finish"), l2Section=$("lesson2Section");
    const lesson1Hit=()=>{
      if(store.get("started")!=="1" || !$("feedbackLayer").classList.contains("is-hidden"))return;
      feedback.open({lesson1:true,kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"商品を見たいときは、広告を開いてもかまいません。",html:"<p>今回は記事の続きを読む練習です。広告の下にある記事を探してみましょう。</p>",button:"記事に戻る"});
    };
    document.querySelectorAll("[data-lesson1-hit]").forEach(el=>el.addEventListener("click", lesson1Hit));
    function revealL1Finish(){
      show(l1Finish);
      l1Continue.setAttribute("aria-expanded","true");
      hide(l1Continue);
    }
    // L1-1は記事側の明示的な操作だけで完了する。スクロール判定を接続しない。
    l1Continue?.addEventListener("click",()=>{
      if(l1Done || store.get("started")!=="1" || !$("feedbackLayer").classList.contains("is-hidden"))return;
      l1Done=true; store.set("l1done",1); setProgress(2);
      feedback.open({lesson1:true,title:"できました！",lead:"広告の下にある、記事の続きを見つけられました。",html:"<p>広告が途中にあっても、押さずにそのまま記事を読み進められます。</p><p>『広告』『PR』などの表示も目印になります。</p>",button:"次の手順へ進む",onClose:()=>{
        revealL1Finish();show(l2Section);l1Finish.focus({preventScroll:true});scrollToEl(l1Finish);
      }});
    });

    const normalChoices=document.querySelectorAll("[data-normal-story]"), promoChoice=document.querySelector("[data-promo-story]");
    const l3Section=$("lesson3Section"), storyTitle=$("storyTitle"), storyLead=$("storyLead");
    promoChoice?.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"広告の表示に気づけましたか？",lead:"これは記事のように見える広告でした。",html:"<strong>見分ける手がかり</strong><p>記事に似た広告には、『PR』『広告』『スポンサー』などの表示が付いていることがあります。</p><p class=\"caution\">広告だから危険という意味ではありません。今回は記事を選ぶ練習です。</p>",button:"もう一度選ぶ"}));
    normalChoices.forEach(btn=>btn.addEventListener("click",()=>{
      if(store.get("l2done")==="1")return;
      const which=btn.dataset.story;
      if(which==="prep"){
        storyTitle.textContent="忙しい日の作り置きアイデア";
        storyLead.textContent="無理なく続けるために、少ない手間で準備できる作り置きのコツを紹介します。";
      }
      store.set("l2done",1); setProgress(3);
      feedback.open({title:"見分けられました！",lead:"記事と広告は、見た目がよく似ていることがあります。",html:"<strong>今回のポイント</strong><p>小さな『PR』『広告』表示も、選ぶときの手がかりになります。</p>",onClose:()=>{hide(l2Section);show(l3Section);showL3Bar();scrollToEl(l3Section);}});
    }));

    const l3Bar=$("lesson3Bar"), l3Close=$("closeLesson3Bar"), l3Goal=$("lesson3Goal"), l4Button=$("openLesson4Button");
    let l3Done=stage>3 || store.get("l3done")==="1";
    function showL3Bar(){ if(!l3Done){show(l3Bar);document.body.classList.add("has-bottom-panel");} }
    function completeL3(mode){
      if(l3Done)return; l3Done=true; store.set("l3done",1); hide(l3Bar); document.body.classList.remove("has-bottom-panel"); setProgress(4);
      const message=mode==="close" ? "邪魔な広告を閉じられました。" : "広告を残したまま、そのまま記事を読めました。";
      const point=mode==="close" ? "邪魔な広告は、×で閉じられることがあります。ただし、必ず閉じなければいけないわけではありません。" : "画面下の広告は、気にならなければそのまま読み進めても大丈夫です。";
      show(l4Button);
      feedback.open({title:"できました！",lead:message,html:`<strong>今回のポイント</strong><p>${point}</p>`,onClose:()=>scrollToEl(l4Button)});
    }
    l3Close?.addEventListener("click",()=>completeL3("close"));
    document.querySelectorAll("[data-lesson3-hit]").forEach(el=>el.addEventListener("click",()=>toast("広告の部分を押しました。商品を見たいときは開いても構いません。今回は記事を読む練習なので、そのまま読み進めてみましょう。")));
    function checkL3(){ if(!l3Done && !l3Section?.classList.contains("is-hidden") && isMostlyVisible(l3Goal,.65)) completeL3("ignore"); }
    window.addEventListener("scroll",checkL3,{passive:true});

    const l4Layer=$("lesson4Layer"), l4Close=$("closeLesson4Button"), transition=$("siteATransition");
    l4Button?.addEventListener("click",()=>{ if(!l3Done)return; show(l4Layer);lock(); });
    document.querySelectorAll("[data-lesson4-hit]").forEach(el=>el.addEventListener("click",()=>toast("広告の部分を押しました。商品を見たいときは開いてもかまいません。今回は記事の続きを読みたいので、広告を閉じる『×』を探してみましょう。")));
    l4Close?.addEventListener("click",()=>{
      hide(l4Layer); unlock(); store.set("l4done",1); setProgress(5);
      feedback.open({title:"閉じられました！",lead:"画面をふさぐ普通の広告を閉じて、元のページへ戻れました。",html:"<strong>今回のポイント</strong><p>普通の広告では、『×』や『閉じる』で元のページへ戻れることがあります。</p><p class=\"caution\">※怪しい警告画面では、画面内の×が安全とは限りません。これはLevel 3で練習します。</p>",onClose:()=>{show(transition);scrollToEl(transition);}});
    });

    $("goSiteBButton")?.addEventListener("click",()=>store.set("stage",5));

    function restoreMain(s){
      setProgress(s);
      if(s>=2){l1Done=true;revealL1Finish();show(l2Section);}
      if(s>=3){hide(l2Section);show(l3Section);}
      if(s===3 && store.get("l3done")!=="1") showL3Bar();
      if(s>=4){l3Done=true;hide(l3Bar);show(l4Button);document.body.classList.remove("has-bottom-panel");}
      if(s>=5){show(transition);}
    }

    if(alreadyStarted) restoreMain(stage);
  }

  function runCountdown(seconds, counterEl, onDone, progressEl){
    const started=performance.now(), duration=seconds*1000;
    let stopped=false;
    function tick(now){
      if(stopped)return;
      const elapsed=Math.min(duration, now-started); const left=Math.max(0, Math.ceil((duration-elapsed)/1000));
      if(counterEl) counterEl.textContent = counterEl.dataset.format === "clock" ? `0:0${left}` : `あと${left}秒`;
      if(progressEl) progressEl.style.width = `${Math.min(100,(elapsed/duration)*100)}%`;
      if(elapsed>=duration){ onDone?.(); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick); return ()=>{stopped=true;};
  }

  function setupOuting(){
    handleEntry();
    if(store.get("started")!=="1") { location.replace("index.html"); return; }
    const feedback=makeFeedbackController(), toast=makeToast();
    const home=$("outingHome"), article=$("outingArticle"), l5Open=$("openLesson5Button"), l5Layer=$("lesson5Layer"), l5Counter=$("lesson5Counter"), l5Close=$("lesson5Close");
    const l6Open=$("openLesson6Button"), l6Layer=$("lesson6Layer"), l6Counter=$("lesson6Counter"), l6Skip=$("lesson6Skip"), progress=$("videoProgressFill"), complete=$("level1Complete"), instruction=$("outingInstruction");
    let stop5=null, stop6=null;
    const stage=Math.max(5,Math.min(6,Number(store.get("stage"))||5)); setProgress(stage);

    if(store.get("l5done")==="1"){hide(home);show(article);}
    if(store.get("l6done")==="1"){hide(home);hide(article);show(complete);setProgress(6);}

    l5Open?.addEventListener("click",()=>{
      show(l5Layer); lock(); hide(l5Close); l5Counter.textContent="あと3秒";
      if(stop5)stop5(); stop5=runCountdown(3,l5Counter,()=>{show(l5Close);l5Counter.textContent="閉じることができます";});
    });
    document.querySelectorAll("[data-lesson5-hit]").forEach(el=>el.addEventListener("click",()=>toast("広告の部分を押しました。今回は記事を読みたいので、少し待ってみましょう。広告によっては、数秒すると『閉じる』が表示されることがあります。")));
    l5Close?.addEventListener("click",()=>{
      if(stop5)stop5(); hide(l5Layer); unlock(); store.set("l5done",1); setProgress(6);
      feedback.open({title:"待てました！",lead:"すぐには閉じられない広告でも、少し待ってから閉じることができました。",html:"<strong>今回のポイント</strong><p>広告は、すぐに閉じる場所が表示されないことがあります。慌てて画面を押さず、少し待つと操作できるようになる場合があります。</p><p class=\"caution\">待ち時間は広告によって違います。</p>",onClose:()=>{hide(home);show(article);instruction.textContent="記事の続きを読んでください。";window.scrollTo({top:0,behavior:"smooth"});}});
    });

    l6Open?.addEventListener("click",()=>{
      show(l6Layer);lock();hide(l6Skip);progress.style.width="0%";l6Counter.dataset.format="clock";l6Counter.textContent="0:05";
      if(stop6)stop6();stop6=runCountdown(5,l6Counter,()=>{show(l6Skip);l6Counter.textContent="スキップできます";progress.style.width="100%";},progress);
    });
    document.querySelectorAll("[data-lesson6-hit]").forEach(el=>el.addEventListener("click",()=>toast("広告の部分を押しました。今回は続きを見たいので、少し待ってみましょう。数秒すると『広告をスキップ』が表示されることがあります。")));
    l6Skip?.addEventListener("click",()=>{
      if(stop6)stop6();hide(l6Layer);unlock();store.set("l6done",1);store.set("stage",6);
      feedback.open({title:"スキップできました！",lead:"表示されるまで待って、広告をスキップできました。",html:"<strong>今回のポイント</strong><p>動画広告は、数秒待つと『スキップ』が表示されることがあります。</p><p class=\"caution\">すべての広告にスキップがあるわけではなく、待ち時間や閉じ方も広告によって違います。</p>",button:"Level 1のまとめを見る",onClose:()=>{hide(article);show(complete);instruction.textContent="Level 1の振り返り";window.scrollTo({top:0,behavior:"smooth"});}});
    });
  }

  if(page==="main") setupMain();
  else if(page==="outing") setupOuting();
  else location.replace("index.html");
})();
