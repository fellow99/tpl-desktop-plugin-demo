# 整体功能规格

> 项目：tpl-desktop-plugin-demo
> 状态：已实现（As-Built）
> 最后更新：2026-07-21

---

## 1. 系统概述

### 1.1 项目用途

tpl-desktop-plugin-demo 是 tpl-desktop 工作台的一个 **wujie（无界）微前端子应用**。它作为演示性子应用，向主应用提供可在桌面网格中使用的 Widget 组件、全屏叠加运行的全屏 App 应用和可切换的桌面视觉背景。

子应用独立开发、独立部署、独立调试，通过 wujie 框架的生命周期协议与主应用桥接。主应用只需在配置清单中声明子应用地址，即可动态加载并消费子应用提供的所有组件。

### 1.2 目标用户

| 用户角色 | 需求 |
|----------|------|
| **工作台终端用户** | 在桌面中添加和使用子应用提供的 Widget/App/背景 |
| **子应用开发者** | 参考本工程快速搭建符合 wujie 规范的子应用并扩展工作台功能 |
| **主应用维护者** | 通过声明式配置接入新子应用，验证主子通信协议的正确性 |

### 1.3 系统边界

**包含：**
- 4 个 Demo Widget 组件（文字、数字、图片、视频）
- 1 个 Demo App 组件（时钟）
- 12 套桌面背景（暗色×4 / 浅色×4 / 动态×4）
- wujie 生命周期适配（`__WUJIE_MOUNT`/`__WUJIE_UNMOUNT`）
- 双模式入口（独立调试 + wujie 沙箱）
- 通过 `window.$wujie.bus.$emit('plugin:ready', {...})` 事件暴露所有组件元数据和定义

**明确排除：**
- 与主应用的路由同步（本子应用无路由系统）
- 用户认证与权限控制（由主应用负责）
- 数据持久化（组件配置由主应用持久化到 localStorage）
- 子应用间的直接通信（通过主应用桥接）
- 生产环境 CDN 部署策略（运维关注点）

---

## 2. 用户故事

- 作为**工作台用户**，我可以在主应用的"添加组件"面板中看到来自本子应用的 Demo（文字/数字/图片/视频）Widget，并将它们拖拽到桌面网格中使用。
- 作为**工作台用户**，我可以在主应用的应用市场中看到 Demo时钟 App，点击启动后它会在全屏覆盖层上显示实时更新的数字时钟。
- 作为**工作台用户**，我可以在主应用的背景选择面板中看到来自本子应用的暗色/浅色/动态背景，并像切换本地背景一样选择使用。
- 作为**子应用开发者**，我只需运行 `pnpm dev` 即可在独立浏览器环境中调试所有组件行为，无需启动主应用。
- 作为**子应用开发者**，我可以通过复制本工程的目录结构和 `main.js` 中的 wujie 生命周期模板，快速搭建新的子应用。
- 作为**主应用维护者**，我只需在 `PLUGINS.json` 中添加一行配置即可接入本子应用，无需修改主应用代码。

---

## 3. 功能需求

### 3.1 wujie 生命周期适配

- **FR-001**: 系统 MUST 在 `main.js`（统一入口）中检测 `window.__POWERED_BY_WUJIE__` 环境标识，区分 wujie 沙箱模式和独立调试模式。
- **FR-002**: 在 wujie 沙箱模式下，系统 MUST 定义 `window.__WUJIE_MOUNT` 函数，在其中创建 Vue 应用实例、加载所有自动扫描的组件元数据并通过 `window.$wujie.bus.$emit('plugin:ready', ...)` 事件向主应用暴露。
- **FR-003**: 在 wujie 沙箱模式下，系统 MUST 定义 `window.__WUJIE_UNMOUNT` 函数，在其中调用 `app.unmount()` 销毁 Vue 实例并将实例引用置为 null。
- **FR-004**: 由于 Vite ESM 模块异步加载，系统 MUST 在 `__WUJIE_MOUNT` 和 `__WUJIE_UNMOUNT` 定义完成后主动调用 `window.__WUJIE.mount()` 通知 wujie 框架就绪。
- **FR-005**: `__WUJIE_MOUNT` 在保活模式下 MUST 仅创建一次 Vue 实例（`if (!appInstance)` 门控），避免重复初始化。
- **FR-006**: 系统 MUST 在独立调试模式下（`__POWERED_BY_WUJIE__` 为 false）直接创建 Vue 应用并挂载到 `#app`，输出 `[plugin] Running standalone` 日志。

### 3.2 组件自动扫描与元数据暴露

