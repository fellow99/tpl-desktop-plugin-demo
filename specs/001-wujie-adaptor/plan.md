# 模块 001-wujie-adaptor — 技术方案

> 项目：tpl-desktop-plugin-demo
> 模块：wujie 生命周期适配器
> 类型：As-Built（基于实际代码实现的技术方案回顾）
> 最后更新：2026-07-24
> 关联：`specs/001-wujie-adaptor/spec.md` `specs/overall-plan.md` §3

---

## 1. 技术上下文

### 1.1 运行环境

- **构建时**: Vite 8.1.4，使用 `@vitejs/plugin-vue` 6.0.8 编译 Vue SFC。四个 `src/*/index.js` 模块通过 `import.meta.glob` 的 `{ eager: true }` 在模块加载时同步完成各目录下组件的自动扫描和注册表构建。
- **运行时**: 浏览器（Vue 3.5.39 Composition API）。唯一入口 `src/main.js`，两种分支：
  - **沙箱模式**: `main.js` L10 `if (window.__POWERED_BY_WUJIE__)` 分支 — 注册 `__WUJIE_MOUNT`/`__WUJIE_UNMOUNT`，通过 `window.$wujie.bus.$emit('plugin:ready', payload)` 向主应用暴露元数据与组件
  - **独立调试模式**: `main.js` L36-39 `else` 分支 — `createApp(App).mount('#app')`
- **HTML 入口**: 单一 `index.html`，挂载点 `<div id="app">`。运行模式由运行时环境（是否在 wujie 沙箱中）决定，不再需要独立 HTML 文件区分。

### 1.2 文件架构总览

```
src/
├── main.js                    ← 唯一生命周期入口（40 行）
├── App.vue                    ← 独立调试/沙箱共用根组件
├── widgets/
│   ├── index.js               ← Widget 自动扫描注册（~89 行）
│   └── demo/                  ← *.widget.vue + *.widget.js 组件文件对
├── apps/
│   ├── index.js               ← App 自动扫描注册（~86 行）
│   └── demo/                  ← *.app.vue + *.app.js 组件文件对
├── backgrounds/
│   ├── index.js               ← Background 自动扫描注册（~50 行）
│   └── dark|light|video/      ← *.bg.js 元数据文件
└── components/
    └── index.js               ← UI 组件自动扫描注册（~19 行）
```

### 1.3 依赖清单（本模块涉及）

| 依赖 | 版本 | 用途 | 使用位置 |
|------|------|------|----------|
| vue | ^3.5.39 | `createApp` | `src/main.js` L1, L12, L37 |
| vite | ^8.1.4 | `import.meta.glob` (eager) | `src/widgets/index.js` L24-25; `src/apps/index.js` L24-25; `src/backgrounds/index.js` L18; `src/components/index.js` L4 |

> 注：wujie 不作为本子应用的依赖。子应用遵循 wujie 生命周期契约，wujie 本身由主应用（tpl-desktop）引入和管理。

### 1.4 关联的 spec.md FR-ID 映射

