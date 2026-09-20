# 宪法原则

> 项目：tpl-desktop-plugin-demo
> 类型：As-Built（描述性 — 基于代码实际遵循的原则）
> 最后更新：2026-07-21

---

## 第 1 条：双入口双模式运行

**原则**：子应用 MUST 同时支持独立调试模式和 wujie 沙箱模式，两种模式通过 `window.__POWERED_BY_WUJIE__` 环境标识在 `main.js` 统一入口中自动切换。

**证据**：
- `main.js` 第 10 行：`if (window.__POWERED_BY_WUJIE__)`
- `main.js` 第 36 行：`else` 分支执行独立调试逻辑
- `main.js` 统一处理双模式，无需多入口

---

## 第 2 条：元数据驱动的组件注册

**原则**：每个 Widget/App 组件 MUST 配对一个 `.widget.js`/`.app.js` 元数据文件，声明 `title`、`category`、`rect`、`props`、`events`、`propsEditors`、`wrapperEditors` 完整字段。Background 使用 `.bg.js` 文件声明元数据。

**证据**：
- `DemoText.widget.js`、`DemoNumber.widget.js`：完整的 props/category/rect 等字段
- `DemoClock.app.js`：category 'Demo应用'、rect 3×3
- `dark-001.bg.js`：title/category/theme/type/avatar/thumbnail/image 完整声明

---

## 第 3 条：组件响应输入约束（C-02）

**原则**：组件 MUST 通过 `defineProps` 显式声明所有可配置属性，运行时 MUST 仅消费 `props` 对象中的值，不得依赖任何外部全局状态（如 `useGridStack`、`desktopConfig`、`localStorage`）。Widget/App 组件行为由 props 单方面控制，编辑器是唯一的 props 写入者。

**证据**：
- 所有 `.widget.vue` 和 `.app.vue` 文件均使用 `defineProps({ ... })` 声明属性
- 无任何组件 import composables（useGridStack 等）
- 无任何组件访问 localStorage 或全局状态

---

## 第 4 条：属性元数据完整性（C-03）

**原则**：每个组件属性在元数据中 MUST 声明 `title`（中文标签）、`category`（分类）、`default`（默认值），可选声明 `type`（数据类型，默认 'text'）、`options`（下拉选项）。

**证据**：
- `DemoNumber.widget.js` 第 14-35 行：value/precision/title/unit 均有完整 title/category/type/default
- `DemoImage.widget.js` 第 20-26 行：objectFit 使用 `type: 'select'` + `options` 数组

---

## 第 5 条：CSS 变量体系

**原则**：组件样式 MUST 使用 CSS 自定义属性（`--desktop-*`）引用颜色/尺寸等主题相关值，不得硬编码色值。在 wujie 沙箱模式下，主应用的 CSS 变量通过 CSS 沙箱自动继承到子应用 iframe 内。

**证据**：
- `DemoText.widget.vue` 第 26 行：`color: var(--desktop-text-primary)`
- `DemoNumber.widget.vue` 第 59/66/72 行：`var(--desktop-text-primary)` / `var(--desktop-text-secondary)`
- `DemoClock.app.vue` 第 62/74 行：`var(--desktop-text-primary)` / `var(--desktop-text-secondary)`

---

## 第 6 条：CSS 作用域隔离

**原则**：所有组件样式 MUST 使用 `<style scoped lang="scss">`，确保样式仅作用于当前组件。根容器 class 使用组件名（PascalCase）作为顶级选择器。

**证据**：
- 所有 `.vue` 文件均使用 `<style scoped lang="scss">`
- `DemoText` 根容器 `class="DemoText"`、`DemoNumber` 根容器 `class="DemoNumber"`

---

## 第 7 条：统一设计模式

**原则**：Widget/App 组件的根容器 MUST 使用 flex 布局居中内容，铺满父容器（`width:100%; height:100%`），形成统一的视觉外观。

**证据**：
- `DemoText.widget.vue` 第 21-24 行：`display:flex; align-items:center; justify-content:center; width:100%; height:100%`
- `DemoNumber.widget.vue` 第 54-58 行：同上模式
- `DemoImage.widget.vue` 第 25-28 行：同上模式（加 `overflow:hidden`）

---

## 第 8 条：资源清理（NFR-003）

**原则**：涉及定时器/视频等资源的组件 MUST 在卸载时清理资源（`onBeforeUnmount` 中 `clearInterval` / `pause()` + `src=''` + `load()`），防止内存泄漏。

**证据**：
- `DemoClock.app.vue` 第 37-42 行：`clearInterval(timer)`
- `DemoVideo.widget.vue` 第 22-28 行：`video.pause(); video.src=''; video.load()`

---

## 第 9 条：空值优雅降级

**原则**：资源型组件（图片/视频）在 `value` 为空时 MUST 不渲染对应元素，显示空白容器而非破损占位符。

**证据**：
- `DemoImage.widget.vue` 第 18 行：`<img v-if="value" ...>`
- `DemoVideo.widget.vue` 第 34 行：`<video v-if="value" ...>`

---

## 第 10 条：wujie 生命周期契约

**原则**：子应用在 wujie 沙箱模式下 MUST 实现 `window.__WUJIE_MOUNT` 和 `window.__WUJIE_UNMOUNT` 生命周期函数，并在挂载完成后通过 `window.$wujie.bus.$emit('plugin:ready', {...})` 向主应用暴露所有组件元数据和定义。Vite ESM 异步加载场景 MUST 在定义完生命周期后主动调用 `window.__WUJIE.mount()`。

**证据**：
- `main.js` 第 11 行：`window.__WUJIE_MOUNT = () => { ... }`
- `main.js` 第 30 行：`window.__WUJIE_UNMOUNT = () => { ... }`
- `main.js` 第 17 行：`window.$wujie?.bus.$emit('plugin:ready', { ... })`
- `main.js` 第 35 行：`window.__WUJIE.mount()`

---

## 第 11 条：元数据默认值回退

**原则**：子应用暴露的元数据对象 MUST 包含与主应用本地的 WidgetMeta/AppMeta/DesktopBackgroundMeta 结构兼容的完整字段。字段缺失时由主应用对应的 use*Metas composable 提供默认值回退。

**证据**：
- `src/widgets/index.js`：`WidgetMetas` 字典，`...raw` 展开 + `compName` 补充 + 默认值回退
- `src/apps/index.js`：`AppMetas` 字典，同上结构与回退
- `src/backgrounds/index.js`：`BackgroundMetas` 字典，`...raw` 展开 + `name` 补充 + 默认值回退

---

## 第 12 条：渐进迁移与兼容

**原则**：子应用组件的命名约定、元数据结构、CSS 变量体系 MUST 与主应用保持一致，确保从主应用本地组件迁移到子应用时消费者（分类树、属性编辑器、视口渲染管线）无需修改。

**证据**：
- 文件命名延续 `*.widget.vue` / `*.widget.js` / `*.app.vue` / `*.app.js` / `*.bg.js` 约定
- 元数据字段结构与主应用 `DesktopBackgroundMeta` 一致（`title/category/theme/type/avatar/thumbnail/image`）
- 使用相同的 `--desktop-*` CSS 变量体系
