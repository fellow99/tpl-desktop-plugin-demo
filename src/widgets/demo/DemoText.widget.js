// ============================================================
// tpl-desktop-plugin-demo: Demo文字（DemoText）元数据
// FR-024：声明 title/category/avatar/thumbnail/rect/props/
//         events/propsEditors/wrapperEditors 完整字段
// C-03：每个属性声明 title、category、default（type 可选，默认 text）
// ============================================================
import avatar from './avatar.svg'

export default {
  title: 'Demo文字',
  category: '3.Demo组件',
  avatar,
  thumbnail: null,
  rect: { unit: 'grid', width: 1, height: 1 },
  props: {
    value: {
      title: '文本内容',
      category: '看板组件配置',
      default: '这是一段文字',
    },
  },
  // Q-02：预留扩展点，保持空数组
  events: [],
  propsEditors: [],
  wrapperEditors: [],
}
