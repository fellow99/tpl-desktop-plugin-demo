# 测试用例：002-demo-widgets

> 项目：tpl-desktop-plugin-demo
> 模块：Demo Widget 组件
> 格式：Given / When / Then
> 最后更新：2026-07-21

---

## 测试概览

| 编号 | 测试对象 | 覆盖 FR | 测试目标 |
|------|---------|--------|---------|
| TC-01 | DemoText | FR-002-DW-010, DW-011 | 默认 props 渲染默认文字 |
| TC-02 | DemoText | FR-002-DW-010 | 自定义 value prop 更新渲染 |
| TC-03 | DemoNumber | FR-002-DW-020, DW-025 | 默认 props 渲染 + useGrouping 验证 |
| TC-04 | DemoNumber | FR-002-DW-021 | 精度超出上界钳位至 20 |
| TC-05 | DemoNumber | FR-002-DW-021 | 精度非法值回退至 0 |
| TC-06 | DemoNumber | FR-002-DW-022 | value 非数字回退至 0 |
| TC-07 | DemoNumber | FR-002-DW-023 | title/unit 条件渲染 |
| TC-08 | DemoImage | FR-002-DW-030 | value 为空不渲染 img |
| TC-09 | DemoImage | FR-002-DW-030, DW-031 | 有效 URL 渲染 img + alt 为空 |
| TC-10 | DemoImage | FR-002-DW-032 | objectFit 动态切换 |
| TC-11 | DemoVideo | FR-002-DW-040 | value 为空不渲染 video |
| TC-12 | DemoVideo | FR-002-DW-041 | autoplay/loop/muted/playsinline 属性验证 |
| TC-13 | DemoVideo | FR-002-DW-043 | 卸载时资源清理 |
| TC-14 | DemoImage | FR-002-DW-033 | objectFit=none 时 overflow:hidden 裁剪 |
| TC-15 | DemoNumber | FR-002-DW-023, DW-025 | title/unit 为空时不渲染对应 span |

---

## TC-01: DemoText — 默认 props 渲染默认文字

**关联 FR**: FR-002-DW-010, FR-002-DW-011

**Given**:
- DemoText 组件已挂载
- 未传入任何 props（使用默认值）

**When**:
- 组件渲染完成

**Then**:
- 组件根容器 `<div class="DemoText">` 存在
- 容器内文本内容为 `"这是一段文字"`（`value` 的默认值）
- 容器样式包含 `display: flex; align-items: center; justify-content: center`
- 容器尺寸为 `width: 100%; height: 100%`
- 文字颜色使用 `var(--desktop-text-primary)` CSS 变量

---

## TC-02: DemoText — 自定义 value prop 更新渲染

**关联 FR**: FR-002-DW-010

**Given**:
- DemoText 组件已挂载，初始 `value="初始文字"`

**When**:
- props.value 从 `"初始文字"` 更新为 `"更新后的文字"`

**Then**:
- 容器内文本内容更新为 `"更新后的文字"`
- 模板 Mustache 插值 `{{ value }}` 响应式刷新
- 其他样式属性不变

---

## TC-03: DemoNumber — 默认 props 渲染 + useGrouping 验证

**关联 FR**: FR-002-DW-020, FR-002-DW-025

**Given**:
- DemoNumber 组件已挂载
- 使用默认 props：`value=123.456`, `precision=2`

**When**:
- 组件渲染完成

**Then**:
- 存在 `<span class="number-title">`（仅当 `title` 非空时） — 默认 `title=''` 时不渲染
- 存在 `<span class="number-unit">`（仅当 `unit` 非空时） — 默认 `unit=''` 时不渲染
- `displayValue` 计算为 `Number((123.456).toFixed(2))` = `123.46`
- `NumberFlow` 组件接收 `:value="123.46"`
- `numberFormat` 对象包含 `useGrouping: false`
- `safePrecision` 为 `2`

---

## TC-04: DemoNumber — 精度超出上界钳位至 20

**关联 FR**: FR-002-DW-021

**Given**:
- DemoNumber 组件已挂载
- `precision` 传入 `25`（超出 `toFixed` 合法范围 [0, 20]）

**When**:
- `safePrecision` 计算属性求值

**Then**:
- `safePrecision.value` 为 `20`（钳位到上界）
- `Math.trunc(25)` = `25`, `Number.isFinite(25)` = `true`, `Math.min(Math.max(25, 0), 20)` = `20`
- `numberFormat.minimumFractionDigits` = `20`
- `numberFormat.maximumFractionDigits` = `20`
- `displayValue` 按 20 位小数格式化
- 组件不因精度超范围而崩溃

---

## TC-05: DemoNumber — 精度非法值回退至 0

**关联 FR**: FR-002-DW-021

**Given**:
- DemoNumber 组件已挂载

**When**:
- `precision` 分别传入 `NaN`、`Infinity`、`-Infinity`

