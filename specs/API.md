# API 清单

> 项目：tpl-desktop-plugin-demo
> 最后更新：2026-07-21

---

## 说明

本工程为 wujie（无界）微前端子应用，是一个**纯前端项目**，不包含 REST API 或后端服务端点。

子应用通过以下机制与主应用（tpl-desktop）交互：

| 交互方式 | 方向 | 说明 |
|----------|------|------|
| `window.__WUJIE_EXPORTS__` | 子→主 | 子应用暴露组件元数据（widgets/apps/backgrounds）供主应用读取 |
| `window.__WUJIE_COMPONENTS__` | 子→主 | 子应用暴露 Vue 组件定义供主应用全局注册 |
| `window.__WUJIE_MOUNT` | 主→子 | 主应用（wujie 框架）调用子应用挂载生命周期 |
| `window.__WUJIE_UNMOUNT` | 主→子 | 主应用（wujie 框架）调用子应用卸载生命周期 |
| `window.__WUJIE.mount()` | 子应用主动 | Vite ESM 异步加载完成后主动通知 wujie 框架就绪 |
| `window.__POWERED_BY_WUJIE__` | wujie 框架 | 环境标识，子应用据此判断运行模式 |
| `window.__WUJIE_RAW_WINDOW__` | wujie 框架 | 原始 window 对象，主应用可通过此向子应用注入共享对象（如 Vue app 实例） |

详见 [overall-api.md](./overall-api.md) 中的接口契约定义。
