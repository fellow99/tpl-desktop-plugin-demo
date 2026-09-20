// ============================================================
// tpl-desktop-plugin-demo: 滚动数字（DemoNumber）元数据
// FR-024 完整字段 / C-03 属性元数据（title、category、type、default）
// ============================================================
import avatar from './avatar.svg'

export default {
  title: 'Demo数字',
  category: '3.Demo组件',
  avatar,
  thumbnail: null,
  rect: { unit: 'grid', width: 1, height: 1 },
  props: {
    value: {
      title: '数值',
      category: '看板组件配置',
      type: 'number',
      default: 123.456,
    },
    precision: {
      title: '小数保留位数',
      category: '看板组件配置',
      type: 'number',
      default: 2,
    },
    title: {
      title: '标题文字',
      category: '看板组件配置',
      default: '',
    },
    unit: {
      title: '单位文字',
      category: '看板组件配置',
      default: '',
    },
  },
  // Q-02：预留扩展点，保持空数组
  events: [],
  propsEditors: [],
  wrapperEditors: [],
}