**Then**:
- 所有情况 `safePrecision.value` 均为 `0`
- `Number.isFinite(NaN)` = `false` → 回退 `0`
- `Number.isFinite(Infinity)` = `false` → 回退 `0`
- `Number.isFinite(-Infinity)` = `false` → 回退 `0`
- `displayValue` 按 0 位小数格式化（整数显示）

---

## TC-06: DemoNumber — value 非数字回退至 0

**关联 FR**: FR-002-DW-022

**Given**:
- DemoNumber 组件已挂载
- `value` 传入非数字字符串 `"abc"`

**When**:
- `displayValue` 计算属性求值

**Then**:
- `parseFloat("abc")` = `NaN`
- `Number.isFinite(NaN)` = `false`
- `displayValue.value` 为 `0`
- `NumberFlow` 组件显示 `0`（或按 precision 格式化后的 `0.00`）
- 组件不因非法输入崩溃

**附加场景**:

| 输入 value | parseFloat 结果 | 预期 displayValue |
|-----------|----------------|------------------|
| `"abc"` | NaN | 0 |
| `null` | NaN | 0 |
| `undefined` | NaN | 0 |
| `""` | NaN | 0 |
| `Infinity` | Infinity (但 Number.isFinite = false) | 0 |
| `"123abc"` | 123 | 123 |
| `"  456  "` | 456 | 456 |

---

## TC-07: DemoNumber — title/unit 条件渲染

**关联 FR**: FR-002-DW-023

**Given**:
- DemoNumber 组件已挂载

**When**:
- 场景 A：`title="温度"`, `unit="°C"`
- 场景 B：`title=""`, `unit=""`（默认）
- 场景 C：`title="速度"`, `unit=""`（仅 title）
- 场景 D：`title=""`, `unit="km/h"`（仅 unit）

**Then**:
- 场景 A：两元素均渲染 — `<span class="number-title">温度</span>` 和 `<span class="number-unit">°C</span>`
- 场景 B：两元素均不渲染 — DOM 无 `.number-title` 或 `.number-unit`
- 场景 C：仅渲染 title — DOM 有 `.number-title`，无 `.number-unit`
- 场景 D：仅渲染 unit — DOM 无 `.number-title`，有 `.number-unit`
- 所有场景 `NumberFlow` 正常渲染

---

## TC-08: DemoImage — value 为空不渲染 img 元素

**关联 FR**: FR-002-DW-030

**Given**:
- DemoImage 组件已挂载
- `value=""`（默认空字符串）

**When**:
- 组件渲染完成

**Then**:
- 根容器 `<div class="DemoImage">` 存在
- 容器内**不存在** `<img>` 元素（`v-if="value"` 门控为 false）
- 容器为空白状态，无破损图片图标
- 容器样式保持 `display: flex; align-items: center; justify-content: center; overflow: hidden`

---

## TC-09: DemoImage — 有效 URL 渲染 img + alt 为空

**关联 FR**: FR-002-DW-030, FR-002-DW-031

**Given**:
- DemoImage 组件已挂载
- `value="https://example.com/sample.jpg"`

**When**:
- 组件渲染完成

**Then**:
- 根容器内存在一个 `<img>` 元素
- `<img>` 的 `src` 属性为 `"https://example.com/sample.jpg"`
- `<img>` 的 `alt` 属性为 `""`（空字符串）
- `<img>` 具有 class `image-content`
- `<img>` 样式 `width: 100%; height: 100%`

---

## TC-10: DemoImage — objectFit 动态切换

**关联 FR**: FR-002-DW-032

**Given**:
- DemoImage 组件已挂载
- `value` 为有效图片 URL
- 初始 `objectFit="cover"`

**When**:
- props.objectFit 依次更新为 `"contain"` → `"fill"` → `"none"` → `"scale-down"` → `"cover"`

**Then**:
- 每次更新后，`<img>` 的 `style` 属性中 `object-fit` 值同步更新

| objectFit 值 | 预期 `<img>` 的 `style.objectFit` |
|-------------|----------------------------------|
| `cover` | `cover` |
| `contain` | `contain` |
| `fill` | `fill` |
| `none` | `none` |
| `scale-down` | `scale-down` |

- 元数据 `options` 包含全部 5 个选项
- 默认值为 `cover`

---

## TC-11: DemoVideo — value 为空不渲染 video 元素

**关联 FR**: FR-002-DW-040

**Given**:
- DemoVideo 组件已挂载
- `value=""`（默认空字符串）

**When**:
- 组件渲染完成

**Then**:
- 根容器 `<div class="DemoVideo">` 存在
- 容器内**不存在** `<video>` 元素（`v-if="value"` 门控为 false）
- `videoRef.value` 为 `null`
- `onBeforeUnmount` 中的清理逻辑 `if (!video) return` 正常跳过（不抛异常）

