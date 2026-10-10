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
  const unlock = () => { document.body.style.overflow = ["feedbackLayer","teacherResetLayer","lesson4Layer","lesson5Layer","lesson6Layer"].some(id=>$(id) && !$(id).classList.contains("is-hidden")) ? "hidden" : ""; };
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
      if(!layer || !layer.classList.contains("is-hidden")) return;
      lesson1Active = opts.lesson1 === true;
      layer.classList.toggle("lesson1-feedback", lesson1Active);
      {
        layer.setAttribute("aria-describedby","feedbackLead feedbackLesson");
        returnFocus = document.activeElement;
        previousInert = [$("introScreen"), $("trainingScreen"), $("lesson3Bar"), $("lesson4Layer"), $("lesson5Layer"), $("lesson6Layer")].filter(Boolean).map(el=>[el,el.inert]);
        previousInert.forEach(([el])=>{el.inert=true;});
      }
      symbol.textContent = opts.symbol || "✓";
      symbol.className = "feedback-symbol " + (opts.kind === "info" ? "info-symbol" : "ok-symbol");
      title.textContent = opts.title || "できました！";
      lead.textContent = opts.lead || "";
      lesson.innerHTML = opts.html || "";
      button.textContent = opts.button || "続ける";
      callback = typeof opts.onClose === "function" ? opts.onClose : null;
      show(layer); lock();
      button.focus({preventScroll:true});
    }
    button?.addEventListener("click",()=>{
      hide(layer); unlock();
      {
        previousInert.forEach(([el,value])=>{el.inert=value;});
        previousInert=[];
        if(returnFocus?.isConnected && !returnFocus.closest?.(".is-hidden")) returnFocus.focus({preventScroll:true});
        returnFocus=null; lesson1Active=false;
      }
      const cb=callback; callback=null; if(cb) cb();
    });
    layer?.addEventListener("keydown",event=>{
      if(event.key==="Tab"){event.preventDefault();button.focus({preventScroll:true});}
      if(event.key==="Escape"){event.preventDefault();button.click();}
    });
    return {open};
  }

  function openScenarioLayer(layer, firstFocus){
    show(layer);lock();$("trainingScreen").inert=true;
    (firstFocus||layer).focus({preventScroll:true});
  }
  function closeScenarioLayer(layer){hide(layer);$("trainingScreen").inert=false;unlock();}
  function setupScenarioFocus(){
    ["lesson4Layer","lesson5Layer","lesson6Layer"].forEach(id=>{
      const layer=$(id);if(!layer)return;layer.setAttribute("tabindex","-1");
      layer.addEventListener("keydown",event=>{
        if(event.key!=="Tab")return;
        const buttons=Array.from(layer.querySelectorAll?.("button")||[]).filter(el=>!el.classList.contains("is-hidden")&&!el.disabled);
        if(!buttons.length){event.preventDefault();layer.focus();return;}
        const first=buttons[0],last=buttons[buttons.length-1],active=document.activeElement;
        if(event.shiftKey && (active===first||active===layer)){event.preventDefault();last.focus();}
        else if(!event.shiftKey && (active===last||active===layer)){event.preventDefault();first.focus();}
      });
    });
  }

  function setupTeacherControls(){
    const teacherMode=new URLSearchParams(location.search).get("teacher")==="1";
    if(!teacherMode)return;
    show($("teacherResetButton"));
    ["goSiteBButton","practiceAgainButton"].forEach(id=>{const link=$(id);if(link)link.href=id==="goSiteBButton" ? "outing.html?teacher=1" : "index.html?start=1&teacher=1";});
    $("teacherResetButton")?.addEventListener("click",()=>{show($("teacherResetLayer"));lock();$("teacherResetCancel")?.focus({preventScroll:true});});
    $("teacherResetCancel")?.addEventListener("click",()=>{hide($("teacherResetLayer"));unlock();$("teacherResetButton")?.focus({preventScroll:true});});
    $("teacherResetConfirm")?.addEventListener("click",()=>{store.clear();location.href="index.html?start=1&teacher=1";});
    $("teacherResetLayer")?.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();$("teacherResetCancel").click();}
      if(event.key==="Tab"){event.preventDefault();const next=document.activeElement===$("teacherResetCancel") ? $("teacherResetConfirm") : $("teacherResetCancel");next.focus({preventScroll:true});}
    });
  }

  function setupPublisherNavigation(){
    document.querySelectorAll("[data-topic]").forEach(link=>link.addEventListener("click",event=>{
      event.preventDefault();const topic=$(link.dataset.topic);if(!topic)return;
      topic.open=true;const menu=link.closest?.(".publisher-menu");if(menu)menu.open=false;
      scrollToEl(topic);
    }));
  }

  function setProgress(n){ const el=$("progressText"); if(el) el.textContent=`Level 1　${n} / 6`; store.set("stage", n); }

  function setupMain(){
    handleEntry();
    setupTeacherControls();setupPublisherNavigation();setupScenarioFocus();
    const feedback=makeFeedbackController();
    const intro=$("introScreen"), training=$("trainingScreen"), start=$("startButton");
    const stage=Math.max(1, Math.min(6, Number(store.get("stage"))||1));
    const alreadyStarted = store.get("started") === "1";
    if(alreadyStarted) { hide(intro); show(training); }
    else { show(intro); hide(training); }

    start?.addEventListener("click",()=>{
      store.set("started",1); setProgress(1); hide(intro); show(training); window.scrollTo({top:0});
    });

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
        revealL1Finish();show(l2Section);$("instructionBox").textContent="次に読む記事を選んでください。";l1Finish.focus({preventScroll:true});scrollToEl(l1Finish);
      }});
    });

    const normalChoices=document.querySelectorAll("[data-normal-story]"), promoChoice=document.querySelector("[data-promo-story]");
    const l3Section=$("lesson3Section"), storyTitle=$("storyTitle"), storyLead=$("storyLead");
    promoChoice?.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"PRの案内を開きました",lead:"PRは、商品やサービスを紹介する表示です。",html:"<strong>見分ける手がかり</strong><p>記事に似た広告には、『PR』『広告』『スポンサー』などの表示が付いていることがあります。</p><p class=\"caution\">広告だから危険という意味ではありません。今回は記事を選ぶ練習です。</p>",button:"もう一度選ぶ"}));
    const storyContent={
      stew:{title:"煮込み料理をおいしく仕上げる3つのコツ",lead:"ちょっとした火加減と水分調整で、いつもの煮込み料理がぐっと作りやすくなります。",photo:"assets/stew-cooking-tips.webp",alt:"鍋で煮込み料理を作る様子",caption:"火加減と水分を見ながら、少しずつ味を整えます。",tips:[["1　最初に香ばしさをつける","肉や野菜を軽く焼いてから煮込むと、味に奥行きが出ます。"],["2　ふたの開け閉めで水分を調整","煮詰まりすぎたら少量の水を足し、ゆるいときはふたを外して調整します。"],["3　最後に味を整える","塩味や酸味は煮込み終わりに確認すると、調整しやすくなります。"]]},
      prep:{title:"忙しい日の作り置きアイデア",lead:"無理なく続けるために、少ない手間で準備できる作り置きのコツを紹介します。",photo:"assets/chicken-tomato-stew.webp",alt:"器に盛りつけた鶏肉のトマト煮",caption:"いつもの主菜を作るときに、翌日の準備も少しだけ。",tips:[["1　作るものを絞る","最初はいつもの主菜と、野菜の下ごしらえ一つから。無理なく続けられる量を選びます。"],["2　準備の手間をまとめる","料理に使う野菜を切るときに、次に使う分の準備も一緒に。調理台を使う時間をまとめられます。"],["3　作った日が分かるようにする","容器に作った日を書いておくと、冷蔵庫を見たときに分かりやすくなります。保存方法や食べる時期も確認しましょう。"]]}
    };
    function renderStory(which){
      const item=storyContent[which]||storyContent.stew;
      storyTitle.textContent=item.title;storyLead.textContent=item.lead;
      $("storyPhoto").src=item.photo;$("storyPhoto").alt=item.alt;$("storyCaption").textContent=item.caption;
      item.tips.forEach((tip,i)=>{$("storyTip"+(i+1)+"Title").textContent=tip[0];$("storyTip"+(i+1)+"Text").textContent=tip[1];});
    }
    normalChoices.forEach(btn=>btn.addEventListener("click",()=>{
      if(store.get("l2done")==="1" || !l1Done || !$("feedbackLayer").classList.contains("is-hidden"))return;
      store.set("story",btn.dataset.story);renderStory(btn.dataset.story);
      store.set("l2done",1);setProgress(3);
      feedback.open({title:"記事を選べました",lead:"選んだ記事の続きを読んでみましょう。",html:"<p>商品やサービスの案内には、『PR』『広告』などの表示が付くことがあります。今回は記事を読む目的で選びました。</p>",onClose:()=>{hide($("recipeContent"));hide(l2Section);show(l3Section);$("instructionBox").textContent="選んだ記事を読み進めてください。";showL3Bar();scrollToEl(l3Section);}});
    }));

    const l3Bar=$("lesson3Bar"), l3Close=$("closeLesson3Bar"), l4Button=$("openLesson4Button");
    let l3Done=stage>3 || store.get("l3done")==="1";
    function showL3Bar(){ if(!l3Done && store.get("l3closed")!=="1"){show(l3Bar);document.body.classList.add("has-bottom-panel");} }
    function completeL3(mode){
      if(l3Done)return; l3Done=true; store.set("l3done",1); hide(l3Bar); document.body.classList.remove("has-bottom-panel"); setProgress(4);
      const message=mode==="close" ? "邪魔な広告を閉じられました。" : "広告を残したまま、そのまま記事を読めました。";
      const point=mode==="close" ? "邪魔な広告は、×で閉じられることがあります。ただし、必ず閉じなければいけないわけではありません。" : "画面下の広告は、気にならなければそのまま読み進めても大丈夫です。";
      hide($("lesson3ContinueButton"));show($("lesson3Finish"));show(l4Button);
      feedback.open({title:"できました！",lead:message,html:`<strong>今回のポイント</strong><p>${point}</p>`,onClose:()=>scrollToEl($("lesson3Finish"))});
    }
    l3Close?.addEventListener("click",()=>{
      if(l3Done)return;store.set("l3closed",1);hide(l3Bar);document.body.classList.remove("has-bottom-panel");
      $("instructionBox").textContent="選んだ記事の続きを読み進めてください。";
    });
    $("lesson3ContinueButton")?.addEventListener("click",()=>{
      if(l3Section.classList.contains("is-hidden") || !$("feedbackLayer").classList.contains("is-hidden"))return;
      completeL3(store.get("l3closed")==="1" ? "close" : "ignore");
    });
    document.querySelectorAll("[data-lesson3-hit]").forEach(el=>el.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"商品を見たいときは開いてもかまいません。",html:"<p>今回は記事を読む練習です。記事に戻って、続きを読み進めてみましょう。</p>",button:"記事に戻る"})));

    const l4Layer=$("lesson4Layer"), l4Close=$("closeLesson4Button"), transition=$("siteATransition");
    l4Button?.addEventListener("click",()=>{ if(!l3Done || !$("feedbackLayer").classList.contains("is-hidden"))return;openScenarioLayer(l4Layer,l4Close); });
    document.querySelectorAll("[data-lesson4-hit]").forEach(el=>el.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"今回は、記事の続きを読む練習です。",html:"<p>商品を見たいときは広告を開いてもかまいません。記事へ戻るための『×』を探してみましょう。</p>",button:"練習画面に戻る"})));
    l4Close?.addEventListener("click",()=>{
      if(l4Layer.classList.contains("is-hidden") || !$("feedbackLayer").classList.contains("is-hidden"))return;
      closeScenarioLayer(l4Layer); store.set("l4done",1); setProgress(5);
      feedback.open({title:"閉じられました！",lead:"画面をふさぐ普通の広告を閉じて、元のページへ戻れました。",html:"<strong>今回のポイント</strong><p>普通の広告では、『×』や『閉じる』で元のページへ戻れることがあります。</p><p class=\"caution\">※怪しい警告画面では、画面内の×が安全とは限りません。これはLevel 3で練習します。</p>",onClose:()=>{show($("lesson4Article"));show(transition);$("instructionBox").textContent="記事へ戻れました。別のサイトの記事も見てみましょう。";scrollToEl($("lesson4Article"));}});
    });

    $("goSiteBButton")?.addEventListener("click",()=>store.set("stage",5));

    function restoreMain(s){
      setProgress(s);
      if(s>=2){l1Done=true;revealL1Finish();show(l2Section);$("instructionBox").textContent="次に読む記事を選んでください。";}
      if(s>=3){hide($("recipeContent"));hide(l2Section);renderStory(store.get("story"));show(l3Section);$("instructionBox").textContent="選んだ記事を読み進めてください。";}
      if(s===3 && store.get("l3done")!=="1") showL3Bar();
      if(s>=4){l3Done=true;hide(l3Bar);hide($("lesson3ContinueButton"));show($("lesson3Finish"));show(l4Button);document.body.classList.remove("has-bottom-panel");}
      if(s>=5){show($("lesson4Article"));show(transition);$("instructionBox").textContent="記事へ戻れました。別のサイトの記事も見てみましょう。";}
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
    if(store.get("started")!=="1") { location.replace("index.html"+(new URLSearchParams(location.search).get("teacher")==="1" ? "?teacher=1" : "")); return; }
    if((Number(store.get("stage"))||1)<5){location.replace("index.html"+(new URLSearchParams(location.search).get("teacher")==="1" ? "?teacher=1" : ""));return;}
    setupTeacherControls();setupPublisherNavigation();setupScenarioFocus();
    const feedback=makeFeedbackController();
    const home=$("outingHome"), article=$("outingArticle"), l5Open=$("openLesson5Button"), l5Layer=$("lesson5Layer"), l5Counter=$("lesson5Counter"), l5Close=$("lesson5Close");
    const l6Open=$("openLesson6Button"), l6Layer=$("lesson6Layer"), l6Counter=$("lesson6Counter"), l6Skip=$("lesson6Skip"), progress=$("videoProgressFill"), complete=$("level1Complete"), instruction=$("outingInstruction");
    let stop5=null, stop6=null;
    const stage=Math.max(5,Math.min(6,Number(store.get("stage"))||5)); setProgress(stage);

    if(store.get("l5done")==="1"){hide(home);show(article);instruction.textContent="記事の続きを読んでください。";}
    if(store.get("l6done")==="1"){hide(home);hide(article);show(complete);setProgress(6);instruction.textContent="Level 1の振り返り";}

    l5Open?.addEventListener("click",()=>{
      if(home.classList.contains("is-hidden") || !$("feedbackLayer").classList.contains("is-hidden"))return;
      hide(l5Close);openScenarioLayer(l5Layer); l5Counter.textContent="あと3秒";
      if(stop5)stop5(); stop5=runCountdown(3,l5Counter,()=>{show(l5Close);l5Counter.textContent="閉じることができます";});
    });
    document.querySelectorAll("[data-lesson5-hit]").forEach(el=>el.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"今回は記事を読む練習です。",html:"<p>少し待つと『閉じる』が表示されることがあります。落ち着いて、画面の表示を見てみましょう。</p>",button:"練習画面に戻る"})));
    l5Close?.addEventListener("click",()=>{
      if(l5Layer.classList.contains("is-hidden") || l5Close.classList.contains("is-hidden") || !$("feedbackLayer").classList.contains("is-hidden"))return;
      if(stop5)stop5(); closeScenarioLayer(l5Layer); store.set("l5done",1); setProgress(6);
      feedback.open({title:"待てました！",lead:"すぐには閉じられない広告でも、少し待ってから閉じることができました。",html:"<strong>今回のポイント</strong><p>広告は、すぐに閉じる場所が表示されないことがあります。慌てて画面を押さず、少し待つと操作できるようになる場合があります。</p><p class=\"caution\">待ち時間は広告によって違います。</p>",onClose:()=>{hide(home);show(article);instruction.textContent="記事の続きを読んでください。";window.scrollTo({top:0,behavior:"smooth"});}});
    });

    l6Open?.addEventListener("click",()=>{
      if(article.classList.contains("is-hidden") || store.get("l5done")!=="1" || !$("feedbackLayer").classList.contains("is-hidden"))return;
      hide(l6Skip);openScenarioLayer(l6Layer);progress.style.width="0%";l6Counter.dataset.format="clock";l6Counter.textContent="0:05";
      if(stop6)stop6();stop6=runCountdown(5,l6Counter,()=>{show(l6Skip);l6Counter.textContent="スキップできます";progress.style.width="100%";},progress);
    });
    document.querySelectorAll("[data-lesson6-hit]").forEach(el=>el.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"今回は記事の続きを読む練習です。",html:"<p>少し待つと『広告をスキップ』が表示されることがあります。表示を見てみましょう。</p>",button:"練習画面に戻る"})));
    l6Skip?.addEventListener("click",()=>{
      if(l6Layer.classList.contains("is-hidden") || l6Skip.classList.contains("is-hidden") || !$("feedbackLayer").classList.contains("is-hidden"))return;
      if(stop6)stop6();closeScenarioLayer(l6Layer);store.set("l6done",1);store.set("stage",6);
      feedback.open({title:"スキップできました！",lead:"表示されるまで待って、広告をスキップできました。",html:"<strong>今回のポイント</strong><p>動画広告は、数秒待つと『スキップ』が表示されることがあります。</p><p class=\"caution\">すべての広告にスキップがあるわけではなく、待ち時間や閉じ方も広告によって違います。</p>",button:"Level 1のまとめを見る",onClose:()=>{hide(article);show(complete);instruction.textContent="Level 1の振り返り";window.scrollTo({top:0,behavior:"smooth"});}});
    });
  }

  if(page==="main") setupMain();
  else if(page==="outing") setupOuting();
  else location.replace("index.html");
})();
