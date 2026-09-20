# 对外接口契约

> 项目：tpl-desktop-plugin-demo
> 类型：As-Built（基于代码的接口定义）
> 最后更新：2026-07-24

---

## 1. 接口概述

本子应用不提供 REST API。与主应用的交互全部通过 wujie 框架的**运行时接口**完成。以下定义子应用暴露给主应用（及 wujie 框架）的完整接口契约。

---

## 2. 子应用 → 主应用（暴露接口）

### 2.1 `window.$wujie.bus.$emit('plugin:ready', payload)`

**用途**: 子应用在挂载后，通过 wujie **事件总线**向主应用发送 `plugin:ready` 事件，一次性交付所有组件的元数据与组件定义。

**数据结构**:

```typescript
interface PluginReadyPayload {
  pluginName:       string                         // 插件名称，来自 window.$wujie.props.pluginName
  widgetMetas:      Record<string, WidgetMeta>     // Widget 元数据字典
  widgetComponents: Record<string, Component>      // Widget 组件定义字典
  appMetas:         Record<string, AppMeta>        // App 元数据字典
  appComponents:    Record<string, Component>      // App 组件定义字典
  backgroundMetas:  Record<string, DesktopBackgroundMeta>  // 背景元数据字典
  components:       Record<string, Component>      // UI 组件定义字典
}
```

**设置时机**: `window.__WUJIE_MOUNT` 回调中，`appInstance.mount('#app')` 之后立即发送。

**实现位置**: `src/main.js` L17-25

**消费侧**: 主应用通过监听 `window.$wujie.bus` 的 `plugin:ready` 事件接收 payload，分别调用 `app.component()` 全局注册组件、`injectWidgetMetas()` / `injectAppMetas()` / `injectBackgroundMetas()` 注入元数据。

---

## 3. wujie 框架 → 子应用（调用接口 + 注入输入）

### 3.1 `window.__WUJIE_MOUNT`

**用途**: wujie 框架在子应用需要挂载时调用此函数。

**签名**:

```typescript
function __WUJIE_MOUNT(): void
```

**实现位置**: `src/main.js` L11-28

**行为**:
1. 检查 `appInstance` 是否为 null（保活模式下仅创建一次）
2. 创建 Vue 应用实例，挂载到 `#app`
3. 通过 `window.$wujie.bus.$emit('plugin:ready', payload)` 向主应用交付所有组件
4. console.log 输出注册的组件清单（widget/app/background 数量）

### 3.2 `window.__WUJIE_UNMOUNT`

**用途**: wujie 框架在子应用需要卸载时调用此函数。

**签名**:

```typescript
function __WUJIE_UNMOUNT(): void
```

**实现位置**: `src/main.js` L30-33

**行为**:
1. 调用 `appInstance?.unmount()` 销毁 Vue 实例
2. 将 `appInstance` 置为 null

### 3.3 `window.$wujie.props.pluginName`

**类型**: `string`

**用途**: wujie 框架通过 props 注入到子应用的插件名称标识符。主应用启动子应用时传入，用于日志输出和身份识别。

**数据流**: 主应用 `startApp({ name: 'tpl-desktop-plugin-demo', props: { pluginName: 'tpl-desktop-plugin-demo' } })` → wujie 框架注入 → 子应用通过 `window.$wujie.props.pluginName` 读取。

**使用位置**: `src/main.js` L15 → 嵌入 `plugin:ready` payload 和 console.log

### 3.4 `window.$wujie.bus`

**类型**: `{ $emit: (event: string, ...args: any[]) => void }`

**用途**: wujie 框架注入的子应用事件总线实例。子应用通过 `$emit` 向主应用发送事件（如 `plugin:ready`），主应用通过同名 `$on` 监听。

**使用位置**: `src/main.js` L17

---

## 4. 子应用 → wujie 框架（主动调用）

### 4.1 `window.__WUJIE.mount()`

**用途**: Vite ESM 模块异步加载完成后，子应用主动通知 wujie 框架脚本已就绪。

