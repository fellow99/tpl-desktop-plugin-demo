# 实施计划：002-demo-widgets

> 项目：tpl-desktop-plugin-demo
> 模块：Demo Widget 组件
> 类型：As-Built（基于实际代码分析）
> 最后更新：2026-07-21

---

## 1. 实施概览

### 1.1 模块结构

```
src/widgets/demo/
├── DemoText.widget.vue     # DemoText 组件定义 (28 行)
├── DemoText.widget.js      # DemoText 元数据     (26 行)
├── DemoNumber.widget.vue   # DemoNumber 组件定义 (82 行)
├── DemoNumber.widget.js    # DemoNumber 元数据     (41 行)
├── DemoImage.widget.vue    # DemoImage 组件定义  (36 行)
├── DemoImage.widget.js     # DemoImage 元数据     (38 行)
├── DemoVideo.widget.vue    # DemoVideo 组件定义  (61 行)
├── DemoVideo.widget.js     # DemoVideo 元数据     (38 行)
└── avatar.svg              # 共享头像图标
```

### 1.2 文件 — 规格交叉引用

| 源文件 | 行数 | 规格 FR 覆盖 |
|--------|------|-------------|
| `DemoText.widget.vue` | 28 | FR-002-DW-010, FR-002-DW-011 |
| `DemoText.widget.js` | 26 | FR-002-DW-012 |
| `DemoNumber.widget.vue` | 82 | FR-002-DW-020~025 |
| `DemoNumber.widget.js` | 41 | FR-002-DW-024 |
| `DemoImage.widget.vue` | 36 | FR-002-DW-030~033 |
| `DemoImage.widget.js` | 38 | FR-002-DW-034, FR-002-DW-035 |
| `DemoVideo.widget.vue` | 61 | FR-002-DW-040~043, FR-002-DW-045 |
| `DemoVideo.widget.js` | 38 | FR-002-DW-044 |

---

## 2. DemoText — Demo文字

### 2.1 组件定义：`DemoText.widget.vue`（28 行）

#### 2.1.1 `<script setup>`（第 1-12 行）

```
1:  <script setup>
2:  // 注释说明：Q-01 仅接收 props 渲染内容，不依赖编辑器环境
8:  defineProps({
9:    // 文本内容
10:   value: { type: String, default: '这是一段文字' },
11: })
12: </script>
```

**规格映射**:
- `defineProps({ value: { type: String, default: '这是一段文字' } })` → FR-002-DW-010, FR-002-DW-011
- 唯一的 prop：`value`，类型 `String`，默认值 `'这是一段文字'`
- 无 `import`、无 `computed`、无任何其他 script 逻辑 — 极简参考实现

#### 2.1.2 `<template>`（第 14-16 行）

```
14: <template>
15:   <div class="DemoText">{{ value }}</div>
16: </template>
```

**规格映射**:
- `{{ value }}` (Mustache 插值) → FR-002-DW-010
- 根容器 class `DemoText` → 宪法第 6 条（CSS 作用域隔离）

#### 2.1.3 `<style scoped lang="scss">`（第 18-28 行）

```
20: .DemoText {
21:   display: flex;
22:   align-items: center;
23:   justify-content: center;
24:   width: 100%;
25:   height: 100%;
26:   color: var(--desktop-text-primary);
27: }
```

**规格映射**:
- `display: flex; align-items: center; justify-content: center` → 宪法第 7 条（统一设计模式）
- `width: 100%; height: 100%` → 宪法第 7 条
- `color: var(--desktop-text-primary)` → 宪法第 5 条（CSS 变量体系）
- `<style scoped lang="scss">` → 宪法第 6 条

### 2.2 元数据定义：`DemoText.widget.js`（26 行）

```
 9: export default {
10:   title: 'Demo文字',
11:   category: '3.Demo组件',
12:   avatar,
13:   thumbnail: null,
14:   rect: { unit: 'grid', width: 1, height: 1 },
15:   props: {
16:     value: {
17:       title: '文本内容',
18:       category: '看板组件配置',
19:       default: '这是一段文字',
20:     },
21:   },
23:   events: [],
24:   propsEditors: [],
25:   wrapperEditors: [],
26: }
```

**规格映射**:
- `rect: { unit: 'grid', width: 1, height: 1 }` → FR-002-DW-012（默认网格 1×1）
- `props.value` 声明 `title`/`category`/`default` → 宪法第 4 条（C-03 属性元数据完整性）
- `type` 未显式声明 → 默认 `'text'`
- `events`/`propsEditors`/`wrapperEditors` 均为空数组 → Q-02 预留扩展点

