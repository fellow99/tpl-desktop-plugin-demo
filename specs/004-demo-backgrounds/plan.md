# 004-demo-backgrounds 实现计划

> 项目：tpl-desktop-plugin-demo
> 模块：桌面背景资源集
> 类型：As-Built（基于已实现代码）
> 最后更新：2026-07-24

---

## 1. 目录结构

```
src/backgrounds/
├── avatar.svg                      # 共享头像图标（1 个文件，所有 12 套背景共用）
├── index.js                        # 自动扫描注册入口
├── dark/                           # 暗色系背景（4 套 × 3 种文件 = 12 个文件）
│   ├── dark-001.bg.js              # 元数据声明
│   ├── dark-001.jpg                # 全尺寸原图
│   ├── dark-001-s.jpg              # 缩略图
│   ├── dark-002.bg.js
│   ├── dark-002.jpg
│   ├── dark-002-s.jpg
│   ├── dark-003.bg.js
│   ├── dark-003.jpg
│   ├── dark-003-s.jpg
│   ├── dark-004.bg.js
│   ├── dark-004.jpg
│   └── dark-004-s.jpg
├── light/                          # 浅色系背景（4 套 × 3 种文件 = 12 个文件）
│   ├── light-001.bg.js
│   ├── light-001.jpg
│   ├── light-001-s.jpg
│   ├── light-002.bg.js
│   ├── light-002.jpg
│   ├── light-002-s.jpg
│   ├── light-003.bg.js
│   ├── light-003.jpg
│   ├── light-003-s.jpg
│   ├── light-004.bg.js
│   ├── light-004.jpg
│   └── light-004-s.jpg
└── video/                          # 动态视频背景（4 套 × 3 种文件 = 12 个文件）
    ├── webm-001.bg.js
    ├── webm-001.webm               # WebM 视频资源
    ├── webm-001-s.jpg
    ├── webm-002.bg.js
    ├── webm-002.webm
    ├── webm-002-s.jpg
    ├── webm-003.bg.js
    ├── webm-003.webm
    ├── webm-003-s.jpg
    ├── webm-004.bg.js
    ├── webm-004.webm
    └── webm-004-s.jpg
```

### 文件统计

| 类别 | 数量 | 路径模式 |
|------|------|----------|
| 元数据文件（`.bg.js`） | 12 | `src/backgrounds/{dark,light,video}/*.bg.js` |
| 全尺寸图片（`.jpg`） | 8 | `src/backgrounds/{dark,light}/[name].jpg` |
| 缩略图（`-s.jpg`） | 12 | `src/backgrounds/{dark,light,video}/[name]-s.jpg` |
| 视频资源（`.webm`） | 4 | `src/backgrounds/video/[name].webm` |
| 共享头像（`.svg`） | 1 | `src/backgrounds/avatar.svg` |
| 自动扫描入口 | 1 | `src/backgrounds/index.js` |
| **合计** | **38** | |

> 注：视频背景的缩略图虽为 `.jpg` 格式，但不计入"全尺寸图片"类别——视频背景的全尺寸资源是 `.webm` 文件。

---

## 2. 资源命名约定

### 2.1 背景标识名

每个背景有一个唯一标识名（`name` 字段），由目录前缀 + 序号组成：

| 目录 | 标识名范围 | 数量 |
|------|-----------|------|
| `dark/` | `dark-001` ~ `dark-004` | 4 |
| `light/` | `light-001` ~ `light-004` | 4 |
| `video/` | `webm-001` ~ `webm-004` | 4 |

标识名的命名规则：
- 格式：`{category-prefix}-{NNN}`
- `{category-prefix}`：`dark`、`light`、`webm`
- `{NNN}`：三位数字，从 `001` 递增

### 2.2 文件命名模式

每个背景的三类文件遵循一致的命名模式：

| 文件类型 | 图片背景（dark/light） | 视频背景（video） |
|----------|------------------------|-------------------|
| 元数据 | `{name}.bg.js` | `{name}.bg.js` |
| 全尺寸资源 | `{name}.jpg` | `{name}.webm` |
| 缩略图 | `{name}-s.jpg` | `{name}-s.jpg` |

### 2.3 缩略图约定

- 缩略图文件名 = 原始文件名 + `-s` 后缀（插入在扩展名前）
- 缩略图始终使用 JPEG 格式（`.jpg`），即使视频背景的缩略图也是 `.jpg`
- 缩略图与原始资源放在同一目录下

---

## 3. `.bg.js` 元数据文件格式

### 3.1 图片背景（dark/light 系列）

**文件位置**：`src/backgrounds/{dark,light}/{name}.bg.js`

**标准内容**（以 `dark-001.bg.js` 为例）：