**调用时机**: `main.js` 中定义完 `__WUJIE_MOUNT` 后立即调用。

**调用位置**: `src/main.js` L35

```js
window.__WUJIE.mount()
```

**说明**: 这是 Vite 子应用的**关键适配步骤**。因为 `<script type="module">` 是异步加载的，wujie 框架可能在脚本执行完之前就尝试调用 `__WUJIE_MOUNT`。主动调用 `window.__WUJIE.mount()` 确保框架在脚本就绪后正确触发挂载流程。

---

## 5. wujie 框架注入 → 子应用（环境标识）

### 5.1 `window.__POWERED_BY_WUJIE__`

**类型**: `boolean | undefined`

**用途**: 子应用通过此变量判断当前是否运行在 wujie 沙箱中。

**取值**:
- `true`: 运行在 wujie 沙箱中（index.html 通过主应用加载）
- `undefined` / `false`: 独立浏览器运行（index.html 直接访问）

**使用位置**: `src/main.js` L10

### 5.2 `window.__WUJIE`

**类型**: `object | undefined`

**用途**: wujie 沙箱实例，子应用通过 `__WUJIE.mount()` 主动通知框架就绪。

**使用位置**: `src/main.js` L35

---

## 6. Vue 组件接口（Widget Props 契约）

### 6.1 DemoText Widget

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | String | `'这是一段文字'` | No |

### 6.2 DemoNumber Widget

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | Number | `123.456` | No |
| `precision` | Number | `2` | No |
| `title` | String | `''` | No |
| `unit` | String | `''` | No |

### 6.3 DemoImage Widget

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | String | `''` | No |
| `objectFit` | String | `'cover'` | No |

`objectFit` 可选值: `'cover'` | `'contain'` | `'fill'` | `'none'` | `'scale-down'`

### 6.4 DemoVideo Widget

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | String | `''` | No |
| `objectFit` | String | `'cover'` | No |

`objectFit` 可选值: 同 DemoImage

### 6.5 DemoClock App

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `format` | String | `'HH:mm:ss'` | No |
| `showDate` | Boolean | `true` | No |

---

## 7. 背景资源接口

### 7.1 背景元数据导出格式

每个 `.bg.js` 文件导出以下结构：

```typescript
interface BackgroundMetaExport {
  title: string        // 如 '暗色背景01'
  category: string     // 如 '暗色系'
  theme: 'dark' | 'light'
  type: 'image' | 'video'
  avatar: string       // SVG import
  thumbnail: string    // jpg import
  image?: string       // type='image' 时存在（jpg import）
  video?: string       // type='video' 时存在（webm import）
}
```

### 7.2 背景资源文件清单

| 分类 | 数量 | 文件 |
|------|------|------|
| 暗色系 (dark) | 4 套 | `dark-001~004` (.bg.js + .jpg + -s.jpg) |
| 浅色系 (light) | 4 套 | `light-001~004` (.bg.js + .jpg + -s.jpg) |
| 动态 (video) | 4 套 | `webm-001~004` (.bg.js + .webm + -s.jpg) |

---

## 8. 接口稳定性承诺

| 接口 | 稳定性 | 说明 |
|------|--------|------|
| `window.__WUJIE_MOUNT` / `__WUJIE_UNMOUNT` | **稳定** | wujie 框架标准生命周期，不可变更 |
| `window.__WUJIE.mount()` | **稳定** | wujie 框架标准就绪通知，不可变更 |
| `window.$wujie.bus.$emit('plugin:ready', payload)` | **稳定** | 事件总线交付接口，payload 结构与 WidgetMeta/AppMeta/DesktopBackgroundMeta 同构 |
| `window.$wujie.props.pluginName` | **稳定** | wujie props 注入，由主应用 startApp 时指定 |
| `window.$wujie.bus` | **稳定** | wujie 框架注入的事件总线实例 |
| Widget Props 接口 | **稳定** | 通过元数据声明，主应用属性编辑器据此生成表单 |
| `.bg.js` 导出格式 | **稳定** | 与主应用 `DesktopBackgroundMeta` 同构 |
