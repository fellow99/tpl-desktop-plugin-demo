# 模块规格：002-demo-widgets

> 项目：tpl-desktop-plugin-demo
> 模块：Demo Widget 组件（DemoText / DemoNumber / DemoImage / DemoVideo）
> 类型：As-Built（基于已实现代码提取）
> 最后更新：2026-07-21

---

## 1. 模块概述

### 1.1 模块职责

002-demo-widgets 包含 4 个 Demo Widget 组件，它们作为 tpl-desktop-plugin-demo 子应用的一部分，在主应用（tpl-desktop）的桌面网格中渲染。每个 Widget 由两个文件组成：`.widget.vue`（组件定义）和 `.widget.js`（元数据声明）。该模块负责以下职责：

- 在主应用桌面网格中渲染文本、数值、图片、视频四种内容类型
- 通过 `defineProps` 声明可配置属性，由主应用属性编辑器驱动
- 遵循统一设计模式（flex 居中、CSS 变量、scoped 样式）
- 对空值输入提供优雅降级（图片/视频不渲染破损占位符）
- 对资源型组件（视频）在卸载时执行清理

### 1.2 组件清单

| 组件名 | 中文显示名 | 内容类型 | 默认网格 | 唯一功能 |
|--------|-----------|---------|----------|---------|
| DemoText | Demo文字 | 纯文本 | 1×1 | Mustache 插值渲染 |
| DemoNumber | Demo数字 | 滚动数值 | 1×1 | @number-flow/vue 数值动画 + 精度控制 |
| DemoImage | Demo图片 | 图片展示 | 2×2 | CSS object-fit 5 种适应模式 + 空值处理 |
| DemoVideo | Demo视频 | 视频播放 | 2×2 | 自动静音循环播放 + 卸载资源清理 |

### 1.3 与整体规格的关系

本模块规格覆盖 [overall-spec.md](../overall-spec.md) 中的以下功能需求：

| 整体规格 FR | 本模块 FR | 组件 |
|------------|----------|------|
| FR-020, FR-021 | FR-002-DW-010~012 | DemoText |
| FR-030, FR-031, FR-032, FR-033 | FR-002-DW-020~025 | DemoNumber |
| FR-040, FR-041, FR-042, FR-043 | FR-002-DW-030~035 | DemoImage |
| FR-050, FR-051, FR-052, FR-053, FR-054 | FR-002-DW-040~046 | DemoVideo |

---

## 2. 功能需求

> 本规格使用 [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt) 关键词（MUST / MUST NOT / SHOULD / MAY）。

### 2.1 DemoText — Demo文字

**FR-002-DW-010**: DemoText Widget MUST 通过 `value` prop（String 类型）接收文本内容，并以 Mustache 插值语法 `{{ value }}` 渲染在根容器 `<div>` 中。

**FR-002-DW-011**: `value` prop MUST 声明默认值 `'这是一段文字'`，当主应用未传入该属性或传入 `undefined` 时，组件 MUST 显示默认文字。

**FR-002-DW-012**: DemoText Widget 的默认网格占用尺寸 MUST 为 `{ unit: 'grid', width: 1, height: 1 }`，即在桌面网格中占 1 列 × 1 行。

**FR-002-DW-013** [NEEDS CLARIFICATION]: DemoText 是否应支持文本溢出截断（如 `text-overflow: ellipsis`）？当前实现依赖父容器的网格单元格约束，未在组件内部做溢出处理。如在极端窄小容器中使用，文本可能被裁剪而无视觉提示。

### 2.2 DemoNumber — Demo数字

**FR-002-DW-020**: DemoNumber Widget MUST 接收 `value` prop（Number 类型，默认 `123.456`），通过 `@number-flow/vue` 的 `NumberFlow` 组件实现数值变化时的平滑滚动动画。

**FR-002-DW-021**: DemoNumber MUST 接收 `precision` prop（Number 类型，默认 `2`），控制数值显示的小数保留位数。处理逻辑如下：

- 对 `precision` 执行 `Math.trunc(Number(…))` 取整
- 若结果为有限数，则钳位至 `[0, 20]` 区间（`toFixed` 的合法参数范围）
- 若结果为 `NaN` / `Infinity` 等非法值，回退为 `0`
- 通过 `Intl.NumberFormat` 的 `minimumFractionDigits` / `maximumFractionDigits` 选项固定小数位数，确保末尾 `0` 得到保留

**FR-002-DW-022**: DemoNumber MUST 对 `value` 执行防御性解析：当 `parseFloat(value)` 结果为 `NaN` 或非有限数时，回退显示 `0`。

**FR-002-DW-023**: DemoNumber MUST 接收可选的 `title` prop（String 类型，默认 `''`）和 `unit` prop（String 类型，默认 `''`）。当对应值为非空字符串时，MUST 分别渲染 `<span class="number-title">` 和 `<span class="number-unit">`；当值为空字符串时，对应元素不渲染（`v-if` 门控）。

