# 规格文档索引

**项目名称：** tpl-desktop-plugin-demo
**版本：** 0.1.0
**技术栈：** Vue 3 + Vite 7 + dayjs + @number-flow/vue + Sass
**文档生成时间：** 2026-07-21
**最后更新：** 2026-07-21

---

## 一、文档总览

| 层级 | 分类 | 文档数量 | 说明 |
|------|------|---------|------|
| 整体 | 项目级顶层文档 | 6 | 架构、技术、宪法、结构、API 清单等全局文档 |
| 整体 | 整体规格文档 | 5 | overall-* 系列文档 |
| 模块 | wujie 适配器（001） | 3 | 生命周期适配、双入口、元数据暴露 |
| 模块 | Demo Widget 组件（002） | 3 | 4 个 Demo Widget 组件 |
| 模块 | Demo App 组件（003） | 3 | DemoClock App 组件 |
| 模块 | 背景资源（004） | 2 | 12 套桌面背景 |
| **合计** | **5 目录 / 22 文件** | | |

---

## 二、项目级顶层文档

全局性的架构、技术、宪法等文档，定义项目基线和开发准则。

| 文档 | 路径 | 说明 |
|------|------|------|
| **项目结构** | [STRUCTURE.md](./STRUCTURE.md) | 源码目录结构、入口/页面清单、组件清单 |
| **API 清单** | [API.md](./API.md) | 全量 API 清单（本工程为纯前端，无 REST API） |
| **技术选型** | [TECH.md](./TECH.md) | 核心技术栈选型理由、版本、依赖说明 |
| **方案总纲** | [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统整体架构设计、分层图、数据流 |
| **宪法原则** | [constitution.md](./constitution.md) | 项目开发原则、编码规范、治理规则（12 条） |
| **检查清单** | [SPECS_CHECKLIST.md](./SPECS_CHECKLIST.md) | 规格文档完成度追踪 |

### 整体规格文档

描述跨模块的全局规格、方案和数据模型。

| 文档 | 路径 | 说明 |
|------|------|------|
| **整体规格** | [overall-spec.md](./overall-spec.md) | 系统级功能规格（FR-001 ~ FR-072） |
| **整体方案** | [overall-plan.md](./overall-plan.md) | 系统级技术方案、宪法合规检查 |
| **数据模型** | [overall-data-model.md](./overall-data-model.md) | 全局数据实体定义（WidgetMeta/AppMeta/DesktopBackgroundMeta 等） |
| **接口模型** | [overall-api.md](./overall-api.md) | 全局接口契约（wujie 运行时接口 + 组件 Props 契约） |
| **测试用例索引** | [overall-test-cases.md](./overall-test-cases.md) | 全模块测试用例索引总览 |

---

## 三、wujie 适配器（001）

### 001 — wujie 生命周期适配器（wujie-adaptor）

> 子应用的核心桥接模块，负责 wujie 环境检测、生命周期注册（`__WUJIE_MOUNT`/`__WUJIE_UNMOUNT`）、通过 `window.$wujie.bus.$emit('plugin:ready', ...)` 事件向主应用暴露所有组件元数据与定义。通过 `main.js` 统一入口 + 4 个 `src/*/index.js` 自动扫描模块实现独立调试与沙箱模式的无缝切换。

| 文档 | 链接 | 说明 |
|------|------|------|
| 功能规格 | [001-wujie-adaptor/spec.md](./001-wujie-adaptor/spec.md) | wujie 生命周期适配器功能规格 |
| 技术方案 | [001-wujie-adaptor/plan.md](./001-wujie-adaptor/plan.md) | wujie 生命周期适配器技术实现方案 |
| 测试用例 | [001-wujie-adaptor/test-cases.md](./001-wujie-adaptor/test-cases.md) | wujie 生命周期适配器 UI 功能测试用例 |

---

## 四、Demo Widget 组件（002）

### 002 — Demo Widget 组件集（demo-widgets）

> 4 个可在主应用桌面网格中渲染的 Demo Widget：DemoText（纯文本）、DemoNumber（动画数字，@number-flow/vue）、DemoImage（图片，5 种 object-fit）、DemoVideo（视频，自动静音循环，资源释放）。所有组件遵循统一设计模式（flex 居中 + 100% 铺满 + --desktop-* CSS 变量 + scoped 作用域）。

| 文档 | 链接 | 说明 |
|------|------|------|
| 功能规格 | [002-demo-widgets/spec.md](./002-demo-widgets/spec.md) | Demo Widget 组件功能规格 |
| 技术方案 | [002-demo-widgets/plan.md](./002-demo-widgets/plan.md) | Demo Widget 组件技术实现方案 |
| 测试用例 | [002-demo-widgets/test-cases.md](./002-demo-widgets/test-cases.md) | Demo Widget 组件 UI 功能测试用例 |

---

## 五、Demo App 组件（003）

### 003 — Demo 时钟 App（demo-app）

> 可在主应用全屏叠加层运行的 DemoClock App，使用 dayjs 实现实时数字时钟，支持自定义时间格式和日期行显隐切换。包含定时器资源管理（`onBeforeUnmount` 清理），中文星期映射。

| 文档 | 链接 | 说明 |
|------|------|------|
| 功能规格 | [003-demo-app/spec.md](./003-demo-app/spec.md) | DemoClock App 功能规格 |
| 技术方案 | [003-demo-app/plan.md](./003-demo-app/plan.md) | DemoClock App 技术实现方案 |
| 测试用例 | [003-demo-app/test-cases.md](./003-demo-app/test-cases.md) | DemoClock App UI 功能测试用例 |

---

## 六、背景资源（004）

### 004 — Demo 桌面背景集（demo-backgrounds）

> 12 套桌面视觉背景，分为暗色系（dark×4）、浅色系（light×4）、动态视频（webm×4）三类。每个背景通过 `.bg.js` 文件声明元数据（title/category/theme/type/资源路径），由 `import.meta.glob` 自动扫描注册，零手动维护。纯资源配置模块，无 UI 交互。

| 文档 | 链接 | 说明 |
|------|------|------|
| 功能规格 | [004-demo-backgrounds/spec.md](./004-demo-backgrounds/spec.md) | Demo 桌面背景集功能规格 |
| 技术方案 | [004-demo-backgrounds/plan.md](./004-demo-backgrounds/plan.md) | Demo 桌面背景集技术实现方案 |

---

## 七、模块编号一览

| 编号 | 模块名 | 英文名 | 分类 |
|------|--------|--------|------|
| 001 | wujie 生命周期适配器 | wujie-adaptor | 框架适配 |
| 002 | Demo Widget 组件集 | demo-widgets | 业务组件 |
| 003 | Demo 时钟 App | demo-app | 业务组件 |
| 004 | Demo 桌面背景集 | demo-backgrounds | 静态资源 |

---

## 八、模块文档结构规范

每个模块目录 `NNN-name/` 下包含以下标准文档：

| 文件 | 命名 | 说明 |
|------|------|------|
| 功能规格 | `spec.md` | 定义模块的功能需求、用户故事、验收标准 |
| 技术方案 | `plan.md` | 模块的技术实现方案、架构决策、组件设计 |
| 测试用例 | `test-cases.md` | 模块 UI 功能测试用例（纯资源模块无此文件） |

---

## 九、快速导航

| 目标读者 | 推荐阅读顺序 |
|---------|-------------|
| **子应用开发者** | constitution.md → STRUCTURE.md → overall-spec.md → 001-wujie-adaptor/ → 002-demo-widgets/ |
| **主应用集成开发者** | overall-api.md → 001-wujie-adaptor/ → ARCHITECTURE.md |
| **架构师 / Tech Lead** | ARCHITECTURE.md → TECH.md → overall-plan.md → overall-api.md |
| **测试 / QA** | overall-test-cases.md → 001-wujie-adaptor/test-cases.md → 002-demo-widgets/test-cases.md → 003-demo-app/test-cases.md |
| **产品经理** | overall-spec.md → 对应模块 spec.md |

---

**文档维护者：** tpl-desktop-plugin-demo 开发团队
