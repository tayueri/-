(() => {
  "use strict";

  const page = document.body.dataset.page || "main";
  const entryParams = new URLSearchParams(location.search);
  const proposedPractice = Number(entryParams.get("practice"));
  const practiceLesson = !entryParams.has("start") && !entryParams.has("reset") && Number.isInteger(proposedPractice) && proposedPractice >= 1 && proposedPractice <= 6 ? proposedPractice : 0;
  const COURSE_PREFIX = "level1Training.";
  const PREFIX = practiceLesson ? "level1Review." + practiceLesson + "." : COURSE_PREFIX;
  let supportController = null;
  function courseGet(key){try{return sessionStorage.getItem(COURSE_PREFIX + key);}catch(e){return null;}}
  function reviewMeta(key,value){try{if(value===undefined)return sessionStorage.getItem("level1Review."+key);sessionStorage.setItem("level1Review."+key,String(value));}catch(e){return null;}}
  function clearCourse(){try{Object.keys(sessionStorage).forEach(k=>{if(k.startsWith(COURSE_PREFIX)||k.startsWith("level1Review."))sessionStorage.removeItem(k);});}catch(e){}}
  function clearPractice(n){try{Object.keys(sessionStorage).forEach(k=>{if(k.startsWith("level1Review."+n+"."))sessionStorage.removeItem(k);});}catch(e){}}

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
  const unlock = () => { document.body.style.overflow = ["feedbackLayer","teacherResetLayer","supportLayer","lesson4Layer","lesson5Layer","lesson6Layer"].some(id=>$(id) && !$(id).classList.contains("is-hidden")) ? "hidden" : ""; };
  const scrollToEl = (el) => { if(el) setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),120); };

  function handleEntry(){
    const params = new URLSearchParams(location.search);
    if(params.get("start") === "1" || params.get("reset") === "1"){
      clearCourse();
      const keepTeacher = params.get("teacher") === "1" ? "?teacher=1" : "";
      history.replaceState({}, "", location.pathname + keepTeacher + location.hash);
    }
  }

  function interactionReady(){return ["feedbackLayer","supportLayer","teacherResetLayer"].every(id=>!$(id)||$(id).classList.contains("is-hidden"));}
  function makeFeedbackController(){
    const layer = $("feedbackLayer"), symbol=$("feedbackSymbol"), title=$("feedbackTitle"), lead=$("feedbackLead"), lesson=$("feedbackLesson"), button=$("feedbackButton");
    let callback = null;
    let lesson1Active = false, returnFocus = null, previousInert = [];
    function open(opts){
      if(!layer || !interactionReady()) return;
      lesson1Active = opts.lesson1 === true;
      layer.classList.toggle("lesson1-feedback", lesson1Active);
      {
        layer.setAttribute("aria-describedby",opts.html ? "feedbackLead feedbackLesson" : "feedbackLead");
        returnFocus = document.activeElement;
        previousInert = [$("introScreen"), $("trainingScreen"), $("lesson3Bar"), $("lesson4Layer"), $("lesson5Layer"), $("lesson6Layer")].filter(Boolean).map(el=>[el,el.inert]);
        previousInert.forEach(([el])=>{el.inert=true;});
      }
      symbol.textContent = opts.symbol || "✓";
      symbol.className = "feedback-symbol " + (opts.kind === "info" ? "info-symbol" : "ok-symbol");
      title.textContent = opts.title || "できました！";
      lead.textContent = opts.lead || "";
      lesson.innerHTML = opts.html || "";
      if(opts.html) show(lesson); else hide(lesson);
      button.textContent = opts.button || "続ける";
      const originalClose = typeof opts.onClose === "function" ? opts.onClose : null;
      callback = practiceLesson && opts.kind !== "info" ? ()=>{if(originalClose)originalClose();finishPractice();} : originalClose;
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
    supportController?.update();
    (firstFocus||layer).focus({preventScroll:true});
  }
  function closeScenarioLayer(layer){hide(layer);$("trainingScreen").inert=false;unlock();supportController?.update();}
  function setupScenarioFocus(){
    ["lesson4Layer","lesson5Layer","lesson6Layer"].forEach(id=>{
      const layer=$(id);if(!layer)return;layer.setAttribute("tabindex","-1");
      layer.addEventListener("keydown",event=>{
        if(event.key!=="Tab")return;
        const buttons=Array.from(layer.querySelectorAll?.("button")||[]).filter(el=>!el.closest?.(".is-hidden")&&!el.disabled);
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
    $("teacherResetConfirm")?.addEventListener("click",()=>{clearCourse();location.href="index.html?start=1&teacher=1";});
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

  function setProgress(n){ const el=$("progressText"); if(el) el.textContent=practiceLesson ? `復習　体験 ${practiceLesson} / 6` : `Level 1　${n} / 6`; store.set("stage", n); supportController?.update(); }

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
      if(store.get("started")!=="1" || !interactionReady())return;
      feedback.open({lesson1:true,kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"商品を見たいときは、広告を開いてもかまいません。今回は記事を読む練習です。記事に戻って、続きを探しましょう。",html:"",button:"記事に戻る"});
    };
    document.querySelectorAll("[data-lesson1-hit]").forEach(el=>el.addEventListener("click", lesson1Hit));
    function revealL1Finish(){
      show(l1Finish);
      l1Continue.setAttribute("aria-expanded","true");
      hide(l1Continue);
    }
    // L1-1は記事側の明示的な操作だけで完了する。スクロール判定を接続しない。
    l1Continue?.addEventListener("click",()=>{
      if(l1Done || store.get("started")!=="1" || !interactionReady())return;
      l1Done=true; store.set("l1done",1); setProgress(2);
      feedback.open({lesson1:true,title:"記事の続きを開けました",lead:"広告が途中にあっても、その下に記事は続いています。「広告」の表示も目印になります。",html:"",button:"記事の続きへ",onClose:()=>{
        revealL1Finish();show(l2Section);$("instructionBox").textContent="次に読む記事をひとつ選んでください。";l1Finish.focus({preventScroll:true});scrollToEl(l1Finish);
      }});
    });

    const normalChoices=document.querySelectorAll("[data-normal-story]"), promoChoice=document.querySelector("[data-promo-story]");
    const l3Section=$("lesson3Section"), storyTitle=$("storyTitle"), storyLead=$("storyLead");
    promoChoice?.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"PRの案内を開きました",lead:"PRは、ここでは商品やサービスを紹介する表示です。案内を見ること自体が危険という意味ではありません。今回は読む記事を選び直してみましょう。",html:"",button:"記事を選び直す"}));
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
      if(store.get("l2done")==="1" || !l1Done || !interactionReady())return;
      store.set("story",btn.dataset.story);renderStory(btn.dataset.story);
      store.set("l2done",1);setProgress(3);
      feedback.open({title:"記事を選べました",lead:"商品やサービスの案内には「PR」「広告」などの表示が付くことがあります。選んだ記事を読んでみましょう。",html:"",button:"選んだ記事を読む",onClose:()=>{hide($("recipeContent"));hide(l2Section);show(l3Section);$("instructionBox").textContent="選んだ記事を読み進めてください。";showL3Bar();scrollToEl(l3Section);}});
    }));

    const l3Bar=$("lesson3Bar"), l3Close=$("closeLesson3Bar"), l4Button=$("openLesson4Button");
    let l3Done=stage>3 || store.get("l3done")==="1";
    function showL3Bar(){ if(!l3Done && store.get("l3closed")!=="1"){show(l3Bar);document.body.classList.add("has-bottom-panel");} }
    function completeL3(mode){
      if(l3Done)return; l3Done=true; store.set("l3done",1); hide(l3Bar); document.body.classList.remove("has-bottom-panel"); setProgress(4);
      hide($("lesson3ContinueButton"));show($("lesson3Finish"));show(l4Button);
      feedback.open({title:"記事の続きを開けました",lead:"邪魔なら閉じても、本文が読めるなら残してもかまいません。どちらでも記事を読み進められます。",html:"",button:"記事の続きへ",onClose:()=>scrollToEl($("lesson3Finish"))});
    }
    l3Close?.addEventListener("click",()=>{
      if(l3Done||!interactionReady())return;store.set("l3closed",1);hide(l3Bar);document.body.classList.remove("has-bottom-panel");
      $("instructionBox").textContent="選んだ記事の続きを読み進めてください。";
    });
    $("lesson3ContinueButton")?.addEventListener("click",()=>{
      if(l3Section.classList.contains("is-hidden") || !interactionReady())return;
      completeL3(store.get("l3closed")==="1" ? "close" : "ignore");
    });
    document.querySelectorAll("[data-lesson3-hit]").forEach(el=>el.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"商品を見たいときは、広告を開いてもかまいません。今回は記事を読む練習です。記事に戻って、続きを読みましょう。",html:"",button:"記事に戻る"})));

    const l4Layer=$("lesson4Layer"), l4Close=$("closeLesson4Button"), transition=$("siteATransition");
    l4Button?.addEventListener("click",()=>{ if(!l3Done || !interactionReady())return;$("instructionBox").textContent="「味つけの基本」の記事を開いて読んでください。";openScenarioLayer(l4Layer,l4Close); });
    document.querySelectorAll("[data-lesson4-hit]").forEach(el=>el.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"商品を見たいときは、広告を開いてもかまいません。今回は記事を読む練習です。広告画面に戻って、記事へ戻れる操作を探しましょう。",html:"",button:"広告画面に戻る"})));
    l4Close?.addEventListener("click",()=>{
      if(l4Layer.classList.contains("is-hidden") || !interactionReady())return;
      closeScenarioLayer(l4Layer); store.set("l4done",1); setProgress(5);
      feedback.open({title:"広告を閉じられました",lead:"本文を覆っていた普通の広告を閉じられました。開こうとした記事に戻って、読み進めましょう。",html:"",button:"記事に戻る",onClose:()=>{show($("lesson4Article"));show(transition);$("instructionBox").textContent="記事へ戻れました。別のサイトの記事も見てみましょう。";scrollToEl($("lesson4Article"));}});
    });

    $("goSiteBButton")?.addEventListener("click",()=>store.set("stage",5));

    function restoreMain(s){
      setProgress(s);
      if(s>=2){l1Done=true;revealL1Finish();show(l2Section);$("instructionBox").textContent="次に読む記事をひとつ選んでください。";}
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
      if(counterEl) counterEl.textContent = counterEl.dataset.format === "clock" ? `${Math.floor(left/60)}:${String(left%60).padStart(2,"0")}` : `あと${left}秒`;
      if(progressEl) progressEl.style.width = `${Math.min(100,(elapsed/duration)*100)}%`;
      if(elapsed>=duration){ onDone?.(); supportController?.refreshHint(); return; }
      supportController?.refreshHint();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick); return ()=>{stopped=true;};
  }

  function setupOuting(){
    handleEntry();
    const teacher=new URLSearchParams(location.search).get("teacher")==="1";
    if(store.get("started")!=="1" || (Number(store.get("stage"))||1)<5){
      location.replace("index.html"+(teacher ? "?teacher=1" : ""));return;
    }
    setupTeacherControls();setupPublisherNavigation();setupScenarioFocus();
    const feedback=makeFeedbackController();
    const home=$("outingHome"),article=$("outingArticle"),packing=$("packingArticle"),complete=$("level1Complete");
    const instruction=$("outingInstruction");
    const l5Layer=$("lesson5Layer"),l5Counter=$("lesson5Counter"),l5Close=$("lesson5Close");
    const l6Layer=$("lesson6Layer"),l6Counter=$("lesson6Counter"),l6Skip=$("lesson6Skip"),progress=$("videoProgressFill");
    let stop5=null,stop6=null;
    const ready=interactionReady;
    function showView(view,move=true){
      [home,article,packing,complete].forEach(hide);
      const target={home,route:article,packing,complete}[view]||home;
      show(target);store.set("outingView",view);
      instruction.textContent=view==="home" ? "「紅葉を楽しめる日帰り散歩コース」の記事を開いてください。" : view==="route" ? "散歩の記事を読み進めてください。" : view==="packing" ? "持ち物の記事を読んでください。" : "Level 1の振り返り";
      if(move) window.scrollTo({top:0,behavior:"auto"});
    }
    function open5(){
      if(!ready())return;
      if(store.get("l5done")==="1"){showView("route");return;}
      store.set("outingView","scene5");hide(l5Close);l5Counter.textContent="あと10秒";
      openScenarioLayer(l5Layer);
      if(stop5)stop5();
      stop5=runCountdown(10,l5Counter,()=>{show(l5Close);l5Counter.textContent="閉じることができます";});
    }
    function open6(){
      if(!ready() || store.get("l5done")!=="1")return;
      if(store.get("l6done")==="1"){showView("packing");return;}
      store.set("outingView","scene6");instruction.textContent="「日帰り旅行の持ちもの」の記事を開いてください。";
      hide(l6Skip);progress.style.width="0%";l6Counter.dataset.format="clock";l6Counter.textContent="0:10";
      openScenarioLayer(l6Layer);
      if(stop6)stop6();
      stop6=runCountdown(10,l6Counter,()=>{show(l6Skip);l6Counter.textContent="スキップできます";progress.style.width="100%";},progress);
    }
    $("openLesson5Button")?.addEventListener("click",()=>{if(home.classList.contains("is-hidden"))return;open5();});
    $("openLesson6Button")?.addEventListener("click",()=>{if(article.classList.contains("is-hidden"))return;open6();});
    document.querySelectorAll("[data-lesson5-hit]").forEach(el=>el.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"商品を見たいときは、広告を開いてもかまいません。今回は記事を読む練習です。広告画面に戻って、表示の変化を見てみましょう。",html:"",button:"広告画面に戻る"})));
    document.querySelectorAll("[data-lesson6-hit]").forEach(el=>el.addEventListener("click",()=>feedback.open({kind:"info",symbol:"i",title:"広告の部分を押しました",lead:"商品を見たいときは、広告を開いてもかまいません。今回は記事を読む練習です。広告画面に戻って、表示の変化を見てみましょう。",html:"",button:"広告画面に戻る"})));
    l5Close?.addEventListener("click",()=>{
      if(l5Layer.classList.contains("is-hidden") || l5Close.classList.contains("is-hidden") || !ready())return;
      if(stop5)stop5();closeScenarioLayer(l5Layer);store.set("l5done",1);setProgress(6);store.set("outingView","route");
      feedback.open({title:"「閉じる」を使えました",lead:"すぐ閉じられない広告でも、少し待つと「閉じる」が現れることがあります。開こうとした記事へ戻れます。",html:"",button:"記事を読む",onClose:()=>showView("route")});
    });
    l6Skip?.addEventListener("click",()=>{
      if(l6Layer.classList.contains("is-hidden") || l6Skip.classList.contains("is-hidden") || !ready())return;
      if(stop6)stop6();closeScenarioLayer(l6Layer);store.set("l6done",1);setProgress(6);store.set("outingView","packing");
      feedback.open({title:"スキップを使えました",lead:"少し待つと「広告をスキップ」が現れることがあります。開こうとした記事へ進みましょう。",html:"",button:"記事を読む",onClose:()=>showView("packing")});
    });
    $("finishLevel1Button")?.addEventListener("click",()=>{
      if(!ready() || packing.classList.contains("is-hidden") || store.get("l6done")!=="1")return;showView("complete");
    });
    document.querySelectorAll("[data-outing-home]").forEach(link=>link.addEventListener("click",event=>{event.preventDefault();if(ready())showView("home");}));
    const view=store.get("outingView");
    setProgress(store.get("l5done")==="1" ? 6 : 5);
    if(store.get("l6done")==="1"){
      // Old Beta 03 completions have no view key; keep them completed.
      showView(view==="packing" ? "packing" : view==="home" ? "home" : view==="route" ? "route" : "complete",false);
    }else if(store.get("l5done")==="1"){
      showView(view==="home" ? "home" : "route",false);if(view==="scene6")open6();
    }else{showView("home",false);if(view==="scene5")open5();}
  }


  const supportHints = [["今は何を読みたいところでしたか。", "「広告」の表示と、料理の手順の見出しを見てみましょう。", "広告の下へ進み、本文の「次の手順を見る」を押してみましょう。"], ["今回は、記事と商品の案内のどちらを見たいですか。", "カードの見出しの近くに、どんな表示があるか見てみましょう。", "「PR」と書かれた案内と、料理の記事を見比べて、読む記事を選んでみましょう。"], ["今は記事のどこを読もうとしていましたか。", "画面下の枠があっても、本文を読めるか見てみましょう。", "読めるならそのまま本文のボタンへ。邪魔なら枠の×で閉じてから、本文のボタンへ進めます。"], ["今は商品の案内と記事のどちらを見たいですか。", "本文を覆う枠の、ふちや上の方を見てみましょう。", "この普通の広告は、枠の右上にある×で閉じられます。"], ["開こうとしていた記事を思い出してみましょう。", "閉じる表示がまだなければ少し待ち、画面がどう変わるか見てみましょう。", "「閉じる」が表示されていたら押して、散歩の記事へ戻りましょう。"], ["今はどの記事を開こうとしていましたか。", "前の体験で、時間がたつと表示が変わったことを思い出してみましょう。", "「広告をスキップ」が出ていたら押して、持ち物の記事へ進みましょう。"]];
  function activeLesson(){
    if(practiceLesson)return practiceLesson;
    if(page==="main")return Math.min(4,Math.max(1,Number(store.get("stage"))||1));
    const view=store.get("outingView");
    if(view==="complete")return 0;
    return view==="home"||view==="scene5" ? 5 : 6;
  }
  function isCourseDone(n){return courseGet("l"+n+"done")==="1" || (n<6 && Number(courseGet("stage"))>n);}
  function teacherSuffix(){return entryParams.get("teacher")==="1" ? "&teacher=1" : "";}
  function beginPractice(n){
    if(!interactionReady())return;
    const highest=Math.min(6,Math.max(1,Number(courseGet("stage"))||1));
    if(courseGet("started")!=="1" || n<1 || n>highest)return;
    if(!practiceLesson){reviewMeta("returnPage",page==="outing" ? "outing.html" : "index.html");reviewMeta("returnScroll",window.scrollY||0);}
    clearPractice(n);
    location.href=(n>=5 ? "outing.html" : "index.html")+"?practice="+n+teacherSuffix();
  }
  function returnToCourse(){
    if(!interactionReady())return;
    const fallback=Number(courseGet("stage"))>=5 ? "outing.html" : "index.html";
    const recorded=reviewMeta("returnPage"),target=recorded==="index.html"||recorded==="outing.html" ? recorded : fallback;
    location.href=target+"?resume=1"+teacherSuffix();
  }
  function finishPractice(){
    if(!practiceLesson)return;
    store.set("practiceComplete",1);
    ["lesson2Section","lesson3Bar","openLesson4Button","siteATransition","openLesson6Button","finishLevel1Button"].forEach(id=>hide($(id)));
    if(practiceLesson===2){hide($("lesson3ContinueButton"));}
    if(practiceLesson===1){hide($("lesson3Section"));}
    document.body.classList.remove("has-bottom-panel");
    show($("reviewCompletePanel"));supportController?.update();
  }
  function initializePractice(){
    if(!practiceLesson)return true;
    const highest=Math.min(6,Math.max(1,Number(courseGet("stage"))||1));
    if(courseGet("started")!=="1" || practiceLesson>highest){location.replace("index.html"+(entryParams.get("teacher")==="1" ? "?teacher=1" : ""));return false;}
    const target=practiceLesson>=5 ? "outing" : "main";
    if(page!==target){location.replace((target==="outing" ? "outing.html" : "index.html")+"?practice="+practiceLesson+teacherSuffix());return false;}
    if(store.get("started")!=="1"){
      store.set("started",1);store.set("stage",practiceLesson);
      for(let n=1;n<practiceLesson;n++)store.set("l"+n+"done",1);
      store.set("story",courseGet("story")||"stew");
      if(practiceLesson===6)store.set("outingView","route");
    }
    return true;
  }
  function jumpToLesson(n){
    const id={1:"recipeArticle",2:"lesson2Section",3:"lesson3Section",4:"openLesson4Button",5:"outingHome",6:"openLesson6Button"}[n],el=$(id);
    if(!el)return;
    setTimeout(()=>{
      const root=document.documentElement,prior=root.style?.scrollBehavior;
      if(root.style)root.style.scrollBehavior="auto";
      el.scrollIntoView({behavior:"auto",block:"start"});
      if(n!==4&&n!==6)el.setAttribute("tabindex","-1");el.focus({preventScroll:true});
      requestAnimationFrame(()=>{if(root.style)root.style.scrollBehavior=prior||"";});
    },120);
  }
  function setupSupport(){
    const layer=$("supportLayer"),title=$("supportTitle"),text=$("supportText"),more=$("supportMoreButton"),back=$("supportBackButton"),confirm=$("supportConfirmButton");
    let mode="",step=1,subject=0,returnFocus=null,previous=[];
    const backgrounds=()=>["introScreen","trainingScreen","lesson3Bar","lesson4Layer","lesson5Layer","lesson6Layer"].map($).filter(Boolean);
    function measureSpace(){
      const root=document.documentElement,header=document.querySelector(".training-header"),controls=$("supportControls");
      if(root.style?.setProperty){
        if(header)root.style.setProperty("--training-header-height",Math.ceil(header.getBoundingClientRect().height)+"px");
        if(controls)root.style.setProperty("--support-panel-height",Math.ceil(controls.getBoundingClientRect().height)+"px");
      }
      const row=Array.from(document.querySelectorAll(".support-stage-tools")).find(el=>!el.closest?.(".is-hidden"));
      if(row&&document.documentElement.style?.setProperty)document.documentElement.style.setProperty("--support-space",Math.ceil(row.getBoundingClientRect().height+6)+"px");
    }
    function update(){
      const n=activeLesson(),started=store.get("started")==="1",complete=practiceLesson && store.get("practiceComplete")==="1";
      if(started&&n)show($("supportControls"));else hide($("supportControls"));
      if($("supportContext"))$("supportContext").textContent=practiceLesson ? "復習中　体験"+n : "練習用サポート　体験"+n;
      const canHint=started&&n&&!complete&&store.get("l"+n+"done")!=="1";
      document.querySelectorAll("[data-support-hint]").forEach(b=>{b.disabled=!canHint;});
      document.querySelectorAll("[data-support-restart]").forEach(b=>{b.disabled=!started||!n;});
      document.querySelectorAll("[data-review-return]").forEach(b=>{if(practiceLesson)show(b);else hide(b);});
      if($("restartCurrentButton"))$("restartCurrentButton").textContent=practiceLesson ? "もう一度" : isCourseDone(n) ? "この体験を復習する" : "この体験をやり直す";
      let previousAvailable=false;
      document.querySelectorAll("[data-review-choice]").forEach(b=>{const n=Number(b.dataset.reviewChoice);if(!practiceLesson&&isCourseDone(n)){show(b);previousAvailable=true;}else hide(b);});
      if(previousAvailable&&started&&n)show($("reviewChoicesMenu"));else hide($("reviewChoicesMenu"));
      measureSpace();
    }
    function hintText(){
      let value=supportHints[subject-1]?.[step-1]||"今の目的を確かめてみましょう。";
      if(subject===4 && step>=2 && $("lesson4Layer").classList.contains("is-hidden"))return step===2 ? "記事の下にある「味つけの基本の記事を読む」を探してみましょう。" : "「味つけの基本の記事を読む」を押して、記事を開きましょう。";
      if(subject===5 && step>=2 && $("lesson5Layer").classList.contains("is-hidden"))return step===2 ? "一覧の「紅葉を楽しめる日帰り散歩コース」という見出しを探してみましょう。" : "「紅葉を楽しめる日帰り散歩コース」の記事を開きましょう。";
      if(subject===6 && step>=2 && $("lesson6Layer").classList.contains("is-hidden"))return step===2 ? "散歩記事の下に「日帰り旅行の持ちもの」という関連記事があります。" : "「日帰り旅行の持ちもの」の「この記事を読む」を押しましょう。";
      if(subject===5 && step>=2){
        const available=$("lesson5Close")&&!$("lesson5Close").classList.contains("is-hidden");
        value=available ? (step===2 ? "「閉じる」の表示が現れました。画面の上の方を見てみましょう。" : "「閉じる」を押して、散歩の記事へ戻りましょう。") : (step===2 ? supportHints[4][1] : "まだ「閉じる」が出ていません。少し待ち、表示されたら押して散歩の記事へ戻りましょう。");
      }
      if(subject===6 && step>=2){
        const available=$("lesson6Skip")&&!$("lesson6Skip").classList.contains("is-hidden");
        value=available ? (step===2 ? "「広告をスキップ」の表示が現れました。画面のふちを見てみましょう。" : "「広告をスキップ」を押して、持ち物の記事へ進みましょう。") : (step===2 ? supportHints[5][1] : "まだ「広告をスキップ」が出ていません。少し待ち、表示されたら押して持ち物の記事へ進みましょう。");
      }
      return value;
    }
    function refreshHint(){if(mode!=="hint"||layer.classList.contains("is-hidden"))return;const value=hintText();if(text.textContent!==value)text.textContent=value;}
    function render(){
      if(mode==="hint"){
        title.textContent="ヒント "+step+" / 3";refreshHint();hide(confirm);back.textContent="画面に戻る";
        if(step<3)show(more);else hide(more);
      }else{title.textContent="この体験をやり直しますか？";text.textContent="この体験の入口へ戻ります。ほかの体験の完了進捗は保持します。";hide(more);show(confirm);back.textContent="続ける";}
    }
    function open(nextMode){
      if(!layer.classList.contains("is-hidden")||!$("feedbackLayer").classList.contains("is-hidden")||!$("teacherResetLayer").classList.contains("is-hidden"))return;
      subject=activeLesson();if(!subject||store.get("started")!=="1")return;
      if(nextMode==="hint" && (store.get("l"+subject+"done")==="1"||store.get("practiceComplete")==="1"))return;
      if(nextMode==="restart" && (practiceLesson||isCourseDone(subject))){beginPractice(subject);return;}
      mode=nextMode;step=Math.max(1,Math.min(3,Number(store.get("hint."+subject))||1));
      if(mode==="hint")store.set("hint."+subject,step);
      returnFocus=document.activeElement;previous=backgrounds().map(el=>[el,el.inert]);previous.forEach(([el])=>{el.inert=true;});
      show(layer);render();lock();back.focus({preventScroll:true});
    }
    function close(){
      hide(layer);mode="";previous.forEach(([el,value])=>{el.inert=value;});previous=[];unlock();
      if(returnFocus?.isConnected&&!returnFocus.closest?.(".is-hidden"))returnFocus.focus({preventScroll:true});returnFocus=null;
    }
    more.addEventListener("click",()=>{if(mode!=="hint")return;step=Math.min(3,step+1);store.set("hint."+subject,step);render();if(step===3)back.focus({preventScroll:true});});
    back.addEventListener("click",close);
    confirm.addEventListener("click",()=>{
      if(mode!=="restart")return;
      store.remove("hint."+subject);
      if(subject===3)store.remove("l3closed");
      if(subject===5)store.set("outingView","home");
      if(subject===6)store.set("outingView","route");
      const n=subject;close();location.href=(n>=5 ? "outing.html" : "index.html")+"?retry="+n+teacherSuffix();
    });
    layer.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();close();}
      if(event.key==="Tab"){
        const buttons=Array.from(layer.querySelectorAll?.("button")||[]).filter(b=>!b.classList.contains("is-hidden")&&!b.disabled);
        const at=buttons.indexOf(document.activeElement);event.preventDefault();buttons[(at+(event.shiftKey ? -1 : 1)+buttons.length)%buttons.length]?.focus();
      }
    });
    document.querySelectorAll("[data-support-hint]").forEach(b=>b.addEventListener("click",()=>open("hint")));
    document.querySelectorAll("[data-support-restart]").forEach(b=>b.addEventListener("click",()=>open("restart")));
    document.querySelectorAll("[data-review-return]").forEach(b=>b.addEventListener("click",returnToCourse));
    document.querySelectorAll("[data-review-lesson]").forEach(b=>b.addEventListener("click",()=>beginPractice(Number(b.dataset.reviewLesson))));
    document.querySelectorAll("[data-review-choice]").forEach(b=>b.addEventListener("click",()=>beginPractice(Number(b.dataset.reviewChoice))));
    $("reviewAgainButton").addEventListener("click",()=>beginPractice(practiceLesson));
    window.addEventListener("resize",measureSpace);
    if(typeof ResizeObserver==="function"){const observer=new ResizeObserver(measureSpace);document.querySelectorAll(".support-stage-tools").forEach(el=>observer.observe(el));if($("supportControls"))observer.observe($("supportControls"));const header=document.querySelector(".training-header");if(header)observer.observe(header);}
    update();return {update,refreshHint};
  }

  if(!initializePractice())return;
  if(page==="main") setupMain();
  else if(page==="outing") setupOuting();
  else {location.replace("index.html");return;}
  if($("supportLayer"))supportController=setupSupport();
  if(practiceLesson){
    if(practiceLesson===2)hide($("recipeContent"));
    if(store.get("l"+practiceLesson+"done")==="1" || store.get("practiceComplete")==="1")finishPractice();
    else jumpToLesson(practiceLesson);
  }else if(entryParams.has("retry")){
    const n=Number(entryParams.get("retry"));if(n===activeLesson()&&!isCourseDone(n))jumpToLesson(n);
    history.replaceState({},"",location.pathname+(entryParams.get("teacher")==="1" ? "?teacher=1" : ""));
  }else if(entryParams.get("resume")==="1"){
    const pos=Math.max(0,Math.min(100000,Number(reviewMeta("returnScroll"))||0));
    setTimeout(()=>{const el=document.documentElement,prior=el.style.scrollBehavior;el.style.scrollBehavior="auto";window.scrollTo({top:pos,behavior:"auto"});requestAnimationFrame(()=>{el.style.scrollBehavior=prior;});},180);
    history.replaceState({},"",location.pathname+(entryParams.get("teacher")==="1" ? "?teacher=1" : ""));
  }
})();