| spec.md FR | 本模块对应实现 |
|------------|----------------|
| FR-001-001 | `main.js` L10: `if (window.__POWERED_BY_WUJIE__)` |
| FR-001-002 | 环境判断位于 import 语句之后、分支逻辑之前（L10, L36） |
| FR-001-003 | `main.js` L11-28: `window.__WUJIE_MOUNT` 赋值 |
| FR-001-004 | `main.js` L30-33: `window.__WUJIE_UNMOUNT` 赋值 |
| FR-001-005 | `main.js` L12: 每次 mount 均创建新 app 实例（与保活模式的差异见 §3.3） |
| FR-001-006 | `main.js` L31: 可选链 `appInstance?.unmount()` 安全卸载 |
| FR-001-007 | `widgets/index.js` L44-69 + `apps/index.js` L44-69 + `backgrounds/index.js` L27-49 — 各模块独立构建元数据字典 |
| FR-001-008 | `widgets/index.js` L56-64 / `apps/index.js` L56-63: `{ ...raw, compName }` 补充 compName |
| FR-001-009 | `backgrounds/index.js` L39-43: `{ ...raw, name }` 补充 name |
| FR-001-010 | `widgets/index.js` L34-41 + `apps/index.js` L34-41 — 各模块独立构建组件字典 |
| FR-001-011 | `widgets/index.js` L34-86 + `apps/index.js` L34-85 |
| FR-001-012 | 四个 `src/*/index.js`: 全部使用 `import.meta.glob`（零静态 import） |
| FR-001-013 | `widgets/index.js` L28-31, `apps/index.js` L28-31, `backgrounds/index.js` L21-24 — 路径提取逻辑 |
| FR-001-014 | `main.js` L35: `window.__WUJIE.mount()` 主动通知就绪 |
| FR-001-015 | `main.js` L35 紧随 L11-33 生命周期注册 |
| FR-001-016 | `index.html` L10: 单一 `<script type="module" src="/src/main.js">` |
| FR-001-017 | `index.html` L9: `<div id="app">`（沙箱与独立调试共享同一挂载点） |
| FR-001-018 | `index.html` L9: `<div id="app">` |
| FR-001-019 | `index.html` L10: 单入口脚本 |
| FR-001-020 | `main.js` L36-39: `else` 分支 |
| FR-001-021 | `main.js` L36-39 不触碰任何 `__WUJIE_*` |
| FR-001-022 | `main.js` L30-33: `__WUJIE_UNMOUNT` 中 `appInstance?.unmount()` + `appInstance = null` |
| FR-001-023 | `main.js` L27: `console.log('[pluginName] Plugin ready...')` |

---

## 2. 宪法合规检查

对照 `specs/constitution.md` 中的 12 条原则，逐条检查模块 001 的合规情况：

| # | 原则 | 合规 | 证据（本模块） |
|---|------|------|----------------|
| 1 | 双入口双模式运行 | ✅ | `main.js` L10 环境判断 + L10/36 双分支，单入口双模式 |
| 2 | 元数据驱动的组件注册 | — | 本模块消费和暴露元数据（通过 auto-scanning 构建注册表），不产生元数据。合规在模块 002/003/004 中体现 |
| 3 | 组件响应输入约束 | — | 不涉及组件实现 |
| 4 | 属性元数据完整性 | — | 不涉及属性定义 |
| 5 | CSS 变量体系 | — | 不涉及组件样式 |
| 6 | CSS 作用域隔离 | — | 不涉及组件样式 |
| 7 | 统一设计模式 | — | 不涉及组件布局 |
| 8 | 资源清理 | ✅ | `main.js` L30-33: `__WUJIE_UNMOUNT` 中 `appInstance?.unmount()` + `appInstance = null` |
| 9 | 空值优雅降级 | — | 不涉及资源型组件 |
| 10 | wujie 生命周期契约 | ✅ | `main.js` L11 `__WUJIE_MOUNT`、L30 `__WUJIE_UNMOUNT`、L35 `window.__WUJIE.mount()` |
| 11 | 元数据默认值回退 | ✅ | 各 `index.js` 均实现默认值回退：`widgets/` L56-64（rect: 1×1）、`apps/` L56-63（rect: 4×3）、`backgrounds/` L39-43（type:'image'）、孤儿组件自动补全 |
| 12 | 渐进迁移与兼容 | ✅ | 沿用 `*.widget.vue` / `*.widget.js` / `*.app.vue` / `*.app.js` / `*.bg.js` 命名约定；bus event 暴露的结构与主应用 WidgetMeta/AppMeta 同构 |

**结论**: 模块 001 在涉及的所有宪法原则中均合规，无违反项。

---

## 3. 关键决策

### 3.1 决策 1: 统一入口设计（单一 `index.html` + 单一 `main.js`）

**选择**: 使用一个 HTML 文件和一个 JS 入口，通过运行时环境检测自动切换沙箱/独立调试模式，替代原先的 `index.html`+`main.js` 和 `plugin.html`+`plugin.js` 双入口方案。

