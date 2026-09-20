# 模块 001-wujie-adaptor — 功能规格

> 项目：tpl-desktop-plugin-demo
> 模块：wujie 生命周期适配器
> 状态：已实现（As-Built）
> 最后更新：2026-07-24
> 关联：`specs/overall-spec.md` §3.1 `specs/overall-api.md` §2-5

---

## 1. 模块概述

### 1.1 用途

001-wujie-adaptor 是本子应用的**核心桥接模块**，负责在微前端框架（wujie）与子应用运行时之间建立双向通信通道。该模块采用**统一入口 + 自动扫描**架构：`main.js` 通过环境检测在同一文件中处理沙箱模式和独立调试模式，而四类组件注册表（Widgets、Apps、Backgrounds、UI Components）均通过 `import.meta.glob` 自动扫描索引模块注册，无需手动维护任何静态导入。

### 1.2 解决的问题

| 问题 | 解决方案 |
|------|----------|
| 子应用开发者如何在不启动主应用的情况下独立调试组件 | 单一入口文件通过 `window.__POWERED_BY_WUJIE__` 环境检测自动切换模式，无需额外配置双入口 |
| 主应用如何发现并消费子应用的组件 | 在沙箱模式下通过 wujie bus 事件 `plugin:ready` 向主应用推送完整的组件元数据和组件定义负载 |
| 新增组件需要手动修改多处适配器代码 | 四类组件全部使用 `import.meta.glob`（eager 模式）自动扫描各自的索引模块，新增文件零维护 |
| Vite ESM 异步加载导致框架提前调用生命周期 | 在脚本初始化完成后主动调用 `window.__WUJIE.mount()` 通知框架就绪 |
| 保活模式下重复创建实例导致内存泄漏 | 使用单例门控（`let appInstance = null`）确保实例仅创建一次 |
| 卸载时残留状态污染 | 在 unmount 生命周期中销毁实例并置空引用 |

### 1.3 范围

**模块 001-wujie-adaptor 包含：**

- 统一入口点 `src/main.js`：环境自动检测与双模式调度（沙箱 / 独立调试）
- 沙箱模式：`__WUJIE_MOUNT` / `__WUJIE_UNMOUNT` 生命周期注册，wujie bus `plugin:ready` 事件发射
- 四类组件注册表的自动扫描索引模块：
  - `src/widgets/index.js` — 自动扫描 `./**/*.widget.vue` + `./**/*.widget.js`
  - `src/apps/index.js` — 自动扫描 `./**/*.app.vue` + `./**/*.app.js`
  - `src/backgrounds/index.js` — 自动扫描 `./**/*.bg.js`
  - `src/components/index.js` — 自动扫描 `./**/app-*.vue`
- 单一 HTML 入口：`index.html`，挂载点为 `#app`
- 独立调试模式下的应用实例创建与挂载
- 卸载时的资源清理与实例引用回收

**明确排除：**
- 具体 Widget/App 组件的实现（属于模块 002/003）
- 桌面背景资源的提供与元数据结构（属于模块 004）
- Vite 构建配置的设计决策（属于基础设施层）
- 主应用侧的加载逻辑与 wujie 配置（属于主应用 tpl-desktop）

---

## 2. 用户故事

### US-001: 子应用开发者独立调试

作为子应用开发者，我可以运行 `pnpm dev` 并在浏览器中直接访问子应用，无需启动主应用，即可看到调试占位页面，验证子应用基础运行正常。环境检测逻辑自动识别非沙箱模式，开发者零配置。

**验收标准：**
- 访问 `http://localhost:5273/index.html` 后页面正常渲染
- `window.__POWERED_BY_WUJIE__` 为 undefined 时自动进入独立调试模式（`else` 分支）
- 控制台输出 "Running standalone" 日志
- 应用实例挂载到 `#app`

### US-002: 主应用加载子应用并获取组件清单

作为主应用（tpl-desktop），我加载子应用后通过 wujie bus 事件接收完整的组件清单（含名称、分类、属性定义、尺寸），以及对应的组件定义用于全局注册。主应用消费者无需关心组件来自本地还是远程子应用。

