# 功能规格说明书 — DemoClock App

> 模块：003-demo-app
> 类型：As-Built（基于已实现代码的功能描述）
> 版本：1.0
> 最后更新：2026-07-21

---

## 1. 概述

### 1.1 模块定位

DemoClock 是 tpl-desktop-plugin-demo 子应用提供的唯一全屏 App 组件，用于在主应用桌面叠加层中展示实时更新的数字时钟。该组件纯展示型，不依赖外部状态或网络请求，仅通过 props 接收配置并自主驱动时间更新。

### 1.2 用户故事

- 作为**工作台用户**，我希望在启动 Demo时钟 App 后看到一个实时跳动的数字时钟，以便在桌面上查看当前时间。
- 作为**工作台用户**，我希望时钟默认同时显示时间和日期（含中文星期），以便获取完整的日历信息。
- 作为**工作台用户**，我希望能够通过配置面板调整时间显示格式，例如仅显示时分（`HH:mm`）或包含毫秒（`HH:mm:ss.SSS`），以适应不同使用场景。
- 作为**工作台用户**，我希望可以选择隐藏日期行，仅保留时间显示，以获得更简洁的视图。

### 1.3 范围

**包含：**
- 基于 dayjs 的实时时间渲染，每秒更新一次
- 中文本地化日期显示（含中文星期映射）
- 可配置的时间格式（通过 `format` prop）
- 日期行显隐切换（通过 `showDate` prop）
- 定时器资源清理（防止内存泄漏）
- CSS 变量体系适配（`--desktop-*` 颜色变量）
- 统一的 flex 居中布局

**明确排除：**
- 多时区支持
- 闹钟/计时器/秒表功能
- 用户自定义日期格式（仅提供 `format` 字段供高级用户使用 dayjs 模板）
- 响应式字号调整（字号固定为 `4em` / `1.25em`）
- 动画过渡效果
- 主题切换（颜色由宿主环境 CSS 变量控制）

---

## 2. 功能需求

### 2.1 时间实时更新

- **FR-060**: DemoClock App MUST 在挂载后立即启动一个持续运行的时间更新循环，更新频率为每秒一次（1000ms 间隔）。
- **FR-060.1**: 时间更新循环 MUST 使用 dayjs 库获取当前时刻，不得使用原生 `Date` 对象或 `new Date()`。
- **FR-060.2**: 时间显示 MUST 使用 `font-variant-numeric: tabular-nums` 样式属性，确保数字字符等宽，避免时间跳变时的 UI 抖动。

### 2.2 时间格式化

- **FR-061**: DemoClock App MUST 支持 `format` prop（String 类型），作为 dayjs 格式化模板字符串，默认值为 `'HH:mm:ss'`。
- **FR-061.1**: 时间显示 MUST 通过 `dayjs().format(props.format)` 方法生成格式化字符串。
- **FR-061.2**: `format` prop 为空字符串时，dayjs 将返回空字符串，时间行显示为空白。此行为由 dayjs 库自身决定，DemoClock 不对此做额外校验或回退。
- **FR-061.3**: `format` prop 接收非法的 dayjs 格式模板（如 `'xyz'`）时，dayjs 将原样输出格式字符。DemoClock 不对此做额外校验。

### 2.3 日期显示

- **FR-062**: DemoClock App MUST 支持 `showDate` prop（Boolean 类型），默认值为 `true`，控制是否渲染日期行。
- **FR-062.1**: 当 `showDate` 为 `true` 时，日期行 MUST 显示格式为 `YYYY年MM月DD日` 的日期文本，后接中文星期映射（周日 ~ 周六）。
- **FR-062.2**: 中文星期映射 MUST 使用硬编码的 `WEEK_CN` 常量数组 `['周日','周一','周二','周三','周四','周五','周六']`，通过 `dayjs().day()` 返回值作为索引获取对应的中文星期文本。不得引入 dayjs 中文 locale 包以控制体积。
- **FR-062.3**: 当 `showDate` 为 `false` 时，日期行 MUST 通过 `v-if="showDate"` 完全从 DOM 中移除（不渲染占位元素）。
- **FR-062.4**: 日期文本的星期索引 MUST 遵循 dayjs 的 `.day()` 方法规范：0=周日，6=周六。

