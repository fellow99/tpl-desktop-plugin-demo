# tpl-desktop-plugin-demo

tpl-desktop 工作台的 **wujie（无界）微前端子应用**。向主应用提供 Widget 组件、全屏 App 应用、桌面视觉背景和通用 UI 组件。

> **核心特性**：所有组件通过 `import.meta.glob` 自动扫描注册，新增组件**零代码修改**。

---

## 架构概览

```
index.html (统一入口)
  └── src/main.js (40 行，双模式入口)
        │
        ├── src/widgets/index.js   ← import.meta.glob 自动扫描 .widget.vue + .widget.js
        ├── src/apps/index.js      ← import.meta.glob 自动扫描 .app.vue + .app.js
        ├── src/backgrounds/index.js ← import.meta.glob 自动扫描 .bg.js
        └── src/components/index.js  ← import.meta.glob 自动扫描 app-*.vue
              │
              └── main.js 统一处理：
                    if (window.__POWERED_BY_WUJIE__) → 沙箱模式 → bus.emit('plugin:ready')
                    else → 独立调试模式 → createApp(App).mount('#app')
```

---

## 自动扫描机制

本项目的核心设计理念：**文件名约定即契约，零手动注册**。

4 个 `src/*/index.js` 模块使用 Vite 的 `import.meta.glob({ eager: true })` 在构建时自动发现并注册所有组件。

### 1. Widget 自动扫描 (`src/widgets/index.js`)

```js
// 扫描所有 .widget.vue（组件定义）和 .widget.js（元数据）
const vueModules = import.meta.glob('./**/*.widget.vue', { eager: true })
const jsModules  = import.meta.glob('./**/*.widget.js',  { eager: true })

// './demo/DemoText.widget.vue' → 'DemoText'
function extractCompName(path) {
  const fileName = path.replace(/^\.\/(.*)\.widget\.(vue|js)$/, '$1')
  return fileName.split('/').pop()
}

// 导出：WidgetComponents（组件定义）+ WidgetMetas（元数据）
export const WidgetComponents = { /* DemoText: Component, DemoNumber: Component, ... */ }
export const WidgetMetas      = { /* DemoText: { title, category, rect, ... compName }, ... */ }
```

**新增 Widget**：只需在 `src/widgets/` 下创建 `.widget.vue` + `.widget.js` 文件对，自动注册。

### 2. App 自动扫描 (`src/apps/index.js`)

```js
// 扫描所有 .app.vue（组件定义）和 .app.js（元数据）
const vueModules = import.meta.glob('./**/*.app.vue', { eager: true })
const jsModules  = import.meta.glob('./**/*.app.js',  { eager: true })

export const AppComponents = { /* DemoClock: Component */ }
export const AppMetas      = { /* DemoClock: { title, category, rect, ... compName } */ }
```

**新增 App**：只需在 `src/apps/` 下创建 `.app.vue` + `.app.js` 文件对，自动注册。

### 3. 桌面背景自动扫描 (`src/backgrounds/index.js`)

```js
// 扫描所有 .bg.js 元数据文件
const bgModules = import.meta.glob('./**/*.bg.js', { eager: true })

// './dark/dark-001.bg.js' → 'dark-001'
function extractBgName(path) {
  const fileName = path.replace(/^\.\/(.*)\.bg\.js$/, '$1')
  return fileName.split('/').pop()
}

export const BackgroundMetas = { /* 'dark-001': { title, category, theme, ... name }, ... */ }
```

**新增背景**：只需在 `src/backgrounds/` 下放入资源文件 + `.bg.js` 元数据，自动注册。

### 4. UI 组件自动扫描 (`src/components/index.js`)

```js
// 扫描所有 app-*.vue 组件
const componentModules = import.meta.glob('./**/app-*.vue', { eager: true })

export const Components = { /* 'app-button': Component, 'app-modal': Component, ... */ }
```

**新增 UI 组件**：只需在 `src/components/` 下创建 `app-*.vue` 文件，自动注册。

### 健壮性保障

所有自动扫描模块均内置：
- **名称冲突检测** — 同名组件覆盖时 `console.warn` 提示
- **孤儿组件处理** — 缺失元数据文件的 `.vue` 组件自动生成默认元数据
- **非法导出降级** — `default` 非对象时回退为空对象，不中断扫描流程
- **默认值回退** — `title` 缺失 → compName 占位；`category` 缺失 → `'其他'`

---

## 注入 wujie 微前端环境

`main.js` 作为统一入口，通过 `window.__POWERED_BY_WUJIE__` 自动切换模式：