**验收标准：**
- 子应用挂载后发射 `window.$wujie.bus.$emit('plugin:ready', payload)` 事件
- payload 包含 `widgetMetas`、`widgetComponents`、`appMetas`、`appComponents`、`backgroundMetas`、`components` 六个字段
- 组件数量与 `src/widgets/`、`src/apps/`、`src/backgrounds/` 目录下的实际文件数一致
- 控制台输出日志格式：`[${pluginName}] Plugin ready, injected N widgets, N apps, N backgrounds`

### US-003: 子应用保活模式下的重复挂载/卸载

作为主应用，用户在工作台中频繁切换页面时，子应用的 Vue 实例不会重复创建（保活模式下仅创建一次），但每次激活时仍需能响应挂载请求。卸载时销毁实例并将单例引用置为 null。

**验收标准：**
- 首次调用 `__WUJIE_MOUNT` 时创建实例并挂载
- 后续调用不重复创建实例（`if (!appInstance)` 门控生效）
- 调用 `__WUJIE_UNMOUNT` 后实例被销毁，`appInstance` 引用置为 `null`

---

## 3. 功能需求

### 3.1 环境检测

- **FR-001-001**: 系统 MUST 在启动时读取 `window.__POWERED_BY_WUJIE__` 的值，将其作为唯一的环境判断依据。值为 truthy 时进入沙箱模式，值为 falsy/undefined 时进入独立调试模式。
- **FR-001-002**: 环境检测逻辑 MUST 位于 `src/main.js` 的顶层，在 `if/else` 分支中调度两种模式，确保两种模式在同一文件中完全隔离。

### 3.2 生命周期注册（沙箱模式）

- **FR-001-003**: 在沙箱模式下（`if (window.__POWERED_BY_WUJIE__)` 为真），系统 MUST 将 `window.__WUJIE_MOUNT` 赋值为一个异步函数。该函数负责：创建运行时实例（单例门控）、注册所有组件、挂载到 `#app` DOM 挂载点、通过 wujie bus 发射 `plugin:ready` 事件。
- **FR-001-004**: 在沙箱模式下，系统 MUST 将 `window.__WUJIE_UNMOUNT` 赋值为一个函数。该函数负责：销毁运行时实例、将 `appInstance` 引用置为 `null`。
- **FR-001-005**: `__WUJIE_MOUNT` 在保活模式下 MUST 使用单例门控（`if (!appInstance)`）：首次调用时创建实例 → 挂载；后续调用跳过创建步骤。
- **FR-001-006**: `__WUJIE_UNMOUNT` MUST 在实例销毁失败时进行容错处理，抛出异常时 SHOULD 输出警告日志并继续执行清理逻辑，不得阻断主应用的正常卸载流程。

### 3.3 wujie Bus 事件通信

- **FR-001-007**: 沙箱模式挂载完成后，系统 MUST 通过 `window.$wujie.bus.$emit('plugin:ready', payload)` 发射就绪事件。发射的时机 MUST 在实例创建、组件注册、DOM 挂载全部完成之后。
- **FR-001-008**: `plugin:ready` 事件的 payload MUST 包含以下六个字段：
  - `pluginName` — 从 `window.$wujie?.props?.pluginName` 获取的子应用名称
  - `widgetMetas` — Widget 组件元数据字典
  - `widgetComponents` — Widget 组件定义字典
  - `appMetas` — App 组件元数据字典
  - `appComponents` — App 组件定义字典
  - `backgroundMetas` — 桌面背景元数据字典
  - `components` — 通用 UI 组件定义字典（`app-*.vue`）
- **FR-001-009**: 事件发射完成后，系统 SHOULD 在控制台输出格式为 `[${pluginName}] Plugin ready, injected N widgets, N apps, N backgrounds` 的日志，其中 N 为各注册表实际条目数量。

### 3.4 Vite ESM 异步桥接

- **FR-001-010**: 由于 ESM 模块加载是异步的，系统 MUST 在 `__WUJIE_MOUNT` / `__WUJIE_UNMOUNT` 定义完成后主动检查 `window.__WUJIE` 对象是否存在，若存在则调用 `window.__WUJIE.mount()` 通知框架模块已就绪可挂载。此调用 MUST 使用可选链（`?.`）确保在非沙箱环境下不会抛出错误。
- **FR-001-011**: `window.__WUJIE.mount()` 的调用 MUST 紧跟在所有生命周期函数定义之后（即 `__WUJIE_MOUNT` / `__WUJIE_UNMOUNT` 赋值完成之后），确保框架调用 `__WUJIE_MOUNT` 时函数已存在。