### 2.4 定时器资源清理

- **FR-063**: DemoClock App 中的 `setInterval` 定时器 MUST 在 `onBeforeUnmount` 生命周期钩子中通过 `clearInterval` 清理。
- **FR-063.1**: 清理逻辑 MUST 包含空值检查（`if (timer)`），防止重复清理或清理未初始化的定时器。
- **FR-063.2**: 清理后 MUST 将 `timer` 变量重置为 `null`，确保即使 `onBeforeUnmount` 被多次触发也不会重复调用 `clearInterval`。
- **FR-063.3**: 在 wujie 保活模式（`alive: true`）下，App 关闭（`__WUJIE_UNMOUNT` 触发卸载）时 DemoClock 的定时器 MUST 被清理。App 重新打开时 MUST 创建新的定时器实例，不得复用已清理的旧定时器。

### 2.5 默认网格尺寸

- **FR-064**: DemoClock App 的默认网格占用尺寸 MUST 为 3×3（`rect: { unit: 'grid', width: 3, height: 3 }`），由元数据文件声明。

### 2.6 元数据声明

- **FR-065**: DemoClock App MUST 通过 `DemoClock.app.js` 元数据文件声明完整的 `AppMeta` 结构，包含 `title`、`category`、`avatar`、`thumbnail`、`rect`、`props`、`events`、`propsEditors`、`wrapperEditors` 字段。
- **FR-065.1**: 元数据中 `format` prop MUST 声明 `{ title: '时间格式', category: '看板组件配置', type: 'text', default: 'HH:mm:ss' }`。
- **FR-065.2**: 元数据中 `showDate` prop MUST 声明 `{ title: '显示日期', category: '看板组件配置', type: 'boolean', default: true }`。
- **FR-065.3**: 组件分类 MUST 为 `'Demo应用'`，与 Widget 组件的 `'3.Demo组件'` 分类相区分。

---

## 3. 非功能需求

### 3.1 性能

- **NFR-060**: 时间更新循环 MUST 保持轻量：每次更新时间复杂度为 O(1)，不产生新对象分配（复用 `now` ref），不触发不必要的响应式更新。
- **NFR-061**: 定时器间隔 MUST 为精确的 1000ms，不得使用 `requestAnimationFrame` 或可变频率更新机制，以保证时间显示的一致性和可预测性。

### 3.2 可靠性

- **NFR-062**: 组件 MUST 在重复挂载/卸载（App 频繁打开/关闭）场景下不产生定时器泄漏，即每次打开后内存中同时存在的定时器数量始终为 1 或 0。

### 3.3 宪法合规

DemoClock App MUST 满足 tpl-desktop-plugin-demo 宪法原则的以下条款：

| 原则 | 条款 | 合规点 |
|------|------|--------|
| 元数据驱动注册 | C-02 / C-03 | `DemoClock.app.js` 声明完整 `AppMeta`，每个 prop 含 title/category/default |
| 组件响应输入约束 | C-03 | 仅通过 `defineProps` 接收输入，无外部状态依赖 |
| CSS 变量体系 | C-05 | 使用 `var(--desktop-text-primary)` 和 `var(--desktop-text-secondary)` |
| CSS 作用域隔离 | C-06 | `<style scoped lang="scss">`，根容器 class 为 `DemoClock` |
| 统一设计模式 | C-07 | flex column 居中，`width: 100%; height: 100%` |
| 资源清理 | C-08 | `onBeforeUnmount` 中 `clearInterval(timer)` |

### 3.4 代码质量

- 组件 MUST 使用 `<script setup>` 语法
- 组件样式 MUST 使用 `<style scoped lang="scss">`
- 定时器变量 MUST 使用 `let timer = null` 声明，不得使用 `ref` 包装

---

## 4. 关键实体