- **FR-010**: 系统 MUST 通过 `src/*/index.js` 四个自动扫描模块，在构建时使用 `import.meta.glob`（eager 模式）自动发现并注册所有组件。
- **FR-011**: `src/widgets/index.js` MUST 自动扫描 `./**/*.widget.vue`（组件定义）和 `./**/*.widget.js`（元数据）文件对，导出 `WidgetMetas`（`Record<string, WidgetMeta>`）和 `WidgetComponents`（`Record<string, Component>`）。
- **FR-012**: `src/apps/index.js` MUST 自动扫描 `./**/*.app.vue` 和 `./**/*.app.js` 文件对，导出 `AppMetas` 和 `AppComponents`。
- **FR-013**: `src/backgrounds/index.js` MUST 自动扫描 `./**/*.bg.js` 元数据文件，导出 `BackgroundMetas`（`Record<string, DesktopBackgroundMeta>`）。
- **FR-014**: `src/components/index.js` MUST 自动扫描 `./**/app-*.vue` UI 组件文件，导出 `Components`（`Record<string, Component>`）。
- **FR-015**: 在 wujie 沙箱模式下，系统 MUST 通过 `window.$wujie.bus.$emit('plugin:ready', { pluginName, widgetMetas, widgetComponents, appMetas, appComponents, backgroundMetas, components })` 事件将所有元数据和组件定义暴露给主应用。

### 3.3 Demo 文字 Widget（DemoText）

- **FR-020**: 系统 MUST 提供 DemoText Widget，根据 `value` prop 渲染纯文本内容，默认值为"这是一段文字"。
- **FR-021**: DemoText 默认网格尺寸 MUST 为 1×1。

### 3.4 Demo 数字 Widget（DemoNumber）

- **FR-030**: 系统 MUST 提供 DemoNumber Widget，根据 `value` prop 渲染数值，使用 @number-flow/vue 实现变化时的平滑滚动动画。
- **FR-031**: DemoNumber MUST 支持 `precision` prop（小数保留位数，默认 2，范围 0~20）。
- **FR-032**: DemoNumber MUST 支持 `title` prop（标题文字）和 `unit` prop（单位文字），两者均可选。
- **FR-033**: DemoNumber MUST 对非法输入进行防御性处理：`precision` 超出 0~20 范围时钳位，`value` 非数字时回退为 0。

### 3.5 Demo 图片 Widget（DemoImage）

- **FR-040**: 系统 MUST 提供 DemoImage Widget，根据 `value` prop 渲染图片元素。
- **FR-041**: DemoImage MUST 支持 `objectFit` prop（CSS object-fit 属性），包含 5 个选项：cover/contain/fill/none/scale-down，默认 cover。
- **FR-042**: 当 `value` 为空字符串时，DemoImage MUST 不渲染 `<img>` 元素，显示空白容器（而非破损图片图标）。
- **FR-043**: DemoImage 默认网格尺寸 MUST 为 2×2。

### 3.6 Demo 视频 Widget（DemoVideo）

- **FR-050**: 系统 MUST 提供 DemoVideo Widget，根据 `value` prop 渲染视频元素，配置 `autoplay`、`loop`、`muted`、`playsinline` 属性实现自动静音循环播放。
- **FR-051**: DemoVideo MUST 支持 `objectFit` prop，选项与 DemoImage 一致（5 种）。
- **FR-052**: 当 `value` 为空字符串时，DemoVideo MUST 不渲染 `<video>` 元素。
- **FR-053**: 组件卸载时 MUST 执行资源清理（`pause()` + `src=''` + `load()`），防止视频继续播放占用内存。
- **FR-054**: DemoVideo 默认网格尺寸 MUST 为 2×2。

### 3.7 Demo 时钟 App（DemoClock）

- **FR-060**: 系统 MUST 提供 DemoClock App，使用 dayjs 实时显示当前时间，每秒更新一次。
- **FR-061**: DemoClock MUST 支持 `format` prop（dayjs 格式化模板，默认 `'HH:mm:ss'`）。
- **FR-062**: DemoClock MUST 支持 `showDate` prop（Boolean，默认 true），控制是否显示日期行（含中文星期映射：周日~周六）。
- **FR-063**: DemoClock 中的 `setInterval` 定时器 MUST 在 `onBeforeUnmount` 中通过 `clearInterval` 清理，防止内存泄漏。
- **FR-064**: DemoClock 默认网格尺寸 MUST 为 3×3。

### 3.8 桌面背景

- **FR-070**: 系统 MUST 提供 12 套桌面背景，分为四个暗色系图片背景（dark-001~004）、四个浅色系图片背景（light-001~004）、四个动态视频背景（webm-001~004）。
- **FR-071**: 每个背景 MUST 通过 `.bg.js` 文件声明元数据，包含 `title`、`category`、`theme`、`type`、`avatar`、`thumbnail`、`image`/`video` 字段。
- **FR-072**: 系统 MUST 使用 `src/backgrounds/index.js` 中的 `import.meta.glob('./**/*.bg.js', { eager: true })` 自动扫描所有背景元数据，实现零手动维护。新增背景只需放置 `.bg.js` 文件和资源到对应目录即可自动注册。

---

## 4. 关键实体

| 实体 | 说明 | 来源 |
|------|------|------|
| Widget 组件 | Web 小部件，可在主应用桌面网格中渲染 | `src/widgets/demo/*.widget.vue` |
| Widget 元数据 | 描述 Widget 的可配置属性、分类、尺寸 | `src/widgets/demo/*.widget.js` |
| App 组件 | 全屏应用，可在主应用全屏叠加层运行 | `src/apps/demo/*.app.vue` |
| App 元数据 | 描述 App 的可配置属性、分类、尺寸 | `src/apps/demo/*.app.js` |
| Background 元数据 | 描述桌面背景的分类、主题、资源路径 | `src/backgrounds/**/*.bg.js` |
| PluginReadyPayload | 子应用通过 wujie 事件总线暴露给主应用的组件元数据和定义 | `main.js` 中的 `$wujie.bus.$emit('plugin:ready', payload)` |