### 3.5 自动扫描索引模块

- **FR-001-012**: 系统 MUST 通过四个独立的索引模块（`index.js`）实现四类组件的自动扫描注册：
  - `src/widgets/index.js` — 使用 `import.meta.glob('./**/*.widget.vue', { eager: true })` 和 `import.meta.glob('./**/*.widget.js', { eager: true })` 扫描 Widget 组件及其元数据，导出 `WidgetMetas` 和 `WidgetComponents`
  - `src/apps/index.js` — 使用 `import.meta.glob('./**/*.app.vue', { eager: true })` 和 `import.meta.glob('./**/*.app.js', { eager: true })` 扫描 App 组件及其元数据，导出 `AppMetas` 和 `AppComponents`
  - `src/backgrounds/index.js` — 使用 `import.meta.glob('./**/*.bg.js', { eager: true })` 扫描背景元数据，导出 `BackgroundMetas`
  - `src/components/index.js` — 使用 `import.meta.glob('./**/app-*.vue', { eager: true })` 扫描通用 UI 组件，导出 `Components`
- **FR-001-013**: 每个索引模块 MUST 从 glob 返回的文件路径中提取组件名称（compName）作为注册表键名。路径提取逻辑为：从模块路径中去掉目录前缀和文件扩展名，取组件名段。
- **FR-001-014**: 索引模块 MUST 对重复的组件名称进行冲突检测和处理，遇到名称冲突时 SHOULD 输出警告日志并使用最后一个匹配结果（或合理的冲突解决策略）。
- **FR-001-015**: 索引模块 MUST 对 glob 扫描结果进行错误处理，单个文件的加载失败 MUST NOT 阻断整个注册表的构建，失败文件 SHOULD 被记录警告日志并跳过。
- **FR-001-016**: 新增或删除任何类型的组件文件（`.widget.vue`、`.widget.js`、`.app.vue`、`.app.js`、`.bg.js`、`app-*.vue`）MUST 被自动发现并包含在下一轮扫描中，无需修改任何索引模块或适配器代码。

### 3.6 单例模式

- **FR-001-017**: 系统 MUST 在 `src/main.js` 的顶层声明 `let appInstance = null` 单例引用。
- **FR-001-018**: 沙箱模式和独立调试模式 MUST 共享相同的单例门控模式：两种模式在创建应用实例时均检查 `appInstance` 是否为 null，仅在未创建时执行 new 逻辑并赋值。

### 3.7 统一 HTML 入口

- **FR-001-019**: 系统 MUST 提供唯一的 HTML 入口文件 `index.html`，声明 mount 容器元素 `id="app"`，通过 `<script type="module" src="/src/main.js">` 加载统一入口脚本。
- **FR-001-020**: `index.html` MUST 同时承载两种运行模式：沙箱模式下 `#app` 作为 wujie 框架指定的挂载点；独立调试模式下 `#app` 作为调试根组件的挂载点。

### 3.8 独立调试模式

- **FR-001-021**: 在独立调试模式下（`__POWERED_BY_WUJIE__` 为 falsy，进入 `else` 分支），系统 MUST 不定义任何微前端生命周期函数，转而创建应用实例并直接挂载到 `#app` 调试挂载点。
- **FR-001-022**: 独立调试模式 MUST 不设置或访问 `window.__WUJIE_MOUNT`、`window.__WUJIE_UNMOUNT`、`window.$wujie` 等任何与微前端框架相关的全局属性或接口，确保调试环境完全干净。
- **FR-001-023**: 独立调试模式启动时 MUST 在控制台输出 "Running standalone" 日志，明确标识当前模式。

### 3.9 资源清理

- **FR-001-024**: 卸载时，系统 MUST 调用 Vue 实例的 `unmount()` 方法销毁实例，并将 `appInstance` 引用置为 `null`。
- **FR-001-025**: 卸载完成后，系统 SHOULD 输出卸载完成的日志信息，便于开发调试。

---

## 4. 关键实体

