# 系统架构

> 项目：tpl-desktop-plugin-demo
> 最后更新：2026-07-21

---

## 1. 架构分层

```
┌──────────────────────────────────────────────────────┐
│                   入口层（HTML）                       │
│  ┌──────────────────────────────────────┐            │
│  │           index.html                  │            │
│  │       (统一入口，双模式共用)           │            │
│  │       <script src=main.js>            │            │
│  └──────────────────┬───────────────────┘            │
│                     │                                 │
├─────────────────────┼─────────────────────────────────┤
│                     ▼                                  │
│  ┌──────────────────────────────────────┐            │
│  │          main.js ★核心入口            │            │
│  │  - 环境判断 (isWujie?)                │            │
│  │  - wujie 生命周期注册                 │            │
│  │  - bus.emit('plugin:ready', ...)      │            │
│  │  - 导入 4 个自动扫描模块              │            │
│  └──────────┬───────────────────────────┘            │
│             │                                         │
├─────────────┼─────────────────────────────────────────┤
│             ▼             自动扫描模块层               │
│  ┌──────────┴──────┬──────────┬──────────┬─────────┐ │
│  │ widgets/index.js│ apps/    │ bgs/     │ comps/  │ │
│  │ (Widget 自动扫描)│ index.js │ index.js │ index.js│ │
│  │ .widget.vue+     │ (App     │ (Bg      │ (UI     │ │
│  │  .widget.js)     │  自动扫描)│ 自动扫描) │ 自动扫描)│ │
│  └──────────┬──────┴────┬─────┴────┬─────┴────┬────┘ │
│             │           │          │          │       │
├─────────────┼───────────┼──────────┼──────────┼───────┤
│             ▼           ▼          ▼          ▼        │
│                   组件层                               │
│  ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐    │
│  │ Widgets  │ │  Apps  │ │  Bgs   │ │UI Comps  │    │
│  │ (自动发现)│ │(自动发现)│ │(12个)  │ │(自动发现) │    │
│  └──────────┘ └────────┘ └────────┘ └──────────┘    │
│                                                       │
├───────────────────────────────────────────────────────┤
│                  资源层                                │
│  ┌───────────────────────────────────────────────┐   │
│  │  backgrounds/                                  │   │
│  │  ├── dark/   (4 套 jpg + 缩略图 thumbnail)     │   │
│  │  ├── light/  (4 套 jpg + 缩略图 thumbnail)     │   │
│  │  └── video/  (4 套 webm + 缩略图 thumbnail)    │   │
│  │  widgets/demo/avatar.svg                       │   │
│  │  backgrounds/avatar.svg                        │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 分层说明

| 层级 | 文件 | 职责 |
|------|------|------|
| **入口层** | `index.html` | 统一 HTML 入口，双模式共用 |
| **初始化层** | `main.js` + `src/*/index.js` | Vue 应用创建、组件自动扫描注册、wujie 生命周期桥接 |
| **组件层** | `widgets/` / `apps/` / `components/` | 可被主应用消费的 Widget、App 和 UI 组件 |
| **资源层** | `backgrounds/` | 桌面背景资源（图片/视频 + 元数据） |

---

## 2. 核心流程

### 2.1 wujie 沙箱模式启动流程

```
  tpl-desktop 主应用
    │
    ▼
  useWujie.loadPlugins()
    → startApp({ name: 'tpl-desktop-plugin-demo', url, alive, exec, fiber })
      → wujie 创建 iframe + 加载 index.html
        ▼
  index.html
    → <script type="module" src="/src/main.js">
      ▼
  main.js
    ├─ import { WidgetMetas, WidgetComponents } from './widgets/index.js'
    │   (widgets/index.js: import.meta.glob 自动扫描 .widget.vue + .widget.js)
    ├─ import { AppMetas, AppComponents } from './apps/index.js'
    │   (apps/index.js: import.meta.glob 自动扫描 .app.vue + .app.js)
    ├─ import { BackgroundMetas } from './backgrounds/index.js'
    │   (backgrounds/index.js: import.meta.glob 自动扫描 .bg.js)
    ├─ import { Components as UIComponents } from './components/index.js'
    │   (components/index.js: import.meta.glob 自动扫描 app-*.vue)
    │
    ├─ const isWujie = window.__POWERED_BY_WUJIE__   // → true
    │
    ├─ window.__WUJIE_MOUNT = () => {
    │    appInstance = createApp(App).mount('#app')
    │    window.$wujie?.bus.$emit('plugin:ready', {
    │      pluginName, widgetMetas, widgetComponents,
    │      appMetas, appComponents, backgroundMetas, components
    │    })
    │  }
    │
    ├─ window.__WUJIE_UNMOUNT = () => {
    │    appInstance?.unmount()
    │    appInstance = null
    │  }
    │
    └─ window.__WUJIE.mount()  // Vite ESM 异步加载后主动通知就绪
```

### 2.2 主应用消费子应用组件

```
  主应用监听 plugin:ready 事件
    ├─ widgetMetas: { DemoText: Meta, DemoNumber: Meta, ... }
    ├─ appMetas: { DemoClock: Meta }
    ├─ backgroundMetas: { dark-001: Meta, ... }
    ├─ widgetComponents: { DemoText: Comp, DemoNumber: Comp, ... }
    ├─ appComponents: { DemoClock: Comp }
    └─ components: { app-*: Comp, ... }

    ├─ 将组件通过 app.component() 注册到主应用 Vue 实例
    └─ 将元数据注入 useWidgetMetas / useAppMetas / useBackgroundMetas
```

---

## 3. 数据流

```
  src/*/index.js (子应用自动扫描模块)
    │
    ├─ widgets/index.js: import.meta.glob('./**/*.widget.vue', { eager })
    │    → WidgetComponents = { compName: Component }
    │    import.meta.glob('./**/*.widget.js', { eager })
    │    → WidgetMetas = { compName: Meta }
    │
    ├─ apps/index.js: import.meta.glob('./**/*.app.vue', { eager })
    │    → AppComponents = { compName: Component }
    │    import.meta.glob('./**/*.app.js', { eager })
    │    → AppMetas = { compName: Meta }
    │
    ├─ backgrounds/index.js: import.meta.glob('./**/*.bg.js', { eager })
    │    → BackgroundMetas = { name: Meta }
    │
    ├─ components/index.js: import.meta.glob('./**/app-*.vue', { eager })
    │    → Components = { name: Component }
    │
    └─ main.js: 导入所有扫描结果
         └─ $wujie.bus.$emit('plugin:ready', { ... })
              (暴露到主应用事件总线)