**替代方案及评估**:

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| 统一入口 + 分支（当前） | 入口单一，无重复代码；构建产物唯一；挂载点统一为 `#app` | 沙箱和调试共用入口，需确保环境检测在所有 import 之后 | ✅ 采用 |
| 双入口 + 双 JS（旧方案） | 入口隔离清晰 | 需维护两个 HTML + 两个 JS；构建产物两套；存在重复逻辑 | ❌ 已弃用 |
| 动态路由模式 | 类似 SPA router | 需要额外的路由库；引入不必要的复杂度 | ❌ 不采用 |

**实现**:
- `index.html` L10: `<script type="module" src="/src/main.js">` — 唯一入口
- `main.js` L10: `if (window.__POWERED_BY_WUJIE__)` — 沙箱分支
- `main.js` L36: `else` — 独立调试分支
- `vite.config.js` L21-23: `rollupOptions.input: { main: 'index.html' }` — 单入口构建
- 挂载点统一为 `<div id="app">`（`index.html` L9）

**设计意图**: 沙箱和独立调试的核心区别仅在于"是否向主应用暴露组件"，因此将两模式合并到同一文件，通过条件分支区分运行时行为。`import.meta.glob` 的 eager 模式确保组件注册表在生命周期函数注册前已构建完成，消除异步竞态。

### 3.2 决策 2: Vite ESM 异步桥接（`window.__WUJIE.mount()` 主动调用）

**背景**: `<script type="module">` 是异步加载的。wujie 框架可能在 `main.js` 脚本执行完之前就尝试调用 `__WUJIE_MOUNT`，导致函数未定义。

**选择**: 在 `__WUJIE_MOUNT` 定义完成后，主动调用 `window.__WUJIE.mount()` 通知框架就绪。

**实现** (`main.js` L35):
```js
window.__WUJIE.mount()  // wujie 内部有去重标记，不会重复执行
```

**关键细节**:
- 直接调用 `window.__WUJIE.mount()`（无条件），因为此语句仅在 `if (window.__POWERED_BY_WUJIE__)` 分支内执行，确保 `window.__WUJIE` 一定存在
- 此调用放在 wujie 分支末尾，确保所有生命周期函数已定义且 ESM 模块已加载完毕
- wujie 框架内部维护去重标记，即使 `__WUJIE_MOUNT` 已定义后框架又尝试调用，也不会重复执行

### 3.3 决策 3: 每次 mount 重建实例（非保活单例）

**背景**: 原 `plugin.js` 方案使用 `let instance = null` 闭包变量 + `if (!instance)` 单例门控，适配主应用 `alive: true` 配置。重构后简化为每次 mount 均创建新实例。

**选择**: 使用 `let appInstance = null`（`main.js` L8）+ 每次 `__WUJIE_MOUNT` 中 `appInstance = createApp(App)` 无条件创建新实例（L12）。

**实现** (`main.js` L8-33):
```js
let appInstance = null  // L8: 模块级变量

window.__WUJIE_MOUNT = () => {
  appInstance = createApp(App)       // L12: 无条件创建
  appInstance.mount('#app')           // L13
  // ... emit plugin:ready event ...  // L17-25
}

window.__WUJIE_UNMOUNT = () => {
  appInstance?.unmount()              // L31: 安全卸载
  appInstance = null                  // L32
}
```

**设计意图**: 由于子应用的所有组件注册信息已通过 `plugin:ready` bus event 暴露给主应用（而非通过 `window.__WUJIE_COMPONENTS__` 全局变量），每次 mount 重建实例不影响主应用的组件注册。此设计简化了生命周期管理，避免保活模式下的状态残留。

### 3.4 决策 4: 统一 `import.meta.glob` 自动扫描（零静态 import）

**选择**: Widget、App、Background、UI Components 四大类全部使用 `import.meta.glob` 自动扫描，完全消除静态 import 语句。

**对比旧方案**:

| 类别 | 旧方案（plugin.js） | 新方案（main.js + 4 个 index.js） | 理由 |
|------|-------------------|----------------------------------|------|
| Widget | 静态 import × 4 | `widgets/index.js` glob 扫描 | 零手动维护、新增组件自动发现 |
| App | 静态 import × 1 | `apps/index.js` glob 扫描 | 同上 |
| Background | `import.meta.glob` | `backgrounds/index.js` glob 扫描 | 保持不变 |
| UI Components | 不存在 | `components/index.js` glob 扫描 | 新增自动发现 |

**各模块实现细节**:

**`src/widgets/index.js`** (~89 lines):
```js
const vueModules = import.meta.glob('./**/*.widget.vue', { eager: true })  // L24
const jsModules = import.meta.glob('./**/*.widget.js', { eager: true })    // L25
// extractCompName(): './demo/DemoText.widget.vue' → 'DemoText'            // L28-31
// WidgetComponents: compName → Vue 组件                                  // L34-41
// WidgetMetas: compName → WidgetMeta（含默认值回退 + compName 注入）     // L44-69
// 孤儿 .widget.vue 自动补全默认元数据                                    // L73-86
```
- 默认 rect: `{ unit:'grid', width:1, height:1 }`
- 健壮性: 同名冲突 warn+覆盖、缺失 .widget.js 孤儿默认值、default 导出非对象降级
- 导出: `WidgetMetas`, `WidgetComponents`, `Components`（别名，兼容主应用 `app.component()` 注册）

**`src/apps/index.js`** (~86 lines):
```js
const vueModules = import.meta.glob('./**/*.app.vue', { eager: true })  // L24
const jsModules = import.meta.glob('./**/*.app.js', { eager: true })    // L25
```
- 默认 rect: `{ unit:'grid', width:4, height:3 }`
- 结构、健壮性、提取逻辑与 `widgets/index.js` 对等
- 导出: `AppMetas`, `AppComponents`

**`src/backgrounds/index.js`** (~50 lines):
```js
const bgModules = import.meta.glob('./**/*.bg.js', { eager: true })  // L18
// extractBgName(): './dark/dark-001.bg.js' → 'dark-001'             // L21-24
```
- 默认值: `category:'其他'`, `type:'image'`
- 非对象 default 导出 → `continue`（跳过该条目）
- 导出: `BackgroundMetas`

**`src/components/index.js`** (~19 lines):
```js
const componentModules = import.meta.glob('./**/app-*.vue', { eager: true })  // L4
// 文件名提取: 'app-something.vue' → 'app-something'                          // L15-16
// 验证组件有效性: comp.render || comp.setup || comp.name                     // L14
```
- 导出: `Components`

**统一 benefits**:
- **零手动维护**: 新增任何组件仅需放置 `.vue` + `.js` 文件对到对应目录，无需修改任何注册代码
- **一致性**: 四类组件使用相同的 eager glob 模式，行为可预期
- **按需拆分**: 各 `index.js` 模块独立、职责单一，`main.js` 仅负责聚合和生命周期

---

## 4. 数据模型

### 4.1 内部数据结构

#### WidgetMetas / WidgetComponents

```typescript
// src/widgets/index.js L34-86 — import.meta.glob 自动构建
// WidgetComponents: Record<string, Component>
//   glob 扫描所有 .widget.vue，提取 compName → Vue SFC default export
//   实例: { DemoText: DemoTextVue, DemoNumber: DemoNumberVue, ... }

// WidgetMetas: Record<string, WidgetMeta>
//   glob 扫描所有 .widget.js，提取 compName → 含默认值回退的元数据对象
//   默认值: category:'其他', rect:{unit:'grid',width:1,height:1}, events:[], propsEditors:[], wrapperEditors:[]
//   compName 由本模块自动注入
//   实例: { DemoText: { title:'演示文本', category:'演示', rect:{...}, compName:'DemoText', ... } }
```

#### AppMetas / AppComponents