| 实体 | 说明 | 定义位置 |
|------|------|----------|
| UnifiedEntry | 统一的入口模块，通过 `window.__POWERED_BY_WUJIE__` 判断进入沙箱或独立调试模式 | `src/main.js` |
| WujieLifecycle | 子应用在沙箱中暴露给微前端框架的两个生命周期函数（mount / unmount） | `__WUJIE_MOUNT` / `__WUJIE_UNMOUNT` |
| PluginReadyPayload | 子应用挂载后通过 wujie bus 发射的 `plugin:ready` 事件负载，包含全部六类组件注册信息 | `$emit('plugin:ready', {...})` |
| WidgetIndex | Widget 组件的自动扫描索引模块，通过 `import.meta.glob` 扫描 `*.widget.vue` 和 `*.widget.js` 文件 | `src/widgets/index.js` |
| AppIndex | App 组件的自动扫描索引模块，通过 `import.meta.glob` 扫描 `*.app.vue` 和 `*.app.js` 文件 | `src/apps/index.js` |
| BackgroundIndex | 背景资源的自动扫描索引模块，通过 `import.meta.glob` 扫描 `*.bg.js` 元数据文件 | `src/backgrounds/index.js` |
| ComponentIndex | 通用 UI 组件的自动扫描索引模块，通过 `import.meta.glob` 扫描 `app-*.vue` 文件 | `src/components/index.js` |
| EnvironmentFlag | 微前端框架注入的布尔标志，标识当前运行环境 | `window.__POWERED_BY_WUJIE__` |
| WujieSandbox | 微前端框架的沙箱实例对象，提供 `$wujie.bus` 事件总线和 `.mount()` 主动就绪通知 | `window.$wujie` |
| SingletonInstance | 全局单例引用，确保 Vue 应用实例在保活模式下仅创建一次 | `let appInstance = null` |

---

## 5. 验收场景

### 场景 1: 独立调试模式启动

- **Given** 子应用开发服务器已启动
- **When** 开发者通过浏览器访问 `index.html` 入口
- **Then** `window.__POWERED_BY_WUJIE__` 为 undefined，进入 `else` 分支，控制台输出 "Running standalone"，应用实例挂载到 `#app`，`window.__WUJIE_MOUNT` 和 `window.__WUJIE_UNMOUNT` 均未定义

### 场景 2: 沙箱模式首次挂载

- **Given** 主应用已通过微前端框架加载子应用的 `index.html`
- **When** 框架调用子应用的 `__WUJIE_MOUNT` 函数
- **Then** 运行时实例被创建（仅一次），所有组件通过自动扫描索引模块完成注册，实例挂载到 `#app`，`window.$wujie.bus.$emit` 发射 `plugin:ready` 事件，payload 包含 widgetMetas / widgetComponents / appMetas / appComponents / backgroundMetas / components，控制台输出日志包含实际组件数量

### 场景 3: 保活模式重复挂载不重建实例

- **Given** 子应用已在保活模式下挂载过一次（`appInstance` 不为 null）
- **When** 主应用再次调用 `__WUJIE_MOUNT`（如用户从其他页面切回工作台）
- **Then** 不创建新的运行时实例（`if (!appInstance)` 门控生效），跳过实例创建逻辑

### 场景 4: 沙箱模式卸载

- **Given** 子应用已在沙箱模式下挂载
- **When** 框架调用 `__WUJIE_UNMOUNT`
- **Then** 实例被销毁（`appInstance.unmount()`），`appInstance` 引用被置为 `null`

### 场景 5: 卸载失败时的容错

- **Given** 子应用已挂载，但 DOM 挂载点被意外移除（模拟异常场景）
- **When** 框架调用 `__WUJIE_UNMOUNT`
- **Then** 实例销毁操作抛出异常被捕获，输出警告日志，`appInstance` 仍被置为 `null`，主应用卸载流程不被阻断

### 场景 6: Vite ESM 异步就绪通知

- **Given** 主应用已加载子应用 `index.html`，`<script type="module">` 异步加载中
- **When** `main.js` 脚本执行完毕，`__WUJIE_MOUNT` 和 `__WUJIE_UNMOUNT` 已定义
- **Then** 适配器主动调用 `window.__WUJIE.mount()` 通知框架模块就绪，框架随后调用 `__WUJIE_MOUNT` 完成挂载 [NEEDS CLARIFICATION: 是否需要定义首次加载的超时时间上限？若网络极慢导致脚本一直未加载完成应如何处理？]

