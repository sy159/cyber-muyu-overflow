(function cyberMuyuToastRenderer() {
  "use strict";

  if (window.renderCyberMuyuToast) {
    return;
  }

  const TOAST_LIFETIME_MS = 2200;
  const POSITIONS = new Set(["bottom-right", "bottom-left", "top-right", "top-left", "bottom-center", "top-center"]);

  window.renderCyberMuyuToast = function renderCyberMuyuToast(payload = {}) {
    const previous = document.querySelector(".cyber-muyu-toast");
    if (previous) {
      previous.remove();
    }

    const position = POSITIONS.has(payload.position) ? payload.position : "bottom-right";
    const toast = document.createElement("div");
    toast.className = `cyber-muyu-toast cyber-muyu-toast--${position}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const stage = document.createElement("div");
    stage.className = "cyber-muyu-stage";

    const iconSurface = document.createElement("div");
    iconSurface.className = "cyber-muyu-icon-surface";

    const wave = document.createElement("div");
    wave.className = "cyber-muyu-wave";

    const aura = document.createElement("div");
    aura.className = "cyber-muyu-aura";

    const bowl = document.createElement("img");
    bowl.className = "cyber-muyu-bowl";
    bowl.alt = "";
    bowl.decoding = "async";
    bowl.draggable = false;
    bowl.src = chrome.runtime.getURL("assets/muyu.svg");

    const hammer = document.createElement("div");
    hammer.className = "cyber-muyu-hammer";

    const hammerHandle = document.createElement("span");
    hammerHandle.className = "cyber-muyu-hammer-handle";

    const hammerHead = document.createElement("span");
    hammerHead.className = "cyber-muyu-hammer-head";

    hammer.append(hammerHandle, hammerHead);

    const reward = document.createElement("div");
    reward.className = "cyber-muyu-reward-float";
    reward.textContent = payload.reward || "功德 +1";

    const rewardStack = document.createElement("div");
    rewardStack.className = "cyber-muyu-reward-stack";
    for (let index = 0; index < 3; index += 1) {
      const echo = document.createElement("span");
      echo.textContent = payload.reward || "功德 +1";
      rewardStack.appendChild(echo);
    }

    const caption = document.createElement("div");
    caption.className = "cyber-muyu-caption";
    caption.textContent = payload.title || "赛博木鱼轻轻点头";

    iconSurface.append(wave, aura, rewardStack, reward, bowl, hammer, caption);
    stage.appendChild(iconSurface);
    toast.appendChild(stage);
    document.body.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, TOAST_LIFETIME_MS);
  };
})();
