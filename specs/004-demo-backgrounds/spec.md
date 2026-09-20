# 004-demo-backgrounds 功能规格

> 项目：tpl-desktop-plugin-demo
> 模块：桌面背景资源集
> 类型：As-Built（描述性 — 基于已实现资源）
> 最后更新：2026-07-24

---

## 1. 模块概述

### 1.1 模块用途

本模块为 tpl-desktop 工作台提供 **12 套桌面视觉背景**。这些背景通过 wujie 微前端协议从子应用暴露给主应用，由主应用的背景选择面板展示，用户可像切换本地背景一样选择使用。

本模块是**纯资源 + 元数据模块**，不包含任何 UI 组件或用户交互逻辑。每个背景由静态资源文件（图片/视频）和一份 `.bg.js` 元数据文件组成，背景的完整集合通过构建工具自动扫描并注册。

### 1.2 模块边界

**包含：**
- 4 个暗色系静态图片背景（dark-001 ~ dark-004）
- 4 个浅色系静态图片背景（light-001 ~ light-004）
- 4 个动态视频背景（webm-001 ~ webm-004）
- 每套背景的元数据声明（`.bg.js`）
- 每套背景的缩略图
- 所有背景共用的头像图标（`avatar.svg`）
- 通过 `import.meta.glob` 实现的自动扫描注册机制

**明确排除：**
- 背景预览 UI（由主应用负责渲染）
- 背景切换过渡动画（由主应用负责实现）
- 背景的创建、编辑、删除功能（资源文件由子应用开发者维护）
- 用户自定义背景上传（不在子应用职责范围内）

### 1.3 与其他模块的关系