### 场景 7: 自动扫描新增 Widget 组件

- **Given** 开发者新增了一个 `my-new.widget.vue` 和 `my-new.widget.js` 文件到 `src/widgets/` 目录
- **When** 子应用在沙箱模式下挂载（开发环境热重载后）
- **Then** `widgets/index.js` 的 `import.meta.glob` 自动发现新文件，`plugin:ready` 事件的 `widgetMetas` 和 `widgetComponents` 中自动包含新组件条目，无需修改任何适配器或索引模块代码

### 场景 8: 自动扫描新增 App、Background、通用组件

- **Given** 开发者新增了 App 组件、Background 元数据或 `app-*.vue` 通用组件
- **When** 子应用挂载
- **Then** 对应的索引模块自动发现新条目，并包含在 `plugin:ready` 事件的对应字段中，appMetas / appComponents / backgroundMetas / components 的计数自动更新

### 场景 9: 自动扫描组件名称冲突处理

- **Given** `src/widgets/` 目录下存在两个文件（如 `foo/widget.vue` 和 `bar/widget.vue`）解析出相同的 compName
- **When** `widgets/index.js` 执行 glob 扫描
- **Then** 冲突被检测到，控制台输出警告日志，注册表使用最后一个匹配结果（或合理解决策略），不抛出未捕获异常

### 场景 10: 非沙箱环境下不注册生命周期

- **Given** 子应用以独立调试模式运行（`__POWERED_BY_WUJIE__` 为 undefined）
- **When** `main.js` 脚本执行完毕
- **Then** `window.__WUJIE_MOUNT` 和 `window.__WUJIE_UNMOUNT` 均未定义，`window.__WUJIE.mount()` 未被调用，`window.$wujie.bus.$emit` 未被调用，运行时实例直接挂载到 `#app`

---

## 6. 非功能需求

### 6.1 性能

- **NFR-001-001**: 沙箱模式首次挂载（含实例创建 + 自动扫描注册 + DOM 挂载 + `plugin:ready` 事件发射）的同步执行时间 SHOULD 在 100ms 以内。
- **NFR-001-002**: 保活模式下的重复挂载（跳过实例创建，门控生效）的同步执行时间 SHOULD 在 10ms 以内。
- **NFR-001-003**: 所有自动扫描索引模块（widgets / apps / backgrounds / components）MUST 使用 `import.meta.glob` 的 eager 模式，确保所有元数据和组件定义在模块加载时一次性完成，不产生额外的网络请求。

### 6.2 可靠性与容错

- **NFR-001-004**: 卸载过程中任何步骤失败 MUST NOT 导致 `appInstance` 引用未被置空（清理逻辑在 catch 块之外执行）。
- **NFR-001-005**: 在任何异常场景下（包括自动扫描模块加载失败），独立调试模式 MUST 保持可用，不依赖沙箱模式的任何基础设施。
- **NFR-001-006**: 单个组件的 glob 扫描失败 MUST NOT 阻断其他组件的扫描和注册，失败项应被记录警告并跳过。

### 6.3 可维护性

- **NFR-001-007**: 新增任何类型组件（Widgets / Apps / Backgrounds / UI Components）MUST 实现零代码修改——仅需将新文件放置在对应的目录下（`src/widgets/`、`src/apps/`、`src/backgrounds/`、`src/components/`），下一轮构建或热重载后自动生效。
- **NFR-001-008**: 四类自动扫描索引模块的 glob 模式配置 MUST 集中在其各自的 `index.js` 文件中，与其他逻辑解耦，方便理解和修改扫描规则。

### 6.4 安全

- **NFR-001-009**: 独立调试模式下 MUST NOT 向 window 暴露任何 `__WUJIE_*` 或 `$wujie` 前缀的全局属性或方法。
- **NFR-001-010**: 卸载后的全局清理 MUST 彻底：`appInstance` 引用 MUST 被置为 `null`，确保不存在悬空引用。

---

## 7. 依赖

### 7.1 内部模块依赖

