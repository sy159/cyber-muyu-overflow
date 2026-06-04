const fs = require("fs");

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const content = fs.readFileSync("content.js", "utf8");
  const styles = fs.readFileSync("styles.css", "utf8");
  const popupHtml = fs.readFileSync("popup.html", "utf8");
  const popup = fs.readFileSync("popup.js", "utf8");
  const readme = fs.readFileSync("README.md", "utf8");
  const background = readRequiredFile("background.js");
  const rules = readRequiredFile("rules.js");
  const muyuAsset = readRequiredFile("assets/muyu.svg");

  assert(!manifest.content_scripts, "manifest must not use always-on content scripts");
  assert(manifest.background?.service_worker === "background.js", "manifest must register background service worker");
  assert(manifest.permissions.includes("storage"), "manifest must keep storage permission");
  assert(manifest.permissions.includes("scripting"), "manifest must include scripting permission for on-demand injection");
  assert(manifest.permissions.includes("tabs"), "manifest must include tabs permission for URL evaluation");
  assert(manifest.host_permissions?.includes("<all_urls>"), "manifest must include host permissions for user regex rules");
  assert(JSON.stringify(manifest.web_accessible_resources || []).includes("assets/muyu.svg"), "manifest must expose the woodfish visual asset to injected pages");
  assert(background.includes("chrome.tabs.onUpdated.addListener"), "background must evaluate pages on navigation");
  assert(background.includes("chrome.scripting.executeScript"), "background must inject toast on demand only");
  assert(background.includes("changeInfo.url"), "background must handle SPA URL changes");
  assert(background.includes("const targetUrl = changeInfo.url || tab.url;"), "background must prefer changeInfo.url over stale tab.url");
  assert(background.includes("evaluateTab(tabId, targetUrl)"), "background must evaluate the fresh target URL");
  assert(background.includes("isBrowserInternalUrl"), "background must filter browser-internal URLs before evaluation");
  assert(background.includes("shouldSkipDuplicateNavigation"), "background must skip duplicate loading/complete navigation callbacks");
  assert(background.includes("navigationCleanupTimers"), "background must track navigation cleanup timers per tab");
  assert(background.includes("clearTimeout(previousCleanupTimer)"), "background must clear stale navigation cleanup timers before scheduling a new one");
  assert(/async function injectToast[\s\S]*try \{[\s\S]*chrome\.scripting\.insertCSS[\s\S]*\} catch \(error\) \{[\s\S]*\}/.test(background), "injectToast must catch protected-page injection failures");
  assert(background.includes("getDailyState"), "background must normalize daily state and cooldown together");
  assert(background.includes("lastTrigger: {}"), "background must clear cooldown history when the day rolls over");
  assert(background.includes("enqueueStorageMutation"), "background must serialize storage mutations to avoid MV3 race conditions");
  assert(background.includes("markRuntimeCooldown"), "background must mark runtime cooldown only after a hit is accepted");
  assert(background.includes("compactLastTrigger"), "background must compact stored cooldown history");
  assert(/function isRuntimeCoolingDown[\s\S]*pruneRuntimeCooldown\(now\)[\s\S]*return now - lastRuntimeTrigger < SAME_PAGE_COOLDOWN_MS;[\s\S]*\}/.test(background), "runtime cooldown check must prune stale entries before reading");
  assert(/function fillToastTemplate\(template, count, reward\) \{[\s\S]*typeof template !== "string"/.test(background), "toast template formatting must guard non-string templates");
  assert(/function markRuntimeCooldown[\s\S]*setTimeout[\s\S]*runtimeCooldown\.delete\(cooldownKey\)/.test(background), "runtime cooldown entries must auto-release after the cooldown window");
  assert(background.includes("function pruneRuntimeCooldown"), "runtime cooldown must support passive pruning when timers are lost");
  assert(background.includes("shouldPersistNormalizedSettings"), "background must avoid clobbering saved settings on every navigation");
  assert(background.includes("TOAST_MESSAGES"), "background must define randomized toast copy");
  assert(background.includes("REWARD_TOKENS"), "background must randomize reward tokens");
  assert((background.match(/label:/g) || []).length >= 32, "reward token pool should be broad enough to avoid repetition");
  assert((background.match(/\{ title:/g) || []).length >= 24, "toast message pool should be broad enough to avoid repetition");
  assert(!background.includes("合法划水已记录"), "toast copy must not use the old legal-moyu notification wording");
  assert(background.includes("快乐 +1"), "random rewards should include happiness-themed copy");
  assert(background.includes("健康 +1"), "random rewards should include health-themed copy");
  assert(background.includes("好运 +1"), "random rewards should include luck-themed copy");
  assert(background.includes("需求免疫 +1"), "random rewards should include rare work-immunity copy");
  assert(!/(有钱|余额|钱包|奶茶|奖金|白嫖资本|房贷|工资)/.test(background), "reward copy must not include money-themed wording");
  assert(background.includes('rarity: "rare"'), "reward tokens should support rare styling");
  assert(background.includes('rarity: "epic"'), "reward tokens should support epic styling");
  assert(background.includes('rarity: "legendary"'), "reward tokens should support legendary styling");
  assert(background.includes('rarity: "easter"'), "reward tokens should support rare easter egg styling");
  assert(background.includes("pickRewardToken"), "background must use weighted reward rarity selection");
  assert(background.includes("getRarityRoll"), "background reward rarity selection must be testable");
  assert(background.includes("getRarityLabel"), "background toast titles must visibly label reward rarity");
  assert(background.includes("rarity: \"legendary\""), "preview payload must be able to force a visible rarity for testing");
  assert(background.includes("createToastPayload"), "background must build toast payloads through a helper");
  assert(!background.includes('settings.toastMode === "fixed"'), "background must not keep a redundant fixed toast mode");
  assert(background.includes('settings.reminderMode !== "silent"'), "background must support silent counting");
  assert(background.includes("settings.reminderPosition"), "background must pass reminder position to the renderer");
  assert((background.match(/title:/g) || []).length >= 8, "toast copy should include multiple random titles");
  assert(background.includes("!!window.renderCyberMuyuToast"), "background must check whether content renderer is already injected");
  assert(background.includes("CyberMuyuRules.evaluateUrl"), "background must use shared rules engine");
  assert(content.includes("renderCyberMuyuToast"), "content must expose toast renderer");
  assert(content.includes("if (window.renderCyberMuyuToast)"), "content renderer must avoid duplicate initialization");
  assert(content.includes("TOAST_LIFETIME_MS = 2200"), "content reminder lifetime should be readable without lingering too long");
  assert(content.includes("window.setTimeout"), "content must clean up the rendered reminder after the animation lifetime");
  assert(content.includes("toast.remove()"), "content cleanup must remove the reminder DOM node");
  assert(content.includes("chrome.runtime.getURL(\"assets/muyu.svg\")"), "content must load the realistic woodfish asset through chrome.runtime.getURL");
  assert(!content.includes("cyber-muyu-overflow-root"), "content must not render the old blocking overlay");
  assert(content.includes("cyber-muyu-toast--leaving"), "content must fade out previous toast instead of hard-removing it");
  assert(/previous\.classList\.add\("cyber-muyu-toast--leaving"\)[\s\S]*window\.setTimeout\(\(\) => \{[\s\S]*previous\.remove\(\)/.test(content), "content must delay removal of a leaving toast");
  assert(rules.includes("DEFAULT_RULES"), "rules module must define default rules");
  assert(rules.includes("regex"), "rules module must support regex rules");
  assert(rules.includes("exclude"), "rules module must support work exclusions");

  const ruleEngine = loadRuleEngine(rules);
  const serviceWorkerRuleEngine = loadRuleEngineLikeServiceWorkerImport(rules);
  assert(serviceWorkerRuleEngine.evaluateUrl("https://www.bilibili.com/video/BV1", serviceWorkerRuleEngine.createDefaultSettings()).matched, "rules must attach CyberMuyuRules to the service worker global scope");
  const defaultState = ruleEngine.createDefaultSettings();
  assert(defaultState.reminderMode === "muyu", "default reminder mode should show the muyu animation");
  assert(defaultState.reminderPosition === "bottom-right", "default reminder position should be bottom-right");
  assert(ruleEngine.normalizeSettings({ reminderMode: "silent" }).reminderMode === "silent", "settings should support silent count mode");
  assert(ruleEngine.normalizeSettings({ reminderPosition: "top-left" }).reminderPosition === "top-left", "settings should support configurable reminder positions");
  assert(ruleEngine.normalizeSettings({ reminderPosition: "top-center" }).reminderPosition === "top-center", "settings should support top-center reminders");
  assert(ruleEngine.normalizeSettings({ toastMode: "badge" }).reminderMode === "silent", "legacy badge mode should migrate to silent count");
  assert(defaultState.rules.length >= 35, "default rules should broadly cover common non-work sites");
  assert(ruleEngine.evaluateUrl("https://www.bilibili.com/video/BV1", defaultState).matched, "default rules should match bilibili");
  assert(ruleEngine.evaluateUrl("https://www.douban.com/group/topic/1", defaultState).matched, "default rules should match douban");
  assert(ruleEngine.evaluateUrl("https://github.com/trending", defaultState).matched, "default rules should match GitHub Trending");
  assert(!ruleEngine.evaluateUrl("https://github.com/company/private-repo", defaultState).matched, "default rules should not mark all GitHub as moyu");
  assert(ruleEngine.validateRule({ type: "domain", pattern: "example.com" }).valid, "rule validation must not crash when id is omitted");
  assert(typeof ruleEngine.createRuleId === "function", "rules module must export createRuleId");
  assert(/^custom-\d+-[a-f0-9]+$/.test(ruleEngine.createRuleId()), "exported rule ids must use the expected format");
  const customRegexState = {
    ...defaultState,
    broadMode: false,
    rules: [{ id: "custom", type: "regex", pattern: "example\\.com\\/fun", category: "other", enabled: true, builtIn: false }],
    exclusions: []
  };
  assert(ruleEngine.evaluateUrl("https://example.com/fun/page", customRegexState).matched, "custom regex rule should match URLs");
  const excludedState = {
    ...customRegexState,
    exclusions: [{ id: "work", type: "domain", pattern: "example.com", enabled: true, builtIn: false }]
  };
  assert(!ruleEngine.evaluateUrl("https://example.com/fun/page", excludedState).matched, "work exclusions must override moyu rules");
  const broadState = {
    ...defaultState,
    broadMode: true,
    rules: [],
    exclusions: [
      ...defaultState.exclusions,
      { id: "work", type: "domain", pattern: "corp.example.com", enabled: true, builtIn: false }
    ]
  };
  assert(ruleEngine.evaluateUrl("https://news.example.com/article", broadState).matched, "broad mode should match ordinary public sites");
  assert(ruleEngine.evaluateUrl("https://fun.example.xyz/article", broadState).matched, "broad mode should match common .xyz public sites");
  assert(ruleEngine.evaluateUrl("https://video.example.cc/watch", broadState).matched, "broad mode should match common .cc public sites");
  assert(ruleEngine.evaluateUrl("https://forum.example.top/thread", broadState).matched, "broad mode should match common .top public sites");
  assert(!ruleEngine.evaluateUrl("https://portal.example.company/dashboard", broadState).matched, "broad mode must not confuse .company with .com");
  assert(!ruleEngine.evaluateUrl("https://corp.example.com/dashboard", broadState).matched, "broad mode should respect work exclusions");
  assert(!ruleEngine.evaluateUrl("http://localhost:3000", broadState).matched, "broad mode should ignore localhost");
  assert(!ruleEngine.evaluateUrl("https://www.google.com/search?q=debug", broadState).matched, "broad mode should exclude search engines");
  assert(!ruleEngine.evaluateUrl("https://mail.google.com/mail/u/0/", broadState).matched, "broad mode should exclude email tools");
  assert(!ruleEngine.evaluateUrl("https://docs.google.com/document/d/abc", broadState).matched, "broad mode should exclude productivity tools");

  const toastBlock = getCssBlock(styles, ".cyber-muyu-toast");
  const bowlBlock = getCssBlock(styles, ".cyber-muyu-bowl");
  assert(!/(^|\n)\s*\*\s*\{/.test(styles), "injected styles must not include a global universal selector");
  assert(styles.includes("body.cyber-muyu-popup *"), "popup-wide box sizing must be scoped to the popup body");
  assert(muyuAsset.includes("<svg"), "woodfish asset must be an SVG illustration");
  assert(muyuAsset.includes("muyu-tail"), "woodfish asset must include a distinct tail shape");
  assert(muyuAsset.includes("muyu-mouth"), "woodfish asset must include the long slanted mouth shape");
  assert(muyuAsset.includes("filter id=\"softShadow\""), "woodfish asset must include soft shadows for depth");
  assert(/position:\s*fixed !important;/.test(toastBlock), "muyu reminder root must resist host page positioning overrides");
  assert(/width:\s*280px !important;/.test(toastBlock), "muyu reminder must have enough room for a woodfish and hammer");
  assert(/width:\s*168px !important;/.test(bowlBlock), "woodfish asset must be large enough to read as the main subject");
  assert(/pointer-events:\s*none !important;/.test(toastBlock), "toast must not block page interactions");
  assert(/contain:\s*layout paint style !important;/.test(toastBlock), "toast must isolate layout and paint");
  assert(!/background:/.test(toastBlock), "muyu reminder root must not render a rectangular card background");
  assert(!/border:/.test(toastBlock), "muyu reminder root must not render a rectangular card border");
  assert(!/box-shadow:/.test(toastBlock), "muyu reminder root must not render a card shadow");
  assert(!/backdrop-filter:/.test(toastBlock), "muyu reminder root must not blur the page like a card");
  assert(styles.includes(".cyber-muyu-toast--bottom-right"), "toast must support bottom-right position");
  assert(styles.includes(".cyber-muyu-toast--bottom-left"), "toast must support bottom-left position");
  assert(styles.includes(".cyber-muyu-toast--top-right"), "toast must support top-right position");
  assert(styles.includes(".cyber-muyu-toast--top-left"), "toast must support top-left position");
  assert(styles.includes(".cyber-muyu-toast--bottom-center"), "toast must support bottom-center position");
  assert(styles.includes(".cyber-muyu-toast--top-center"), "toast must support top-center position");
  assert(!/transform:/.test(getCssBlock(styles, ".cyber-muyu-toast--bottom-center")), "bottom-center positioning must not rely on root transforms");
  assert(!content.includes("cyber-muyu-toast-progress"), "content renderer must not show a rectangular toast progress bar");
  assert(content.includes("cyber-muyu-hammer"), "content renderer must include a muyu knocking action");
  assert(content.includes("cyber-muyu-reward-float"), "content renderer must include floating reward text");
  assert(content.includes("cyber-muyu-reward-stack"), "content renderer must include stacked reward echoes");
  assert(content.includes("cyber-muyu-particles"), "content renderer must include a particle burst layer");
  assert(content.includes("cyber-muyu-impact-flash"), "content renderer must include an impact flash layer");
  assert((content.match(/glyph:/g) || []).length >= 16, "particle burst should include enough particles to feel visible");
  assert(content.includes('kind: "coin"'), "particle burst should include coin-like particles without money text");
  assert(content.includes("createParticle"), "content renderer must create lightweight DOM particles");
  assert(content.includes("getParticleMultiplier"), "content renderer must scale particle count by reward rarity");
  assert(content.includes('"legendary"') && content.includes('"easter"'), "content renderer must recognize legendary and easter rarities");
  assert(content.includes("cyber-muyu-stage--${rarity}"), "content renderer must expose rarity-specific stage classes");
  assert(!content.includes('glyph: "¥"'), "particles must not include money symbols");
  assert(!content.includes('glyph: "$"'), "particles must not include dollar symbols");
  assert(!content.includes("有钱 +1"), "content fallback reward must not use money-themed copy");
  assert(content.includes("--reward-curve-x"), "content renderer must randomize reward curve motion");
  assert(content.includes("cyber-muyu-aura"), "content renderer must include a lightweight impact aura");
  assert(styles.includes("linear-gradient(180deg, #ff8358"), "muyu visual should use a warm cardless icon palette");
  assert(styles.includes(".cyber-muyu-wave"), "muyu visual should include decorative wave lines like the reference icon");
  assert(styles.includes(".cyber-muyu-impact-flash"), "muyu visual should include a direct hit flash");
  assert(styles.includes("18% {"), "muyu knock timeline must keep a quick impact while using the adjusted lifetime");
  assert(getCssBlock(styles, "@keyframes cyberMuyuHammerKnock").includes("rotate(20deg)"), "hammer impact should keep the earlier lighter strike feel");
  assert(getCssBlock(styles, "@keyframes cyberMuyuBowlKnock").includes("scale3d(0.92, 0.92, 1)"), "bowl should keep the earlier lighter compression");
  assert(getCssBlock(styles, "@keyframes cyberMuyuBowlKnock").includes("scale3d(1.06, 1.06, 1)"), "bowl should keep the earlier lighter rebound");
  assert(styles.includes(".cyber-muyu-particle--coin"), "particle burst must include coin-like gold particles");
  assert(styles.includes("@keyframes cyberMuyuImpactFlash"), "muyu impact must include a direct flash animation");
  assert(getCssBlock(styles, "@keyframes cyberMuyuRewardFloat").includes("scale(1.3)"), "reward text must keep the prominent previous pop-out scale");
  assert(getCssBlock(styles, "@keyframes cyberMuyuRewardFloat").includes("var(--reward-curve-x"), "reward text must travel along a curved path");
  assert(styles.includes(".cyber-muyu-reward-float--rare"), "reward text must support rare styling");
  assert(styles.includes(".cyber-muyu-reward-float--epic"), "reward text must support epic styling");
  assert(styles.includes(".cyber-muyu-reward-float--legendary"), "reward text must support legendary styling");
  assert(styles.includes(".cyber-muyu-reward-float--easter"), "reward text must support easter egg styling");
  assert(styles.includes(".cyber-muyu-stage--rare .cyber-muyu-bowl"), "rare hits must visibly alter the woodfish hit feedback");
  assert(styles.includes(".cyber-muyu-stage--epic .cyber-muyu-hammer-head"), "epic hits must visibly alter the hammer feedback");
  assert(styles.includes(".cyber-muyu-stage--legendary .cyber-muyu-wave"), "legendary hits must have stronger post-impact waves");
  assert(styles.includes(".cyber-muyu-stage--easter .cyber-muyu-impact-flash"), "easter hits must have a distinct impact flash");
  assert(styles.includes("@keyframes cyberMuyuRareBowlKnock"), "rare hits must use a distinct bowl animation timeline");
  assert(styles.includes("@keyframes cyberMuyuEpicBowlKnock"), "epic hits must use a distinct bowl animation timeline");
  assert(styles.includes("@keyframes cyberMuyuParticleBurst"), "muyu impact must include particle burst animation");
  assert(styles.includes("@keyframes cyberMuyuWaveExpand"), "muyu impact must include a dedicated expanding wave animation");
  assert(styles.includes("@keyframes cyberMuyuRewardStack"), "muyu reward stack must keep the prominent stacked text animation");
  assert(styles.includes("cyberMuyuStageIn 2.2s"), "muyu reminder animation should use the adjusted visible lifetime");
  assert(getCssBlock(styles, ".cyber-muyu-reward-stack").includes("font-size: 22px"), "reward stack must keep the previous readable text size");
  assert(getCssBlock(styles, ".cyber-muyu-reward-float").includes("white-space: nowrap !important"), "reward text must resist host page wrapping overrides");
  assert(getCssBlock(styles, ".cyber-muyu-bowl").includes("display: block !important"), "woodfish asset display must resist host page overrides");
  assert(getCssBlock(styles, ".cyber-muyu-reward-stack span").includes("display: block !important"), "reward stack spans must resist host page display overrides");
  assert(getCssBlock(styles, ".cyber-muyu-caption").includes("bottom: 4px"), "caption must stay low enough to avoid overlapping the woodfish");
  assert(getCssBlock(styles, ".recent-item > div,\n.rule-item > div").includes("min-width: 0"), "popup list text wrappers must be allowed to shrink");
  assert(getCssBlock(styles, ".recent-item > div,\n.rule-item > div").includes("overflow: hidden"), "popup list text wrappers must clip long content");

  assert(popup.includes('const LAST_TRIGGER_KEY = "lastMoyuTriggerAt";'), "popup must know cooldown storage key");
  assert(popupHtml.includes("reminderModeSelect"), "popup must expose reminder mode selection");
  assert(popupHtml.includes("reminderPositionSelect"), "popup must expose reminder position selection");
  assert(popupHtml.includes("敲木鱼提醒"), "popup must offer the muyu reminder mode");
  assert(popupHtml.includes("静默计数"), "popup must offer silent count mode");
  assert(popupHtml.includes("顶部居中"), "popup must expose top-center reminder position");
  assert(!popupHtml.includes("固定右下角提示"), "popup must not show redundant fixed toast mode");
  assert(!popupHtml.includes("关闭页面提示"), "popup must not show redundant close-page-prompt mode");
  assert(popup.includes("hour12: false"), "popup recent-hit times must use fixed 24-hour formatting");
  assert(popup.includes("CyberMuyuRules.createRuleId()"), "popup must use the shared rule id generator");
  assert(popup.includes("chrome.storage.onChanged.addListener"), "popup must refresh dashboard when storage changes");
  assert(popup.includes("elements.rulesList.addEventListener(\"click\", handleRulesListClick)"), "popup rules list must use event delegation");
  assert(!popup.includes("elements.rulesList.querySelectorAll(\"button\")"), "popup must not bind rule buttons after every render");
  assert(/async function loadSettings\(\) \{\s*const stored = await chrome\.storage\.local\.get\(CyberMuyuRules\.SETTINGS_KEY\);\s*settings = CyberMuyuRules\.normalizeSettings\(stored\[CyberMuyuRules\.SETTINGS_KEY\]\);\s*\}/.test(popup), "popup loadSettings must not blindly rewrite settings on init");
  assert(!popup.includes("async function getSyncedDailyRecord"), "dashboard rendering must be read-only and must not write daily records");
  assert(popup.includes("无上天道"), "popup rank logic must include a 1000+ late-game title");
  assert(popup.includes("摸鱼天尊"), "popup rank logic must include deeper post-200 progression");
  assert(popup.includes("工位外神"), "popup rank logic must include a 2000+ endgame title");
  assert(!/function createRuleId\(\)/.test(popup), "popup must not duplicate rule id generation");
  await runPopupRegressionChecks(popup);
  await runBackgroundRegressionChecks(background, rules);
  assertNoProductionConsole(content, "content.js");
  assertNoProductionConsole(popup, "popup.js");
  assertNoProductionConsole(background, "background.js");
  assertNoProductionConsole(rules, "rules.js");
  assert(!/\/Users\/|v1wzhiqiangz|Desktop\/snow/.test(readme), "README must not expose local absolute paths");

  console.log("extension verification ok");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getCssBlock(css, selector) {
  const start = css.indexOf(`${selector} {`);
  assert(start >= 0, `missing CSS selector: ${selector}`);

  const bodyStart = css.indexOf("{", start) + 1;
  let depth = 1;
  let cursor = bodyStart;

  while (cursor < css.length && depth > 0) {
    const char = css[cursor];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    }
    cursor += 1;
  }

  return css.slice(bodyStart, cursor - 1);
}

function readRequiredFile(file) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function assertNoProductionConsole(source, filename) {
  assert(!/console\./.test(source), `${filename} must not log in production`);
}

function loadRuleEngine(source) {
  const vm = require("vm");
  const sandbox = { URL };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.CyberMuyuRules;
}

function loadRuleEngineLikeServiceWorkerImport(source) {
  const vm = require("vm");
  const sandbox = { URL };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.CyberMuyuRules;
}

function runBackgroundRegressionChecks(background, rules) {
  const vm = require("vm");
  const tabUpdatedListeners = [];
  const storage = {};
  let renderCount = 0;
  let lastToastPayload = null;
  let settingsWriteCount = 0;
  let settingsReadCount = 0;

  const sandbox = {
    URL,
    Date,
    Math,
    setTimeout,
    clearTimeout,
    importScripts(file) {
      assert(file === "rules.js", "background must import the shared rules file");
      vm.runInContext(rules, sandbox);
    },
    chrome: {
      runtime: {
        onInstalled: {
          addListener() {}
        },
        onMessage: {
          addListener() {}
        }
      },
      tabs: {
        onUpdated: {
          addListener(handler) {
            tabUpdatedListeners.push(handler);
          }
        }
      },
      storage: {
        local: {
          async get(keys) {
            const snapshot = {};
            const requestedKeys = Array.isArray(keys) ? keys : [keys];
            if (requestedKeys.includes("cyberMuyuSettings")) {
              settingsReadCount += 1;
            }
            for (const key of requestedKeys) {
              snapshot[key] = cloneForStorage(storage[key]);
            }
            await delay(8);
            return snapshot;
          },
          async set(values) {
            await delay(8);
            if (Object.prototype.hasOwnProperty.call(values, "cyberMuyuSettings")) {
              settingsWriteCount += 1;
            }
            Object.assign(storage, cloneForStorage(values));
          }
        }
      },
      scripting: {
        async insertCSS() {},
        async executeScript(options) {
          if (options.args) {
            renderCount += 1;
            lastToastPayload = cloneForStorage(options.args[0]);
          }
          return [{ result: true }];
        }
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(background, sandbox);
  assert(tabUpdatedListeners.length === 1, "background must register one tab update listener");

  storage.cyberMuyuSettings = sandbox.CyberMuyuRules.createDefaultSettings();
  storage.cyberMuyuSettings.reminderPosition = "top-left";

  const targetUrl = "https://www.bilibili.com/video/BV1";
  const secondTargetUrl = "https://www.douban.com/group/topic/1";
  tabUpdatedListeners[0](17, { status: "loading", url: targetUrl }, { url: targetUrl });
  tabUpdatedListeners[0](17, { status: "complete" }, { url: targetUrl });
  tabUpdatedListeners[0](18, { url: secondTargetUrl }, { url: secondTargetUrl });
  tabUpdatedListeners[0](19, { status: "complete" }, { url: "chrome://extensions/" });

  return delay(120).then(() => {
    assert(renderCount === 2, "runtime cooldown must prevent duplicate same-URL renders while allowing concurrent different URLs");
    assert(storage.moyuDaily.count === 2, "serialized storage mutations must preserve concurrent different-URL counts");
    assert(storage.moyuCount === 2, "serialized storage mutations must preserve the total count");
    assert(Object.keys(storage.lastMoyuTriggerAt || {}).length === 2, "stored cooldown history should only retain active cooldown entries");
    assert(settingsReadCount === 2, "background must skip duplicate complete callbacks and browser-internal URLs before reading settings");
    assert(lastToastPayload?.position === "top-left", "background must preserve the saved reminder position after navigation");
    assert(storage.cyberMuyuSettings.reminderPosition === "top-left", "background navigation must not reset reminder position to default");
    assert(settingsWriteCount === 0, "background must not rewrite valid saved settings on every navigation");
  });
}

function runPopupRegressionChecks(popup) {
  const vm = require("vm");
  const listeners = {};
  const storageChangeListeners = [];
  const elementStore = new Map();
  const tabButtons = ["dashboard", "rules", "settings"].map((tab) => createElement(`tab-${tab}`, { tab }));
  let settingsWriteCount = 0;
  let dailyWriteCount = 0;
  const storage = {
    cyberMuyuSettings: {
      ...loadRuleEngine(fs.readFileSync("rules.js", "utf8")).createDefaultSettings(),
      rules: [{ id: "rule-1", type: "domain", pattern: "example.com", name: "Example", category: "custom", enabled: true, builtIn: false }],
      exclusions: []
    },
    moyuDaily: { date: "1999-12-31", count: 42 },
    moyuCount: 42,
    lastMoyuTriggerAt: { "1:https://example.com": 123456 },
    recentMoyuHits: []
  };

  const sandbox = {
    console,
    CyberMuyuRules: loadRuleEngine(fs.readFileSync("rules.js", "utf8")),
    Date: class FixedDate extends Date {
      constructor(...args) {
        if (args.length > 0) {
          super(...args);
        } else {
          super("2000-01-01T00:00:00");
        }
      }
    },
    document: {
      addEventListener(event, handler) {
        listeners[event] = handler;
      },
      querySelectorAll(selector) {
        if (selector === ".tab-button") {
          return tabButtons;
        }

        return [];
      },
      getElementById(id) {
        if (!elementStore.has(id)) {
          const element = createElement(id);
          if (id === "ruleListType") {
            element.value = "rules";
          }
          elementStore.set(id, element);
        }
        return elementStore.get(id);
      }
    },
    chrome: {
      storage: {
        onChanged: {
          addListener(handler) {
            storageChangeListeners.push(handler);
          }
        },
        local: {
          async get(keys) {
            const result = {};
            const requestedKeys = Array.isArray(keys) ? keys : [keys];
            for (const key of requestedKeys) {
              result[key] = storage[key];
            }
            return result;
          },
          async set(values) {
            if (Object.prototype.hasOwnProperty.call(values, "cyberMuyuSettings")) {
              settingsWriteCount += 1;
            }
            if (Object.prototype.hasOwnProperty.call(values, "moyuDaily")) {
              dailyWriteCount += 1;
            }
            Object.assign(storage, values);
          }
        }
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(popup, sandbox);

  return Promise.resolve()
    .then(() => listeners.DOMContentLoaded())
    .then(() => {
      assert(settingsWriteCount === 0, "popup init must not rewrite valid settings");
      assert(dailyWriteCount === 0, "dashboard render must not rewrite stale daily records");
      assert(elementStore.get("todayCount").textContent === "0", "popup must display zero for stale daily records without writing storage");
      assert(storageChangeListeners.length === 1, "popup must register one storage change listener");
      storage.moyuDaily = { date: "2000-01-01", count: 7 };
      storage.moyuCount = 9;
      storage.recentMoyuHits = [{ host: "bilibili.com", ruleName: "Bilibili", category: "video", timestamp: 946684800000 }];
      storageChangeListeners[0]({
        moyuDaily: { newValue: storage.moyuDaily },
        moyuCount: { newValue: storage.moyuCount },
        recentMoyuHits: { newValue: storage.recentMoyuHits }
      }, "local");
      return delay(0);
    })
    .then(() => {
      assert(elementStore.get("todayCount").textContent === "7", "popup must live-refresh today's count from storage changes");
      assert(elementStore.get("totalCount").textContent === "9 动", "popup must live-refresh total count from storage changes");
      return elementStore.get("rulesList").clickDelegatedRuleButton("toggle", "rule-1");
    })
    .then(() => {
      assert(storage.cyberMuyuSettings.rules.find((rule) => rule.id === "rule-1").enabled === false, "rule list event delegation must toggle a rule");
      storage.moyuDaily = { date: "2000-01-01", count: 11 };
      storage.moyuCount = 13;
      tabButtons.find((button) => button.dataset.tab === "dashboard").click();
      return delay(0);
    })
    .then(() => {
      assert(elementStore.get("todayCount").textContent === "11", "dashboard tab activation must refresh today's count");
      assert(elementStore.get("totalCount").textContent === "13 动", "dashboard tab activation must refresh total count");
      return elementStore.get("resetButton").click();
    })
    .then(() => {
      assert(Object.keys(storage.lastMoyuTriggerAt).length === 0, "reset must clear the cooldown timestamp");
    });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cloneForStorage(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function createElement(id, dataset = {}) {
  return {
    id,
    dataset,
    value: "",
    checked: false,
    disabled: false,
    selectedIndex: 0,
    style: {},
    attributes: {},
    textContent: "",
    innerHTML: "",
    classList: {
      toggle() {}
    },
    click() {
      if (typeof this.listeners.click === "function") {
        return this.listeners.click({ target: this });
      }

      return undefined;
    },
    clickDelegatedRuleButton(action, id) {
      if (typeof this.listeners.click !== "function") {
        return Promise.resolve();
      }

      const button = {
        dataset: { action, id },
        closest(selector) {
          return selector === "button" ? button : null;
        }
      };

      return this.listeners.click({ target: button });
    },
    listeners: {},
    addEventListener(event, handler) {
      this.listeners[event] = handler;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    contains() {
      return true;
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    querySelectorAll() {
      return [];
    },
    children: []
  };
}
