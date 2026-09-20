# 测试用例 — DemoClock App

> 模块：003-demo-app
> 来源：spec.md / plan.md
> 格式：Given / When / Then
> 用例数：12
> 版本：1.0
> 最后更新：2026-07-21

---

## 测试范围说明

以下测试用例覆盖 DemoClock App 的全部功能需求（FR-060 ~ FR-065）及关键非功能需求（NFR-060 ~ NFR-062）。测试应在以下两种环境中执行：

- **独立调试模式**: `main.js` 直接挂载 DemoClock
- **wujie 沙箱模式**: 通过主应用加载 DemoClock（含保活模式 `alive: true`）

---

## TC-001: 默认 props 渲染（FR-060, FR-060.1, FR-062）

**目标**: 验证组件使用默认 props 能正确渲染时间和日期。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载，未传入任何 props（使用默认值 `format: 'HH:mm:ss'`, `showDate: true`） |
| **When** | 挂载后立即检查 DOM 内容 |
| **Then** | 根容器 class 为 `DemoClock` |
| **And** | `.clock-time` 元素存在，显示格式为 `HH:mm:ss` 的当前时间（如 `20:42:15`） |
| **And** | `.clock-date` 元素存在，显示格式为 `YYYY年MM月DD日 周X` 的当前日期（如 `2026年07月21日 周二`） |
| **And** | `.clock-date` 中的星期为中文（周日/周一/周二/周三/周四/周五/周六 之一） |

---

## TC-002: 时间每秒更新一次（FR-060, FR-060.1, NFR-060）

**目标**: 验证时间显示每秒精确更新。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载，`format` 为 `'HH:mm:ss'` |
| **When** | 记录 `.clock-time` 的文本内容 `t0`，等待恰好 1 秒后记录文本内容 `t1` |
| **Then** | `parseInt(t1.slice(-2))` 等于 `(parseInt(t0.slice(-2)) + 1) % 60`（秒数递增 1） |
| **And** | 再等待恰好 1 秒后记录 `t2`，秒数继续递增 |

**额外验证**：使用 `vi.advanceTimersByTime(1000)` 推进 fake timers 后，`now.value` 更新为新的 dayjs 对象（毫秒级精度），确保 dayjs 对象确实被替换而非在原对象上修改。

---

## TC-003: 时间格式化 — 自定义格式（FR-061）

**目标**: 验证 `format` props 改变后时间显示格式相应变化。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载，`format` 初始为 `'HH:mm:ss'` |
| **When** | 将 `format` 更新为 `'HH:mm'` |
| **Then** | `.clock-time` 仅显示小时和分钟，格式为 `HH:mm`（如 `20:42`） |
| **When** | 将 `format` 更新为 `'YYYY-MM-DD HH:mm:ss'` |
| **Then** | `.clock-time` 显示完整日期时间（如 `2026-07-21 20:42:15`） |
| **When** | 将 `format` 更新为 `'A h:mm:ss'`（12 小时制 + AM/PM） |
| **Then** | `.clock-time` 显示 12 小时制时间（如 `PM 8:42:15`） |

---

## TC-004: empty/空字符串 format 处理（FR-061.2）

**目标**: 验证空 format 的行为——dayjs 对空模板返回空字符串。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载 |
| **When** | 将 `format` 设为 `''`（空字符串） |
| **Then** | `.clock-time` 元素文本为空字符串 |
| **And** | `.clock-time` 元素仍存在于 DOM 中（`v-if` 仅在 `.clock-date` 上使用） |
| **And** | 组件不抛出异常 |

---

## TC-005: 日期行显示与隐藏切换（FR-062, FR-062.3）

**目标**: 验证 `showDate` prop 切换时日期行的显/隐行为。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载，`showDate` 为 `true`（默认值） |
| **When** | 检查 DOM |
| **Then** | `.clock-date` 元素存在于 DOM 中，显示完整日期文本 |
| **When** | 将 `showDate` 更新为 `false` |
| **Then** | `.clock-date` 元素完全不存在于 DOM 中（`v-if="showDate"` 移除元素，非 `display:none`） |
| **When** | 将 `showDate` 更新回 `true` |
| **Then** | `.clock-date` 元素重新出现在 DOM 中，显示当前日期文本 |
| **And** | 容器 flex layout 正常，`.clock-time` 垂直居中（不再因日期行缺失而偏位） |

