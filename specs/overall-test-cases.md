# 测试用例索引

> 项目：tpl-desktop-plugin-demo
> 最后更新：2026-07-21

---

## 概述

本文件为 tpl-desktop-plugin-demo 子应用的全模块测试用例索引总览。各模块的详细测试用例参见对应模块目录下的 `test-cases.md`。

---

## 模块测试用例分布

| 模块编号 | 模块名称 | 测试用例文档 | 用例数 | 说明 |
|----------|----------|-------------|--------|------|
| 001 | wujie-adaptor | [001-wujie-adaptor/test-cases.md](./001-wujie-adaptor/test-cases.md) | — | wujie 生命周期、双模式切换、组件暴露 |
| 002 | demo-widgets | [002-demo-widgets/test-cases.md](./002-demo-widgets/test-cases.md) | — | 4 个 Demo Widget 的渲染、交互、空值处理、属性配置 |
| 003 | demo-app | [003-demo-app/test-cases.md](./003-demo-app/test-cases.md) | — | DemoClock App 的时间更新、日期显示、资源清理 |
| 004 | demo-backgrounds | — | — | 纯资源模块，无 UI 交互界面，不生成 test-cases.md |

> 注：004-demo-backgrounds 为纯资源模块（图片/视频 + 元数据），无前端交互界面，不生成测试用例文档。

---

## 测试类别一览

| 类别 | 覆盖模块 | 说明 |
|------|----------|------|
| **独立调试模式** | 001 | 子应用 standalone 环境下的启动验证 |
| **wujie 生命周期** | 001 | mount/unmount 流程、保活模式单例、ESM 异步桥接 |
| **组件暴露** | 001 | exports/components 对象结构与内容验证 |
| **Widget 渲染** | 002 | 各 Widget 的默认渲染、props 动态更新 |
| **Widget 空值处理** | 002 | DemoImage/DemoVideo 值为空时不渲染 |
| **Widget 属性配置** | 002 | objectFit 切换、precision 钳位、value 格式化 |
| **App 渲染** | 003 | DemoClock 实时时间更新、日期行显隐 |
| **资源清理** | 002, 003 | 视频暂停释放、定时器清除 |
| **集成验证** | 001, 002, 003 | 主-子应用联调、组件在主应用中的表现 |

---

## 前置条件

所有测试用例共享以下前置条件：

1. 子应用开发服务器已启动（`pnpm dev`，端口 5273）
2. 主应用开发服务器已启动（非必须，仅集成测试需要）
3. 主应用 `public/PLUGINS.json` 中已配置子应用条目（非必须，仅集成测试需要）
4. 浏览器支持现代 Web API（Proxy、WebComponent、Shadow DOM）

---

## 快速导航

| 测试角色 | 推荐起点 |
|----------|----------|
| **子应用开发者** | 001-wujie-adaptor/test-cases.md → 002-demo-widgets/test-cases.md |
| **主应用集成测试** | 001-wujie-adaptor/test-cases.md（集成场景部分） |
| **QA / 测试工程师** | 本索引 → 各模块 test-cases.md |