```

---

## 4. 与主应用的关系

```
┌──────────────────────┐        ┌──────────────────────┐
│   tpl-desktop (主应用)  │        │ tpl-desktop-plugin-demo (子应用) │
│                      │        │                      │
│  useWujie.js         │ startApp│  main.js +            │
│    ┌──────────────┐  │───────→│    src/*/index.js       │
│    ┌──────────────┐  │───────→│    __WUJIE_MOUNT      │
│    │ setupApp()    │  │        │    __WUJIE_UNMOUNT    │
│    │ startApp()    │  │        │    buildExports()    │
│    │ afterMount    │  │◄──────│    buildComponents()  │
│    │   读取 exports │  │        │                      │
│    └──────────────┘  │        │  widgets/demo/        │
│                      │        │    DemoText / Number  │
│  useWidgetMetas      │        │    DemoImage / Video  │
│  useAppMetas         │        │                      │
│  useBackgroundMetas  │        │  apps/demo/           │
│    ← inject*Metas()  │        │    DemoClock          │
│                      │        │                      │
│  Desktop.vue         │        │  backgrounds/         │
│    Widget 添加面板    │        │    dark/light/video   │
│    App 应用市场       │        │                      │
│    背景选择面板       │        │                      │
└──────────────────────┘        └──────────────────────┘
```

---

## 5. 架构关键决策

### 5.1 元数据与组件统一暴露

子应用通过 wujie 事件总线 `$wujie.bus.$emit('plugin:ready', ...)` 一次性暴露所有元数据和组件定义：
- **元数据**（`widgetMetas`/`appMetas`/`backgroundMetas`）：纯数据对象（`Record<string, Meta>`），轻量可直接 JSON 序列化
- **组件定义**（`widgetComponents`/`appComponents`/`components`）：Vue SFC 编译后的组件对象，由主应用 `app.component()` 全局注册后使用

### 5.2 自动扫描的零维护架构

4 个 `src/*/index.js` 模块通过 `import.meta.glob({ eager: true })` 实现构建时自动扫描，新增任何组件只需放置文件到对应目录，无需修改任何注册代码。文件名约定即契约：
- `*.widget.vue` + `*.widget.js` → Widget
- `*.app.vue` + `*.app.js` → App
- `*.bg.js` → Background
- `app-*.vue` → UI Component

### 5.3 Vite ESM 异步加载桥接

由于 Vite 使用 ESM 模块（`<script type="module">`），脚本加载是异步的。`main.js` 在定义完 `window.__WUJIE_MOUNT` 和 `__WUJIE_UNMOUNT` 后主动调用 `window.__WUJIE.mount()` 通知 wujie 框架脚本已就绪，这是 Vite 子应用的**关键适配步骤**。

### 5.4 统一入口设计

| 入口 | 环境 | `__POWERED_BY_WUJIE__` | 行为 |
|------|------|------------------------|------|
| `index.html` + `main.js` | 独立调试 | `false` | 直接 `createApp(App).mount('#app')` |
| `index.html` + `main.js` | wujie 沙箱 | `true` | 注册生命周期，`bus.emit('plugin:ready')` 暴露组件 |
