# 整体技术方案

> 项目：tpl-desktop-plugin-demo
> 类型：As-Built（基于实际代码实现的技术方案回顾）
> 最后更新：2026-07-21

---

## 1. 技术上下文

### 1.1 运行环境

- **构建时**: Vite 7，使用 `@vitejs/plugin-vue` 编译 Vue SFC，使用 `sass` 编译 SCSS。`import.meta.glob` 的 `{ eager: true }` 模式在模块加载时同步完成背景元数据的自动扫描。
- **运行时**: 浏览器（Vue 3 Composition API）。两种运行模式：
  - **独立调试模式**: `index.html` → `main.js` → `createApp(App).mount('#app')`
  - **wujie 沙箱模式**: `index.html` → `main.js` → 环境判断 → 注册 wujie 生命周期 → 等待主应用激活

### 1.2 依赖清单

| 依赖 | 版本 | 类型 | 用途 |
|------|------|------|------|
| vue | ^3.5.39 | dependencies | 组件框架 |
| dayjs | ^1.11.19 | dependencies | DemoClock 时间格式化 |
| @number-flow/vue | ^0.4.8 | dependencies | DemoNumber 数字动画 |
| vite | ^8.1.4 | devDependencies | 构建工具 |
| @vitejs/plugin-vue | ^6.0.8 | devDependencies | Vue SFC 编译 |
| sass | ^1.101.0 | devDependencies | SCSS 编译 |

> 注：wujie（无界）不作为本子应用的依赖。子应用遵循 wujie 生命周期契约，但 wujie 本身由主应用引入和管理。

### 1.3 Vite 构建配置

```js
// vite.config.js 关键配置
{
  base: '/tpl-desktop-plugin-demo/',          // 生产环境资源路径
  server: {
    port: 5273,                       // 开发服务器端口
    cors: true,                       // 允许主应用跨域访问
    host: '0.0.0.0',                 // 监听所有网络接口
    watch: { usePolling: true },      // 文件系统轮询（Windows 兼容）
  },
}
```

---

## 2. 宪法合规检查

对照 [constitution.md](./constitution.md) 中的 12 条原则逐条检查：

| 条款 | 状态 | 证据 |
|------|------|------|
| 第1条：双入口双模式 | ✅ 合规 | `main.js` L10/36 — 环境判断 + 双分支 |
| 第2条：元数据驱动注册 | ✅ 合规 | 所有 Widget/App/Background 均有配对元数据文件 |
| 第3条：组件响应输入约束 | ✅ 合规 | 所有 .vue 仅使用 defineProps，无外部状态引用 |
| 第4条：属性元数据完整性 | ✅ 合规 | 所有属性声明 title/category/default |
| 第5条：CSS 变量体系 | ✅ 合规 | 所有组件使用 --desktop-* 变量 |
| 第6条：CSS 作用域隔离 | ✅ 合规 | 所有 .vue 使用 scoped lang="scss" |
| 第7条：统一设计模式 | ✅ 合规 | 所有根容器 flex 居中 + 100% 铺满 |
| 第8条：资源清理 | ✅ 合规 | DemoClock: clearInterval / DemoVideo: pause+src+load |
| 第9条：空值优雅降级 | ✅ 合规 | DemoImage/DemoVideo: v-if="value" |
| 第10条：wujie 生命周期 | ✅ 合规 | main.js L11/30/35 |
| 第11条：元数据默认值回退 | ✅ 合规 | 各 index.js 展开 meta + 补充 compName/name |
| 第12条：渐进迁移与兼容 | ✅ 合规 | 命名约定/元数据结构/CSS 变量与主应用一致 |

**异常项**: 无违反项。

---

## 3. 实现策略

### 3.1 main.js 统一入口 + 自动扫描模块架构

`main.js`（40 行）是本子应用的**统一入口文件**，同时处理 wujie 沙箱和独立调试两种模式。组件发现通过 4 个独立的自动扫描模块实现，各司其职：