| 模块 | 依赖关系 | 说明 |
|------|----------|------|
| 自动扫描索引模块（widgets/apps/backgrounds/components） | 被 `src/main.js` import | 四个 `index.js` 输出被导入后组装为 `plugin:ready` 事件的 payload |
| 002-demo-widgets | 被 `src/widgets/index.js` 自动扫描 | Widget 组件的 `.widget.vue` 和 `.widget.js` 文件通过 glob 自动发现 |
| 003-demo-app | 被 `src/apps/index.js` 自动扫描 | App 组件的 `.app.vue` 和 `.app.js` 文件通过 glob 自动发现 |
| 004-demo-backgrounds | 被 `src/backgrounds/index.js` 自动扫描 | Background 的 `.bg.js` 文件通过 glob 自动发现 |

### 7.2 外部框架依赖

| 依赖 | 接口 | 说明 |
|------|------|------|
| 微前端框架（wujie） | `window.__POWERED_BY_WUJIE__` | 环境标识（boolean/undefined） |
| 微前端框架（wujie） | `window.__WUJIE` | 沙箱实例，提供 `.mount()` 方法用于主动就绪通知 |
| 微前端框架（wujie） | `window.__WUJIE_MOUNT` | 框架调用的生命周期函数（由本模块定义） |
| 微前端框架（wujie） | `window.__WUJIE_UNMOUNT` | 框架调用的生命周期函数（由本模块定义） |
| 微前端框架（wujie） | `window.$wujie.bus.$emit` | wujie 事件总线，用于发射 `plugin:ready` 事件 |
| 微前端框架（wujie） | `window.$wujie.props.pluginName` | 主应用通过 wujie props 注入的子应用名称 |

### 7.3 运行时依赖

| 依赖 | 版本 | 说明 |
|------|------|------|
| vue | ^3.5.39 | 提供 `createApp`、`defineComponent`，用于创建应用实例和组件注册 |
| Vite | ^8.1.4 | 提供 `import.meta.glob`（eager 模式）用于所有四类组件的自动扫描 |

### 7.4 假设

1. **假设**: 微前端框架（wujie）已由主应用正确引入并初始化，子应用仅需遵循生命周期契约，无需安装或配置 wujie 本身。
2. **假设**: 主应用的 wujie 配置中设置了 `alive: true`（保活模式），子应用的单例门控基于此假设设计。
3. **假设**: 生产构建使用 Vite 的单入口配置（`index.html`），该入口被主应用的 `PLUGINS.json` 或等效配置引用。
4. **假设**: 主应用监听 `plugin:ready` 事件并从 payload 中提取各组件的元数据和定义，负责注入其组件管理系统。
5. **假设**: 四类组件的文件遵循约定的命名模式（`.widget.vue` + `.widget.js`、`.app.vue` + `.app.js`、`.bg.js`、`app-*.vue`），放置在约定的目录下，确保 glob 模式能正确匹配。

---

## 8. 待澄清

| ID | 问题 | 影响 |
|----|------|------|
| NEEDS-CLARIFICATION-1 | Vite ESM 异步加载的超时策略：若网络极慢导致脚本长时间未加载完成（`window.__WUJIE.mount()` 从未被调用），主应用侧应由 wujie 框架的超时机制处理还是子应用侧需要实现超时重试？ | 影响 FR-001-010 的容错设计 |
| NEEDS-CLARIFICATION-2 | `__WUJIE_MOUNT` 在保活模式下每次调用都跳过实例创建，是否需要在重复调用时重新发射 `plugin:ready` 事件？当前设计仅在首次挂载时发射，若插件配置变化可能需要重新通知主应用 | 影响 FR-001-003 / FR-001-007 的事件发射策略 |
| NEEDS-CLARIFICATION-3 | 自动扫描索引模块中组件名称冲突的具体解决策略（覆盖、跳过、抛出）是否需要统一约定为跨模块的强制性规范？ | 影响 FR-001-014 的实现行为一致性 |

---

## 9. 版本历史

| 日期 | 变更 |
|------|------|
| 2026-07-24 | 重构为统一入口 + 自动扫描架构 — `main.js` 统一处理沙箱/独立调试模式，四类组件全部使用 `import.meta.glob` 自动扫描索引模块，wujie bus 事件 `plugin:ready` 替换 window 全局对象通信，单 HTML 入口 `index.html` |
| 2026-07-21 | 初始版本，基于已实现代码提取 |