```js
import { WidgetMetas, WidgetComponents } from './widgets/index.js'
import { AppMetas, AppComponents }       from './apps/index.js'
import { BackgroundMetas }               from './backgrounds/index.js'
import { Components as UIComponents }    from './components/index.js'

let appInstance = null

if (window.__POWERED_BY_WUJIE__) {
  // ====== 沙箱模式 ======
  window.__WUJIE_MOUNT = () => {
    appInstance = createApp(App)
    appInstance.mount('#app')

    // 通过 wujie 事件总线向主应用暴露所有组件
    window.$wujie?.bus.$emit('plugin:ready', {
      pluginName:  window.$wujie?.props?.pluginName,
      widgetMetas:        WidgetMetas,
      widgetComponents:   WidgetComponents,
      appMetas:           AppMetas,
      appComponents:      AppComponents,
      backgroundMetas:    BackgroundMetas,
      components:         UIComponents,
    })
  }

  window.__WUJIE_UNMOUNT = () => {
    appInstance?.unmount()
    appInstance = null
  }

  // Vite ESM 异步加载完成后主动通知 wujie 框架就绪
  window.__WUJIE.mount()
} else {
  // ====== 独立调试模式 ======
  appInstance = createApp(App)
  appInstance.mount('#app')
}
```

### 与主应用通信流程

```
子应用挂载完毕
  → $wujie.bus.$emit('plugin:ready', {
      widgetMetas, widgetComponents,    // Widget 组件 + 元数据
      appMetas, appComponents,          // App 组件 + 元数据
      backgroundMetas,                  // 背景元数据
      components                        // UI 组件
    })
  → 主应用监听 'plugin:ready' 事件
    → app.component() 注册所有组件
    → use*Metas() 注入元数据到分类树
```

---

## 目录结构

```
tpl-desktop-plugin-demo/
├── index.html                  # 统一 HTML 入口
├── package.json
├── vite.config.js
├── README.md                   # 本文件
├── specs/                      # 规范文档（详见 specs/README.md）
├── src/
│   ├── main.js                 # ★ 统一入口（双模式 + wujie 生命周期）
│   ├── App.vue                 # 根组件
│   ├── widgets/
│   │   ├── index.js            # Widget 自动扫描注册
│   │   └── demo/
│   │       ├── DemoText.widget.vue    # 文字 Widget
│   │       ├── DemoText.widget.js     # 元数据
│   │       ├── DemoNumber.widget.vue  # 数字 Widget
│   │       ├── DemoNumber.widget.js
│   │       ├── DemoImage.widget.vue   # 图片 Widget
│   │       ├── DemoImage.widget.js
│   │       ├── DemoVideo.widget.vue   # 视频 Widget
│   │       └── DemoVideo.widget.js
│   ├── apps/
│   │   ├── index.js            # App 自动扫描注册
│   │   └── demo/
│   │       ├── DemoClock.app.vue      # 时钟 App
│   │       └── DemoClock.app.js
│   ├── backgrounds/
│   │   ├── index.js            # 背景自动扫描注册
│   │   ├── dark/  (4 套暗色)
│   │   ├── light/ (4 套浅色)
│   │   └── video/ (4 套动态)
│   └── components/
│       └── index.js            # UI 组件自动扫描注册
```

---

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器（独立调试模式）
pnpm dev
# → 访问 http://localhost:5273/index.html

# 构建生产版本
pnpm build
```

---

## 如何新增组件

### 新增一个 Widget

1. 创建 `src/widgets/demo/MyWidget.widget.vue`（组件实现）
2. 创建 `src/widgets/demo/MyWidget.widget.js`（元数据声明）

```js
// MyWidget.widget.js
export default {
  title: '我的组件',
  category: '3.Demo组件',
  rect: { unit: 'grid', width: 2, height: 2 },
  props: {
    value: { title: '内容', default: '' }
  },
  events: [],
  propsEditors: [],
  wrapperEditors: []
}
```

3. 完成。无需修改任何其他代码，`src/widgets/index.js` 自动发现并注册。

### 新增一个 App

1. 创建 `src/apps/demo/MyApp.app.vue`
2. 创建 `src/apps/demo/MyApp.app.js`（结构同 WidgetMeta）
3. 完成。`src/apps/index.js` 自动注册。

### 新增桌面背景

1. 放入背景图片/视频到 `src/backgrounds/<类别>/`
2. 创建 `.bg.js` 元数据文件：

```js
// src/backgrounds/dark/my-bg.bg.js
export default {
  title: '我的暗色背景',
  category: '暗色系',
  theme: 'dark',
  type: 'image',
  avatar: new URL('./avatar.svg', import.meta.url).href,
  thumbnail: new URL('./my-bg-s.jpg', import.meta.url).href,
  image: new URL('./my-bg.jpg', import.meta.url).href
}
```

3. 完成。`src/backgrounds/index.js` 自动注册。

### 新增 UI 组件

1. 创建 `src/components/common/app-tooltip.vue`
2. 完成。`src/components/index.js` 自动注册为 `app-tooltip`。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | ^3.5 | 组件框架 |
| Vite | ^8.1 | 构建工具 + `import.meta.glob` |
| dayjs | ^1.11 | DemoClock 时间格式化 |
| @number-flow/vue | ^0.4 | DemoNumber 数字动画 |
| Sass | ^1.101 | SCSS 编译 |

---

## 规范文档

完整的架构设计、功能规格、技术方案和测试用例位于 [`specs/`](./specs/) 目录，详见 [specs/README.md](./specs/README.md)。