```js
// src/backgrounds/dark/dark-001.bg.js
import avatar from '../avatar.svg'
import thumbnail from './dark-001-s.jpg'
import image from './dark-001.jpg'

export default {
    title: '暗色背景01',
    category: '暗色系',
    theme: 'dark',
    type: 'image',
    avatar: avatar,
    thumbnail: thumbnail,
    image: image
};
```

**import 路径说明**：

| 导入变量 | 路径类型 | 说明 |
|----------|----------|------|
| `avatar` | `'../avatar.svg'` | 相对路径，向上一级到 `backgrounds/` 根目录，所有 `.bg.js` 统一引用 |
| `thumbnail` | `'./{name}-s.jpg'` | 相对路径，同目录下的缩略图 |
| `image` | `'./{name}.jpg'` | 相对路径，同目录下的全尺寸图片 |

### 3.2 视频背景（webm 系列）

**文件位置**：`src/backgrounds/video/{name}.bg.js`

**标准内容**（以 `webm-001.bg.js` 为例）：

```js
// src/backgrounds/video/webm-001.bg.js
import avatar from '../avatar.svg'
import thumbnail from './webm-001-s.jpg'
import video from './webm-001.webm'

export default {
    title: '动态背景01',
    category: '动态背景',
    theme: 'dark',
    type: 'video',
    avatar: avatar,
    thumbnail: thumbnail,
    video: video
};
```

### 3.3 各背景的 title 汇总

| 分类 | 序号 | `name` | `title` |
|------|------|--------|---------|
| 暗色系 | 001 | `dark-001` | `'暗色背景01'` |
| 暗色系 | 002 | `dark-002` | `'暗色背景02'` |
| 暗色系 | 003 | `dark-003` | `'暗色背景03'` |
| 暗色系 | 004 | `dark-004` | `'暗色背景04'` |
| 浅色系 | 001 | `light-001` | `'浅色背景01'` |
| 浅色系 | 002 | `light-002` | `'浅色背景02'` |
| 浅色系 | 003 | `light-003` | `'浅色背景03'` |
| 浅色系 | 004 | `light-004` | `'浅色背景04'` |
| 动态背景 | 001 | `webm-001` | `'动态背景01'` |
| 动态背景 | 002 | `webm-002` | `'动态背景02'` |
| 动态背景 | 003 | `webm-003` | `'动态背景03'` |
| 动态背景 | 004 | `webm-004` | `'动态背景04'` |

### 3.4 字段约束

- `title`：中文标签，格式 `'{分类前缀}{序号}'`，如 `'暗色背景01'`
- `category`：与 `title` 无直接映射关系——例如视频背景的 `title` 为 `'动态背景01'` 但 `category` 为 `'动态背景'`（无序号）。分类命名规则：
  - dark 系列 → `'暗色系'`
  - light 系列 → `'浅色系'`
  - webm 系列 → `'动态背景'`
- `theme`：`'dark'` 或 `'light'`，与背景视觉色调一致，视频背景固定为 `'dark'`
- `type`：`'image'` 或 `'video'`，决定后续渲染方式
- `avatar`：Vite import 路径，所有背景指向同一个 `avatar.svg`
- `thumbnail`：Vite import 路径，指向 `-s.jpg` 缩略图
- `image`（仅图片背景）：Vite import 路径，指向全尺寸 `.jpg`
- `video`（仅视频背景）：Vite import 路径，指向 `.webm` 视频

---

## 4. 自动扫描注册机制

### 4.1 glob 模式

**代码位置**：`src/backgrounds/index.js`

```js
const bgModules = import.meta.glob('./**/*.bg.js', { eager: true })
```

**参数说明**：

| 参数 | 值 | 说明 |
|------|-----|------|
| `pattern` | `'./**/*.bg.js'` | 递归匹配当前目录（`backgrounds/`）下任意深度的 `.bg.js` 文件 |
| `options` | `{ eager: true }` | 同步导入，在模块加载时立即解析所有匹配的模块（非 lazy 模式） |

**返回值**：`Record<string, Module>`，key 为相对于当前文件（`src/backgrounds/index.js`）的模块路径。

例如，对于 `dark-001.bg.js`：
```js
{
  './dark/dark-001.bg.js': { default: { title: '暗色背景01', ... } },
  './dark/dark-002.bg.js': { default: { title: '暗色背景02', ... } },
  // ...
  './video/webm-004.bg.js': { default: { title: '动态背景04', ... } },
}
```

**为什么用 `eager: true`**：背景元数据在 `src/backgrounds/index.js` 加载时一次性收集到 `backgroundRegistry` 中，随后作为 `BackgroundMetas` 导出。`src/main.js` 在 `__WUJIE_MOUNT` 生命周期中通过 `window.$wujie.bus.$emit('plugin:ready', { backgroundMetas: BackgroundMetas })` 暴露给主应用。不需要懒加载——主应用在接收到 `plugin:ready` 事件时同步获取所有背景元数据。