```
main.js（统一入口 — 40 行）
├─ 导入: Vue createApp + App.vue + 4 个自动扫描模块
│    import { WidgetMetas, WidgetComponents } from './widgets/index.js'
│    import { AppMetas, AppComponents } from './apps/index.js'
│    import { BackgroundMetas } from './backgrounds/index.js'
│    import { Components as UIComponents } from './components/index.js'
│
├─ isWujie=true（沙箱模式）:
│   ├─ window.__WUJIE_MOUNT: createApp → mount('#app')
│   │        → $wujie.bus.$emit('plugin:ready', { pluginName, ... })
│   ├─ window.__WUJIE_UNMOUNT: appInstance?.unmount()
│   └─ window.__WUJIE.mount() — Vite ESM 异步桥接
│
└─ isWujie=false（独立调试模式）:
    └─ createApp(App).mount('#app') → console.log('[plugin] Running standalone')

src/widgets/index.js（~90 行）— Widget 自动扫描
├─ import.meta.glob('./**/*.widget.vue', { eager: true }) → WidgetComponents
├─ import.meta.glob('./**/*.widget.js', { eager: true }) → WidgetMetas
└─ 默认值回退 + 孤儿处理 + 冲突检测

src/apps/index.js（~86 行）— App 自动扫描
├─ import.meta.glob('./**/*.app.vue', { eager: true }) → AppComponents
├─ import.meta.glob('./**/*.app.js', { eager: true }) → AppMetas
└─ 同上健壮性保障

src/backgrounds/index.js（~50 行）— Background 自动扫描
└─ import.meta.glob('./**/*.bg.js', { eager: true }) → BackgroundMetas

src/components/index.js（~19 行）— UI 组件自动扫描
└─ import.meta.glob('./**/app-*.vue', { eager: true }) → Components
```

### 3.2 组件自动扫描设计

所有组件类型均使用 **`import.meta.glob` eager 自动扫描**，无需手动 import：

```js
// src/widgets/index.js — Widget 自动扫描示例
const vueModules = import.meta.glob('./**/*.widget.vue', { eager: true })
const jsModules = import.meta.glob('./**/*.widget.js', { eager: true })

// 从路径提取组件名：'./basic/BasicText.widget.vue' → 'BasicText'
function extractCompName(path) {
  const fileName = path.replace(/^\.\/(.*)\.widget\.(vue|js)$/, '$1')
  return fileName.split('/').pop()
}

// 构建组件字典
for (const [path, module] of Object.entries(vueModules)) {
  const compName = extractCompName(path)
  WidgetComponents[compName] = module.default
}

// 构建元数据字典（含默认值回退）
for (const [path, module] of Object.entries(jsModules)) {
  const compName = extractCompName(path)
  const raw = module.default
  const meta = {
    category: '其他',
    rect: { unit: 'grid', width: 1, height: 1 },
    events: [],
    propsEditors: [],
    wrapperEditors: [],
    ...(typeof raw === 'object' && raw !== null ? raw : {}),
    compName,
  }
  WidgetMetas[compName] = meta
}
```

**设计理由**:
- `{ eager: true }` 确保在模块加载时同步完成扫描，无额外网络请求
- 4 个 `index.js` 模块各自独立，职责单一，可独立测试
- 文件名约定即契约：`*.widget.vue`/`*.app.vue`/`*.bg.js`/`app-*.vue` 自动识别
- 元数据默认值回退 + 孤儿组件处理 + 名称冲突检测 — 三重健壮性保障
- **零手动维护**：新增任何组件只需放置文件到对应目录，无需修改任何注册代码

### 3.3 保活模式单例设计

`__WUJIE_MOUNT` 中通过 `if (!instance)` 门控确保 Vue 实例仅创建一次：

```js
window.__WUJIE_MOUNT = () => {
  if (!instance) {   // 保活模式：已存在则不重建
    instance = createApp({ template: '<div id="plugin-app"></div>' })
    for (const [name, entry] of Object.entries(widgetRegistry)) {
      instance.component(name, entry.component)
    }
    instance.mount('#plugin-root')
  }
  window.$wujie.bus.$emit('plugin:ready', {
    ...all metas and components...
  })   // 每次都更新（确保最新）
}
```

### 3.4 Vite ESM 异步桥接

这是 Vite 子应用的**关键适配点**。由于 `<script type="module">` 是异步加载的，wujie 框架可能在脚本执行完之前就调用了 `__WUJIE_MOUNT`。因此：

```js
// 在所有 __WUJIE_MOUNT 定义完成后，主动通知 wujie 框架
if (window.__WUJIE?.mount) {
  window.__WUJIE.mount()   // 内置去重标记，不会重复执行
}
```

### 3.5 双入口构建策略

Vite 配置使用 `rollupOptions.input` 双入口：

