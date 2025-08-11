import { renderDashboard } from '../pages/dashboard.js'
import { renderDataEntries, setupDataEntries } from '../pages/dataEntries.js'

const routes = {
  '': () => {
    document.getElementById('main-content').innerHTML = renderDashboard()
  },
  '#dashboard': () => {
    document.getElementById('main-content').innerHTML = renderDashboard()
  },
  '#data-entries': () => {
    document.getElementById('main-content').innerHTML = renderDataEntries()
    setupDataEntries() // Panggil fungsi setup di sini
  },
  '#data-entries': () => {
    document.getElementById('main-content').innerHTML = renderDataEntries()
    setupDataEntries() // Panggil fungsi setup di sini
  },
}

export const handleRouting = () => {
  const path = window.location.hash || '#dashboard'
  const renderFunction = routes[path]
  if (renderFunction) {
    renderFunction()
  } else {
    document.getElementById('main-content').innerHTML = '<h2>404 Page Not Found</h2>'
  }
}
