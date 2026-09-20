# 技术选型

> 项目：tpl-desktop-plugin-demo
> 最后更新：2026-07-21

---

## 技术栈总览

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | Vue 3 (Composition API + `<script setup>`) | ^3.5.39 | 组件框架、响应式系统 |
| **构建** | Vite | ^8.1.4 | 开发服务器、生产构建 |
| **Vite 插件** | @vitejs/plugin-vue | ^6.0.8 | Vue SFC 编译 |
| **样式** | Sass (SCSS) | ^1.101.0 | CSS 预处理（`<style scoped lang="scss">`） |
| **数值动画** | @number-flow/vue | ^0.4.8 | DemoNumber Widget 的数字滚动动画 |
| **日期** | dayjs | ^1.11.19 | DemoClock App 的时间格式化 |
| **微前端** | wujie（无界） | （主应用依赖） | 子应用通过 `__WUJIE_MOUNT`/`__WUJIE_UNMOUNT` 生命周期适配 wujie 沙箱 |

> 注：wujie 本身不在此子应用的 `package.json` 中声明，子应用通过 `window.__POWERED_BY_WUJIE__` 判断运行环境，遵循 wujie 生命周期契约。

---

## 技术决策理由

### 1. Vite 7 + Vue 3 — 与主应用技术栈对齐

主应用 tpl-desktop 使用 Vite 7 + Vue 3.5，子应用保持相同技术栈可确保：
- 组件语法一致（Composition API + `<script setup>`）
- 构建配置互通（主应用通过 Vite proxy 代理子应用 dev server）
- 依赖版本兼容（Vue 3.x 保活模式下共享实例无冲突风险）

### 2. 统一入口架构（index.html + main.js）

`index.html` 作为唯一 HTML 入口，通过 `main.js` 中的 `if (window.__POWERED_BY_WUJIE__)` 自动切换沙箱/独立调试模式。

| 入口 | 用途 | 使用场景 |
|------|------|----------|
| `index.html` + `main.js` | 双模式统一入口 | `pnpm dev` → 访问 `localhost:5273`；主应用通过 `startApp()` 加载 |

此设计符合 wujie 子应用最佳实践（参见主应用 `docs/wujie-research.md` §3.4），确保独立开发与沙箱运行两不相扰。

### 3. @number-flow/vue — 数字动画

DemoNumber Widget 使用 `@number-flow/vue` 实现数值变化时的平滑滚动动画。该库：
- 专为 Vue 3 设计，与 Composition API 无缝集成
- 纯 CSS + JS 驱动，无需 Canvas/WebGL
- 支持自定义格式化（format 选项）

### 4. dayjs — 轻量级日期处理

DemoClock App 使用 dayjs 进行时间格式化。选择理由：
- 体积极小（~2KB），适合子应用场景
- API 与 moment.js 兼容，学习成本低
- 中文星期映射硬编码（`WEEK_CN`），避免引入 locale 包

### 5. Sass (SCSS) — 样式预处理

沿用主应用的 SCSS 方案，所有组件使用 `<style scoped lang="scss">`，通过 CSS 变量（`--desktop-*`）与主应用主题系统对接。

### 6. Vite `import.meta.glob` — 自动扫描

`src/backgrounds/index.js` 中使用 `import.meta.glob('./**/*.bg.js', { eager: true })` 自动扫描所有背景元数据文件，与主应用的 `import.meta.glob` 策略一致，实现零手动维护。同样，`src/widgets/index.js`、`src/apps/index.js`、`src/components/index.js` 也使用相同的自动扫描策略。