```typescript
// src/apps/index.js L34-85 — 与 widgets 对等的结构
// AppComponents: Record<string, Component>
// AppMetas: Record<string, AppMeta>
//   默认 rect: { unit:'grid', width:4, height:3 }
//   实例: { DemoClock: { title:'演示时钟', category:'演示', rect:{...}, compName:'DemoClock', ... } }
```

#### BackgroundMetas

```typescript
// src/backgrounds/index.js L27-49 — import.meta.glob 自动构建
// BackgroundMetas: Record<string, DesktopBackgroundMeta>
//   默认值: category:'其他', type:'image'
//   name 由本模块自动注入
//   实例: { 'dark-001': { title:'暗色背景01', category:'暗色系', type:'image', name:'dark-001', ... } }
```

#### Components (UI)

```typescript
// src/components/index.js L9-18 — import.meta.glob 自动构建
// Components: Record<string, Component>
//   扫描 app-*.vue，提取文件名 → Vue SFC
//   实例: { 'app-modal': ModalVue, 'app-toolbar': ToolbarVue, ... }
```

### 4.2 对外暴露的数据结构

#### `plugin:ready` Bus Event Payload

```typescript
// main.js L17-25 — 通过 window.$wujie.bus.$emit 发送
interface PluginReadyPayload {
  pluginName: string                         // 插件名（来自 window.$wujie.props.pluginName）
  widgetMetas: Record<string, WidgetMeta>    // → 主应用注册组件元数据
  widgetComponents: Record<string, Component> // → 主应用 app.component(name, comp)
  appMetas: Record<string, AppMeta>          // → 主应用注册 App 元数据
  appComponents: Record<string, Component>   // → 主应用 app.component(name, comp)
  backgroundMetas: Record<string, DesktopBackgroundMeta>  // → 主应用注册背景
  components: Record<string, Component>      // → 主应用注册 UI 辅助组件
}
```

### 4.3 实例变量

```typescript
// main.js L8 — 模块级变量，在 __WUJIE_MOUNT / __WUJIE_UNMOUNT 中读写
let appInstance: App<Element> | null = null
```

---

## 5. 接口契约

### 5.1 子应用 → 主应用（暴露）

| 接口 | 类型 | 设置位置 | 消费侧 |
|------|------|----------|--------|
| `window.$wujie.bus.$emit('plugin:ready', payload)` | wujie 事件总线 | `main.js` L17-25 | 主应用监听 `plugin:ready` 事件，解包 payload 注册组件/元数据/背景 |

**Payload 字段**:
| 字段 | 来源 | 用途 |
|------|------|------|
| `pluginName` | `window.$wujie.props.pluginName` | 插件标识 |
| `widgetMetas` | `widgets/index.js` → `WidgetMetas` | Widget 元数据字典 |
| `widgetComponents` | `widgets/index.js` → `WidgetComponents` | Widget Vue 组件字典 |
| `appMetas` | `apps/index.js` → `AppMetas` | App 元数据字典 |
| `appComponents` | `apps/index.js` → `AppComponents` | App Vue 组件字典 |
| `backgroundMetas` | `backgrounds/index.js` → `BackgroundMetas` | 背景元数据字典 |
| `components` | `components/index.js` → `Components` | UI 辅助组件字典 |

### 5.2 wujie 框架 → 子应用（调用）

| 接口 | 签名 | 实现位置 | 行为摘要 |
|------|------|----------|----------|
| `window.__WUJIE_MOUNT` | `() => void` | `main.js` L11-28 | 创建 app 实例 → mount('#app') → emit plugin:ready → log |
| `window.__WUJIE_UNMOUNT` | `() => void` | `main.js` L30-33 | `appInstance?.unmount()` → `appInstance = null` |

### 5.3 子应用 → wujie 框架（主动调用）

| 接口 | 调用位置 | 用途 |
|------|------|------|
| `window.__WUJIE.mount()` | `main.js` L35 | 通知框架 ESM 模块加载完毕，可安全调用 `__WUJIE_MOUNT` |