---

## TC-006: 中文星期映射正确性（FR-062.1, FR-062.2, FR-062.4）

**目标**: 验证 `WEEK_CN` 数组中所有 7 个映射与 `dayjs().day()` 返回值的对应关系。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载，`showDate` 为 `true` |
| **When** | 分别模拟 `dayjs().day()` 返回 0, 1, 2, 3, 4, 5, 6 |
| **Then** | `dateText` 分别以 `周日`、`周一`、`周二`、`周三`、`周四`、`周五`、`周六` 结尾 |

**实现提示**: 由于 `dateText` 使用了 `now.value.day()`，可通过注入 mock dayjs 对象（返回特定 `.day()` 值）进行单元测试。

---

## TC-007: 定时器清理 — clearInterval 调用（FR-063, FR-063.1, FR-063.2）

**目标**: 验证组件卸载时定时器被正确清理。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载，`setInterval` 已被调用（可用 vi.spyOn 验证） |
| **When** | 卸载组件（触发 `onBeforeUnmount`） |
| **Then** | `clearInterval` 被调用，参数为 `setInterval` 返回的 timer ID |
| **And** | `timer` 变量被重置为 `null` |
| **And** | 如果再次触发 `onBeforeUnmount`（模拟极端情况），不再调用 `clearInterval`（因为 `if (timer)` 检查失败） |

---

## TC-008: 定时器泄漏验证 — 反复挂载/卸载（NFR-062, FR-063.3）

**目标**: 验证组件反复挂载和卸载不产生定时器泄漏。

| 步骤 | 内容 |
|------|------|
| **Given** | 一个可控制的 DemoClock 挂载/卸载测试环境 |
| **When** | 挂载 DemoClock → 卸载 → 挂载 → 卸载，重复 5 次 |
| **Then** | 每次挂载时 `setInterval` 调用次数 +1 |
| **And** | 每次卸载时 `clearInterval` 调用次数 +1 |
| **And** | 测试结束时，活跃定时器数量为 0（`setInterval` 调用总数 = `clearInterval` 调用总数） |
| **And** | 无 "attempted to update unmounted component" 警告 |

---

## TC-009: 组件重新挂载后时间继续更新（FR-063.3）

**目标**: 验证在 wujie 保活模式的"关闭 → 重新打开"场景下，定时器正常工作。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载（timer 1 运行中） |
| **When** | 卸载 DemoClock（timer 1 被清除） |
| **And** | 重新挂载 DemoClock（timer 2 创建） |
| **Then** | `.clock-time` 显示当前时间（非卸载时刻的时间） |
| **And** | 时间继续每秒更新 |
| **And** | timer 1 ≠ timer 2（新定时器 ID 不同于旧 ID） |

---

## TC-010: DOM 结构与 CSS 合规验证（FR-060.2, 宪法 C-05, C-06, C-07）

**目标**: 验证渲染的 DOM 结构和样式满足宪法要求。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载，使用默认 props |
| **When** | 检查根容器的 computed styles |
| **Then** | `display` 为 `flex` |
| **And** | `flex-direction` 为 `column` |
| **And** | `align-items` 为 `center` |
| **And** | `justify-content` 为 `center` |
| **And** | `width` 为 `100%`，`height` 为 `100%` |
| **When** | 检查 `.clock-time` 的 computed styles |
| **Then** | `font-variant-numeric` 为 `tabular-nums` |
| **And** | `font-size` 为 `4em`（或计算后的等效 px 值） |
| **And** | `font-weight` 为 `600` |
| **When** | 检查 `.clock-date` 的 computed styles |
| **Then** | `font-size` 为 `1.25em`（或计算后的等效 px 值） |
| **When** | 检查元素样式隔离 |
| **Then** | `.clock-time` 和 `.clock-date` 有 `data-v-*` scoped 属性（Vue scoped CSS 自动添加） |
| **And** | 颜色值来自 `var(--desktop-text-primary)` 或 `var(--desktop-text-secondary)`（非硬编码色值如 `#000`、`#333`） |