详见 [overall-data-model.md](./overall-data-model.md)。

---

## 5. 验收场景

### 场景 1: 子应用独立调试

- Given 子应用开发服务器已启动（`pnpm dev`，端口 5273）
- When 开发者访问 `http://localhost:5273/index.html`
- Then 页面显示"tpl-desktop-plugin-demo — Standalone Debug"，`window.__POWERED_BY_WUJIE__` 为 undefined

### 场景 2: 主应用加载子应用 Widget

- Given 主应用和子应用开发服务器均已启动，主应用 `PLUGINS.json` 中已配置子应用
- When 主应用用户登录进入桌面，打开编辑模式 → 部件面板
- Then 部件列表中包含"Demo文字"、"Demo数字"、"Demo图片"、"Demo视频"，分类为"3.Demo组件"

### 场景 3: 主应用加载子应用 App

- Given 同场景 2
- When 用户打开 App 应用市场
- Then App 列表中包含"Demo时钟"，分类为"Demo应用"
- When 用户启动 Demo时钟
- Then 全屏覆盖层显示实时更新的数字时钟，包含时间和日期行

### 场景 4: 主应用加载子应用背景

- Given 同场景 2
- When 用户打开背景选择面板
- Then 背景列表中包含暗色系（4 个）、浅色系（4 个）、动态背景（4 个），共 12 个
- When 用户选择一个背景
- Then 桌面背景切换为所选背景

### 场景 5: 子应用加载失败不影响主应用

- Given 主应用已启动，子应用开发服务器**未**启动（端口不可达）
- When 用户打开主应用桌面
- Then 主应用正常启动，本地组件可正常使用
- And 子应用提供的组件不在任何面板中显示
- And 控制台输出 warning 提示子应用加载失败

### 场景 6: 组件资源清理

- Given Demo视频 Widget 已添加到桌面，视频正在播放
- When 用户删除该 Widget 或切换到其他页面
- Then 视频停止播放，浏览器内存中无泄漏的视频资源

---

## 6. 非功能需求

### 6.1 性能

- 子应用首次加载时间应控制在 3 秒以内（本地开发环境）
- Widget 组件渲染不应阻塞主应用 UI 线程（主应用通过 wujie fiber 模式确保）

### 6.2 可扩展性

- 新增 Widget 组件只需：创建 `.widget.vue` + `.widget.js` 文件放入 `src/widgets/` 子目录 → `import.meta.glob` 自动扫描 → 完成（零代码修改）
- 新增 App 组件只需：创建 `.app.vue` + `.app.js` 文件放入 `src/apps/` 子目录 → `import.meta.glob` 自动扫描 → 完成（零代码修改）
- 新增 Background 只需：放入 `.jpg`/`.webm` 资源 + `.bg.js` 元数据文件到 `src/backgrounds/` 子目录 → `import.meta.glob` 自动扫描 → 完成
- 新增 UI 组件只需：创建 `app-*.vue` 文件放入 `src/components/` 子目录 → `import.meta.glob` 自动扫描 → 完成（零代码修改）

### 6.3 兼容性

- 子应用 MUST 与主应用 tpl-desktop 的 Vue 3.5+ 版本兼容（wujie 保活模式下共享 Vue 实例）
- 子应用 MUST 支持 wujie-vue3 ^1.0.22 版本的生命周期协议

### 6.4 安全

- 子应用 MUST 仅在 wujie 沙箱中运行，不直接访问主应用的 DOM、localStorage 和组件状态
- 子应用的 CSS MUST 通过 `<style scoped>` 隔离，不污染主应用全局样式

### 6.5 代码质量

- 所有 `.vue` 文件 MUST 使用 `<script setup>` + TypeScript JSDoc 注释
- 所有组件样式 MUST 使用 `<style scoped lang="scss">`
- 涉及资源的组件 MUST 在卸载时清理资源（定时器/视频）

---

## 7. 假设与约束

1. **假设**: wujie 框架已由主应用引入，子应用无需安装 wujie 依赖，仅需遵循生命周期协议。
2. **假设**: 主应用的 CSS 变量体系（`--desktop-*`）通过 wujie CSS 沙箱自动继承到子应用 iframe 内，子应用组件可直接使用这些变量。
3. **假设**: 保活模式（`alive: true`）下子应用 Vue 实例常驻内存，切换时不重复创建。
4. **约束**: 子应用必须使用 `base: '/tpl-desktop-plugin-demo/'` 以确保生产环境静态资源路径正确。
5. **约束**: 子应用开发服务器必须开启 CORS（`server.cors: true`），允许主应用跨域加载子应用资源。
6. **约束**: 子应用组件命名使用 `Demo*` 前缀，与主应用的 `Basic*` 前缀区分，避免同名冲突。