### 5.4 wujie 框架 → 子应用（注入）

| 接口 | 类型 | 读取位置 | 用途 |
|------|------|----------|------|
| `window.__POWERED_BY_WUJIE__` | `boolean\|undefined` | `main.js` L10 | 环境检测 |
| `window.__WUJIE` | `object\|undefined` | `main.js` L35 | 沙箱实例引用（仅调 `.mount()`） |
| `window.$wujie.bus` | `object\|undefined` | `main.js` L17 | wujie 事件总线（emit plugin:ready） |
| `window.$wujie.props` | `object\|undefined` | `main.js` L15 | 主应用传入的 props（pluginName） |

### 5.5 已废弃的接口

| 旧接口 | 废弃原因 |
|--------|----------|
| `window.__WUJIE_EXPORTS__` | 改为 `plugin:ready` bus event 中 `widgetMetas`/`appMetas`/`backgroundMetas` 字段 |
| `window.__WUJIE_COMPONENTS__` | 改为 `plugin:ready` bus event 中 `widgetComponents`/`appComponents`/`components` 字段 |
| `plugin.html` + `plugin.js` | 统一到 `index.html` + `main.js` 单入口 |
| `src/plugin.js` `buildExports()` / `buildComponents()` | 职责下沉到各 `src/*/index.js` 自动扫描模块 |

---

## 6. 实现策略

### 6.1 核心架构分解

`src/main.js`（40 行）是本模块的**唯一生命周期入口**。四个 `src/*/index.js` 作为**预先加载的构建模块**，在 import 时通过 eager glob 完成所有组件注册表的构建。

```
src/main.js (40 行) — 唯一生命周期入口
│
├─ [L1-6]   import 聚合 ────────────────────────────────
│   ├─ L1:  createApp from 'vue'
│   ├─ L2:  App.vue (共用根组件)
│   ├─ L3:  WidgetMetas, WidgetComponents from './widgets/index.js'
│   ├─ L4:  AppMetas, AppComponents from './apps/index.js'
│   ├─ L5:  BackgroundMetas from './backgrounds/index.js'
│   └─ L6:  Components as UIComponents from './components/index.js'
│
├─ [L8]     实例变量: let appInstance = null
│
├─ [L10-35] isWujie = true — 沙箱模式
│   ├─ L11-28:  window.__WUJIE_MOUNT
│   │   ├─ L12:    appInstance = createApp(App)  [每次重建]
│   │   ├─ L13:    appInstance.mount('#app')
│   │   ├─ L15:    pluginName = window.$wujie?.props?.pluginName
│   │   ├─ L17-25: window.$wujie?.bus.$emit('plugin:ready', {...})
│   │   └─ L27:    console.log 统计输出
│   ├─ L30-33:  window.__WUJIE_UNMOUNT
│   │   ├─ L31:    appInstance?.unmount()
│   │   └─ L32:    appInstance = null
│   └─ L35:     window.__WUJIE.mount()  [主动通知就绪]
│
└─ [L36-39] isWujie = false — 独立调试模式
    ├─ L37:   appInstance = createApp(App)
    ├─ L38:   appInstance.mount('#app')
    └─ L39:   console.log('[plugin] Running standalone')

src/widgets/index.js (~89 行) — Widget 自动扫描
│
├─ L24-25: import.meta.glob (eager) × 2 (.widget.vue + .widget.js)
├─ L28-31: extractCompName() 路径→组件名
├─ L34-41: WidgetComponents 字典构建
├─ L44-69: WidgetMetas 字典构建（含默认值回退 + compName 注入）
├─ L73-86: 孤儿 .vue 默认元数据补全
└─ L89:    Components 别名导出

src/apps/index.js (~86 行) — App 自动扫描
│
├─ L24-25: import.meta.glob (eager) × 2 (.app.vue + .app.js)
├─ L28-31: extractCompName()
├─ L34-41: AppComponents 字典构建
├─ L44-69: AppMetas 字典构建（含默认值回退 + compName 注入）
└─ L72-85: 孤儿 .vue 默认元数据补全

src/backgrounds/index.js (~50 行) — Background 自动扫描
│
├─ L18:    import.meta.glob (eager) × 1 (.bg.js)
├─ L21-24: extractBgName() 路径→背景名
└─ L27-49: BackgroundMetas 字典构建（含默认值回退 + name 注入）

src/components/index.js (~19 行) — UI 组件自动扫描
│
├─ L4:     import.meta.glob (eager) × 1 (app-*.vue)
└─ L11-18: Components 字典构建（含有效性验证）
```