| 实体 | 说明 | 来源 |
|------|------|------|
| `DemoClock.vue` | Vue SFC 组件，实现时钟渲染与更新逻辑 | `src/apps/demo/DemoClock.app.vue` |
| `DemoClock.app.js` | App 元数据文件，声明组件可配置属性与分类 | `src/apps/demo/DemoClock.app.js` |
| `now` | `ref(dayjs())` 响应式变量，驱动 timeText 和 dateText 计算属性 | `.vue` 第 22 行 |
| `timeText` | `computed` 计算属性，根据 `props.format` 格式化时间 | `.vue` 第 24 行 |
| `dateText` | `computed` 计算属性，生成 `YYYY年MM月DD日 周X` 格式日期 | `.vue` 第 25-27 行 |
| `WEEK_CN` | `const` 常量数组，中文星期映射（周日~周六） | `.vue` 第 20 行 |
| `timer` | `let` 变量，持有 `setInterval` 返回的定时器 ID | `.vue` 第 29 行 |
| `props.format` | String prop，dayjs 时间格式化模板 | `.vue` 第 14 行 / `.app.js` 第 14-18 行 |
| `props.showDate` | Boolean prop，控制日期行显隐 | `.vue` 第 16 行 / `.app.js` 第 20-25 行 |

---

## 5. 验收场景

### 场景 1: 时间实时更新

- Given DemoClock App 已启动
- When 用户观察时钟显示
- Then 时间以 `HH:mm:ss` 格式每秒更新一次
- And 数字使用等宽字体（tabular-nums），无 UI 抖动

### 场景 2: 日期行显示

- Given `showDate` 为 `true`（默认值）
- When DemoClock App 已启动
- Then 时间行下方显示日期，格式为 `YYYY年MM月DD日 周X`（如 `2026年07月21日 周二`）

### 场景 3: 日期行隐藏

- Given 用户通过属性编辑器将 `showDate` 设为 `false`
- When DemoClock App 重新渲染
- Then 日期行完全从 DOM 中移除
- And 仅显示时间行，容器仍保持 flex column 居中

### 场景 4: 时间格式自定义

- Given 用户通过属性编辑器将 `format` 设为 `'HH:mm'`
- When DemoClock App 重新渲染
- Then 时间行仅显示小时和分钟（如 `20:42`），不再显示秒

### 场景 5: App 关闭后资源释放

- Given DemoClock App 正在运行（定时器活跃）
- When 用户关闭 App（触发 onBeforeUnmount）
- Then `clearInterval` 被调用，定时器停止
- And `timer` 变量被重置为 `null`

### 场景 6: wujie 保活模式下重新打开

- Given DemoClock App 在 wujie 保活模式下已关闭（定时器已清理）
- When 用户再次打开 DemoClock App
- Then 创建新的定时器实例
- And 时间重新开始每秒更新

### 场景 7: 空 format 的行为

- Given `format` 设为 `''`（空字符串）
- When DemoClock App 已启动
- Then 时间行显示为空（dayjs 对空模板返回空字符串）

---

## 6. 假设与约束

1. **假设**: dayjs 库已在子应用依赖中安装（`package.json` → `"dayjs": "^1.11.13"`），DemoClock 不负责引入 dayjs。
2. **假设**: 主应用的 CSS 变量（`--desktop-text-primary`、`--desktop-text-secondary`）通过 wujie CSS 沙箱自动继承到子应用 iframe 内。
3. **假设**: DemoClock 运行在 wujie 沙箱中时，定时器 API（`setInterval`/`clearInterval`）行为与独立浏览器环境一致。
4. **约束**: 组件不得引入 `import.meta.glob` 或动态导入，必须使用静态 `import`。
5. **约束**: 组件必须与 Vue 3.5+ 的 `<script setup>` 编译模式兼容。
6. **约束**: 组件不得直接访问 `window.__POWERED_BY_WUJIE__`，所有 wujie 生命周期适配由 `plugin.js` 统一管理。

---

## 7. 待澄清事项

无。本模块功能边界清晰，所有行为均可从已实现代码中明确推导。

---

## 8. 版本历史

| 日期 | 变更 |
|------|------|
| 2026-07-21 | 初始版本，基于已实现代码（As-Built）提取 |