```
┌─────────────────────────────────────────────────────────────────────┐
│  主应用（tpl-desktop）                                                │
│  ┌──────────────┐  ┌──────────────────────────────────────────────┐ │
│  │ 背景选择面板  │  │ useBackgroundMetas                           │ │
│  │ (UI 渲染)    │  │ (元数据读取 + 默认值回退)                      │ │
│  └──────┬───────┘  └──────────────┬───────────────────────────────┘ │
│         │                         │                                  │
│         │  监听 'plugin:ready' 事件，获取 e.backgroundMetas          │
│         └─────────┬───────────────┘                                  │
└───────────────────┼──────────────────────────────────────────────────┘
                    │ wujie 协议
                    │ window.$wujie.bus.$emit('plugin:ready', {
                    │   backgroundMetas: BackgroundMetas,
                    │   ...
                    │ })
┌───────────────────┼──────────────────────────────────────────────────┐
│  子应用（tpl-desktop-plugin-demo）                                            │
│  ┌────────────────┴───────────────────────────────────────────────┐ │
│  │  src/backgrounds/index.js                                      │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ import.meta.glob('./**/*.bg.js', { eager: true })        │  │ │
│  │  └──────────────┬───────────────────────────────────────────┘  │ │
│  │                 │ 自动扫描                                       │ │
│  │  ┌──────────────▼───────────────────────────────────────────┐  │ │
│  │  │ backgroundRegistry                                       │  │ │
│  │  │  → export const BackgroundMetas = { ... }                │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  src/main.js                                                        │
│  │  window.$wujie.bus.$emit('plugin:ready', {                       │
│  │    backgroundMetas: BackgroundMetas,                             │
│  │    ...                                                            │
│  │  })                                                               │
│                                                                      │
│  src/backgrounds/                                                    │
│  ├── avatar.svg            (共享头像图标)                             │
│  ├── dark/                                                           │
│  │   ├── dark-001.bg.js    (元数据)                                   │
│  │   ├── dark-001.jpg      (原图)                                     │
│  │   ├── dark-001-s.jpg    (缩略图)                                   │
│  │   └── ... (dark-002 ~ dark-004)                                   │
│  ├── light/                                                          │
│  │   ├── light-001.bg.js                                             │
│  │   ├── light-001.jpg                                               │
│  │   ├── light-001-s.jpg                                             │
│  │   └── ... (light-002 ~ light-004)                                 │
│  └── video/                                                          │
│      ├── webm-001.bg.js                                              │
│      ├── webm-001.webm                                               │
│      ├── webm-001-s.jpg                                              │
│      └── ... (webm-002 ~ webm-004)                                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. 功能需求

### 2.1 背景类型

- **BG-001**: 系统 MUST 支持两种背景类型：`image`（静态图片）和 `video`（循环视频）。
- **BG-002**: `type='image'` 的背景 MUST 提供 `image` 字段，指向全尺寸 JPEG 图片资源。
- **BG-003**: `type='video'` 的背景 MUST 提供 `video` 字段，指向 WebM 视频资源。
- **BG-004**: 视频类型背景 MUST 具有 `theme='dark'`（动态视频背景视觉上属于暗色系）。

### 2.2 背景分类

- **BG-005**: 系统 MUST 将背景按视觉风格分为三个分类（`category` 字段）：
  - `'暗色系'` — 4 个深色调图片背景（dark-001 ~ dark-004）
  - `'浅色系'` — 4 个浅色调图片背景（light-001 ~ light-004）
  - `'动态背景'` — 4 个循环视频背景（webm-001 ~ webm-004）
- **BG-006**: 每个分类内的背景 MUST 按照序号（001 ~ 004）排列，便于用户浏览选择。

### 2.3 主题关联

- **BG-007**: 每个背景 MUST 声明 `theme` 字段，取值 `'dark'` 或 `'light'`，用于主应用的主题适配逻辑。
- **BG-008**: `theme='dark'` 的背景适用于深色主题的工作台界面；`theme='light'` 的背景适用于浅色主题。
- **BG-009**: 动态视频背景（webm-001 ~ webm-004）MUST 关联 `theme='dark'`。

### 2.4 元数据声明

- **BG-010**: 每套背景 MUST 由一份 `.bg.js` 文件声明元数据，该文件位于背景资源所在目录。
- **BG-011**: `.bg.js` 文件 MUST 使用 ES module `export default` 导出一个描述当前背景的元数据对象。
- **BG-012**: 元数据对象 MUST 包含以下必填字段：`title`、`category`、`theme`、`type`、`avatar`、`thumbnail`。
- **BG-013**: 当 `type='image'` 时，MUST 额外包含 `image` 字段。

[NEEDS CLARIFICATION] BG-013 中"当 type='image' 时 MUST 额外包含 `image` 字段"的约束是否需要扩展到"当 type='video' 时 MUST 额外包含 `video` 字段"？当前已实现的视频 `.bg.js` 文件均包含 `video` 字段，但未在需求中显式声明。

- **BG-014**: `avatar` 字段 MUST 引用 `src/backgrounds/avatar.svg`（位于 backgrounds 目录根级的共享头像图标），所有 12 套背景共用同一头像。

### 2.5 自动扫描注册

- **BG-015**: 系统 MUST 使用构建工具的文件系统扫描能力，自动发现 `src/backgrounds/` 目录下所有 `.bg.js` 文件。
- **BG-016**: 扫描机制 MUST 支持嵌套目录（`dark/`、`light/`、`video/`），递归匹配任意深度的 `.bg.js` 文件。
- **BG-017**: 系统 MUST 从 `.bg.js` 文件的路径中提取文件名（不含扩展名和路径前缀）作为背景的唯一标识名（`name` 字段）。
- **BG-018**: 新增背景时，开发者 MUST 只需在对应分类目录下添加资源文件和 `.bg.js` 元数据文件，无需修改任何注册代码（零手动维护）。

### 2.6 元数据暴露

- **BG-019**: 系统 MUST 将所有扫描到的背景元数据收集到 `backgroundRegistry` 中。
- **BG-020**: `backgroundRegistry` 中的每个条目 MUST 包含元数据对象的完整字段，并补充 `name` 字段（从文件名提取的唯一标识）。
- **BG-021**: 系统 MUST 将 `BackgroundMetas`（从 `backgroundRegistry` 导出）通过 `window.$wujie.bus.$emit('plugin:ready', { backgroundMetas: BackgroundMetas })` 暴露给主应用。

### 2.7 资源文件约定

- **BG-022**: 缩略图文件 MUST 在原始文件名后追加 `-s` 后缀（如 `dark-001.jpg` → `dark-001-s.jpg`）。
- **BG-023**: 缩略图文件 MUST 放置在与原图/原视频相同的目录下。
- **BG-024**: 图片背景资源 MUST 使用 JPEG 格式（`.jpg`）；视频背景资源 MUST 使用 WebM 格式（`.webm`）。

[NEEDS CLARIFICATION] 缩略图的建议尺寸或最大文件大小是否需要约束？当前缩略图用于背景选择面板的列表展示，但未规定生成规范。

---

## 3. 关键实体

### 3.1 背景元数据实体（DesktopBackgroundMeta）

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `title` | string | ✅ | 背景中文名称，带序号 | `'暗色背景01'` |
| `category` | string | ✅ | 背景分类 | `'暗色系'` / `'浅色系'` / `'动态背景'` |
| `theme` | string | ✅ | 关联主题，取值 `'dark'` 或 `'light'` | `'dark'` |
| `type` | string | ✅ | 资源类型，取值 `'image'` 或 `'video'` | `'image'` |
| `avatar` | string (import) | ✅ | 头像/图标资源路径（Vite import），所有背景共用 `avatar.svg` | `import avatar from '../avatar.svg'` |
| `thumbnail` | string (import) | ✅ | 缩略图资源路径（`-s.jpg`），用于选择面板列表展示 | `import thumbnail from './dark-001-s.jpg'` |
| `image` | string (import) | 条件 | 原图资源路径，仅在 `type='image'` 时存在 | `import image from './dark-001.jpg'` |
| `video` | string (import) | 条件 | 视频资源路径，仅在 `type='video'` 时存在 | `import video from './webm-001.webm'` |
| `name` | string | 运行时 | 背景唯一标识名，由 `src/backgrounds/index.js` 的自动扫描逻辑从文件路径提取并注入 | `'dark-001'` |

> 注：`name` 字段不在 `.bg.js` 元数据文件中声明，而是在 `src/backgrounds/index.js` 的注册循环中通过 `fileName.split('/').pop()` 从文件路径提取后注入。

### 3.2 背景注册表（backgroundRegistry）

```
backgroundRegistry: Record<string, { meta: DesktopBackgroundMeta }>

