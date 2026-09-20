<script setup>
// ============================================================
// tpl-desktop-plugin-demo: Demo文字（DemoText）
// 最简看板组件参考实现：
//   仅通过 Mustache 插值渲染 value，无其他 script 逻辑。
// Q-01：仅接收 props 渲染内容，不依赖编辑器环境。
// ============================================================
defineProps({
  // 文本内容
  value: { type: String, default: '这是一段文字' },
})
</script>

<template>
  <div class="DemoText">{{ value }}</div>
</template>

<style scoped lang="scss">
// 统一设计模式：根容器铺满 + flex 居中
.DemoText {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--desktop-text-primary);
}
</style>
