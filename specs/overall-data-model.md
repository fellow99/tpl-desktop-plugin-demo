# 数据模型

> 项目：tpl-desktop-plugin-demo
> 类型：As-Built（基于实际代码的数据结构）
> 最后更新：2026-07-21

---

## 1. 核心实体

### 1.1 WidgetMeta — Widget 组件元数据

描述一个 Widget 组件的可配置属性、分类、尺寸和行为。

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `title` | string | ✅ | 组件中文显示名称 | `'Demo文字'` |
| `category` | string | ✅ | 分类路径，点号分隔 | `'3.Demo组件'` |
| `avatar` | string (import) | ✅ | 组件头像/图标（SVG import） | `import avatar from './avatar.svg'` |
| `thumbnail` | string \| null | — | 缩略图，null 表示无缩略图 | `null` |
| `rect` | object | ✅ | 默认网格占用尺寸 | `{ unit: 'grid', width: 1, height: 1 }` |
| `rect.unit` | string | ✅ | 尺寸单位，固定为 `'grid'` | `'grid'` |
| `rect.width` | number | ✅ | 默认宽度（网格列数） | `1` |
| `rect.height` | number | ✅ | 默认高度（网格行数） | `1` |
| `props` | Record\<string, PropMeta\> | ✅ | 可配置属性字典 | 见 §1.2 |
| `events` | string[] | ✅ | 支持的事件列表，当前为空数组 | `[]` |
| `propsEditors` | any[] | ✅ | 自定义属性编辑器列表，当前为空数组 | `[]` |
| `wrapperEditors` | any[] | ✅ | 自定义外壳编辑器列表，当前为空数组 | `[]` |
| `compName` | string | (运行时注入) | 组件注册名，由 `src/*/index.js` 自动扫描模块补充 | `'DemoText'` |

### 1.2 PropMeta — 属性元数据

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `title` | string | ✅ | 属性中文标签 | `'文本内容'` |
| `category` | string | ✅ | 属性分类 | `'看板组件配置'` |
| `type` | string | — | 属性数据类型（默认 `'text'`） | `'number'` \| `'text'` \| `'select'` \| `'boolean'` |
| `default` | any | ✅ | 属性默认值 | `'这是一段文字'` |
| `options` | { label, value }[] | — | 仅 `type='select'` 时存在 | `[{ label: '覆盖', value: 'cover' }, ...]` |

### 1.3 AppMeta — App 组件元数据

结构与 WidgetMeta 完全一致，仅 `category` 命名不同（如 `'Demo应用'`）。详见 §1.1。

### 1.4 DesktopBackgroundMeta — 桌面背景元数据

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `title` | string | ✅ | 背景中文名称 | `'暗色背景01'` |
| `category` | string | ✅ | 背景分类 | `'暗色系'` \| `'浅色系'` \| `'动态背景'` |
| `theme` | string | ✅ | 关联主题 | `'dark'` \| `'light'` |
| `type` | string | ✅ | 背景类型 | `'image'` \| `'video'` |
| `avatar` | string (import) | ✅ | 头像图标（SVG） | `import avatar from '../avatar.svg'` |
| `thumbnail` | string (import) | ✅ | 缩略图（jpg） | `import thumbnail from './dark-001-s.jpg'` |
| `image` | string (import) | — | 背景原图（type='image' 时） | `import image from './dark-001.jpg'` |
| `video` | string (import) | — | 背景视频（type='video' 时） | `import video from './webm-001.webm'` |
| `name` | string | (运行时注入) | 背景唯一标识，由 `src/backgrounds/index.js` 从文件名提取 | `'dark-001'` |

### 1.5 WidgetRegistry — Widget 组件注册表

内部数据结构，用于 `main.js` 和各 `src/*/index.js` 自动扫描模块中追踪组件定义和元数据的配对关系。

```js
// 结构
{
  DemoText: {
    component: VueComponent,    // .vue 文件的 default export
    meta: MetaObject,           // .widget.js 的 default export
  },
  // ...
}
```

### 1.6 PluginReadyPayload — 子应用通过 wujie 事件总线暴露的组件数据

```js
// window.$wujie.bus.$emit('plugin:ready', payload) 的 payload 结构
{
  pluginName: string,
  widgetMetas: Record<string, WidgetMeta>,         // compName → WidgetMeta
  widgetComponents: Record<string, Component>,     // compName → Vue Component
  appMetas: Record<string, AppMeta>,               // compName → AppMeta
  appComponents: Record<string, Component>,        // compName → Vue Component
  backgroundMetas: Record<string, DesktopBackgroundMeta>,  // name → DesktopBackgroundMeta
  components: Record<string, Component>,           // name → Vue Component (UI components)
}
```

### 1.7 组件字典 — 子应用内部组件定义

```js
// WidgetComponents / AppComponents 的结构
{
  DemoText: Component,
  DemoNumber: Component,
  DemoImage: Component,
  DemoVideo: Component,
  DemoClock: Component,
}
```

---

## 2. 状态机

### 2.1Demo 视频 Widget 生命周期状态

```
  [未挂载]
     │ onMounted
     ▼
  [播放中]  ← autoplay + loop + muted
     │         video.play()
     │ onBeforeUnmount
     ▼
  [已清理]  ← video.pause() + src='' + load()
```

### 2.2Demo 时钟 App 生命周期状态

```
  [未挂载]
     │ onMounted
     ▼
  [运行中]  ← setInterval(() => now = dayjs(), 1000)
     │ onBeforeUnmount
     ▼
  [已清理]  ← clearInterval(timer)
```

### 2.3 wujie 子应用生命周期状态

```
  [未加载]
     │ wujie 框架加载 index.html
     ▼
  [脚本加载中]  ← Vite ESM module 异步下载
     │ main.js 执行完毕
     ▼
  [就绪等待]    ← __WUJIE_MOUNT 已定义，等待框架调用
     │ window.__WUJIE.mount() 或 wujie 框架主动调用
     ▼
  [已挂载]      ← Vue 实例创建 + 组件自动扫描 + bus.emit('plugin:ready')
     │ wujie 框架调用 __WUJIE_UNMOUNT 或保活模式 deactivated
     ▼
  [已卸载/挂起] ← app.unmount() + 引用清理
```

---

## 3. 验证规则

### 3.1 DemoNumber Widget 输入验证

| 属性 | 验证规则 | 非法值处理 |
|------|----------|------------|
| `value` | `parseFloat(value)` 结果须为有限数 | 回退为 `0` |
| `precision` | `Math.trunc(Number(precision))` 须为整数且在 0~20 之间 | 钳位到 0~20，NaN/Infinity 回退为 0 |

### 3.2 DemoImage/DemoVideo Widget 空值验证

| 属性 | 验证规则 | 处理 |
|------|----------|------|
| `value` | 是否为空字符串 `''` | `v-if="value"` — 不渲染对应元素 |

---

## 4. 数据来源标识

所有组件元数据的 `compName` 字段在 `src/*/index.js` 自动扫描模块中自动补充，确保主应用加载时可以正确识别组件来源。

主应用侧通过监听 `plugin:ready` 事件获取所有组件元数据和定义，注入 `useWidgetMetas`/`useAppMetas`/`useBackgroundMetas`，并标记 `source: 'plugin:tpl-desktop-plugin-demo'`（当 `_plugin` 字段存在时，见主应用 `specs/overall-data-model.md` §WidgetMeta 扩展字段）。

---

## 5. 版本历史

| 日期 | 变更 |
|------|------|
| 2026-07-21 | 初始版本，基于已实现代码提取 |
