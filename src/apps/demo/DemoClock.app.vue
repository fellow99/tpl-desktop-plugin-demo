<script setup>
// ============================================================
// tpl-desktop-plugin-demo: 时钟（DemoClock）
// 时间实时更新的时钟 App。
// 计时器卫生：setInterval 在 onMounted 启动、onBeforeUnmount 清除，
// App 反复关闭/最小化恢复不产生泄漏。
// Q-01：仅接收 props 渲染内容，可独立运行。
// ============================================================
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  // 时间格式（dayjs format 模板）
  format: { type: String, default: 'HH:mm:ss' },
  // 是否显示日期行
  showDate: { type: Boolean, default: true },
})

// 中文星期映射（避免引入 dayjs locale 附加体积）
const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const now = ref(dayjs())

const timeText = computed(() => now.value.format(props.format))
const dateText = computed(
  () => `${now.value.format('YYYY年MM月DD日')} ${WEEK_CN[now.value.day()]}`,
)

let timer = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = dayjs()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="DemoClock">
    <div class="clock-time">{{ timeText }}</div>
    <div v-if="showDate" class="clock-date">{{ dateText }}</div>
  </div>
</template>

<style scoped lang="scss">
// 根容器铺满 + flex 居中（与 widgets/demo 统一设计模式一致）
.DemoClock {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  width: 100%;
  height: 100%;
  color: var(--desktop-text-primary);
}

.clock-time {
  font-size: 4em;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.clock-date {
  color: var(--desktop-text-secondary);
  font-size: 1.25em;
}
</style>