```js
// vite.config.js 单入口配置
build: {
  rollupOptions: {
    input: {
      main: 'index.html',    // 统一入口
    },
  },
}
```

生产构建会生成一套 HTML + JS bundle。主应用通过 `PLUGINS.json` 配置的 `url` 字段加载 `index.html`。

### 3.6 主-子通信机制

子应用通过 wujie 事件总线向主应用暴露组件：

```js
// main.js — wujie 沙箱模式挂载完成后
window.$wujie?.bus.$emit('plugin:ready', {
  pluginName,
  widgetMetas: WidgetMetas,       // Record<string, WidgetMeta>
  widgetComponents: WidgetComponents,  // Record<string, Component>
  appMetas: AppMetas,             // Record<string, AppMeta>
  appComponents: AppComponents,   // Record<string, Component>
  backgroundMetas: BackgroundMetas,   // Record<string, DesktopBackgroundMeta>
  components: UIComponents,       // Record<string, Component>
})
```

主应用通过监听 `plugin:ready` 事件消费子应用暴露的所有组件和元数据。此结构与主应用本地的 WidgetMeta/AppMeta/DesktopBackgroundMeta 完全同构，消费者零改动。

---

## 4. 错误处理策略

| 场景 | 处理方式 | 位置 |
|------|----------|------|
| 非 wujie 环境下访问 `__WUJIE__` | 可选链 `window.__WUJIE?.mount` + `window.$wujie?.bus` | `main.js` |
| `__WUJIE_UNMOUNT` 中 `unmount()` 失败 | 可选链 `appInstance?.unmount()` 安全调用 | `main.js` |
| Widget value 为空 | `v-if="value"` 不渲染元素 | DemoImage/DemoVideo |
| DemoNumber precision 非法 | `Math.trunc + clamp 0~20` 归一化 | `DemoNumber.widget.vue` L24-27 |
| DemoNumber value 非数字 | `parseFloat → Number.isFinite → 回退 0` | `DemoNumber.widget.vue` L31-32 |
| 定时器/视频未清理 | `onBeforeUnmount` 中主动清理 | DemoClock/DemoVideo |

---

## 5. 文件清单

| 文件 | 行数 | 用途 | 模块 |
|------|------|------|------|
| `src/main.js` | 40 | wujie 生命周期适配 ★统一入口 | 001 |
| `src/widgets/index.js` | 89 | Widget 自动扫描注册模块 | 001 |
| `src/apps/index.js` | 86 | App 自动扫描注册模块 | 001 |
| `src/backgrounds/index.js` | 50 | Background 自动扫描注册模块 | 001 |
| `src/components/index.js` | 19 | UI 组件自动扫描注册模块 | 001 |
| `src/App.vue` | 3 | 独立调试根组件（占位） | 001 |
| `index.html` | 12 | 统一 HTML 入口（双模式共用） | 001 |
| `vite.config.js` | 27 | Vite 构建配置 | — |
| `package.json` | 21 | 项目元数据 | — |
| `src/widgets/demo/DemoText.widget.vue` | 28 | 文字 Widget | 002 |
| `src/widgets/demo/DemoText.widget.js` | 26 | 文字 元数据 | 002 |
| `src/widgets/demo/DemoNumber.widget.vue` | 82 | 数字 Widget | 002 |
| `src/widgets/demo/DemoNumber.widget.js` | 41 | 数字 元数据 | 002 |
| `src/widgets/demo/DemoImage.widget.vue` | 36 | 图片 Widget | 002 |
| `src/widgets/demo/DemoImage.widget.js` | 38 | 图片 元数据 | 002 |
| `src/widgets/demo/DemoVideo.widget.vue` | 61 | 视频 Widget | 002 |
| `src/widgets/demo/DemoVideo.widget.js` | 38 | 视频 元数据 | 002 |
| `src/apps/demo/DemoClock.app.vue` | 76 | 时钟 App | 003 |
| `src/apps/demo/DemoClock.app.js` | 31 | 时钟 元数据 | 003 |
| `src/backgrounds/dark/dark-001~004.bg.js` | 4×13 | 暗色背景元数据 | 004 |
| `src/backgrounds/light/light-001~004.bg.js` | 4×13 | 浅色背景元数据 | 004 |
| `src/backgrounds/video/webm-001~004.bg.js` | 4×13 | 视频背景元数据 | 004 |
| 背景资源文件（jpg/webm/缩略图） | 36 个 | 桌面背景素材 | 004 |
