import { createApp } from 'vue'
import App from './App.vue'
import { WidgetMetas, WidgetComponents } from './widgets/index.js'
import { AppMetas, AppComponents } from './apps/index.js'
import { BackgroundMetas } from './backgrounds/index.js'
import { Components as UIComponents } from './components/index.js'

let appInstance = null

if (window.__POWERED_BY_WUJIE__) {
  window.__WUJIE_MOUNT = () => {
    appInstance = createApp(App)
    appInstance.mount('#app')

    const pluginName = window.$wujie?.props?.pluginName

    window.$wujie?.bus.$emit('plugin:ready', {
      pluginName,
      widgetMetas: WidgetMetas,
      widgetComponents: WidgetComponents,
      appMetas: AppMetas,
      appComponents: AppComponents,
      backgroundMetas: BackgroundMetas,
      components: UIComponents,
    })

    console.log(`[${pluginName}] Plugin ready, injected ${Object.keys(WidgetMetas).length} widgets, ${Object.keys(AppMetas).length} apps, ${Object.keys(BackgroundMetas).length} backgrounds`)
  }

  window.__WUJIE_UNMOUNT = () => {
    appInstance?.unmount()
    appInstance = null
  }

  window.__WUJIE.mount()
} else {
  appInstance = createApp(App)
  appInstance.mount('#app')
  console.log('[plugin] Running standalone')
}