**FR-002-DW-024**: DemoNumber Widget 的默认网格占用尺寸 MUST 为 1×1。

**FR-002-DW-025**: DemoNumber 的 `numberFormat` 计算属性 MUST 设置 `useGrouping: false`，即不显示千分位分隔符。

### 2.3 DemoImage — Demo图片

**FR-002-DW-030**: DemoImage Widget MUST 接收 `value` prop（String 类型，默认 `''`），当其值为非空字符串时，渲染 `<img>` 元素；当其值为空字符串时，MUST NOT 渲染 `<img>` 元素，仅显示空白根容器。

**FR-002-DW-031**: DemoImage MUST 将 `<img>` 元素的 `alt` 属性设为空字符串 `""`（无替代文本），避免在图片加载失败时显示破损图标及残留 alt 文字。

**FR-002-DW-032**: DemoImage MUST 接收 `objectFit` prop（String 类型，默认 `'cover'`），通过内联样式 `:style="{ objectFit }"` 绑定到 `<img>` 元素的 CSS `object-fit` 属性。可选值包括：

| 值 | CSS 行为 | 中文标签 |
|----|---------|---------|
| `cover` | 裁剪并覆盖容器，保持宽高比 | 覆盖 |
| `contain` | 完整显示图片，可能留白 | 包含 |
| `fill` | 拉伸填充，不保持宽高比 | 填充 |
| `none` | 保持原始尺寸，可能溢出 | 原始 |
| `scale-down` | 取 none 与 contain 中较小的一个 | 缩小 |

**FR-002-DW-033**: DemoImage 根容器 MUST 设置 `overflow: hidden`，确保当 `objectFit` 为 `none` 且图片原始尺寸大于容器时，超出部分被裁剪。

**FR-002-DW-034**: DemoImage Widget 的默认网格占用尺寸 MUST 为 2×2。

**FR-002-DW-035**: 元数据中的 `objectFit` 属性 MUST 声明 `type: 'select'` 并附带 `options` 数组（5 个选项），使主应用属性编辑器渲染为下拉选择器。

### 2.4 DemoVideo — Demo视频

**FR-002-DW-040**: DemoVideo Widget MUST 接收 `value` prop（String 类型，默认 `''`），当其值为非空字符串时，渲染 `<video>` 元素；当其值为空字符串时，MUST NOT 渲染 `<video>` 元素。

**FR-002-DW-041**: `<video>` 元素 MUST 配置以下四个 HTML 属性以实现自动静音循环播放：

- `autoplay`：页面加载后自动播放
- `loop`：循环播放
- `muted`：静音（满足浏览器自动播放策略）
- `playsinline`：内联播放（iOS Safari 兼容）

**FR-002-DW-042**: DemoVideo MUST 接收 `objectFit` prop（String 类型，默认 `'cover'`），选项与 DemoImage 完全一致（5 种），通过内联样式绑定到 `<video>` 元素的 CSS `object-fit` 属性。

**FR-002-DW-043**: DemoVideo MUST 在组件卸载前（`onBeforeUnmount` 生命周期钩子）执行资源清理，具体步骤为：

1. `video.pause()` — 停止播放
2. `video.src = ''` — 清空视频源 URL
3. `video.load()` — 触发资源释放

若 `videoRef.value` 为 `null`（组件未渲染 `<video>` 元素时），MUST 跳过清理步骤（`if (!video) return` 门控）。

**FR-002-DW-044**: DemoVideo Widget 的默认网格占用尺寸 MUST 为 2×2。

**FR-002-DW-045**: DemoVideo 根容器 MUST 设置 `overflow: hidden`，防止视频内容溢出容器边界。

**FR-002-DW-046** [NEEDS CLARIFICATION]: DemoVideo 当前依赖浏览器原生 `<video>` 控件，未提供播放/暂停、进度条等自定义 UI 控件。是否需要为 DemoVideo 添加自定义控制栏？目前设计意图为纯展示（自动播放、无用户交互），若需交互控制，需新增 `controls` prop 或自定义控件组件。

---

## 3. 技术约束

本模块组件 MUST 遵循 [constitution.md](../constitution.md) 中的以下原则：

### 3.1 组件响应输入约束（C-02 / 宪法第 3 条）

每个 Widget 组件 MUST ：
- 通过 `defineProps({ … })` 显式声明所有可配置属性
- 运行时仅消费 `props` 对象中的值
- 不依赖任何外部全局状态（如 `useGridStack`、`desktopConfig`、`localStorage`）

### 3.2 属性元数据完整性（C-03 / 宪法第 4 条）

每个属性在元数据（`.widget.js`）中 MUST 声明：
- `title`（中文标签）
- `category`（固定为 `'看板组件配置'`）
- `default`（默认值）
- `type`（可选，默认 `'text'`；DemoNumber 声明 `'number'`，DemoImage/DemoVideo 声明 `'select'`）
- `options`（仅 `type: 'select'` 时提供）

### 3.3 CSS 变量体系（宪法第 5 条）

