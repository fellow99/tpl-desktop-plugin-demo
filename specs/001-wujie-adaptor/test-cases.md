# 模块 001-wujie-adaptor — 测试用例

> 项目：tpl-desktop-plugin-demo
> 模块：wujie 生命周期适配器
> 关联：`specs/001-wujie-adaptor/spec.md` `specs/001-wujie-adaptor/plan.md`
> 最后更新：2026-07-24

---

## 测试概述

| 属性 | 值 |
|------|-----|
| 测试范围 | `src/main.js` 中的环境检测、生命周期、`$wujie.bus.$emit('plugin:ready', ...)` 事件暴露、ESM 桥接、独立调试回退 |
| 测试类型 | 单元测试（模拟 window 对象）+ 集成测试（完整沙箱模拟） |
| 关联 FR | FR-001-001 ~ FR-001-023 |
| 测试用例数 | 13 |

---

## 测试环境准备

### 前提条件（所有测试）

- Vue 3.5+ 运行时已加载
- `import.meta.glob` 已 polyfill（测试环境可能不支持 Vite 原生 glob）
- window 对象可被测试框架重置/模拟

### 共享 Fixtures

```js
// 模拟 wujie 沙箱环境
function setupWujieSandbox() {
  window.__POWERED_BY_WUJIE__ = true
  window.__WUJIE = { mount: vi.fn() }
  window.$wujie = {
    bus: { $emit: vi.fn() },
    props: { pluginName: 'test-plugin' }
  }
}

// 模拟独立调试环境
function setupStandalone() {
  delete window.__POWERED_BY_WUJIE__
  delete window.__WUJIE
  delete window.$wujie
}

// 模拟插件已挂载
async function setupPluginMounted() {
  setupWujieSandbox()
  await loadPluginModule()          // 触发 main.js 顶层执行
  window.__WUJIE_MOUNT()           // 手动触发挂载
}

// 清理全局状态
function cleanupWindow() {
  delete window.__POWERED_BY_WUJIE__
  delete window.__WUJIE
  delete window.$wujie
  delete window.__WUJIE_MOUNT
  delete window.__WUJIE_UNMOUNT
}
```

---

## 测试用例

### TC-001: 独立调试模式 — 环境检测为 falsy 时加载调试根组件

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-001, FR-001-020, FR-001-021 |
| **优先级** | P0 |
| **前置条件** | `window.__POWERED_BY_WUJIE__` 未定义（独立浏览器环境） |
| **Given** | 子应用在非 wujie 环境下加载 `main.js` |
| **When** | 脚本执行到环境检测分支（`main.js` L36 `else` 块） |
| **Then** | 1. `window.__WUJIE_MOUNT` 未被赋值（undefined） |
|        | 2. `window.__WUJIE_UNMOUNT` 未被赋值（undefined） |
|        | 3. `window.$wujie` 未被设置（undefined） |
|        | 4. `window.$wujie?.bus?.$emit` 不会被调用（`$wujie` 不存在） |
|        | 5. `window.__WUJIE.mount()` **未被调用** |
|        | 6. 通过 `createApp(App)` 直接创建实例并挂载到 `#app` |

### TC-002: 沙箱模式 — 环境检测为 truthy 时注册生命周期

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-001, FR-001-003, FR-001-004 |
| **优先级** | P0 |
| **前置条件** | `window.__POWERED_BY_WUJIE__` 为 true，`window.__WUJIE` 存在，`window.$wujie` 存在 |
| **Given** | 子应用在 wujie 沙箱中加载 `main.js` |
| **When** | 脚本执行到环境检测分支（`main.js` L10 `if (isWujie)` 块） |
| **Then** | 1. `window.__WUJIE_MOUNT` 被赋值为一个函数（L11） |
|        | 2. `window.__WUJIE_UNMOUNT` 被赋值为一个函数（L30） |
|        | 3. `typeof window.__WUJIE_MOUNT === 'function'` 为 true |
|        | 4. `typeof window.__WUJIE_UNMOUNT === 'function'` 为 true |