---

## TC-12: DemoVideo — autoplay/loop/muted/playsinline 属性验证

**关联 FR**: FR-002-DW-041

**Given**:
- DemoVideo 组件已挂载
- `value` 为有效视频 URL

**When**:
- 组件渲染完成

**Then**:
- 根容器内存在一个 `<video>` 元素
- `<video>` 的 `autoplay` 属性为 `true`（HTML boolean 属性存在）
- `<video>` 的 `loop` 属性为 `true`
- `<video>` 的 `muted` 属性为 `true`
- `<video>` 的 `playsinline` 属性为 `true`
- `<video>` 的 `src` 属性为传入的 `value` URL
- `<video>` 具有 class `video-content`

---

## TC-13: DemoVideo — 卸载时资源清理

**关联 FR**: FR-002-DW-043

**Given**:
- DemoVideo 组件已挂载
- `value` 为有效视频 URL
- `<video>` 元素存在且正在播放
- 模拟 `videoRef.value` 指向真实 `<video>` DOM 节点

**When**:
- 触发组件卸载（父组件中 `v-if` 切换为 false，或路由切换）

**Then**:
- `onBeforeUnmount` 钩子执行
- `video.pause()` 被调用 — 视频停止播放
- `video.src` 被设置为 `''` — 视频源清空
- `video.load()` 被调用 — 浏览器执行资源重载/释放
- 清理完成后不抛出异常
- 无视频继续在后台播放占用内存

**边界条件**:

| 条件 | 预期行为 |
|------|---------|
| `videoRef.value` 为 `null`（value 为空时） | `if (!video) return` 提前退出，不执行后续清理 |
| `videoRef.value` 有效但 `src` 已为空 | `pause()` 可安全调用（无操作），`src=''` 和 `load()` 正常执行 |

---

## TC-14: DemoImage — objectFit=none 时 overflow:hidden 裁剪

**关联 FR**: FR-002-DW-033

**Given**:
- DemoImage 组件已挂载
- `value` 为有效图片 URL，图片原始尺寸（如 800×600）大于容器尺寸（2×2 网格）
- `objectFit="none"`

**When**:
- 组件渲染完成

**Then**:
- `<img>` 的 `style.objectFit` 为 `none`
- 图片按原始尺寸显示，可能溢出容器边界
- 根容器 `.DemoImage` 设置了 `overflow: hidden`
- 溢出容器的图片部分被裁剪（不可见）
- 用户看到的是图片在容器范围内的裁剪效果

---

## TC-15: DemoNumber — title/unit 为空时对应 span 不渲染

**关联 FR**: FR-002-DW-023, FR-002-DW-025

**Given**:
- DemoNumber 组件已挂载
- `title=""` 且 `unit=""`（默认 props）

**When**:
- 组件渲染完成，父组件传入 `title="总计"` 更新

**Then**:
- 初始渲染：DOM 中无 `.number-title`，无 `.number-unit`
- props 更新后：DOM 中出现 `.number-title` 且内容为 `"总计"`
- `.number-unit` 仍然不渲染（`unit` 仍为空）
- `v-if="title"` 和 `v-if="unit"` 独立控制各自元素的显隐
- `NumberFlow` 始终渲染，不受 title/unit 变化影响

---

## 附录 A：测试覆盖矩阵

| 组件 | 默认渲染 | Prop 更新 | 空值处理 | 精度/边缘 | 资源清理 | 样式验证 |
|------|---------|----------|---------|----------|---------|---------|
| DemoText | TC-01 | TC-02 | N/A | N/A | N/A | TC-01 |
| DemoNumber | TC-03 | TC-15 | N/A | TC-04, TC-05, TC-06 | N/A | TC-07, TC-15 |
| DemoImage | TC-09 | TC-10 | TC-08 | TC-14 | N/A | TC-09, TC-14 |
| DemoVideo | TC-12 | — | TC-11 | — | TC-13 | TC-12 |

---

## 附录 B：未覆盖的验收场景

以下场景需要集成测试环境（主应用 + wujie 沙箱）验证，不在本模块单元测试范围内：

1. **主应用"添加组件"面板**显示 Widget 分类和列表（依赖主应用 useWidgetMetas / useWujie）
2. **Widget 拖拽到桌面网格**的尺寸行为（依赖主应用 GridStack 布局引擎）
3. **属性编辑器**根据元数据渲染正确的输入控件（依赖主应用属性编辑器组件）
4. **wujie 保活模式**下 Vue 实例不重复创建（依赖 wujie 框架）
5. **CSS 变量继承**：`--desktop-text-*` 在主应用 iframe 内正确生效（依赖 wujie CSS 沙箱）

---

## 附录 C：修订历史

| 日期 | 变更 |
|------|------|
| 2026-07-21 | 初始版本，15 个测试用例覆盖 4 个 Widget 全部功能需求 |