### 2.3 DemoText 数据流

```
主应用属性编辑器
    │
    │ 写入 props.value
    ▼
defineProps({ value })
    │
    ▼
模板: {{ value }}
    │
    ▼
浏览器渲染文本
```

DemoText 是所有 Widget 中最简的数据流：props 直接绑定到模板，无任何中间转换。

---

## 3. DemoNumber — Demo数字

### 3.1 组件定义：`DemoNumber.widget.vue`（82 行）

#### 3.1.1 导入依赖（第 9-10 行）

```
 9: import { computed } from 'vue'
10: import NumberFlow from '@number-flow/vue'
```

**技术决策**: 使用 `@number-flow/vue` 而非自行实现动画。NumberFlow 是专为数值变化动画设计的 Vue 3 组件库。

#### 3.1.2 Props 声明（第 12-21 行）

```
12: const props = defineProps({
13:   // 数值
14:   value: { type: Number, default: 123.456 },
15:   // 小数保留位数
16:   precision: { type: Number, default: 2 },
17:   // 标题文字
18:   title: { type: String, default: '' },
19:   // 单位文字
20:   unit: { type: String, default: '' },
21: })
```

**规格映射**:
- `value` (Number, default 123.456) → FR-002-DW-020
- `precision` (Number, default 2) → FR-002-DW-021
- `title` (String, default '') → FR-002-DW-023
- `unit` (String, default '') → FR-002-DW-023

#### 3.1.3 精度归一计算属性（第 24-27 行）

```
24: const safePrecision = computed(() => {
25:   const p = Math.trunc(Number(props.precision))
26:   return Number.isFinite(p) ? Math.min(Math.max(p, 0), 20) : 0
27: })
```

**规格映射**: → FR-002-DW-021（精度钳位处理）

**详细逻辑**:
1. `Number(props.precision)` — 将 precision 转换为数字（处理字符串输入）
2. `Math.trunc(…)` — 截断小数部分取整
3. `Number.isFinite(p)` — 检查是否为有限数（NaN / ±Infinity → 回退为 0）
4. `Math.min(Math.max(p, 0), 20)` — 钳位到 [0, 20]

#### 3.1.4 显示值计算属性（第 30-33 行）

```
30: const displayValue = computed(() => {
31:   const n = parseFloat(props.value)
32:   return Number.isFinite(n) ? Number(n.toFixed(safePrecision.value)) : 0
33: })
```

**规格映射**: → FR-002-DW-022（value 防御性解析）

**详细逻辑**:
1. `parseFloat(props.value)` — 从字符串/数字中提取数值
2. `Number.isFinite(n)` — 检查是否为有限数
3. `n.toFixed(safePrecision.value)` — 按安全精度格式化（结果为字符串）
4. `Number(…)` — 转回数字类型（去除 toFixed 产生的字符串格式）
5. 非法输入 → 回退为 `0`

#### 3.1.5 数字格式配置（第 36-40 行）

```
36: const numberFormat = computed(() => ({
37:   minimumFractionDigits: safePrecision.value,
38:   maximumFractionDigits: safePrecision.value,
39:   useGrouping: false,
40: }))
```

**规格映射**: → FR-002-DW-021（小数位数）、FR-002-DW-025（useGrouping: false）

这是传递给 `NumberFlow` 的 `:format` 属性的 `Intl.NumberFormat` 选项对象。`minimumFractionDigits` 和 `maximumFractionDigits` 设为相同值以确保始终显示固定小数位数（保留末尾 0）。

#### 3.1.6 模板（第 44-49 行）

```
44:   <div class="DemoNumber">
45:     <span v-if="title" class="number-title">{{ title }}</span>
46:     <NumberFlow class="number-value" :value="displayValue" :format="numberFormat" />
47:     <span v-if="unit" class="number-unit">{{ unit }}</span>
48:   </div>
```

**规格映射**:
- `v-if="title"` → FR-002-DW-023（title 为空时不渲染）
- `v-if="unit"` → FR-002-DW-023（unit 为空时不渲染）
- `<NumberFlow :value="displayValue" :format="numberFormat" />` → FR-002-DW-020

#### 3.1.7 样式（第 52-82 行）