### 6.2 数据流

```
[组件文件]              [src/*/index.js]               [src/main.js]            [主应用]
                                                                                    
.widget.vue  ──glob──→ WidgetComponents ──import──┐                              
.widget.js   ──glob──→ WidgetMetas      ──import──┤                              
                                                   │                              
.app.vue     ──glob──→ AppComponents    ──import──┤                              
.app.js      ──glob──→ AppMetas         ──import──┼──→ __WUJIE_MOUNT ──→ $emit('plugin:ready', {
                                                   │        │                   widgetMetas,
.bg.js × 12  ──glob──→ BackgroundMetas  ──import──┤        │                   widgetComponents,
                                                   │        │                   appMetas,
app-*.vue    ──glob──→ Components        ──import──┘        │                   appComponents,
                                                             │                   backgroundMetas,
                              window.__WUJIE.mount() ←──────┘                   components
                                                                                })
                                                                                      │
                                                                                      ▼
                                                                              主应用解包注册:
                                                                              app.component(name, comp)
                                                                              injectMetas(widgetMetas)
                                                                              ...
```

### 6.3 错误处理策略

| 场景 | 处理方式 | 位置 | 对应 FR |
|------|----------|------|---------|
| `__WUJIE_UNMOUNT` 时 `app.unmount()` 失败 | 可选链 `appInstance?.unmount()` 静默处理 | `main.js` L31 | FR-001-006 |
| Widget/App glob 扫描同名冲突 | `console.warn` + 后定义覆盖先定义 | `widgets/index.js` L37-39; `apps/index.js` L37-39 | — |
| Widget/App 缺少 .js 元数据文件（孤儿） | `console.warn` + 自动补全默认元数据 | `widgets/index.js` L73-86; `apps/index.js` L72-85 | — |
| Widget/App .js default 导出非对象 | `console.warn` + 降级为空对象 | `widgets/index.js` L52-55; `apps/index.js` L52-55 | — |
| Background .js default 导出非对象 | `console.warn` + `continue`（跳过该条目） | `backgrounds/index.js` L34-38 | — |
| Background glob 同名冲突 | `console.warn` + 后定义覆盖先定义 | `backgrounds/index.js` L30-32 | — |
| UI 组件无效（无 render/setup/name） | 静默跳过 | `components/index.js` L14 | — |
| `window.$wujie.bus` 不存在 | 可选链 `?.bus.$emit` 静默跳过 | `main.js` L17 | — |

### 6.4 构建配置

```js
// vite.config.js L19-25: 简化的单入口配置
build: {
  rollupOptions: {
    input: {
      main: 'index.html',  // 唯一入口
    },
  },
}
```

**与旧方案对比**:
- **旧**: 双入口 `main: 'index.html'` + `plugin: 'plugin.html'` → 两套 bundle
- **新**: 单入口 `main: 'index.html'` → 一套 bundle，运行时环境检测决定行为

生产构建产物路径：
- `dist/index.html` + `dist/assets/main-*.js` — 同时支持独立调试和 wujie 沙箱

---

## 7. 文件清单

