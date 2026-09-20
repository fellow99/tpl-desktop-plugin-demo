<template>
  <div class="plugin-app">
    <p>独立开发模式</p>
    <p>Widgets: {{ Object.keys(WidgetMetas) }}</p>
    <p>Apps: {{ Object.keys(AppMetas) }}</p>
    <p>背景: {{ Object.keys(BackgroundMetas) }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { WidgetMetas } from './widgets/index.js'
import { AppMetas } from './apps/index.js'
import { BackgroundMetas } from './backgrounds/index.js'
</script>