### 4.2 注册循环

**代码位置**：`src/backgrounds/index.js`

```js
// Background 注册表：从 glob 自动扫描
const backgroundRegistry = {}
for (const [path, module] of Object.entries(bgModules)) {
  const fileName = path.replace(/^\.\/(.*)\.bg\.js$/, '$1')
  const name = fileName.split('/').pop()
  const raw = module.default
  if (raw && typeof raw === 'object') {
    backgroundRegistry[name] = { meta: { ...raw, name } }
  }
}

// 导出：BackgroundMetas
export const BackgroundMetas = Object.fromEntries(
  Object.entries(backgroundRegistry).map(([name, entry]) => [name, { ...entry.meta }])
)
```

**逐行解析**：

| 行 | 代码 | 作用 |
|----|------|------|
| 1 | `const backgroundRegistry = {}` | 初始化空注册表 |
| 2 | `for (const [path, module] of Object.entries(bgModules))` | 遍历 glob 返回的所有模块 |
| 3 | `const fileName = path.replace(/^\.\/(.*)\.bg\.js$/, '$1')` | 去除路径前缀 `./` 和文件扩展名 `.bg.js`，得到 `dark/dark-001` |
| 4 | `const name = fileName.split('/').pop()` | 取路径最后一段作为名称 → `'dark-001'` |
| 5 | `const raw = module.default` | 获取 `.bg.js` 的 default export（元数据对象） |
| 6 | `if (raw && typeof raw === 'object')` | 防御性检查：确保 default export 是非空对象 |
| 7 | `backgroundRegistry[name] = { meta: { ...raw, name } }` | 将元数据 + 注入的 `name` 字段存入注册表 |

**路径提取示例**：

| `path`（glob key） | 正则匹配 → `fileName` | `.pop()` → `name` |
|---------------------|------------------------|-------------------|
| `./dark/dark-001.bg.js` | `dark/dark-001` | `dark-001` |
| `./light/light-002.bg.js` | `light/light-002` | `light-002` |
| `./video/webm-003.bg.js` | `video/webm-003` | `webm-003` |

### 4.3 暴露给主应用

**代码位置**：`src/main.js`（`__WUJIE_MOUNT` 生命周期回调中）

```js
if (window.__POWERED_BY_WUJIE__) {
  window.__WUJIE_MOUNT = () => {
    appInstance = createApp(App)
    appInstance.mount('#app')

    // 通过 wujie 事件总线向主应用暴露所有组件（含背景元数据）
    window.$wujie?.bus.$emit('plugin:ready', {
      pluginName:  window.$wujie?.props?.pluginName,
      widgetMetas:        WidgetMetas,
      widgetComponents:   WidgetComponents,
      appMetas:           AppMetas,
      appComponents:      AppComponents,
      backgroundMetas:    BackgroundMetas,
      components:         UIComponents,
    })
  }
}
```

此时 `plugin:ready` 事件的 `backgroundMetas` 字段结构为：

```js
{
  "dark-001": { title: '暗色背景01', category: '暗色系', theme: 'dark', type: 'image', avatar: '...', thumbnail: '...', image: '...', name: 'dark-001' },
  "dark-002": { ... },
  "dark-003": { ... },
  "dark-004": { ... },
  "light-001": { title: '浅色背景01', category: '浅色系', theme: 'light', type: 'image', avatar: '...', thumbnail: '...', image: '...', name: 'light-001' },
  "light-002": { ... },
  "light-003": { ... },
  "light-004": { ... },
  "webm-001": { title: '动态背景01', category: '动态背景', theme: 'dark', type: 'video', avatar: '...', thumbnail: '...', video: '...', name: 'webm-001' },
  "webm-002": { ... },
  "webm-003": { ... },
  "webm-004": { ... },
}
```

**主应用消费方式**：

```js
// 主应用中监听 'plugin:ready' 事件
window.$wujie.bus.$on('plugin:ready', (e) => {
  const { backgroundMetas, widgetMetas, appMetas, ... } = e
  // backgroundMetas → 注入到背景选择面板数据源
  useBackgroundMetas(backgroundMetas)
})
```

---

## 5. 数据流

