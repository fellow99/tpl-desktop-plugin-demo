# 项目目录结构 & 路由清单

> 项目：tpl-desktop-plugin-demo
> 最后更新：2026-07-21

---

## 1. 完整目录树

```
tpl-desktop-plugin-demo/
├── index.html                          # 独立调试入口（开发时用）
├── plugin.html                         # wujie 沙箱入口（被主应用 iframe 加载）
├── package.json                        # 子应用独立 package（name=tpl-desktop-plugin-demo）
├── pnpm-lock.yaml                      # 依赖锁文件
├── vite.config.js                      # Vite 构建配置（port=5273, cors=true）
├── specs/                              # 规范文档目录
│   ├── README.md                       # 文档总索引
│   ├── SPECS_CHECKLIST.md              # 文档完成度追踪
│   ├── STRUCTURE.md                    # 本文件
│   ├── API.md                          # API 清单
│   ├── TECH.md                         # 技术选型
│   ├── ARCHITECTURE.md                 # 系统架构
│   ├── constitution.md                 # 宪法原则
│   ├── overall-spec.md                 # 整体功能规格
│   ├── overall-plan.md                 # 整体技术方案
│   ├── overall-data-model.md           # 数据模型
│   ├── overall-api.md                  # 对外接口契约
│   ├── overall-test-cases.md           # 测试用例索引
│   ├── 001-wujie-adaptor/              # 001 模块：wujie 生命周期适配器
│   ├── 002-demo-widgets/               # 002 模块：Demo Widget 组件集
│   ├── 003-demo-app/                   # 003 模块：Demo App 组件
│   └── 004-demo-backgrounds/           # 004 模块：Demo 桌面背景集
└── src/
    ├── main.js                         # 统一入口脚本（双模式共用）★核心文件
    ├── App.vue                         # 独立调试模式根组件
    ├── widgets/
    │   ├── index.js                    # Widget 自动扫描注册入口（import.meta.glob）
    │   └── demo/
    │       ├── DemoText.widget.vue      # Demo文字 Widget（纯文本渲染）
    │       ├── DemoText.widget.js       # Demo文字 元数据
    │       ├── DemoNumber.widget.vue    # Demo数字 Widget（NumberFlow 动画数值）
    │       ├── DemoNumber.widget.js     # Demo数字 元数据
    │       ├── DemoImage.widget.vue     # Demo图片 Widget（5 种 object-fit）
    │       ├── DemoImage.widget.js      # Demo图片 元数据
    │       ├── DemoVideo.widget.vue     # Demo视频 Widget（自动静音循环）
    │       ├── DemoVideo.widget.js      # Demo视频 元数据
    │       └── avatar.svg              # Widget 头像占位图
    ├── apps/
    │   ├── index.js                    # App 自动扫描注册入口（import.meta.glob）
    │   └── demo/
    │       ├── DemoClock.app.vue        # Demo时钟 App（dayjs 实时时间）
    │       └── DemoClock.app.js         # Demo时钟 元数据
    ├── components/
    │   └── index.js                    # UI 组件自动扫描注册入口（import.meta.glob）
    └── backgrounds/
        ├── index.js                    # Background 自动扫描注册入口（import.meta.glob）
        ├── avatar.svg                  # 背景通用头像
        ├── dark/
        │   ├── dark-001.bg.js          # 暗色背景01 元数据
        │   ├── dark-001.jpg            # 暗色背景01 原图
        │   ├── dark-001-s.jpg          # 暗色背景01 缩略图
        │   ├── dark-002.bg.js / dark-002.jpg / dark-002-s.jpg
        │   ├── dark-003.bg.js / dark-003.jpg / dark-003-s.jpg
        │   └── dark-004.bg.js / dark-004.jpg / dark-004-s.jpg
        ├── light/
        │   ├── light-001.bg.js         # 浅色背景01 元数据
        │   ├── light-001.jpg           # 浅色背景01 原图
        │   ├── light-001-s.jpg         # 浅色背景01 缩略图
        │   ├── light-002.bg.js / light-002.jpg / light-002-s.jpg
        │   ├── light-003.bg.js / light-003.jpg / light-003-s.jpg
        │   └── light-004.bg.js / light-004.jpg / light-004-s.jpg
        └── video/
            ├── webm-001.bg.js          # 动态背景01 元数据
            ├── webm-001.webm           # 动态背景01 视频
            ├── webm-001-s.jpg          # 动态背景01 缩略图
            ├── webm-002.bg.js / webm-002.webm / webm-002-s.jpg
            ├── webm-003.bg.js / webm-003.webm / webm-003-s.jpg
            └── webm-004.bg.js / webm-004.webm / webm-004-s.jpg
```

