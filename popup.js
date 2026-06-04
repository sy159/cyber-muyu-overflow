(function cyberMuyuPopup() {
  "use strict";

  const DAILY_KEY = "moyuDaily";
  const TOTAL_KEY = "moyuCount";
  const LAST_TRIGGER_KEY = "lastMoyuTriggerAt";
  const RECENT_HITS_KEY = "recentMoyuHits";
  const VALUE_PER_MOYU = 2.5;
  const MILK_TEA_PRICE = 15;

  let settings = CyberMuyuRules.createDefaultSettings();
  let editingRuleId = null;

  const elements = {
    enabledBadge: document.getElementById("enabledBadge"),
    tabButtons: Array.from(document.querySelectorAll(".tab-button")),
    panels: {
      dashboard: document.getElementById("dashboardPanel"),
      rules: document.getElementById("rulesPanel"),
      settings: document.getElementById("settingsPanel")
    },
    todayCount: document.getElementById("todayCount"),
    moneyValue: document.getElementById("moneyValue"),
    rankBadge: document.getElementById("rankBadge"),
    totalCount: document.getElementById("totalCount"),
    recentList: document.getElementById("recentList"),
    ruleType: document.getElementById("ruleType"),
    ruleCategory: document.getElementById("ruleCategory"),
    ruleName: document.getElementById("ruleName"),
    rulePattern: document.getElementById("rulePattern"),
    saveRuleButton: document.getElementById("saveRuleButton"),
    cancelEditButton: document.getElementById("cancelEditButton"),
    ruleError: document.getElementById("ruleError"),
    ruleSearch: document.getElementById("ruleSearch"),
    ruleListType: document.getElementById("ruleListType"),
    rulesList: document.getElementById("rulesList"),
    enabledToggle: document.getElementById("enabledToggle"),
    broadModeToggle: document.getElementById("broadModeToggle"),
    reminderModeSelect: document.getElementById("reminderModeSelect"),
    reminderPositionSelect: document.getElementById("reminderPositionSelect"),
    resetButton: document.getElementById("resetButton"),
    restoreDefaultsButton: document.getElementById("restoreDefaultsButton")
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindEvents();
    await loadSettings();
    await renderDashboard();
    renderSettings();
    renderRules();
  }

  function bindEvents() {
    elements.tabButtons.forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.tab));
    });

    elements.saveRuleButton.addEventListener("click", saveRuleFromForm);
    elements.cancelEditButton.addEventListener("click", clearRuleForm);
    elements.ruleSearch.addEventListener("input", renderRules);
    elements.rulesList.addEventListener("click", handleRulesListClick);
    elements.ruleListType.addEventListener("change", () => {
      clearRuleForm();
      renderRules();
    });

    elements.enabledToggle.addEventListener("change", async () => {
      settings.enabled = elements.enabledToggle.checked;
      await persistSettings();
    });

    elements.broadModeToggle.addEventListener("change", async () => {
      settings.broadMode = elements.broadModeToggle.checked;
      await persistSettings();
    });

    elements.reminderModeSelect.addEventListener("change", async () => {
      settings.reminderMode = elements.reminderModeSelect.value;
      await persistSettings();
    });

    elements.reminderPositionSelect.addEventListener("change", async () => {
      settings.reminderPosition = elements.reminderPositionSelect.value;
      await persistSettings();
    });

    elements.resetButton.addEventListener("click", resetMerit);
    elements.restoreDefaultsButton.addEventListener("click", restoreDefaults);

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      if (changes[DAILY_KEY] || changes[TOTAL_KEY] || changes[RECENT_HITS_KEY]) {
        renderDashboard();
      }
    });
  }

  async function loadSettings() {
    const stored = await chrome.storage.local.get(CyberMuyuRules.SETTINGS_KEY);
    settings = CyberMuyuRules.normalizeSettings(stored[CyberMuyuRules.SETTINGS_KEY]);
  }

  async function persistSettings() {
    settings = CyberMuyuRules.normalizeSettings(settings);
    await chrome.storage.local.set({ [CyberMuyuRules.SETTINGS_KEY]: settings });
    renderSettings();
    renderRules();
  }

  async function renderDashboard() {
    const today = getTodayKey();
    const stored = await chrome.storage.local.get([DAILY_KEY, TOTAL_KEY, RECENT_HITS_KEY]);
    const todayRecord = getDisplayDailyRecord(stored[DAILY_KEY], today);
    const todayCount = Number(todayRecord.count || 0);
    const totalCount = Number(stored[TOTAL_KEY] || 0);
    const money = todayCount * VALUE_PER_MOYU;
    const rank = getCultivationRank(todayCount);

    elements.todayCount.textContent = String(todayCount);
    elements.moneyValue.textContent = `${money.toFixed(2)} 元`;
    elements.rankBadge.textContent = rank.name;
    elements.totalCount.textContent = `${totalCount} 动`;
    renderRecentHits(stored[RECENT_HITS_KEY] || []);
  }

  function renderRecentHits(hits) {
    if (!hits.length) {
      elements.recentList.innerHTML = '<div class="empty-state">暂无命中记录，功德系统正在待机。</div>';
      return;
    }

    elements.recentList.innerHTML = hits.map((hit) => `
      <div class="recent-item">
        <div>
          <div class="recent-host">${escapeHtml(hit.host || "unknown")}</div>
          <div class="recent-meta">${escapeHtml(hit.ruleName || "规则命中")} · ${formatTime(hit.timestamp)}</div>
        </div>
        <span class="pill">${escapeHtml(hit.category || "moyu")}</span>
      </div>
    `).join("");
  }

  function renderSettings() {
    elements.enabledToggle.checked = settings.enabled;
    elements.broadModeToggle.checked = settings.broadMode;
    elements.reminderModeSelect.value = settings.reminderMode;
    elements.reminderPositionSelect.value = settings.reminderPosition;
    elements.enabledBadge.textContent = settings.enabled ? "静默运行" : "已关闭";
  }

  function renderRules() {
    const listName = elements.ruleListType.value;
    const rules = settings[listName] || [];
    const keyword = elements.ruleSearch.value.trim().toLowerCase();
    const visibleRules = rules.filter((rule) => {
      const haystack = `${rule.name} ${rule.pattern} ${rule.category}`.toLowerCase();
      return haystack.includes(keyword);
    });

    if (!visibleRules.length) {
      elements.rulesList.innerHTML = '<div class="empty-state">没有匹配的规则。</div>';
      return;
    }

    elements.rulesList.innerHTML = visibleRules.map((rule) => `
      <div class="rule-item">
        <div>
          <div class="rule-name">${escapeHtml(rule.name)}</div>
          <div class="rule-meta">${rule.type === "regex" ? "正则" : "域名"} · ${escapeHtml(rule.pattern)} · ${escapeHtml(rule.category)}</div>
        </div>
        <div class="rule-actions">
          <button class="icon-button" type="button" data-action="toggle" data-id="${escapeHtml(rule.id)}">${rule.enabled ? "开" : "关"}</button>
          <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(rule.id)}">改</button>
          <button class="icon-button" type="button" data-action="delete" data-id="${escapeHtml(rule.id)}">删</button>
        </div>
      </div>
    `).join("");

  }

  function handleRulesListClick(event) {
    const button = event.target.closest("button");
    if (!button || !elements.rulesList.contains(button)) {
      return;
    }

    handleRuleAction(button.dataset.action, button.dataset.id);
  }

  async function handleRuleAction(action, id) {
    const listName = elements.ruleListType.value;
    const rules = settings[listName] || [];
    const rule = rules.find((item) => item.id === id);
    if (!rule) {
      return;
    }

    if (action === "toggle") {
      rule.enabled = !rule.enabled;
      await persistSettings();
      return;
    }

    if (action === "edit") {
      editingRuleId = id;
      elements.ruleType.value = rule.type;
      elements.ruleCategory.value = rule.category === "exclude" ? "custom" : rule.category;
      elements.ruleName.value = rule.name;
      elements.rulePattern.value = rule.pattern;
      elements.saveRuleButton.textContent = "保存修改";
      elements.ruleError.textContent = "";
      return;
    }

    if (action === "delete") {
      settings[listName] = rules.filter((item) => item.id !== id);
      clearRuleForm();
      await persistSettings();
    }
  }

  async function saveRuleFromForm() {
    const listName = elements.ruleListType.value;
    const rule = {
      id: editingRuleId || CyberMuyuRules.createRuleId(),
      name: elements.ruleName.value.trim() || elements.rulePattern.value.trim(),
      type: elements.ruleType.value,
      pattern: elements.rulePattern.value.trim(),
      category: listName === "exclusions" ? "exclude" : elements.ruleCategory.value,
      enabled: true,
      builtIn: false
    };
    const validation = CyberMuyuRules.validateRule(rule);
    if (!validation.valid) {
      elements.ruleError.textContent = validation.message;
      return;
    }

    const list = settings[listName] || [];
    if (editingRuleId) {
      settings[listName] = list.map((item) => item.id === editingRuleId ? rule : item);
    } else {
      settings[listName] = [rule, ...list];
    }

    clearRuleForm();
    await persistSettings();
  }

  function clearRuleForm() {
    editingRuleId = null;
    elements.ruleName.value = "";
    elements.rulePattern.value = "";
    elements.ruleType.value = "domain";
    elements.ruleCategory.value = "video";
    elements.saveRuleButton.textContent = "添加规则";
    elements.ruleError.textContent = "";
  }

  async function resetMerit() {
    const today = getTodayKey();
    await chrome.storage.local.set({
      [DAILY_KEY]: {
        date: today,
        count: 0
      },
      [TOTAL_KEY]: 0,
      [LAST_TRIGGER_KEY]: {},
      [RECENT_HITS_KEY]: []
    });
    await renderDashboard();
  }

  async function restoreDefaults() {
    settings = CyberMuyuRules.createDefaultSettings();
    clearRuleForm();
    await persistSettings();
  }

  function activateTab(name) {
    elements.tabButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === name);
    });

    Object.entries(elements.panels).forEach(([panelName, panel]) => {
      panel.classList.toggle("is-active", panelName === name);
    });

    if (name === "dashboard") {
      renderDashboard();
    }
  }

  function getDisplayDailyRecord(record, today) {
    if (!record || record.date !== today) {
      return { date: today, count: 0 };
    }

    return {
      date: today,
      count: Number(record.count || 0)
    };
  }

  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getCultivationRank(count) {
    if (count >= 2000) {
      return {
        name: "工位外神·摸鱼无量"
      };
    }

    if (count >= 1500) {
      return {
        name: "摸鱼天尊·低调巡游"
      };
    }

    if (count >= 1000) {
      return {
        name: "无上天道·资本克星"
      };
    }

    if (count >= 777) {
      return {
        name: "七七七功德暴击"
      };
    }

    if (count >= 500) {
      return {
        name: "独占因果·带薪飞升"
      };
    }

    if (count >= 351) {
      return {
        name: "化神期工位隐者"
      };
    }

    if (count > 200) {
      return {
        name: "大乘期赛博真仙"
      };
    }

    if (count >= 101) {
      return {
        name: "出窍期摸鱼尊者"
      };
    }

    if (count >= 51) {
      return {
        name: "元婴期带薪老怪"
      };
    }

    if (count >= 11) {
      return {
        name: "结丹期划水大师"
      };
    }

    return {
      name: "筑基期摸鱼散修"
    };
  }

  function formatTime(timestamp) {
    if (!timestamp) {
      return "刚刚";
    }

    return new Date(timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