示例：
{
  "dark-001": { meta: { title: '暗色背景01', category: '暗色系', theme: 'dark', type: 'image', ..., name: 'dark-001' } },
  "dark-002": { meta: { ... } },
  ...
  "webm-004": { meta: { title: '动态背景04', category: '动态背景', theme: 'dark', type: 'video', ..., name: 'webm-004' } },
}
```

---

## 4. 用户故事

- 作为**工作台用户**，我可以在背景选择面板中看到按"暗色系"、"浅色系"、"动态背景"三个分类组织的 12 个背景选项，通过缩略图快速识别每个背景的视觉效果。
- 作为**工作台用户**，我选择一个暗色系背景后，桌面背景立即切换为深色调图片，与深色主题协调搭配。
- 作为**工作台用户**，我选择一个动态背景后，桌面背景展示循环播放的视频，无需任何额外操作。
- 作为**子应用开发者**，我只需在 `src/backgrounds/<category>/` 目录下放入 `.jpg`/`.webm` 资源、`-s.jpg` 缩略图和 `.bg.js` 元数据文件，新增的背景即可自动出现在主应用的面板中，无需修改 `src/backgrounds/index.js`。

---

## 5. 验收场景

### 场景 1：主应用背景选择面板展示

- **Given** 主应用与子应用均已启动，主应用成功加载子应用
- **When** 用户打开背景选择面板
- **Then** 面板展示 3 个分类标签（暗色系/浅色系/动态背景）
- **And** 每个分类下显示 4 个背景缩略图选项
- **And** 每个缩略图下方显示对应的中文名称（暗色背景01~04、浅色背景01~04、动态背景01~04）

### 场景 2：新增背景自动注册

- **Given** 子应用 `src/backgrounds/dark/` 目录已存在 dark-001 ~ dark-004
- **When** 开发者在 `src/backgrounds/dark/` 目录下新增 `dark-005.jpg`、`dark-005-s.jpg` 和 `dark-005.bg.js`，重新构建子应用
- **Then** 主应用重新加载子应用后，背景选择面板中暗色系分类下出现第 5 个背景"暗色背景05"
- **And** 整个过程中未修改 `src/backgrounds/index.js` 的任何代码

### 场景 3：背景元数据完整性

- **Given** 主应用监听了 `plugin:ready` 事件，获取了 `e.backgroundMetas`
- **When** 主应用遍历 `backgroundMetas` 对象中的每个条目
- **Then** 每个条目包含完整的 `title`、`category`、`theme`、`type`、`avatar`、`thumbnail` 字段
- **And** 图片类型背景额外包含 `image` 字段
- **And** 视频类型背景额外包含 `video` 字段
- **And** 每个条目包含 `name` 字段且值与文件名一致（如 `dark-001`）

### 场景 4：子应用独立调试模式

- **Given** 子应用开发服务器已启动（`pnpm dev`）
- **When** 开发者访问 `http://localhost:5273/index.html`
- **Then** 独立调试页面正常显示（进入独立调试模式，`window.__POWERED_BY_WUJIE__` 为 undefined）
- **And** 背景资源不在此模式下渲染（独立调试模式仅展示 Widget/App 组件）

