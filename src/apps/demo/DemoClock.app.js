// ============================================================
// tpl-desktop-plugin-demo: 时钟（DemoClock）元数据
// 依据 overall-data-model.md §1.6：title 时钟 / category Demo应用 / 3×3
// C-03：每个属性声明 title、category、default（type 可选，默认 text）
// compName 由 apps/index.js 自动注入，此处不手写
// ============================================================
export default {
  title: 'Demo时钟',
  category: 'Demo应用',
  avatar: null,
  thumbnail: null,
  rect: { unit: 'grid', width: 3, height: 3 },
  props: {
    format: {
      title: '时间格式',
      category: '看板组件配置',
      type: 'text',
      default: 'HH:mm:ss',
    },
    showDate: {
      title: '显示日期',
      category: '看板组件配置',
      type: 'boolean',
      default: true,
    },
  },
  // Q-02：预留扩展点，保持空数组
  events: [],
  propsEditors: [],
  wrapperEditors: [],
}