```
54: .DemoNumber {
55:   display: flex;
56:   align-items: center;
57:   justify-content: center;
58:   width: 100%;
59:   height: 100%;
60:   color: var(--desktop-text-primary);
61: }
62: .number-title {
63:   overflow: hidden;
64:   max-width: 40%;
65:   white-space: nowrap;
66:   text-overflow: ellipsis;
67:   font-size: 0.875em;
68:   color: var(--desktop-text-secondary);
69:   transform: translateX(-0.25em);
70: }
71: .number-value {
72:   font-size: 1.5em;
73:   font-weight: 600;
74: }
75: .number-unit {
76:   font-size: 0.875em;
77:   color: var(--desktop-text-secondary);
78:   transform: translateX(0.25em);
79: }
```

**设计要点**:
- 根容器遵循统一设计模式 → 宪法第 7 条
- `--desktop-text-primary` / `--desktop-text-secondary` → 宪法第 5 条
- Title 有溢出截断（`max-width:40%` + `text-overflow: ellipsis`）
- Title/Unit 使用 `translateX` 微调间距（-0.25em / +0.25em），实现视觉上的负/正内边距效果
- Number 值字号 1.5em 粗体 600，为主体视觉焦点

### 3.2 元数据定义：`DemoNumber.widget.js`（41 行）

```
 8:   title: 'Demo数字',
11:   category: '3.Demo组件',
13:   rect: { unit: 'grid', width: 1, height: 1 },
14:   props: {
15:     value:    { title: '数值',     category: '看板组件配置', type: 'number', default: 123.456 },
20:     precision:{ title: '小数保留位数', category: '看板组件配置', type: 'number', default: 2 },
26:     title:    { title: '标题文字',  category: '看板组件配置', default: '' },
31:     unit:     { title: '单位文字',  category: '看板组件配置', default: '' },
```

**规格映射**:
- `rect: { width: 1, height: 1 }` → FR-002-DW-024
- 每个 prop 声明 `title`/`category`/`type`/`default` → 宪法第 4 条
- `type: 'number'` 告知主应用属性编辑器渲染数值输入框
- `title` 和 `unit` 未声明 `type` → 默认 `'text'`

### 3.3 DemoNumber 数据流

```
主应用属性编辑器
    │
    ├── props.value ──────► parseFloat → Number.isFinite? → toFixed(safePrecision)
    ├── props.precision ──► Math.trunc → clamp[0,20] → Number.isFinite? → safePrecision
    ├── props.title ──────► v-if 门控 → <span class="number-title">
    └── props.unit ───────► v-if 门控 → <span class="number-unit">
    │
    ▼
displayValue (Number) ──► NumberFlow (:value + :format)
    │
    ▼
浏览器渲染滚动动画数值
```

---

## 4. DemoImage — Demo图片

### 4.1 组件定义：`DemoImage.widget.vue`（36 行）

#### 4.1.1 `<script setup>`（第 1-13 行）

```
 8: defineProps({
 9:   // 图片 URL 路径
10:   value: { type: String, default: '' },
11:   // CSS object-fit 适应方式
12:   objectFit: { type: String, default: 'cover' },
13: })
```

**规格映射**:
- `value` (String, default '') → FR-002-DW-030
- `objectFit` (String, default 'cover') → FR-002-DW-032

**设计要点**: 无需 `import`（无 computed、无 ref），与 DemoText 同属极简 props 驱动组件。

#### 4.1.2 模板（第 16-20 行）

```
17:   <div class="DemoImage">
18:     <img v-if="value" class="image-content" :src="value" :style="{ objectFit }" alt="" />
19:   </div>
```

**规格映射**:
- `v-if="value"` → FR-002-DW-030（空值不渲染 img）
- `alt=""` → FR-002-DW-031（空 alt 属性）
- `:style="{ objectFit }"` → FR-002-DW-032（内联样式绑定）

**`v-if` vs `v-show` 决策**: 使用 `v-if` 而非 `v-show`，确保 value 为空时 `<img>` 完全不存在于 DOM 中，避免浏览器对 `src=""` 发起请求或显示破损图标。

#### 4.1.3 样式（第 22-36 行）

```
23: .DemoImage {
24:   display: flex;
25:   align-items: center;
26:   justify-content: center;
27:   width: 100%;
28:   height: 100%;
29:   overflow: hidden;
30: }
32: .image-content {
33:   width: 100%;
34:   height: 100%;
35: }
```

**规格映射**:
- `overflow: hidden` → FR-002-DW-033（裁剪溢出内容，objectFit:none 时必需）
- `width: 100%; height: 100%` on img → 确保图片填充整个容器

