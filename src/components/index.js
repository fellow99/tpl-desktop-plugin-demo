// components/index.js
// 使用 import.meta.glob 自动扫描 app-*.vue 组件

const componentModules = import.meta.glob('./**/app-*.vue', { eager: true })

/**
 * @type {Record<string, import('vue').Component>}
 */
export const Components = {}

for (const path in componentModules) {
  const mod = componentModules[path]
  const comp = mod.default || mod
  if (comp && (comp.render || comp.setup || comp.__name || comp.name)) {
    const fileName = path.split('/').pop()
    const compName = fileName.replace('.vue', '')
    Components[compName] = comp
  }
}
