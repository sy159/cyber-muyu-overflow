(function attachCyberMuyuRules(globalScope) {
  "use strict";

  const SETTINGS_KEY = "cyberMuyuSettings";
  const RULE_TYPES = {
    DOMAIN: "domain",
    REGEX: "regex"
  };

  const MATCH_SOURCES = {
    RULE: "rule",
    BROAD: "broad"
  };

  const DEFAULT_SETTINGS = {
    enabled: true,
    broadMode: false,
    reminderMode: "muyu",
    reminderPosition: "bottom-right"
  };

  const REMINDER_MODES = ["muyu", "silent"];
  const REMINDER_POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left", "bottom-center", "top-center"];

  const DEFAULT_RULES = [
    domainRule("video-bilibili", "Bilibili", "bilibili.com", "video"),
    domainRule("video-douyin", "抖音", "douyin.com", "video"),
    domainRule("video-kuaishou", "快手", "kuaishou.com", "video"),
    domainRule("video-youtube", "YouTube", "youtube.com", "video"),
    domainRule("video-iqiyi", "爱奇艺", "iqiyi.com", "video"),
    domainRule("video-youku", "优酷", "youku.com", "video"),
    domainRule("video-qq", "腾讯视频", "v.qq.com", "video"),
    domainRule("video-mgtv", "芒果 TV", "mgtv.com", "video"),
    domainRule("video-acfun", "AcFun", "acfun.cn", "video"),
    domainRule("video-twitch", "Twitch", "twitch.tv", "video"),

    domainRule("social-weibo", "微博", "weibo.com", "social"),
    domainRule("social-zhihu", "知乎", "zhihu.com", "social"),
    domainRule("social-xiaohongshu", "小红书", "xiaohongshu.com", "social"),
    domainRule("social-douban", "豆瓣", "douban.com", "social"),
    domainRule("social-tieba", "贴吧", "tieba.baidu.com", "social"),
    domainRule("social-hupu", "虎扑", "hupu.com", "social"),
    domainRule("social-reddit", "Reddit", "reddit.com", "social"),
    domainRule("social-twitter", "X / Twitter", "x.com", "social"),
    domainRule("social-instagram", "Instagram", "instagram.com", "social"),

    domainRule("shop-taobao", "淘宝", "taobao.com", "shopping"),
    domainRule("shop-tmall", "天猫", "tmall.com", "shopping"),
    domainRule("shop-jd", "京东", "jd.com", "shopping"),
    domainRule("shop-pdd", "拼多多", "pinduoduo.com", "shopping"),
    domainRule("shop-smzdm", "什么值得买", "smzdm.com", "shopping"),
    domainRule("shop-amazon", "Amazon", "amazon.com", "shopping"),
    domainRule("shop-ebay", "eBay", "ebay.com", "shopping"),
    domainRule("shop-etsy", "Etsy", "etsy.com", "shopping"),

    domainRule("community-v2ex", "V2EX", "v2ex.com", "community"),
    domainRule("community-juejin", "掘金", "juejin.cn", "community"),
    domainRule("community-sspai", "少数派", "sspai.com", "community"),
    domainRule("community-ithome", "IT之家", "ithome.com", "community"),
    domainRule("community-producthunt", "Product Hunt", "producthunt.com", "community"),
    domainRule("community-medium", "Medium", "medium.com", "community"),
    domainRule("community-devto", "DEV Community", "dev.to", "community"),

    domainRule("news-36kr", "36氪", "36kr.com", "news"),
    domainRule("news-huxiu", "虎嗅", "huxiu.com", "news"),
    domainRule("news-thepaper", "澎湃新闻", "thepaper.cn", "news"),
    domainRule("news-ifanr", "爱范儿", "ifanr.com", "news"),
    domainRule("news-nytimes", "纽约时报", "nytimes.com", "news"),
    domainRule("news-bbc", "BBC", "bbc.com", "news"),
    domainRule("news-cnn", "CNN", "cnn.com", "news"),

    regexRule("tech-github-trending", "GitHub Trending", "github\\.com\\/(trending|explore|topics)(\\/.*)?$", "tech"),
    regexRule("tech-stackoverflow-tags", "Stack Overflow Tags", "stackoverflow\\.com\\/questions\\/tagged\\/.*", "tech"),
    regexRule("video-youtube-shorts", "YouTube Shorts", "youtube\\.com\\/shorts\\/.*", "video")
  ];

  const DEFAULT_EXCLUSIONS = [
    domainRule("exclude-localhost", "本地开发 localhost", "localhost", "exclude"),
    regexRule("exclude-private-ip", "内网 IP", "^(https?:\\/\\/)?(10\\.|172\\.(1[6-9]|2\\d|3[0-1])\\.|192\\.168\\.)", "exclude"),
    domainRule("exclude-github-work", "GitHub 普通仓库", "github.com", "exclude", false),
    domainRule("exclude-google", "Google 搜索", "google.com", "exclude"),
    domainRule("exclude-baidu", "百度搜索", "baidu.com", "exclude"),
    domainRule("exclude-bing", "Bing 搜索", "bing.com", "exclude"),
    domainRule("exclude-mail-google", "Gmail", "mail.google.com", "exclude"),
    domainRule("exclude-outlook", "Outlook", "outlook.office.com", "exclude"),
    domainRule("exclude-docs-google", "Google Docs", "docs.google.com", "exclude"),
    domainRule("exclude-drive-google", "Google Drive", "drive.google.com", "exclude"),
    domainRule("exclude-office", "Microsoft Office", "office.com", "exclude"),
    domainRule("exclude-notion", "Notion", "notion.so", "exclude"),
    domainRule("exclude-feishu", "飞书", "feishu.cn", "exclude"),
    domainRule("exclude-larksuite", "Lark", "larksuite.com", "exclude"),
    domainRule("exclude-dingtalk", "钉钉", "dingtalk.com", "exclude"),
    domainRule("exclude-slack", "Slack", "slack.com", "exclude")
  ];

  const SAFE_PUBLIC_SUFFIXES = [
    ".com",
    ".cn",
    ".net",
    ".org",
    ".io",
    ".tv",
    ".app",
    ".dev",
    ".co",
    ".me",
    ".cc",
    ".info",
    ".top",
    ".xyz",
    ".site",
    ".online",
    ".club",
    ".fun",
    ".wiki",
    ".pro",
    ".live",
    ".to"
  ];

  function createDefaultSettings() {
    return {
      enabled: DEFAULT_SETTINGS.enabled,
      broadMode: DEFAULT_SETTINGS.broadMode,
      reminderMode: DEFAULT_SETTINGS.reminderMode,
      reminderPosition: DEFAULT_SETTINGS.reminderPosition,
      rules: cloneRules(DEFAULT_RULES),
      exclusions: cloneRules(DEFAULT_EXCLUSIONS)
    };
  }

  function normalizeSettings(settings) {
    const defaults = createDefaultSettings();
    if (!settings || typeof settings !== "object") {
      return defaults;
    }

    return {
      enabled: typeof settings.enabled === "boolean" ? settings.enabled : defaults.enabled,
      broadMode: typeof settings.broadMode === "boolean" ? settings.broadMode : defaults.broadMode,
      reminderMode: normalizeReminderMode(settings, defaults.reminderMode),
      reminderPosition: REMINDER_POSITIONS.includes(settings.reminderPosition) ? settings.reminderPosition : defaults.reminderPosition,
      rules: normalizeRuleList(settings.rules, defaults.rules),
      exclusions: normalizeRuleList(settings.exclusions, defaults.exclusions)
    };
  }

  function normalizeReminderMode(settings, fallback) {
    if (REMINDER_MODES.includes(settings.reminderMode)) {
      return settings.reminderMode;
    }

    if (settings.toastMode === "badge") {
      return "silent";
    }

    return fallback;
  }

  function normalizeRuleList(rules, fallback) {
    if (!Array.isArray(rules)) {
      return fallback;
    }

    return rules
      .map(normalizeRule)
      .filter(Boolean);
  }

  function normalizeRule(rule) {
    if (!rule || typeof rule !== "object") {
      return null;
    }

    const type = rule.type === RULE_TYPES.REGEX ? RULE_TYPES.REGEX : RULE_TYPES.DOMAIN;
    const pattern = String(rule.pattern || "").trim();
    if (!pattern) {
      return null;
    }

    return {
      id: String(rule.id || createRuleId()),
      name: String(rule.name || pattern),
      type,
      pattern,
      category: String(rule.category || "custom"),
      enabled: rule.enabled !== false,
      builtIn: Boolean(rule.builtIn)
    };
  }

  function evaluateUrl(url, settings) {
    const normalizedSettings = normalizeSettings(settings);
    if (!normalizedSettings.enabled) {
      return createEvaluation(false, null, null);
    }

    const parsed = safeParseUrl(url);
    if (!parsed) {
      return createEvaluation(false, null, null);
    }

    const exclusion = findMatchingRule(parsed, normalizedSettings.exclusions);
    if (exclusion) {
      return {
        matched: false,
        reason: "excluded",
        rule: exclusion,
        source: "exclude"
      };
    }

    const rule = findMatchingRule(parsed, normalizedSettings.rules);
    if (rule) {
      return createEvaluation(true, rule, MATCH_SOURCES.RULE);
    }

    if (normalizedSettings.broadMode && isBroadMoyuCandidate(parsed)) {
      return createEvaluation(true, createBroadRule(parsed.hostname), MATCH_SOURCES.BROAD);
    }

    return createEvaluation(false, null, null);
  }

  function findMatchingRule(parsed, rules) {
    return rules.find((rule) => rule.enabled && doesRuleMatch(parsed, rule)) || null;
  }

  function doesRuleMatch(parsed, rule) {
    if (rule.type === RULE_TYPES.REGEX) {
      return doesRegexMatch(parsed.href, rule.pattern);
    }

    return doesDomainMatch(parsed.hostname, rule.pattern);
  }

  function doesDomainMatch(hostname, pattern) {
    const normalizedHost = String(hostname || "").toLowerCase();
    const normalizedPattern = String(pattern || "").toLowerCase().replace(/^\*\./, "");
    return normalizedHost === normalizedPattern || normalizedHost.endsWith(`.${normalizedPattern}`);
  }

  function doesRegexMatch(url, pattern) {
    try {
      return new RegExp(pattern, "i").test(url);
    } catch (error) {
      return false;
    }
  }

  function validateRule(rule) {
    const normalized = normalizeRule(rule);
    if (!normalized) {
      return {
        valid: false,
        message: "规则不能为空"
      };
    }

    if (normalized.type === RULE_TYPES.REGEX) {
      try {
        new RegExp(normalized.pattern);
      } catch (error) {
        return {
          valid: false,
          message: "正则表达式无效"
        };
      }
    }

    return {
      valid: true,
      message: ""
    };
  }

  function isBroadMoyuCandidate(parsed) {
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || hostname === "localhost" || hostname.endsWith(".local")) {
      return false;
    }

    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return false;
    }

    return SAFE_PUBLIC_SUFFIXES.some((suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix));
  }

  function safeParseUrl(url) {
    try {
      return new URL(url);
    } catch (error) {
      return null;
    }
  }

  function createEvaluation(matched, rule, source) {
    return {
      matched,
      reason: matched ? "matched" : "not_matched",
      rule,
      source
    };
  }

  function createBroadRule(hostname) {
    return {
      id: "broad-mode",
      name: hostname,
      type: RULE_TYPES.DOMAIN,
      pattern: hostname,
      category: "broad",
      enabled: true,
      builtIn: true
    };
  }

  function domainRule(id, name, pattern, category, enabled = true) {
    return {
      id,
      name,
      type: RULE_TYPES.DOMAIN,
      pattern,
      category,
      enabled,
      builtIn: true
    };
  }

  function regexRule(id, name, pattern, category, enabled = true) {
    return {
      id,
      name,
      type: RULE_TYPES.REGEX,
      pattern,
      category,
      enabled,
      builtIn: true
    };
  }

  function cloneRules(rules) {
    return rules.map((rule) => ({ ...rule }));
  }

  function createRuleId() {
    return `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  globalScope.CyberMuyuRules = {
    SETTINGS_KEY,
    RULE_TYPES,
    DEFAULT_RULES,
    DEFAULT_EXCLUSIONS,
    createDefaultSettings,
    normalizeSettings,
    evaluateUrl,
    validateRule,
    doesDomainMatch,
    createRuleId
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