### 4.2 元数据定义：`DemoImage.widget.js`（38 行）

```
 9:   title: 'Demo图片',
11:   category: '3.Demo组件',
13:   rect: { unit: 'grid', width: 2, height: 2 },
15:   props: {
16:     value:     { title: '图片地址', category: '看板组件配置', default: '' },
20:     objectFit: {
21:       title: '适应方式',
22:       category: '看板组件配置',
23:       type: 'select',
24:       default: 'cover',
25:       options: [
26:         { label: '覆盖', value: 'cover' },
27:         { label: '包含', value: 'contain' },
28:         { label: '填充', value: 'fill' },
29:         { label: '原始', value: 'none' },
30:         { label: '缩小', value: 'scale-down' },
31:       ],
32:     },
33:   },
```

**规格映射**:
- `rect: { width: 2, height: 2 }` → FR-002-DW-034（默认网格 2×2）
- `type: 'select'` + `options` → FR-002-DW-035（下拉选择器）
- 5 个 options 覆盖所有 CSS object-fit 合法值 → FR-002-DW-032

### 4.3 DemoImage 数据流

```
主应用属性编辑器
    │
    ├── props.value ──────► v-if="value" 门控 → <img :src="value">
    └── props.objectFit ──► :style="{ objectFit }" → CSS object-fit
    │
    ▼
浏览器渲染图片（或空白容器）
```

---

## 5. DemoVideo — Demo视频

### 5.1 组件定义：`DemoVideo.widget.vue`（61 行）

#### 5.1.1 `<script setup>`（第 1-29 行）

```
10: import { ref, onBeforeUnmount } from 'vue'
12: defineProps({
13:   // 视频 URL 路径
14:   value: { type: String, default: '' },
15:   // CSS object-fit 适应方式
16:   objectFit: { type: String, default: 'cover' },
17: })
```

**规格映射**:
- `value` (String, default '') → FR-002-DW-040
- `objectFit` (String, default 'cover') → FR-002-DW-042

**与其他组件的区别**: DemoVideo 是本模块中唯一需要 `import { ref, onBeforeUnmount }` 的 Widget，因为它需要管理视频 DOM 引用和执行卸载清理。

#### 5.1.2 视频引用与清理（第 20-28 行）

```
20: const videoRef = ref(null)
22: onBeforeUnmount(() => {
23:   const video = videoRef.value
24:   if (!video) return
25:   video.pause()
26:   video.src = ''
27:   video.load()
28: })
```

**规格映射**: → FR-002-DW-043（卸载资源清理）

**清理步骤顺序与原理**:
1. `videoRef.value` — 获取 DOM 引用；若为 null（v-if 未渲染 video），立即 return → 门控
2. `video.pause()` — 停止播放，释放解码器资源
3. `video.src = ''` — 清空 src，解除对视频文件的引用
4. `video.load()` — 触发浏览器重新加载（此时 src 为空），彻底释放媒体资源

**为何需要 `video.load()`**: 仅设置 `src=''` 不会触发浏览器立即释放资源；调用 `load()` 强制浏览器执行资源重置，在 Chrome DevTools Memory 面板中可验证效果。

#### 5.1.3 模板（第 32-45 行）

```
32:   <div class="DemoVideo">
33:     <video
34:       v-if="value"
35:       ref="videoRef"
36:       class="video-content"
37:       :src="value"
38:       :style="{ objectFit }"
39:       autoplay
40:       loop
41:       muted
42:       playsinline
43:     ></video>
44:   </div>
```

**规格映射**:
- `v-if="value"` → FR-002-DW-040（空值不渲染 video）
- `autoplay` → FR-002-DW-041
- `loop` → FR-002-DW-041
- `muted` → FR-002-DW-041（满足浏览器自动播放策略）
- `playsinline` → FR-002-DW-041（iOS Safari 兼容）
- `:style="{ objectFit }"` → FR-002-DW-042
- `ref="videoRef"` → FR-002-DW-043（cleanup 引用）

**`autoplay` 策略说明**: 现代浏览器（Chrome 66+、Safari 11+）对自动播放有严格限制。通过同时设置 `autoplay` + `muted`，可满足"静音自动播放"策略要求。若 `muted` 缺失，浏览器将静默阻止 `autoplay`。

#### 5.1.4 样式（第 47-61 行）

