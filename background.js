importScripts("rules.js");

(function cyberMuyuBackground() {
  "use strict";

  const DAILY_KEY = "moyuDaily";
  const TOTAL_KEY = "moyuCount";
  const LAST_TRIGGER_KEY = "lastMoyuTriggerAt";
  const RECENT_HITS_KEY = "recentMoyuHits";
  const SAME_PAGE_COOLDOWN_MS = 1200;
  const NAVIGATION_DEDUPE_MS = 500;
  const MAX_RECENT_HITS = 8;
  const runtimeCooldown = new Map();
  const recentNavigations = new Map();
  let storageMutationQueue = Promise.resolve();
  const REWARD_TOKENS = [
    "有钱 +1",
    "快乐 +1",
    "健康 +1",
    "余额 +1",
    "自由 +1",
    "松弛 +1",
    "好运 +1",
    "续命 +1",
    "回血 +1",
    "白嫖 +1",
    "精神补偿 +1",
    "带薪呼吸 +1",
    "反内耗 +1",
    "下班能量 +1",
    "摸鱼熟练度 +1",
    "今日小确幸 +1",
    "钱包幻想 +1",
    "灵魂亮度 +1",
    "工位隐身 +1",
    "需求免疫 +1"
  ];
  const TOAST_MESSAGES = [
    { title: "今日敲击到账", detail: "{reward} · 今日 {count} 动" },
    { title: "资本家雷达短暂失灵", detail: "{reward} · 风险可控" },
    { title: "检测到温柔摸鱼", detail: "{reward} · 情绪回血" },
    { title: "会议孽障自动消散", detail: "{reward} · Bug -1" },
    { title: "道友手速稳定", detail: "{reward} · 第 {count} 次隐身成功" },
    { title: "工位肉身在线", detail: "{reward} · 灵魂短暂离岗" },
    { title: "KPI 未察觉异常", detail: "{reward} · 数据看似平稳" },
    { title: "赛博木鱼轻轻点头", detail: "{reward} · 继续低调" },
    { title: "这不是摸鱼，是热爱生活", detail: "{reward} · 今日 {count} 动" },
    { title: "已进入低功耗修仙", detail: "{reward} · 带薪呼吸稳定" },
    { title: "检测到战略性休息", detail: "{reward} · 脑细胞续命" },
    { title: "老板视野外活动成功", detail: "{reward} · 操作干净利落" },
    { title: "今日福报余额上涨", detail: "{reward} · 继续保持安静" },
    { title: "摸鱼姿势被系统认可", detail: "{reward} · 页面已记录" },
    { title: "需求暂时追不上你", detail: "{reward} · 心率稳定" }
  ];

  chrome.runtime.onInstalled.addListener(async () => {
    await ensureSettings();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const targetUrl = changeInfo.url || tab.url;

    if (!targetUrl || isBrowserInternalUrl(targetUrl)) {
      return;
    }

    if (!changeInfo.url && changeInfo.status !== "complete") {
      return;
    }

    if (shouldSkipDuplicateNavigation(tabId, targetUrl, changeInfo)) {
      return;
    }

    evaluateTab(tabId, targetUrl);
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "CYBER_MUYU_PREVIEW_TOAST") {
      return false;
    }

    const tabId = sender.tab?.id;
    if (typeof tabId !== "number") {
      sendResponse({ ok: false });
      return false;
    }

    injectToast(tabId, {
      title: "今日敲击到账",
      detail: "有钱 +1 · 今日预览",
      category: "preview"
    }).then(() => sendResponse({ ok: true }));

    return true;
  });

  async function evaluateTab(tabId, url) {
    const settings = await ensureSettings();
    const evaluation = CyberMuyuRules.evaluateUrl(url, settings);
    if (!evaluation.matched) {
      return;
    }

    const cooldownKey = `${tabId}:${url}`;
    const hitResult = await enqueueStorageMutation(async () => {
      const now = Date.now();
      if (isRuntimeCoolingDown(cooldownKey, now)) {
        return null;
      }

      const stored = await chrome.storage.local.get([TOTAL_KEY, DAILY_KEY, LAST_TRIGGER_KEY, RECENT_HITS_KEY]);
      const dailyState = getDailyState(stored[DAILY_KEY], stored[LAST_TRIGGER_KEY]);
      const lastTrigger = compactLastTrigger(dailyState.lastTrigger, now);
      if (now - Number(lastTrigger[cooldownKey] || 0) < SAME_PAGE_COOLDOWN_MS) {
        return null;
      }

      markRuntimeCooldown(cooldownKey, now);

      const nextDaily = {
        date: dailyState.daily.date,
        count: dailyState.daily.count + 1
      };
      const nextTotal = Number(stored[TOTAL_KEY] || 0) + 1;
      const hit = createRecentHit(url, evaluation, now);

      await chrome.storage.local.set({
        [DAILY_KEY]: nextDaily,
        [TOTAL_KEY]: nextTotal,
        [LAST_TRIGGER_KEY]: {
          ...lastTrigger,
          [cooldownKey]: now
        },
        [RECENT_HITS_KEY]: [hit, ...(stored[RECENT_HITS_KEY] || [])].slice(0, MAX_RECENT_HITS)
      });

      return {
        count: nextDaily.count
      };
    });

    if (!hitResult) {
      return;
    }

    if (settings.reminderMode !== "silent") {
      await injectToast(tabId, createToastPayload(hitResult.count, evaluation, settings.reminderPosition));
    }
  }

  function enqueueStorageMutation(task) {
    const queuedTask = storageMutationQueue.then(task, task);
    storageMutationQueue = queuedTask.catch(() => {});
    return queuedTask;
  }

  function isBrowserInternalUrl(url) {
    return [
      "chrome://",
      "edge://",
      "about:",
      "devtools://",
      "chrome-extension://"
    ].some((prefix) => url.startsWith(prefix));
  }

  function shouldSkipDuplicateNavigation(tabId, url, changeInfo) {
    const now = Date.now();
    const key = String(tabId);
    const previous = recentNavigations.get(key);
    const isCompletionOnly = !changeInfo.url && changeInfo.status === "complete";

    if (isCompletionOnly && previous?.url === url && now - previous.timestamp < NAVIGATION_DEDUPE_MS) {
      return true;
    }

    recentNavigations.set(key, {
      url,
      timestamp: now
    });

    setTimeout(() => {
      const latest = recentNavigations.get(key);
      if (latest?.url === url && latest.timestamp === now) {
        recentNavigations.delete(key);
      }
    }, NAVIGATION_DEDUPE_MS);

    return false;
  }

  async function ensureSettings() {
    const stored = await chrome.storage.local.get(CyberMuyuRules.SETTINGS_KEY);
    const rawSettings = stored[CyberMuyuRules.SETTINGS_KEY];
    const settings = CyberMuyuRules.normalizeSettings(rawSettings);
    if (shouldPersistNormalizedSettings(rawSettings, settings)) {
      await chrome.storage.local.set({ [CyberMuyuRules.SETTINGS_KEY]: settings });
    }
    return settings;
  }

  function shouldPersistNormalizedSettings(rawSettings, settings) {
    if (!rawSettings || typeof rawSettings !== "object") {
      return true;
    }

    return !settings.rules.length || !settings.exclusions.length;
  }

  async function injectToast(tabId, payload) {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ["styles.css"]
      });

      const [existingRenderer] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => !!window.renderCyberMuyuToast
      });

      if (!existingRenderer || !existingRenderer.result) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"]
        });
      }

      await chrome.scripting.executeScript({
        target: { tabId },
        func: (toastPayload) => {
          window.renderCyberMuyuToast?.(toastPayload);
        },
        args: [payload]
      });
    } catch (error) {
      return;
    }
  }

  function isRuntimeCoolingDown(cooldownKey, now) {
    const lastRuntimeTrigger = Number(runtimeCooldown.get(cooldownKey) || 0);
    return now - lastRuntimeTrigger < SAME_PAGE_COOLDOWN_MS;
  }

  function markRuntimeCooldown(cooldownKey, now) {
    runtimeCooldown.set(cooldownKey, now);
    setTimeout(() => {
      runtimeCooldown.delete(cooldownKey);
    }, SAME_PAGE_COOLDOWN_MS);
  }

  function createToastPayload(count, evaluation, position) {
    const template = getRandomItem(TOAST_MESSAGES);
    const reward = getRandomItem(REWARD_TOKENS);
    return {
      title: fillToastTemplate(template.title, count, reward),
      detail: fillToastTemplate(template.detail, count, reward),
      reward,
      position,
      category: evaluation.rule?.category || "moyu"
    };
  }

  function fillToastTemplate(template, count, reward) {
    if (!template || typeof template !== "string") {
      return "功德到账";
    }

    return template
      .replace(/\{count\}/g, String(count || 0))
      .replace(/\{reward\}/g, String(reward || ""));
  }

  function getRandomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function createRecentHit(url, evaluation, timestamp) {
    const parsed = new URL(url);
    return {
      url,
      host: parsed.hostname,
      ruleName: evaluation.rule?.name || parsed.hostname,
      category: evaluation.rule?.category || "moyu",
      source: evaluation.source,
      timestamp
    };
  }

  function getDailyState(record, lastTrigger) {
    const today = getTodayKey();
    if (!record || record.date !== today) {
      return {
        daily: { date: today, count: 0 },
        lastTrigger: {}
      };
    }

    return {
      daily: {
        date: today,
        count: Number(record.count || 0)
      },
      lastTrigger: lastTrigger || {}
    };
  }

  function compactLastTrigger(lastTrigger, now) {
    const compacted = {};
    Object.entries(lastTrigger || {}).forEach(([cooldownKey, timestamp]) => {
      if (now - Number(timestamp || 0) < SAME_PAGE_COOLDOWN_MS) {
        compacted[cooldownKey] = timestamp;
      }
    });

    return compacted;
  }

  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
})();
