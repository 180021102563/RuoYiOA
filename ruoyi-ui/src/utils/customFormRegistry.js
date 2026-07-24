/**
 * 自定义表单注册表
 *
 * 自动扫描 src/views/workflow/customForms/ 目录下的 .vue 文件
 * key = 文件名（不含扩展名），如 'LeaveForm'
 * value = 组件异步加载函数
 *
 * 使用方式：
 *   import customFormRegistry from '@/utils/customFormRegistry'
 *   const loader = customFormRegistry['LeaveForm']
 *   if (loader) {
 *     const module = await loader()
 *     const component = module.default || module
 *   }
 */

const customFormRegistry = {}

// 自动扫描约定目录
const requireComponent = require.context(
  '@/views/workflow/customForms',
  false,       // 不递归子目录
  /\.vue$/     // 只匹配 .vue 文件
)

requireComponent.keys().forEach(fileName => {
  // 从 './LeaveForm.vue' 提取 'LeaveForm'
  const componentName = fileName.replace(/^\.\/(.*)\.\w+$/, '$1')
  customFormRegistry[componentName] = () => requireComponent(fileName)
})

/**
 * 获取自定义表单组件名列表
 * @returns {Array<{name: string}>}
 */
export function getCustomFormOptions() {
  return Object.keys(customFormRegistry).map(name => ({ name }))
}

export default customFormRegistry