```
48: .DemoVideo {
49:   display: flex;
50:   align-items: center;
51:   justify-content: center;
52:   width: 100%;
53:   height: 100%;
54:   overflow: hidden;
55: }
57: .video-content {
58:   width: 100%;
59:   height: 100%;
60: }
```

**规格映射**:
- `overflow: hidden` → FR-002-DW-045
- 根容器 flex 居中 → 宪法第 7 条

### 5.2 元数据定义：`DemoVideo.widget.js`（38 行）

```
 9:   title: 'Demo视频',
11:   category: '3.Demo组件',
13:   rect: { unit: 'grid', width: 2, height: 2 },
```

**规格映射**:
- `rect: { width: 2, height: 2 }` → FR-002-DW-044
- objectFit options 与 DemoImage 完全一致 → FR-002-DW-042

### 5.3 DemoVideo 数据流

```
主应用属性编辑器
    │
    ├── props.value ──────► v-if="value" 门控 → <video :src="value">
    └── props.objectFit ──► :style="{ objectFit }"
    │
    ▼
<video autoplay loop muted playsinline> 开始播放
    │
    │ (组件卸载时)
    ▼
onBeforeUnmount: pause() → src='' → load()
    │
    ▼
资源释放完成
```

---

## 6. 跨组件设计模式

### 6.1 文件命名规范

| 模式 | 示例 |
|------|------|
| 组件定义 | `{ComponentName}.widget.vue` |
| 元数据 | `{ComponentName}.widget.js` |
| 默认导出 | 组件：Vue 组件对象 / 元数据：Plain JS object |
| 分类 | `'3.Demo组件'`（点号分隔层级） |
| Props 分类 | `'看板组件配置'` |

### 6.2 CSS 模式

所有 Widget 共享以下 CSS 模式：

```scss
.{ComponentName} {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  // 图片/视频组件额外：
  overflow: hidden;
}
```

颜色使用：
- 主文字：`var(--desktop-text-primary)` — DemoText, DemoNumber 数值
- 次要文字：`var(--desktop-text-secondary)` — DemoNumber title/unit

### 6.3 Vue 模式

| 模式 | 使用组件 |
|------|---------|
| `defineProps` 显式声明 | 全部 |
| `computed` 计算属性 | DemoNumber (3 个) |
| `ref` + `onBeforeUnmount` | DemoVideo |
| Mustache 插值 `{{ }}` | DemoText, DemoNumber |
| `v-if` 条件渲染 | DemoNumber (title/unit), DemoImage, DemoVideo |
| `:style` 动态样式 | DemoImage, DemoVideo |

### 6.4 元数据模式

```js
export default {
  title: '中文名称',
  category: '3.Demo组件',
  avatar,
  thumbnail: null,
  rect: { unit: 'grid', width: N, height: M },
  props: { /* ... */ },
  events: [],          // 预留扩展
  propsEditors: [],    // 预留扩展
  wrapperEditors: [],  // 预留扩展
}
```

---

## 7. 宪法合规清单

| 宪法条款 | 适用性 | DemoText | DemoNumber | DemoImage | DemoVideo |
|---------|--------|----------|------------|-----------|-----------|
| 第 3 条（C-02）| 全部 | ✅ defineProps | ✅ defineProps | ✅ defineProps | ✅ defineProps |
| 第 4 条（C-03）| 全部 | ✅ title/category/default | ✅ + type:number | ✅ + type:select | ✅ + type:select |
| 第 5 条（CSS 变量）| 全部 | ✅ --desktop-text-primary | ✅ --desktop-text-primary/secondary | — | — |
| 第 6 条（Scoped）| 全部 | ✅ scoped lang="scss" | ✅ scoped lang="scss" | ✅ scoped lang="scss" | ✅ scoped lang="scss" |
| 第 7 条（Flex 居中）| 全部 | ✅ | ✅ | ✅ + overflow | ✅ + overflow |
| 第 8 条（NFR-003）| DemoVideo | N/A | N/A | N/A | ✅ pause+src=''+load() |
| 第 9 条（空值降级）| Image/Video | N/A (纯文本) | N/A (有默认值) | ✅ v-if="value" | ✅ v-if="value" |

### 7.1 宪法违规风险

无已知违规。所有组件均通过以下检查：
- ✅ 不依赖外部全局状态
- ✅ 不直接访问 localStorage
- ✅ 不 import composables
- ✅ 不硬编码色值

---

## 8. 修订历史

| 日期 | 变更 |
|------|------|
| 2026-07-21 | 初始版本，基于已实现代码分析 |
