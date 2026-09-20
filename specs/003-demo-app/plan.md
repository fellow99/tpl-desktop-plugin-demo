# 实现计划 — DemoClock App

> 模块：003-demo-app
> 类型：As-Built（基于已实现代码的实现说明）
> 版本：1.0
> 最后更新：2026-07-21

---

## 1. 源文件清单

| 文件 | 行数 | 用途 |
|------|------|------|
| `src/apps/demo/DemoClock.app.vue` | 76 | Vue SFC 组件（模板 + 逻辑 + 样式） |
| `src/apps/demo/DemoClock.app.js` | 31 | App 元数据声明（props/category/rect） |

总代码量：107 行。无额外辅助文件或工具函数。

---

## 2. 组件架构图

```
DemoClock.app.vue
├── <script setup>      (L1-43)  组件逻辑
│   ├── imports          (L9-10)  Vue API + dayjs
│   ├── defineProps      (L12-17) Props 契约
│   ├── WEEK_CN          (L20)    中文星期映射常量
│   ├── now ref          (L22)    响应式时间状态
│   ├── timeText computed(L24)    格式化时间文本
│   ├── dateText computed(L25-27) 格式化日期文本（含中文星期）
│   ├── timer 变量       (L29)    定时器 ID（非响应式）
│   ├── onMounted         (L31-35) 启动定时器
│   └── onBeforeUnmount   (L37-42) 清理定时器
├── <template>          (L45-49)  模板
│   ├── div.DemoClock   (L46)     根容器
│   ├── div.clock-time  (L47)     时间行（timeText）
│   └── div.clock-date  (L48)     日期行（dateText，条件渲染）
└── <style scoped>      (L52-76)  样式
    ├── .DemoClock      (L54-63)  根容器 flex 布局
    ├── .clock-time     (L65-70)  时间字号/字重/等宽数字
    └── .clock-date     (L72-75)  日期次要颜色/字号
```

---

## 3. Props 契约与实现映射

本表建立 spec.md 的功能需求到代码行的精确映射。

### 3.1 Props 定义

| Prop | Type | Default | 声明位置 | 元数据位置 | 对应 FR |
|------|------|---------|----------|------------|---------|
| `format` | `String` | `'HH:mm:ss'` | `.vue` L14 | `.app.js` L14-18 | FR-061 |
| `showDate` | `Boolean` | `true` | `.vue` L16 | `.app.js` L20-25 | FR-062 |

### 3.2 Props 消费点

| Prop | 消费位置 | 消费方式 |
|------|----------|----------|
| `format` | `.vue` L24 | `now.value.format(props.format)` → `timeText` computed |
| `showDate` | `.vue` L48 | `v-if="showDate"` → 条件渲染日期行 |

---

## 4. dayjs 使用模式

### 4.1 导入

```js
// .vue L10
import dayjs from 'dayjs'
```

dayjs 作为依赖在 `package.json` 中声明（`"dayjs": "^1.11.13"`），DemoClock 直接使用默认导出，不引入任何 locale 插件。

### 4.2 时间格式化

```js
// .vue L24
const timeText = computed(() => now.value.format(props.format))
```

**工作机制：**
1. `now` 是 `ref(dayjs())`，初始值为组件创建时刻的 dayjs 对象（`.vue` L22）
2. 定时器每 1000ms 更新 `now.value = dayjs()`（`.vue` L33）
3. `timeText` 是 `computed`，在 `now` 变化时自动重新计算
4. 格式化使用 `props.format` 作为 dayjs 的 `.format()` 模板参数