组件样式 MUST 使用 CSS 自定义属性引用主题相关值：
- `var(--desktop-text-primary)`：主要文字颜色（所有 4 个组件均使用）
- `var(--desktop-text-secondary)`：次要文字颜色（DemoNumber 的 title/unit）

### 3.4 CSS 作用域隔离（宪法第 6 条）

所有 `.vue` 组件 MUST 使用 `<style scoped lang="scss">`，且根容器 class 使用组件名（PascalCase）作为顶级选择器：
- `.DemoText` — DemoText
- `.DemoNumber` — DemoNumber
- `.DemoImage` — DemoImage
- `.DemoVideo` — DemoVideo

### 3.5 统一设计模式（宪法第 7 条）

所有 Widget 根容器 MUST ：
- `display: flex; align-items: center; justify-content: center`
- `width: 100%; height: 100%`
- 图片/视频容器额外设置 `overflow: hidden`

### 3.6 资源清理（宪法第 8 条 / NFR-003）

视频组件 MUST 在 `onBeforeUnmount` 中执行清理。本模块中仅有 DemoVideo 需要此处理。

### 3.7 空值优雅降级（宪法第 9 条）

DemoImage 和 DemoVideo 在 `value` 为空字符串时 MUST 不渲染对应的 `<img>` / `<video>` 元素，使用 `v-if="value"` 门控。

---

## 4. 关键实体

| 实体 | 所在文件 | 说明 |
|------|---------|------|
| DemoText | `src/widgets/demo/DemoText.widget.vue` | 纯文本 Widget 组件 |
| DemoText 元数据 | `src/widgets/demo/DemoText.widget.js` | 声明 title、rect(1×1)、props.value |
| DemoNumber | `src/widgets/demo/DemoNumber.widget.vue` | 滚动数字 Widget 组件 |
| DemoNumber 元数据 | `src/widgets/demo/DemoNumber.widget.js` | 声明 title、rect(1×1)、4 个 props |
| DemoImage | `src/widgets/demo/DemoImage.widget.vue` | 图片 Widget 组件 |
| DemoImage 元数据 | `src/widgets/demo/DemoImage.widget.js` | 声明 title、rect(2×2)、objectFit(select) |
| DemoVideo | `src/widgets/demo/DemoVideo.widget.vue` | 视频 Widget 组件 |
| DemoVideo 元数据 | `src/widgets/demo/DemoVideo.widget.js` | 声明 title、rect(2×2)、objectFit(select) |

---

## 5. 验收场景

### 场景 1：DemoText 默认渲染

- Given DemoText Widget 以默认 props 渲染
- When 组件挂载
- Then 显示文字"这是一段文字"，颜色为 `var(--desktop-text-primary)`，内容在容器中水平和垂直居中

### 场景 2：DemoNumber 数值动画

- Given DemoNumber Widget 挂载，value=100, precision=2
- When value 从 100 变化为 200
- Then NumberFlow 组件执行平滑滚动动画，最终显示 "200.00"

### 场景 3：DemoNumber 精度钳位

- Given DemoNumber Widget 挂载，precision=25
- When precision 被传入 25（超出 [0, 20] 范围）
- Then safePrecision 钳位为 20，显示按 20 位小数格式化

### 场景 4：DemoImage 空值处理

- Given DemoImage Widget 挂载，value=""
- When value 为空字符串
- Then 不渲染 `<img>` 元素（v-if 门控），容器为空白，无破损图片图标

### 场景 5：DemoImage objectFit 切换

- Given DemoImage Widget 挂载，value 为有效图片 URL
- When objectFit prop 从 'cover' 切换为 'contain'
- Then `<img>` 元素的 `style.objectFit` 更新为 'contain'，图片适配方式相应变化

### 场景 6：DemoVideo 自动播放

- Given DemoVideo Widget 挂载，value 为有效视频 URL
- Then `<video>` 元素存在，且 `autoplay`、`loop`、`muted`、`playsinline` 属性均为 true

### 场景 7：DemoVideo 卸载清理

- Given DemoVideo Widget 已挂载并正在播放
- When 组件被卸载（父组件移除或条件渲染为 false）
- Then `onBeforeUnmount` 执行 `pause()` + `src=''` + `load()`，视频停止播放

---

## 6. 待澄清事项

| 编号 | 事项 | 关联 FR | 影响范围 |
|------|------|--------|---------|
| [NC-001] | DemoText 是否应支持文本溢出截断（`text-overflow: ellipsis`）？ | FR-002-DW-013 | DemoText 组件样式 |
| [NC-002] | DemoVideo 是否需要自定义播放控制栏或 `controls` prop？ | FR-002-DW-046 | DemoVideo 组件功能 |
| [NC-003] | DemoNumber 的 `useGrouping: false` 是否应为可配置项（如新增 `showGrouping` prop）？ | — | DemoNumber 组件 props |

---

## 7. 修订历史

| 日期 | 变更 |
|------|------|
| 2026-07-21 | 初始版本，基于已实现代码提取（As-Built） |