---

## 2. 页面 / 入口清单

本工程为 wujie 子应用，无传统路由系统（无 vue-router），而是通过单一 HTML 入口的 `main.js` 中环境判断实现双模式运行。

| 入口文件 | HTML 入口 | JS 入口 | 模式 | 用途 |
|----------|-----------|---------|------|------|
| `index.html` + `src/main.js` | `/tpl-desktop-plugin-demo/index.html` | `src/main.js` | **双模式统一入口** | 通过 `window.__POWERED_BY_WUJIE__` 自动切换沙箱/独立调试模式 |

### 2.1 独立调试模式流程

```
index.html
  → <script type="module" src="/src/main.js">
    → window.__POWERED_BY_WUJIE__ === undefined/false
    → createApp(App).mount('#app')
    → console.log('[plugin] Running standalone')
```

### 2.2 wujie 沙箱模式流程

```
index.html
  → <script type="module" src="/src/main.js">
    → window.__POWERED_BY_WUJIE__ === true
    → 注册 __WUJIE_MOUNT / __WUJIE_UNMOUNT
      → __WUJIE_MOUNT: createApp → mount('#app')
        → $wujie.bus.$emit('plugin:ready', { ... })
      → __WUJIE_UNMOUNT: appInstance?.unmount()
    → window.__WUJIE.mount() — 主动通知就绪
```

---

## 3. 组件清单

### 3.1 Widget 组件（4 个）

| 组件名 | 文件 | 用途 | 默认尺寸 |
|--------|------|------|----------|
| DemoText | `widgets/demo/DemoText.widget.vue` | 纯文本展示 | 1×1 grid |
| DemoNumber | `widgets/demo/DemoNumber.widget.vue` | 数字动画展示（@number-flow/vue） | 1×1 grid |
| DemoImage | `widgets/demo/DemoImage.widget.vue` | 图片展示（5 种 object-fit） | 2×2 grid |
| DemoVideo | `widgets/demo/DemoVideo.widget.vue` | 视频播放（自动静音循环） | 2×2 grid |

### 3.2 App 组件（1 个）

| 组件名 | 文件 | 用途 | 默认尺寸 |
|--------|------|------|----------|
| DemoClock | `apps/demo/DemoClock.app.vue` | 数字时钟（dayjs + 日期显示） | 3×3 grid |

### 3.3 Background 组件（12 个）

| 背景名 | 文件 | 分类 | 主题 | 类型 |
|--------|------|------|------|------|
| dark-001 ~ dark-004 | `backgrounds/dark/dark-*.bg.js` | 暗色系 | dark | image |
| light-001 ~ light-004 | `backgrounds/light/light-*.bg.js` | 浅色系 | light | image |
| webm-001 ~ webm-004 | `backgrounds/video/webm-*.bg.js` | 动态背景 | dark | video |

---

## 4. 关键配置文件

| 文件 | 用途 |
|------|------|
| `package.json` | 项目元数据、依赖版本、构建脚本 |
| `vite.config.js` | Vite 配置（base=/tpl-desktop-plugin-demo/、port=5273、cors=true） |
| `pnpm-lock.yaml` | 依赖版本锁定 |

### 4.1 自动扫描入口模块

| 文件 | 用途 | 扫描模式 |
|------|------|----------|
| `src/widgets/index.js` | Widget 组件自动扫描注册 | `./**/*.widget.vue` + `./**/*.widget.js` |
| `src/apps/index.js` | App 组件自动扫描注册 | `./**/*.app.vue` + `./**/*.app.js` |
| `src/backgrounds/index.js` | 桌面背景自动扫描注册 | `./**/*.bg.js` |
| `src/components/index.js` | UI 组件自动扫描注册 | `./**/app-*.vue` |

---

## 5. 无 docs / public 目录

本工程无 `docs/` 独立文档目录和 `public/` 静态资源目录。所有逻辑集中在 `src/`，规范文档集中在 `specs/`。
