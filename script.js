(() => {
  "use strict";

  const page = document.body.dataset.page || "main";

  const store = {
    get(key) {
      return sessionStorage.getItem(key);
    },
    set(key, value) {
      sessionStorage.setItem(key, value);
    },
    remove(key) {
      sessionStorage.removeItem(key);
    }
  };

  function show(element) {
    if (element) element.classList.remove("is-hidden");
  }

  function hide(element) {
    if (element) element.classList.add("is-hidden");
  }

  function lockPageScroll() {
    document.body.style.overflow = "hidden";
  }

  function unlockPageScroll() {
    document.body.style.overflow = "";
  }

  function setupMainPage() {
    const introScreen = document.getElementById("introScreen");
    const trainingScreen = document.getElementById("trainingScreen");
    const startButton = document.getElementById("startButton");
    const progressText = document.getElementById("progressText");

    const continueButton = document.getElementById("continueButton");
    const scenarioLayer = document.getElementById("scenarioLayer");
    const closeScenarioButton = document.getElementById("closeScenarioButton");
    const trainingChoices = document.querySelectorAll(".training-choice");

    const ngOverlay = document.getElementById("ngOverlay");
    const hitTarget = document.getElementById("hitTarget");
    const retryButton = document.getElementById("retryButton");

    const correctOverlay = document.getElementById("correctOverlay");
    const returnArticleButton = document.getElementById("returnArticleButton");

    const q1ClearNote = document.getElementById("q1ClearNote");
    const articleAfterQ1 = document.getElementById("articleAfterQ1");

    const openSecondScenarioButton = document.getElementById("openSecondScenarioButton");
    const q2CorrectOverlay = document.getElementById("q2CorrectOverlay");
    const q2ReturnArticleButton = document.getElementById("q2ReturnArticleButton");
    const q2ClearNote = document.getElementById("q2ClearNote");
    const articleAfterQ2 = document.getElementById("articleAfterQ2");

    let q1Started = false;
    let q1Cleared = store.get("q1Cleared") === "1";
    let q2Cleared = store.get("q2Cleared") === "1";

    function refreshMainState() {
      const started = store.get("trainingStarted") === "1";

      if (started) {
        hide(introScreen);
        show(trainingScreen);
      } else {
        show(introScreen);
        hide(trainingScreen);
      }

      q1Cleared = store.get("q1Cleared") === "1";
      q2Cleared = store.get("q2Cleared") === "1";

      if (q1Cleared) {
        q1ClearNote.classList.remove("is-hidden");
        articleAfterQ1.classList.remove("is-hidden");
        continueButton.textContent = "記事の続きを読む";
        if (!q2Cleared) progressText.textContent = "第2問 / 3問";
      }

      if (q2Cleared) {
        q2ClearNote.classList.remove("is-hidden");
        articleAfterQ2.classList.remove("is-hidden");
        progressText.textContent = "第3問 / 3問";
      }
    }

    function detectReturnFromSecondScenario() {
      const active = store.get("q2Active") === "1";
      const visited = store.get("q2Visited") === "1";
      const alreadyCleared = store.get("q2Cleared") === "1";

      if (active && visited && !alreadyCleared) {
        store.set("q2Cleared", "1");
        store.remove("q2Active");
        q2Cleared = true;
        refreshMainState();
        show(q2CorrectOverlay);
        lockPageScroll();
      }
    }

    startButton.addEventListener("click", () => {
      store.set("trainingStarted", "1");
      hide(introScreen);
      show(trainingScreen);
      window.scrollTo({ top: 0, behavior: "auto" });
    });

    continueButton.addEventListener("click", () => {
      if (q1Cleared) {
        articleAfterQ1.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      q1Started = true;
      show(scenarioLayer);
      lockPageScroll();
    });

    trainingChoices.forEach((area) => {
      area.addEventListener("click", () => {
        if (!q1Started || q1Cleared) return;

        const label = area.dataset.hit || "広告の中";
        hitTarget.textContent = label;

        hide(scenarioLayer);
        show(ngOverlay);
      });
    });

    retryButton.addEventListener("click", () => {
      hide(ngOverlay);
      show(scenarioLayer);
    });

    closeScenarioButton.addEventListener("click", () => {
      if (!q1Started || q1Cleared) return;

      q1Cleared = true;
      store.set("q1Cleared", "1");
      hide(scenarioLayer);
      show(correctOverlay);
    });

    returnArticleButton.addEventListener("click", () => {
      hide(correctOverlay);
      unlockPageScroll();
      refreshMainState();
      q1ClearNote.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    openSecondScenarioButton.addEventListener("click", () => {
      if (!q1Cleared || q2Cleared) return;

      store.set("q2Active", "1");
      store.remove("q2Visited");
      window.location.href = "scenario2.html";
    });

    q2ReturnArticleButton.addEventListener("click", () => {
      hide(q2CorrectOverlay);
      unlockPageScroll();
      refreshMainState();
      q2ClearNote.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    [scenarioLayer, ngOverlay, correctOverlay, q2CorrectOverlay].forEach((overlay) => {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          event.preventDefault();
        }
      });
    });

    window.addEventListener("pageshow", () => {
      refreshMainState();
      detectReturnFromSecondScenario();
    });

    refreshMainState();
  }

  function setupSecondScenarioPage() {
    const active = store.get("q2Active") === "1";
    const q1Cleared = store.get("q1Cleared") === "1";

    if (!active || !q1Cleared) {
      window.location.replace("index.html");
      return;
    }

    store.set("q2Visited", "1");

    const q2Choices = document.querySelectorAll(".scenario2-choice");
    const q2NgOverlay = document.getElementById("q2NgOverlay");
    const q2HitTarget = document.getElementById("q2HitTarget");
    const q2RetryButton = document.getElementById("q2RetryButton");

    q2Choices.forEach((choice) => {
      choice.addEventListener("click", () => {
        q2HitTarget.textContent = choice.dataset.hit || "ページ内のボタン";
        show(q2NgOverlay);
        lockPageScroll();
      });
    });

    q2RetryButton.addEventListener("click", () => {
      hide(q2NgOverlay);
      unlockPageScroll();
    });

    q2NgOverlay.addEventListener("click", (event) => {
      if (event.target === q2NgOverlay) {
        event.preventDefault();
      }
    });
  }

  if (page === "main") {
    setupMainPage();
  } else if (page === "scenario2") {
    setupSecondScenarioPage();
  }
})();
