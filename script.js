(() => {
  "use strict";

  const introScreen = document.getElementById("introScreen");
  const trainingScreen = document.getElementById("trainingScreen");
  const startButton = document.getElementById("startButton");
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

  let q1Started = false;
  let q1Cleared = false;

  function show(element) {
    element.classList.remove("is-hidden");
  }

  function hide(element) {
    element.classList.add("is-hidden");
  }

  function lockPageScroll() {
    document.body.style.overflow = "hidden";
  }

  function unlockPageScroll() {
    document.body.style.overflow = "";
  }

  startButton.addEventListener("click", () => {
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
    hide(scenarioLayer);
    show(correctOverlay);
  });

  returnArticleButton.addEventListener("click", () => {
    hide(correctOverlay);
    unlockPageScroll();

    continueButton.textContent = "記事の続きを読む";
    q1ClearNote.classList.remove("is-hidden");
    articleAfterQ1.classList.remove("is-hidden");

    q1ClearNote.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // iOS Safariでダイアログ表示中に背景へ誤って触れないよう、
  // オーバーレイ外側のタップには何も割り当てない。
  [scenarioLayer, ngOverlay, correctOverlay].forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        event.preventDefault();
      }
    });
  });
})();