```
┌─────────────────────────────────────────────────────────────────────┐
│  构建时（Vite）                                                       │
│                                                                      │
│  src/backgrounds/**/*.bg.js  ──→  import.meta.glob (eager: true)    │
│                                      │                               │
│  src/backgrounds/**/*.{jpg,webm,svg}  │  Vite import 处理            │
│                                      │  (哈希化 + 打包)               │
│                                      ▼                               │
│                              bgModules: Record<path, Module>         │
└─────────────────────────────────────────────────────────────────────┘
                                        │
┌──────────────────────────────────────▼──────────────────────────────┐
│  运行时（src/backgrounds/index.js 加载时）                             │
│                                                                      │
│  bgModules  ──→  for...of 循环                                       │
│                      │                                               │
│                      ├── 路径解析: regex → fileName → name           │
│                      ├── 防御检查: raw && typeof raw === 'object'    │
│                      └── 注册: backgroundRegistry[name] = { meta }   │
│                                      │                               │
│                                      ▼                               │
│                              backgroundRegistry                      │
│                                      │                               │
│             export const BackgroundMetas = ...                       │
│                                      │                               │
└──────────────────────────────────────┼──────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────┐
│  运行时（src/main.js — __WUJIE_MOUNT 回调）                           │
│                                                                      │
│  import { BackgroundMetas } from './backgrounds/index.js'           │
│                         │                                            │
│  window.$wujie.bus.$emit('plugin:ready', {                          │
│      backgroundMetas: BackgroundMetas,                              │
│      ...                                                             │
│  })                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                        │
┌──────────────────────────────────────▼──────────────────────────────┐
│  主应用消费（'plugin:ready' 事件监听器）                               │
│                                                                      │
│  window.$wujie.bus.$on('plugin:ready', (e) => {                     │
│      const { backgroundMetas } = e                                  │
│      // ...                                                          │
│  })                                                                  │
│          │                                                           │
│          ▼                                                           │
│  useBackgroundMetas()  ──→  注入到背景选择面板数据源                   │
│          │                                                           │
│          ▼                                                           │
│  用户选择背景 ──→ 主应用渲染引擎根据 type 渲染 image/video            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. 宪法原则遵循

| 宪法原则 | 相关条款 | 实现位置 |
|----------|----------|----------|
| 第 2 条：元数据驱动的组件注册 | `.bg.js` 声明完整元数据（title/category/theme/type/avatar/thumbnail/image 字段） | 各 `.bg.js` 文件 |
| 第 11 条：元数据默认值回退 | `BackgroundMetas` 导出中 `...entry.meta` 展开 + `name` 字段补充 | `src/backgrounds/index.js` |
| 第 12 条：渐进迁移与兼容 | `DesktopBackgroundMeta` 字段结构与主应用一致 | `.bg.js` export 格式 |

与 Widget/App 模块不同，背景模块不涉及以下宪法原则（因无 UI 组件）：
- 第 3 条：组件响应输入约束（不适用——无 props）
- 第 5 条：CSS 变量体系（不适用——无样式）
- 第 6 条：CSS 作用域隔离（不适用——无样式）
- 第 7 条：统一设计模式（不适用——无 UI）
- 第 8 条：资源清理（不适用——背景资源由主应用管理生命周期）
- 第 9 条：空值优雅降级（不适用）

---

## 7. 新增背景操作指南

如需新增一个背景（例如 `dark-005`）：

### 步骤 1：准备资源文件

在 `src/backgrounds/dark/` 目录下放置：
- `dark-005.jpg` — 全尺寸背景图片（推荐 1920×1080 及以上分辨率）
- `dark-005-s.jpg` — 缩略图（推荐 320×180 或等比例缩小）

### 步骤 2：创建元数据文件

创建 `src/backgrounds/dark/dark-005.bg.js`：

```js
import avatar from '../avatar.svg'
import thumbnail from './dark-005-s.jpg'
import image from './dark-005.jpg'

export default {
    title: '暗色背景05',
    category: '暗色系',
    theme: 'dark',
    type: 'image',
    avatar: avatar,
    thumbnail: thumbnail,
    image: image
};
```

### 步骤 3：无需修改代码

`import.meta.glob('./**/*.bg.js', { eager: true })` 在 `src/backgrounds/index.js` 中已覆盖 `dark/` 目录下所有 `.bg.js` 文件，新文件自动被扫描和注册。

重新构建子应用后，主应用重新加载即可看到新增背景。

---

## 8. 目录索引

| 规格文件 | 路径 |
|----------|------|
| 功能规格 | [spec.md](./spec.md) |
| 实现计划（本文件） | [plan.md](./plan.md) |
| 宪法原则 | [../constitution.md](../constitution.md) |
| 整体功能规格 | [../overall-spec.md](../overall-spec.md) |
| 数据模型 | [../overall-data-model.md](../overall-data-model.md) |

---

## 9. 版本历史

| 日期 | 变更 |
|------|------|
| 2026-07-21 | 初始版本，基于已实现代码提取 |
| 2026-07-24 | 架构更新：背景自动扫描从 `plugin.js` 迁移至 `src/backgrounds/index.js`（glob 路径从 `./backgrounds/**/*.bg.js` 改为 `./**/*.bg.js`）；暴露方式从 `window.__WUJIE_EXPORTS__.backgrounds` 改为通过 `window.$wujie.bus.$emit('plugin:ready', { backgroundMetas })` 事件；新增 `index.js` 到文件统计；更新数据流图 |