---

## 6. 非功能需求

### 6.1 可扩展性

- 新增背景的成本仅限资源文件准备（3 个文件 + 已有 avatar.svg），无需代码变更
- 新增背景分类（如在 `backgrounds/` 下新建 `gradient/` 目录）同样受 `**/*.bg.js` glob 模式支持，无需修改扫描逻辑

### 6.2 兼容性

- `.bg.js` 元数据格式 MUST 与主应用的 `DesktopBackgroundMeta` 类型兼容
- 资源路径 MUST 使用 Vite `import` 语句引入，确保构建产物中资源路径经过哈希化处理

### 6.3 资源质量

- 全尺寸背景图片 SHOULD 具有足够分辨率以适配常见桌面分辨率（1920×1080 及以上）
- 缩略图 SHOULD 保持合理的文件大小以便快速加载（背景选择面板通常一次展示 12 张缩略图）

### 6.4 代码质量

- `.bg.js` 文件 MUST 仅包含 import 语句和 export default 对象，不包含任何逻辑代码
- 所有 `.bg.js` 文件 MUST 遵循统一的字段声明顺序（title → category → theme → type → avatar → thumbnail → image/video）

---

## 7. 假设与约束

1. **假设**：主应用的背景选择面板已根据 `category` 字段实现分类展示逻辑。
2. **假设**：主应用的背景渲染引擎已根据 `type` 字段区分图片/视频背景的渲染方式。
3. **假设**：主应用的 CSS 变量体系（`--desktop-*`）不直接影响背景资源本身——背景是纯视觉资源，不涉及组件样式。
4. **约束**：视频背景 MUST 使用 WebM 格式（`video/webm`），确保在主流浏览器中的兼容性。
5. **约束**：所有背景共享同一份 `avatar.svg`，位于 `src/backgrounds/avatar.svg`，各 `.bg.js` 通过相对路径 `../avatar.svg` 引用。
6. **约束**：背景文件中不得包含任何用户交互逻辑、事件处理或 DOM 操作。

---

## 8. 版本历史

| 日期 | 变更 |
|------|------|
| 2026-07-21 | 初始版本，基于已实现资源提取 |
| 2026-07-24 | 架构更新：背景自动扫描从 `plugin.js` 迁移至 `src/backgrounds/index.js`；暴露方式从 `window.__WUJIE_EXPORTS__` 改为 `window.$wujie.bus.$emit('plugin:ready', ...)` |