### TC-003: 沙箱模式首次挂载 — 创建实例、emit 'plugin:ready' 暴露所有组件

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-003, FR-001-005, FR-001-007, FR-001-008, FR-001-010 |
| **优先级** | P0 |
| **前置条件** | 沙箱环境已初始化（含 `window.$wujie.bus.$emit` mock），`main.js` 已加载并注册了 `__WUJIE_MOUNT` |
| **Given** | 子应用生命周期已注册，尚未挂载 |
| **When** | `window.__WUJIE_MOUNT()` 被首次调用 |
| **Then** | 1. Vue 应用实例被创建（`createApp(App)` 被调用） |
|        | 2. 应用挂载到 `#app` DOM 元素 |
|        | 3. `window.$wujie.bus.$emit` 被调用，第一个参数为 `'plugin:ready'` |
|        | 4. 调用次数：恰好 1 次 |
|        | 5. `$emit` 的 payload 中 `.widgets` 无顶层字段（元数据在 `widgetMetas` 中，包含 4 个条目：DemoText, DemoNumber, DemoImage, DemoVideo） |
|        | 6. `$emit` 的 payload 中 `.apps` 无顶层字段（元数据在 `appMetas` 中，包含 1 个条目：DemoClock） |
|        | 7. `$emit` 的 payload 中 `backgroundMetas` 包含 12 个条目 |
|        | 8. `$emit` 的 payload 中 `widgetComponents` 包含 4 个 Vue 组件定义 |
|        | 9. 每个 `widgetMetas` 条目包含 `compName` 字段（如 `'DemoText'`） |
|        | 10. 每个 `backgroundMetas` 条目包含 `name` 字段（如 `'dark-001'`） |

### TC-004: 保活模式 — 重复挂载重建实例并重新 emit

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-005 |
| **优先级** | P0 |
| **前置条件** | 沙箱环境，已首次挂载完成（`appInstance` 已存在） |
| **Given** | `__WUJIE_MOUNT` 已被调用过一次，`appInstance` 不为 null |
| **When** | `window.__WUJIE_MOUNT()` 被再次调用 |
| **Then** | 1. `createApp` **被再次调用**（无 `if (!appInstance)` 门控，每次重建） |
|        | 2. `appInstance.mount('#app')` **被再次调用** |
|        | 3. `window.$wujie.bus.$emit('plugin:ready', ...)` **被再次调用** |
|        | 4. `$emit` 的 payload 结构与首次挂载一致（widgetMetas 4 条, appMetas 1 条, backgroundMetas 12 条） |
|        | 5. `$emit` 被调用次数累计为 2 |

### TC-005: 卸载 — 销毁实例

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-004, FR-001-022, FR-001-023 |
| **优先级** | P0 |
| **前置条件** | 沙箱环境，已挂载完成（`__WUJIE_MOUNT` 已调用） |
| **Given** | 子应用当前处于已挂载状态，`appInstance` 不为 null |
| **When** | `window.__WUJIE_UNMOUNT()` 被调用 |
| **Then** | 1. `appInstance.unmount()` 被调用（销毁 Vue 应用实例，使用可选链 `?.`） |
|        | 2. `appInstance` 被置为 `null`（L32） |
|        | 3. `window.$wujie.bus.$emit` **不被额外调用**（卸载不触发 emit） |
|        | 4. 卸载成功后 `appInstance === null` |

### TC-006: 卸载容错 — appInstance 为 null 时不报错

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-006, NFR-001-004 |
| **优先级** | P1 |
| **前置条件** | 沙箱环境，但 `appInstance` 已被置为 null（模拟异常状态） |
| **Given** | `appInstance === null` |
| **When** | `window.__WUJIE_UNMOUNT()` 被调用 |
| **Then** | 1. `appInstance?.unmount()` 可选链求值为 undefined，**不抛出异常** |
|        | 2. `appInstance` 保持为 `null`（已赋值为 null，再次赋值为 null） |
|        | 3. 无 TypeError 抛出 |
|        | 4. 卸载流程完整执行，未被异常中断 |

### TC-007: 卸载后重新挂载 — 可正常重新创建实例

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-005 |
| **优先级** | P1 |
| **前置条件** | 沙箱环境，已完成：挂载 → 卸载（`appInstance` 已被置为 null） |
| **Given** | 子应用已被成功卸载，`appInstance === null` |
| **When** | `window.__WUJIE_MOUNT()` 被重新调用 |
| **Then** | 1. 重新创建 Vue 实例（`createApp` 被调用） |
|        | 2. 所有行为与首次挂载（TC-003）完全一致 |
|        | 3. `window.$wujie.bus.$emit('plugin:ready', ...)` 被重新调用 |

### TC-008: Vite ESM 异步桥接 — 主动通知框架就绪

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-014, FR-001-015 |
| **优先级** | P0 |
| **前置条件** | 沙箱环境（`__POWERED_BY_WUJIE__` = true），`window.__WUJIE.mount` 是一个 mock 函数 |
| **Given** | `main.js` 脚本正在执行，`__WUJIE_MOUNT` 和 `__WUJIE_UNMOUNT` 已完成定义（L11, L30） |
| **When** | 脚本执行到 L35 的桥接代码 |
| **Then** | 1. `window.__WUJIE.mount` 被调用（无 optional chaining，直接调用 wujie 框架 API） |
|        | 2. 调用时机：在 `__WUJIE_MOUNT` **定义之后**、`__WUJIE_UNMOUNT` **定义之后** |
|        | 3. 调用次数：恰好 1 次 |
|        | 4. 调用发生在 `__WUJIE_MOUNT` 函数体被**调用之前**（仅为通知就绪，不触发挂载） |
|        | 5. `$emit('plugin:ready', ...)` 在桥接时**不被调用**（emit 在 `__WUJIE_MOUNT` 内触发） |