| 文件 | 行数 | 用途 | 对应 FR |
|------|------|------|---------|
| `src/main.js` | 40 | **核心**：唯一生命周期入口，双模式分支 + `plugin:ready` bus event 暴露 | FR-001-001~006, FR-001-014~015, FR-001-020~023 |
| `src/widgets/index.js` | 89 | Widget 自动扫描注册：`import.meta.glob` → `WidgetMetas` + `WidgetComponents` | FR-001-007~008, FR-001-010~013 |
| `src/apps/index.js` | 86 | App 自动扫描注册：`import.meta.glob` → `AppMetas` + `AppComponents` | FR-001-007~008, FR-001-010~013 |
| `src/backgrounds/index.js` | 50 | Background 自动扫描注册：`import.meta.glob` → `BackgroundMetas` | FR-001-007, FR-001-009, FR-001-011~013 |
| `src/components/index.js` | 19 | UI 组件自动扫描注册：`import.meta.glob` → `Components` | FR-001-010, FR-001-012 |
| `src/App.vue` | ~3 | 独立调试/沙箱共用根组件（占位） | FR-001-020 |
| `index.html` | 12 | 单一 HTML 入口（挂载点 `#app`） | FR-001-016~019 |
| `vite.config.js` | 26 | Vite 构建配置（单入口 + CORS + 端口） | 基础设施 |

**代码统计**:
- 模块 001 总代码：~322 行（含四个 `src/*/index.js` 自动扫描模块）
- 核心生命周期逻辑：`main.js` 中 ~35 行（沙箱分支 L10-35 + 独立调试 L36-39）
- 自动扫描/注册表构建：~244 行（widgets 89 + apps 86 + backgrounds 50 + components 19）
- 与旧方案对比：从 2 个入口文件（171+5=176 行）增长到 5 个模块化文件（40+89+86+50+19=284 行），原因是将原本混杂在 `plugin.js` 中的注册表构建逻辑按组件类别拆分为独立模块

**已删除的文件**:

| 文件 | 删除原因 |
|------|----------|
| `plugin.html` | 统一到 `index.html` 单入口 |
| `src/plugin.js` | 职责拆分到 `src/main.js` + 四个 `src/*/index.js` |

---

## 8. 与整体方案的交叉引用

| 整体方案章节 | 模块 001 关联点 |
|-------------|----------------|
| overall-spec.md §3.1 | wujie 生命周期适配（FR-001~006）— 全部由本模块实现 |
| overall-spec.md §3.2 | 组件元数据暴露（FR-010~014）— 全部由本模块实现，方式改为 `plugin:ready` bus event |
| overall-spec.md §3.8 | Background 自动扫描（FR-070~072）— FR-072 的 glob 部分由 `backgrounds/index.js` 实现 |
| overall-plan.md §3.1 | 统一入口架构 — `main.js` + 四个 `index.js` 自动扫描模块 |
| overall-plan.md §3.3 | 每次 mount 重建实例 — `main.js` L12 无条件 createApp |
| overall-plan.md §3.4 | Vite ESM 异步桥接 — `main.js` L35 `window.__WUJIE.mount()` |
| overall-plan.md §3.5 | 单入口构建策略 — 统一 `index.html` 入口，运行时环境检测 |
| overall-api.md §2~5 | 所有接口契约 — 本模块是实现方 |
| overall-data-model.md §1.5~1.7 | 注册表 / WidgetMeta / AppMeta / DesktopBackgroundMeta — 本模块定义并构建 |
| constitution.md §1, §8, §10, §11, §12 | 本模块直接关联的宪法原则 |

---

## 9. 版本历史

| 日期 | 变更 |
|------|------|
| 2026-07-24 | **架构重构 v2**：统一入口（`index.html` + `main.js`）、四类组件统一 `import.meta.glob` 自动扫描、`plugin:ready` bus event 替代 `window.__WUJIE_EXPORTS__`/`__WUJIE_COMPONENTS__`、删除 `plugin.html`/`plugin.js`、新增 `src/widgets|apps|backgrounds|components/index.js` 四个自动扫描模块 |
| 2026-07-21 | 初始版本，基于已实现代码提取（双入口 `index.html`+`plugin.html` / `main.js`+`plugin.js`、静态 import + glob 混合、`window.__WUJIE_EXPORTS__`/`__WUJIE_COMPONENTS__` 全局变量） |