---

## TC-011: null/undefined props 降级行为

**目标**: 验证 props 传入 null 或 undefined 时的行为是否与默认值行为一致。

| 步骤 | 内容 |
|------|------|
| **Given** | DemoClock 组件已挂载 |
| **When** | 将 `format` 设为 `null`（JavaScript 显式传入 null） |
| **Then** | `timeText` 使用 dayjs 处理 `null` 的默认行为（dayjs 将 null 视为无效输入，`.format(null)` 返回空字符串） |
| **And** | 组件不抛出异常 |
| **When** | 将 `showDate` 设为 `undefined` |
| **Then** | 由于 Vue props 的 default 机制，`showDate` 回退为默认值 `true` |
| **And** | `.clock-date` 仍在 DOM 中显示 |

**注意**: Vue 的 `defineProps` 默认值机制仅在 prop 值为 `undefined` 时触发。显式传入 `null` 不会触发默认值回退。

---

## TC-012: 多实例定时器隔离

**目标**: 验证同一页面中存在多个 DemoClock 实例时，各实例的定时器独立运行、独立清理。

| 步骤 | 内容 |
|------|------|
| **Given** | 页面中同时挂载 2 个 DemoClock 实例（instance-A 使用默认 props，instance-B 使用 `format: 'HH:mm'`） |
| **When** | 检查两个实例的内容 |
| **Then** | instance-A 的 `.clock-time` 显示 `HH:mm:ss` 格式 |
| **And** | instance-B 的 `.clock-time` 显示 `HH:mm` 格式 |
| **And** | 两个实例的时间更新互不影响 |
| **When** | 卸载 instance-A |
| **Then** | instance-A 的定时器被清除 |
| **And** | instance-B 继续正常运行，时间继续更新 |
| **When** | 再卸载 instance-B |
| **Then** | instance-B 的定时器被清除 |
| **And** | 无定时器残留，`clearInterval` 调用总数 = `setInterval` 调用总数 = 2 |

---

## 附录 A: 测试环境配置

### A.1 依赖

```
vue@^3.5.0
dayjs@^1.11.13
vitest (单元测试)
@vue/test-utils (组件挂载测试)
```

### A.2 Fake Timers

所有涉及时间推进的测试（TC-002, TC-007, TC-008, TC-009）应使用 vitest 的 fake timers：

```js
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})
```

### A.3 dayjs Mock

涉及特定日期/星期的测试（TC-006）可 mock dayjs：

```js
vi.mock('dayjs', () => {
  const actualDayjs = vi.importActual('dayjs')
  return {
    default: vi.fn((...args) => {
      if (args.length === 0) return actualDayjs('2026-07-21T20:42:15') // 周二
      return actualDayjs(...args)
    }),
  }
})
```

---

## 附录 B: 需求覆盖矩阵

| 测试用例 | 覆盖的 FR/NFR |
|----------|---------------|
| TC-001 | FR-060, FR-060.1, FR-062 |
| TC-002 | FR-060, FR-060.1, NFR-060 |
| TC-003 | FR-061 |
| TC-004 | FR-061.2 |
| TC-005 | FR-062, FR-062.3 |
| TC-006 | FR-062.1, FR-062.2, FR-062.4 |
| TC-007 | FR-063, FR-063.1, FR-063.2 |
| TC-008 | NFR-062, FR-063.3 |
| TC-009 | FR-063.3 |
| TC-010 | FR-060.2, C-05, C-06, C-07 |
| TC-011 | FR-061 (边界), Vue props 默认值机制 |
| TC-012 | FR-063 (多实例隔离) |

---

## 附录 C: 版本历史

| 日期 | 变更 |
|------|------|
| 2026-07-21 | 初始版本，12 个测试用例全覆盖 |

---

*全文覆盖 spec.md 第 2 节全部功能需求（FR-060 ~ FR-065）及第 3 节关键非功能需求（NFR-060 ~ NFR-062）。*