### TC-009: 非沙箱环境 — `window.__WUJIE.mount()` 不被调用

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-014, FR-001-021 |
| **优先级** | P1 |
| **前置条件** | 独立调试环境（`window.__WUJIE` 不存在或为 undefined） |
| **Given** | `__POWERED_BY_WUJIE__` 为 falsy，脚本进入 `else` 分支（L36） |
| **When** | 脚本执行 |
| **Then** | 1. `window.__WUJIE` 为 undefined，不进入 if 分支 |
|        | 2. `window.__WUJIE.mount()` **不被调用**（不在 if 块内） |
|        | 3. 无任何 TypeError 抛出 |
|        | 4. 脚本直接进入独立调试分支（`createApp(App).mount('#app')`） |

### TC-010: emit payload 内容校验 — Widget 条目包含 compName 和完整元数据

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-008 |
| **优先级** | P1 |
| **前置条件** | 沙箱环境，已挂载，`$emit` mock 已捕获调用参数 |
| **Given** | `window.__WUJIE_MOUNT()` 已调用，`$emit('plugin:ready', payload)` 已触发 |
| **When** | 访问 `payload.widgetMetas.DemoText`（emit 的第二个参数的 `widgetMetas` 字段） |
| **Then** | 1. 条目包含 `title: 'Demo文字'`（来自 `DemoText.widget.js`） |
|        | 2. 条目包含 `category: '3.Demo组件'` |
|        | 3. 条目包含 `rect: { unit: 'grid', width: 1, height: 1 }` |
|        | 4. 条目包含 `props` 对象（含 `value` 属性定义） |
|        | 5. 条目包含 `compName: 'DemoText'`（由自动扫描模块补充） |
|        | 6. `events` 字段存在且为 `[]` |
|        | 7. `propsEditors` 字段存在且为 `[]` |
|        | 8. `wrapperEditors` 字段存在且为 `[]` |

### TC-011: Background 自动扫描 — 所有 12 个背景被正确注册

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-009, FR-001-012, FR-001-013 |
| **优先级** | P1 |
| **前置条件** | 沙箱环境，已挂载，`$emit` mock 已捕获调用参数 |
| **Given** | `$emit('plugin:ready', payload)` 已触发，`payload.backgroundMetas` 已设置 |
| **When** | 遍历 `payload.backgroundMetas` 对象的所有条目 |
| **Then** | 1. 条目总数为 12（dark × 4 + light × 4 + webm × 4） |
|        | 2. 存在条目 `dark-001` 且 `meta.name === 'dark-001'` |
|        | 3. 存在条目 `dark-004` 且 `meta.theme === 'dark'`、`meta.type === 'image'` |
|        | 4. 存在条目 `light-001` 且 `meta.theme === 'light'`、`meta.type === 'image'` |
|        | 5. 存在条目 `webm-001` 且 `meta.type === 'video'` |
|        | 6. 每个条目都有 `title`、`category`、`theme`、`type`、`avatar`、`thumbnail` 字段 |
|        | 7. `dark-*` 系列的 `category` 为 `'暗色系'`，`light-*` 为 `'浅色系'`，`webm-*` 为 `'动态背景'` |
|        | 8. 无重复的 `name` 值 |

### TC-012: 统一入口 — index.html 加载 main.js，挂载点 #app

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-016, FR-001-017, FR-001-018, FR-001-019 |
| **优先级** | P1 |
| **前置条件** | Vite 构建已完成（bundle 已生成） |
| **Given** | 生产构建产物中 `dist/index.html` 作为唯一 HTML 入口 |
| **When** | 检查 `index.html` 文件的 `<script>` 引用和 DOM 挂载点 |
| **Then** | 1. `index.html` 包含 `<script type="module" src="/src/main.js">`（或构建后的 chunk） |
|        | 2. `index.html` 包含 `<div id="app">` 作为挂载点 |
|        | 3. `index.html` 是唯一 HTML 入口（不再有独立的 `plugin.html`） |
|        | 4. 同一入口在沙箱模式和独立调试模式下均可正常工作 |
|        | 5. 沙箱模式：`__POWERED_BY_WUJIE__` → 注册生命周期 + emit `plugin:ready` |
|        | 6. 独立调试模式：直接 `createApp(App).mount('#app')` |

