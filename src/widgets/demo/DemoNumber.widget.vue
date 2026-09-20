<script setup>
// ============================================================
// tpl-desktop-plugin-demo: 滚动数字（DemoNumber）
// FR-003~005：使用 @number-flow/vue 的 NumberFlow 组件实现
//   数值变化时的平滑滚动动画。
// 渲染前经 parseFloat(value).toFixed(precision) 处理，
// 并通过 format 选项固定小数位数，保证数值格式统一。
// ============================================================
import { computed } from 'vue'
import NumberFlow from '@number-flow/vue'

const props = defineProps({
  // 数值
  value: { type: Number, default: 123.456 },
  // 小数保留位数
  precision: { type: Number, default: 2 },
  // 标题文字
  title: { type: String, default: '' },
  // 单位文字
  unit: { type: String, default: '' },
})

// 精度归一：非法输入回退 0 位小数（0~20 为 toFixed 合法区间）
const safePrecision = computed(() => {
  const p = Math.trunc(Number(props.precision))
  return Number.isFinite(p) ? Math.min(Math.max(p, 0), 20) : 0
})

// parseFloat(value).toFixed(precision) → 数值（非法输入回退 0）
const displayValue = computed(() => {
  const n = parseFloat(props.value)
  return Number.isFinite(n) ? Number(n.toFixed(safePrecision.value)) : 0
})

// 固定小数位数展示（保留末尾 0，与 toFixed 行为一致）
const numberFormat = computed(() => ({
  minimumFractionDigits: safePrecision.value,
  maximumFractionDigits: safePrecision.value,
  useGrouping: false,
}))
</script>

<template>
  <div class="DemoNumber">
    <span v-if="title" class="number-title">{{ title }}</span>
    <NumberFlow class="number-value" :value="displayValue" :format="numberFormat" />
    <span v-if="unit" class="number-unit">{{ unit }}</span>
  </div>
</template>

<style scoped lang="scss">
// flex 横向排列 title | number | unit
.DemoNumber {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--desktop-text-primary);
}

.number-title {
  overflow: hidden;
  max-width: 40%;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.875em;
  color: var(--desktop-text-secondary);
  transform: translateX(-0.25em);
}

.number-value {
  font-size: 1.5em;
  font-weight: 600;
}

.number-unit {
  font-size: 0.875em;
  color: var(--desktop-text-secondary);
  transform: translateX(0.25em);
}
</style>
