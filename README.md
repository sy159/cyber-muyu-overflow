# 赛博功德林 (Cyber Muyu Overflow)

给打工人和程序员准备的 Chrome 浏览器插件。它会根据可管理的摸鱼规则识别网页，记录功德，并按设置显示一个轻量木鱼敲击提醒。

不播放声音，不刷控制台，不用居中大弹窗打断浏览。

## 功能

- 命中摸鱼规则时自动记录今日功德和总功德。
- 默认内置大量常见摸鱼站点，覆盖视频、社交、购物、社区、新闻和技术摸鱼场景。
- 支持用户添加、编辑、删除、启用、停用规则。
- URL 规则支持两种类型：
  - 域名：例如 `bilibili.com`
  - 正则：例如 `douban\\.com\\/group`
- 支持工作网站排除规则，排除规则优先级最高。
- 支持广义摸鱼模式：除工作排除、本地开发、内网地址、搜索引擎、邮箱和常见办公工具外，普通公开网页都可计为摸鱼。
- 支持 SPA 路由变化捕获，例如在 B 站或 YouTube 内部切换页面也会重新评估规则。
- Popup 看板包含今日功德、总功德、白嫖金额、修仙段位和最近命中记录。
- 提醒方式支持敲木鱼提醒和静默计数。
- 敲木鱼提醒包含轻量敲击动作和随机 `xx +1` 飘字。
- 提醒位置可选右下角、左下角、右上角、左上角、底部居中和顶部居中。

## 安装测试

1. 打开 Chrome。
2. 访问 `chrome://extensions/`。
3. 打开右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目目录：

```text
/path/to/cyber-muyu-overflow
```

安装后，访问默认规则覆盖的网站即可触发计数。点击浏览器扩展图标可以打开功德控制台。

## 项目结构

```text
.
├── manifest.json        # Chrome Extension MV3 配置
├── background.js        # 监听页面加载，按规则判断并按需注入提示
├── rules.js             # 默认规则、正则校验、排除规则和广义摸鱼模式
├── content.js           # 按设置位置渲染木鱼敲击提醒
├── popup.html           # 插件弹窗控制台
├── popup.js             # 看板、规则管理和设置逻辑
├── styles.css           # Toast 和 Popup UI 样式
├── assets/
│   └── muyu.svg         # 木鱼主体 SVG 视觉资产
├── verify-extension.js  # 本地规则与回归校验脚本
└── LICENSE
```

## 权限说明

插件使用以下 MV3 权限：

- `storage`：在本地保存功德统计、规则和设置。
- `tabs`：读取标签页 URL，用于规则判断。
- `scripting`：只在命中规则后按需注入 toast 渲染器和样式。
- `host_permissions: <all_urls>`：支持用户自定义正则 URL 规则和广义摸鱼模式。
- `web_accessible_resources`：允许注入页面加载扩展内置的 `assets/muyu.svg` 木鱼视觉资产。

虽然声明了 `<all_urls>` 主机权限，但插件不会常驻注入所有网页。后台只读取 URL 做规则判断，命中后才注入轻量 toast。

## 本地校验

项目不依赖打包工具或第三方库。安装前可以运行：

```bash
node verify-extension.js
node --check background.js
node --check content.js
node --check popup.js
node --check rules.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"
```

`verify-extension.js` 会检查：

- Manifest 不再使用常驻 `content_scripts`。
- 后台使用 `chrome.tabs.onUpdated` 和 `chrome.scripting` 按需注入。
- 规则引擎支持域名、正则、工作排除和广义摸鱼模式。
- 默认规则能覆盖常见摸鱼网站，同时不会把普通 GitHub 仓库直接算作摸鱼。
- 广义摸鱼模式默认排除搜索引擎、邮箱和常见办公工具。
- Toast 渲染器会先检查是否已注入，避免重复执行 `content.js`。
- Popup 跨天时会同步重置今日功德。
- 一键忏悔会清除防刷冷却记录。
- Toast 是紧凑的木鱼敲击提醒，不阻挡页面交互，并支持多个位置。
- 生产文件没有 `console.*` 输出。
- README 不包含本地绝对路径。

## 隐私说明

插件只使用 `chrome.storage.local` 在本地保存功德统计、规则和设置，不上传数据，不请求远程接口。

## 开发说明

如果需要调整默认摸鱼站点，优先修改 `rules.js` 中的 `DEFAULT_RULES`，并同步更新 `verify-extension.js` 中相关覆盖测试。

如果新增 Popup 控件，需要同步更新 `popup.html`、`popup.js` 和必要的本地回归测试。