### TC-013: 构建产物 — main.js bundle 包含所有注册的组件代码（除 backgrounds）

| 字段 | 内容 |
|------|------|
| **关联 FR** | FR-001-007, FR-001-010, FR-001-012 |
| **优先级** | P2 |
| **前置条件** | Vite 生产构建已完成 |
| **Given** | 检查 `dist/assets/main-*.js` 的 bundle 内容 |
| **When** | 搜索 bundle 中的组件相关字符串 |
| **Then** | 1. bundle 包含 `DemoText`、`DemoNumber`、`DemoImage`、`DemoVideo`、`DemoClock` 字符串（组件注册名） |
|        | 2. bundle 包含 Widget/App 组件的 `.vue` 编译后的 render 函数 |
|        | 3. bundle 包含 Background 元数据（来自 eager glob，但 Background 没有 .vue 文件） |
|        | 4. bundle 包含 `__WUJIE_MOUNT`、`__WUJIE_UNMOUNT`、`'plugin:ready'`、`$emit` 字符串 |
|        | 5. bundle 包含 `__POWERED_BY_WUJIE__` 环境检测逻辑 |

---

## 测试数据矩阵

### 环境检测分支覆盖

| 场景 | `__POWERED_BY_WUJIE__` | `__WUJIE` | `$wujie` | 进入分支 | 预期行为 | TC |
|------|------------------------|-----------|----------|----------|----------|-----|
| 独立浏览器 | `undefined` | `undefined` | `undefined` | `else` (L36) | 直接 `createApp(App).mount('#app')`，不注册生命周期 | TC-001 |
| wujie 沙箱 | `true` | `{ mount: fn }` | `{ bus: { $emit: fn }, props: { pluginName } }` | `if` (L10) | 注册生命周期 + `emit('plugin:ready', ...)` + 主动通知就绪 | TC-002, TC-003, TC-008 |
| wujie 保活重激活 | `true` | `{ mount: fn }` | `{ bus: { $emit: fn }, props: { pluginName } }` | `if` (L10) | 重建实例，重新 emit | TC-004 |

### 生命周期状态转换

```
[未加载] ──加载 main.js──→ [就绪] ──__WUJIE_MOUNT()──→ [已挂载]
                                                              │
                              [未加载] ←──__WUJIE_UNMOUNT()── [已挂载]
                                                              │
                              [就绪] ←──__WUJIE_UNMOUNT()── [已挂载] (appInstance=null)
                                │
                                └──__WUJIE_MOUNT()──→ [已挂载] (重新创建 + emit)
```

### emit payload 结构完整性检查

| emit payload 字段 | 预期条目数 | 每个条目必有字段 | TC |
|------------------|-----------|-----------------|-----|
| `widgetMetas` | 4 | title, category, rect, props, events, propsEditors, wrapperEditors, compName | TC-003, TC-010 |
| `appMetas` | 1 | 同上 | TC-003 |
| `backgroundMetas` | 12 | title, category, theme, type, avatar, thumbnail, name | TC-003, TC-011 |
| `widgetComponents` | 4 | Vue 组件定义对象 | TC-003 |
| `appComponents` | 1 | Vue 组件定义对象 | TC-003 |
| `components` | 不定 | Vue 组件定义对象 | TC-003 |

---

## 已知测试局限

| 局限 | 影响 | 缓解措施 |
|------|------|----------|
| `import.meta.glob` 在 Node 测试环境下不可用 | TC-011 无法直接用 Jest/Vitest 运行 | 使用 Vite 的 `ssrLoadModule` 或在真实 Vite dev server 中运行集成测试 |
| 需要 mock `window.$wujie.bus.$emit` 并验证调用参数 | 所有涉及 emit 的测试 | 使用 `vi.fn()` mock 并在测试中断言 `toHaveBeenCalledWith('plugin:ready', ...)` |
| 需要 mock DOM 挂载点 `#app` | 所有涉及 mount 的测试 | 测试前在 jsdom 中创建 `<div id="app">` 元素 |

---

## 版本历史

| 日期 | 变更 |
|------|------|
| 2026-07-24 | 架构升级：`plugin.js`→`main.js` 统一入口，`__WUJIE_EXPORTS__`/`__WUJIE_COMPONENTS__`→`$wujie.bus.$emit('plugin:ready', ...)`，`#plugin-root`→`#app`，移除双 HTML 入口 |
| 2026-07-21 | 初始版本，13 个测试用例覆盖全部 FR |
