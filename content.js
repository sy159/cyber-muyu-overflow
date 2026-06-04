(function cyberMuyuToastRenderer() {
  "use strict";

  if (window.renderCyberMuyuToast) {
    return;
  }

  const TOAST_LIFETIME_MS = 2200;
  const POSITIONS = new Set(["bottom-right", "bottom-left", "top-right", "top-left", "bottom-center", "top-center"]);
  const RARITIES = new Set(["common", "rare", "epic", "legendary", "easter"]);
  const PARTICLE_PRESETS = [
    { glyph: "", kind: "coin", x: -52, y: -48 },
    { glyph: "1", x: -24, y: -64 },
    { glyph: "0", x: 12, y: -58 },
    { glyph: "+", x: 44, y: -42 },
    { glyph: "", kind: "coin", x: -42, y: -20 },
    { glyph: "1", x: 35, y: -12 },
    { glyph: "0", x: -8, y: -76 },
    { glyph: "+", x: 62, y: -26 },
    { glyph: "", kind: "coin", x: -68, y: -8 },
    { glyph: "0", x: 74, y: -5 },
    { glyph: "*", x: -18, y: -96 },
    { glyph: "+", x: 20, y: -90 },
    { glyph: "", kind: "coin", x: -76, y: -35 },
    { glyph: "0", x: 82, y: -38 },
    { glyph: "", kind: "coin", x: -4, y: -108 },
    { glyph: "", kind: "coin", x: 54, y: -70 }
  ];

  window.renderCyberMuyuToast = function renderCyberMuyuToast(payload = {}) {
    const previous = document.querySelector(".cyber-muyu-toast");
    if (previous) {
      previous.classList.add("cyber-muyu-toast--leaving");
      window.setTimeout(() => {
        previous.remove();
      }, 220);
    }

    const position = POSITIONS.has(payload.position) ? payload.position : "bottom-right";
    const rewardText = payload.reward || "快乐 +1";
    const rarity = RARITIES.has(payload.rarity) ? payload.rarity : "common";
    const toast = document.createElement("div");
    toast.className = `cyber-muyu-toast cyber-muyu-toast--${position}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const stage = document.createElement("div");
    stage.className = `cyber-muyu-stage cyber-muyu-stage--${rarity}`;

    const iconSurface = document.createElement("div");
    iconSurface.className = "cyber-muyu-icon-surface";

    const wave = document.createElement("div");
    wave.className = "cyber-muyu-wave";

    const aura = document.createElement("div");
    aura.className = "cyber-muyu-aura";

    const impactFlash = document.createElement("div");
    impactFlash.className = "cyber-muyu-impact-flash";

    const particles = document.createElement("div");
    particles.className = "cyber-muyu-particles";
    createParticles(rarity).forEach((preset, index) => {
      particles.appendChild(createParticle(preset, index, rarity));
    });

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
    reward.className = `cyber-muyu-reward-float cyber-muyu-reward-float--${rarity}`;
    reward.style.setProperty("--reward-curve-x", `${getRewardCurveX()}px`);
    reward.textContent = rewardText;

    const rewardStack = document.createElement("div");
    rewardStack.className = `cyber-muyu-reward-stack cyber-muyu-reward-stack--${rarity}`;
    for (let index = 0; index < 3; index += 1) {
      const echo = document.createElement("span");
      echo.textContent = rewardText;
      rewardStack.appendChild(echo);
    }

    const caption = document.createElement("div");
    caption.className = "cyber-muyu-caption";
    caption.textContent = payload.title || "赛博木鱼轻轻点头";

    iconSurface.append(wave, aura, impactFlash, particles, rewardStack, reward, bowl, hammer, caption);
    stage.appendChild(iconSurface);
    toast.appendChild(stage);
    document.body.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, TOAST_LIFETIME_MS);
  };

  function createParticle(preset, index, rarity) {
    const particle = document.createElement("span");
    particle.className = `cyber-muyu-particle cyber-muyu-particle--${rarity} cyber-muyu-particle--${preset.kind || "code"}`;
    particle.textContent = preset.glyph || "";
    particle.style.setProperty("--particle-x", `${preset.x}px`);
    particle.style.setProperty("--particle-y", `${preset.y}px`);
    particle.style.setProperty("--particle-delay", `${index * 18}ms`);
    particle.style.setProperty("--particle-spin", `${index % 2 === 0 ? 28 : -28}deg`);
    return particle;
  }

  function createParticles(rarity) {
    const multiplier = getParticleMultiplier(rarity);
    if (multiplier <= 1) {
      return PARTICLE_PRESETS;
    }

    const particles = [];
    for (let round = 0; round < multiplier; round += 1) {
      PARTICLE_PRESETS.forEach((preset, index) => {
        const offsetSeed = (round * 7) + index;
        particles.push({
          ...preset,
          x: preset.x + ((offsetSeed % 5) - 2) * 8,
          y: preset.y - (round * 12) + ((offsetSeed % 3) - 1) * 5
        });
      });
    }

    return particles;
  }

  function getParticleMultiplier(rarity) {
    if (rarity === "easter") {
      return 3;
    }

    if (rarity === "legendary") {
      return 2;
    }

    if (rarity === "epic") {
      return 2;
    }

    return 1;
  }

  function getRewardCurveX() {
    return Math.round((Math.random() * 44) - 22);
  }
})();