**模板字符串语义：** 遵循 [dayjs format 文档](https://day.js.org/docs/en/display/format)：
- `HH` — 24 小时制小时（00-23，补零）
- `mm` — 分钟（00-59，补零）
- `ss` — 秒（00-59，补零）
- `YYYY` — 四位数年份
- `MM` — 月份（01-12，补零）
- `DD` — 日期（01-31，补零）

### 4.3 日期格式化与中文星期映射

```js
// .vue L20
const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// .vue L25-27
const dateText = computed(
  () => `${now.value.format('YYYY年MM月DD日')} ${WEEK_CN[now.value.day()]}`,
)
```

**工作机制：**
1. 日期部分使用固定格式 `'YYYY年MM月DD日'`，不可配置
2. 星期部分通过 `dayjs().day()` 获取数值索引（0=周日，6=周六）
3. 索引值直接访问 `WEEK_CN` 数组获取中文星期名
4. **设计决策**：使用硬编码数组而非引入 `dayjs/locale/zh-cn`，避免增加 ~2KB 的 locale 包体积。此决策适用于仅需简单星期映射的场景。

---

## 5. setInterval 生命周期管理

### 5.1 定时器启动

```js
// .vue L29
let timer = null

// .vue L31-35
onMounted(() => {
  timer = setInterval(() => {
    now.value = dayjs()
  }, 1000)
})
```

**工作机制：**
- `timer` 使用 `let` 声明而非 `ref()`，因为定时器 ID 不需要触发响应式更新
- `onMounted` 在组件挂载到 DOM 后执行，确保模板已就绪
- 回调函数 `() => { now.value = dayjs() }` 每秒执行一次，直接替换 `now` ref 的值
- 每次替换 `now.value` 时，依赖 `now` 的 `timeText` 和 `dateText` 两个 computed 自动重新计算

### 5.2 定时器清理

```js
// .vue L37-42
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
```

**防御性设计：**
1. `if (timer)` 空值检查 — 防止在 `onMounted` 尚未执行完时组件就被卸载（极端时序）
2. `timer = null` 置空 — 防止 `onBeforeUnmount` 被重复触发时重复调用 `clearInterval`
3. 使用 `onBeforeUnmount` 而非 `onUnmounted` — 在 DOM 移除前清理，避免 Vue 尝试更新已销毁组件的计算属性

### 5.3 生命周期状态机

```
  [未挂载]  timer = null
     │
     │ onMounted()
     ▼
  [运行中]  timer = setInterval(..., 1000)
     │         now 每 1000ms 更新
     │
     │ onBeforeUnmount()
     ▼
  [已清理]  clearInterval(timer); timer = null
```

### 5.4 wujie 保活模式的特殊性

在 wujie 保活模式（`alive: true`）下：
- App 关闭时 wujie 框架触发组件卸载 → `onBeforeUnmount` 执行 → 定时器清理
- App 重新打开时 wujie 框架触发组件挂载 → `onMounted` 执行 → 新定时器创建
- 定时器不会在保活期间残留，因为 Vue 组件的挂载/卸载生命周期在保活模式下仍然正常触发

---

## 6. CSS 设计详解

### 6.1 根容器布局

```scss
// .vue L54-63
.DemoClock {
  display: flex;
  flex-direction: column;    // 垂直排列时间行和日期行
  align-items: center;       // 水平居中
  justify-content: center;   // 垂直居中
  gap: 0.5em;                // 时间行与日期行间距
  width: 100%;               // 铺满父容器宽度
  height: 100%;              // 铺满父容器高度
  color: var(--desktop-text-primary);  // 主文字色 — 宪法 C-05 合规
}
```

**设计依据：** 此布局与所有 Widget 组件的根容器布局完全一致（宪法 C-07），确保视觉外观统一。APP 容器使用 `flex-direction: column` 而非 `row`，因为时间行在上、日期行在下。

### 6.2 时间行样式

```scss
// .vue L65-70
.clock-time {
  font-size: 4em;                        // 大字号，适配 3×3 网格
  font-weight: 600;                      // 半粗体，增强可读性
  font-variant-numeric: tabular-nums;    // 等宽数字 — FR-060.2 合规
  line-height: 1.1;                      // 紧凑行高，避免多余间距
}
```

**tabular-nums 的作用：** `font-variant-numeric: tabular-nums` 使每个数字字符占用相同的水平空间。在数字跳变时（如 `20:58` → `20:59`），字符宽度保持不变，UI 不会出现水平抖动。

### 6.3 日期行样式

```scss
// .vue L72-75
.clock-date {
  color: var(--desktop-text-secondary);   // 次要文字色 — 宪法 C-05 合规
  font-size: 1.25em;                  // 较小字号，突出主次关系
}
```

### 6.4 CSS 变量体系

DemoClock 仅使用两个 CSS 变量，均来自主应用的变量体系：

| 变量 | 用途 | 对应元素 |
|------|------|----------|
| `--desktop-text-primary` | 主要文字颜色（时间行） | `.DemoClock` 根容器 |
| `--desktop-text-secondary` | 次要文字颜色（日期行） | `.clock-date` |

这些变量通过 wujie CSS 沙箱从主应用继承到子应用 iframe 中，DemoClock 不定义任何 fallback 颜色。

---

## 7. 元数据结构详解

### 7.1 完整元数据

```js
// DemoClock.app.js (31 行)
export default {
  title: 'Demo时钟',         // 宪法 C-03: title 必需
  category: 'Demo应用',      // 宪法 C-03: category 必需
  avatar: null,              // 宪法 C-03: avatar 必需（null 表示无头像）
  thumbnail: null,           // 宪法 C-03: thumbnail 可选（null 表示无缩略图）
  rect: {                    // FR-064: 默认网格尺寸 3×3
    unit: 'grid',
    width: 3,
    height: 3,
  },
  props: {                   // 宪法 C-02: 通过 props 声明可配置属性
    format: {
      title: '时间格式',                    // C-03: 中文标签
      category: '看板组件配置',              // C-03: 属性分类
      type: 'text',                        // C-03: 数据类型
      default: 'HH:mm:ss',                 // C-03: 默认值
    },
    showDate: {
      title: '显示日期',
      category: '看板组件配置',
      type: 'boolean',
      default: true,
    },
  },
  events: [],               // C-03: 事件列表（当前无事件）
  propsEditors: [],         // C-03: 自定义属性编辑器（空数组）
  wrapperEditors: [],       // C-03: 自定义外壳编辑器（空数组）
}
```

### 7.2 与 Widget 元数据的差异

| 字段 | DemoClock App | DemoText Widget | 说明 |
|------|---------------|-----------------|------|
| `category` | `'Demo应用'` | `'3.Demo组件'` | App 与 Widget 使用不同分类 |
| `rect` | `3×3` | `1×1` | App 默认网格尺寸更大 |
| `avatar` | `null` | SVG import | App 未提供头像图标 |
| `props.category` | `'看板组件配置'` | 同上 | 统一使用此分类 |

---

## 8. 功能需求实现对照表

| spec.md FR | 实现文件 | 代码行 | 实现方式 |
|------------|----------|--------|----------|
| FR-060 | `.vue` L32-34 | `setInterval(() => { now.value = dayjs() }, 1000)` | 每秒更新 ref |
| FR-060.1 | `.vue` L10, L33 | `import dayjs from 'dayjs'` + `now.value = dayjs()` | dayjs 创建当前时刻 |
| FR-060.2 | `.vue` L68 | `font-variant-numeric: tabular-nums` | CSS 等宽数字 |
| FR-061 | `.vue` L14, L24 | `format: { default: 'HH:mm:ss' }` + `now.value.format(props.format)` | computed 格式化 |
| FR-062 | `.vue` L16, L48 | `showDate: { default: true }` + `v-if="showDate"` | 条件渲染 |
| FR-062.1 | `.vue` L26 | `now.value.format('YYYY年MM月DD日') ${WEEK_CN[...]}` | 日期格式化 + 星期映射 |
| FR-062.2 | `.vue` L20 | `const WEEK_CN = ['周日','周一','周二','周三','周四','周五','周六']` | 硬编码数组，零依赖 |
| FR-062.3 | `.vue` L48 | `v-if="showDate"` | 直接 DOM 移除 |
| FR-063 | `.vue` L38-41 | `clearInterval(timer); timer = null` | onBeforeUnmount 清理 |
| FR-063.1 | `.vue` L38 | `if (timer)` | 空值检查 |
| FR-063.2 | `.vue` L40 | `timer = null` | 置空防重复清理 |
| FR-064 | `.app.js` L12 | `rect: { unit: 'grid', width: 3, height: 3 }` | 元数据声明 |
| FR-065 | `.app.js` | 全文 | 完整 AppMeta 字段 |
| FR-065.1 | `.app.js` L14-18 | `format: { title, category, type, default }` | format 属性元数据 |
| FR-065.2 | `.app.js` L20-25 | `showDate: { title, category, type, default }` | showDate 属性元数据 |
| FR-065.3 | `.app.js` L9 | `category: 'Demo应用'` | App 分类 |

---

## 9. 宪法合规检查清单

| 宪法条款 | 要求 | 合规状态 | 证据 |
|----------|------|----------|------|
| C-02: 组件响应输入约束 | 仅消费 props，无外部状态 | ✅ PASS | L12-17 defineProps；无 useGridStack/useRouter 等 import |
| C-03: 属性元数据完整性 | title/category/default 齐全 | ✅ PASS | `.app.js` L8-26 所有字段完整 |
| C-05: CSS 变量体系 | 使用 `--desktop-*` 变量 | ✅ PASS | `.vue` L62 `--desktop-text-primary`, L74 `--desktop-text-secondary` |
| C-06: CSS 作用域隔离 | `<style scoped lang="scss">` | ✅ PASS | `.vue` L52 |
| C-07: 统一设计模式 | flex 居中 + width/height 100% | ✅ PASS | `.vue` L55-61 |
| C-08: 资源清理 | onBeforeUnmount 清理 | ✅ PASS | `.vue` L37-42 clearInterval |
| C-09: 空值优雅降级 | v-if 条件渲染 | ✅ PASS | `.vue` L48 v-if="showDate" |

---

## 10. 技术决策记录 (TDR)

### TDR-003-01: 中文星期映射使用硬编码数组

**决策**: 使用 `const WEEK_CN = ['周日',...,'周六']` 硬编码日志而非引入 `dayjs/locale/zh-cn`。

**理由**:
- dayjs 中文 locale 包约 2KB（已 gzip），仅为一个索引映射引入完整的日期格式化本地化包是过度设计
- 硬编码数组仅 ~100 字节，语义清晰，一次理解终身有效
- DemoClock 无需中文月份名、相对时间等功能，这些都在 dayjs locale 中但不会被使用

**替代方案**: 引入 `import 'dayjs/locale/zh-cn'` → 已否决（体积/收益比不佳）。

### TDR-003-02: 定时器使用 let 而非 ref

**决策**: `let timer = null` 而非 `const timer = ref(null)`。

**理由**:
- 定时器 ID 仅用于挂载时赋值和卸载时清理，不需要响应式追踪
- 使用 `ref` 会导致不必要的 `Proxy` 包装和 watcher 开销
- Vue 官方最佳实践：非模板使用的值不应放入响应式系统

**替代方案**: `const timer = ref(null)` → 已否决（无意义响应式开销）。

### TDR-003-03: 日期格式固定不可配置

**决策**: 日期行使用固定格式 `'YYYY年MM月DD日'`，不通过额外的 prop 暴露。

**理由**:
- DemoClock 定位为简单演示 App，不需要日历定制化
- 如果需要自定义日期格式，用户可使用其他 Widget 组件组合实现
- 保持 Props 接口最小化（2 个 props），降低主应用属性编辑器的复杂度

---

## 11. 版本历史

| 日期 | 变更 |
|------|------|
| 2026-07-21 | 初始版本，基于已实现代码（As-Built）提取 |
