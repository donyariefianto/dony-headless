import { initSidebar } from './sidebar.js'
import { initTheme } from './theme.js'
import { initRouter } from './router.js'

document.addEventListener('DOMContentLoaded', () => {
  initSidebar()
  initTheme()
  initRouter()
})
