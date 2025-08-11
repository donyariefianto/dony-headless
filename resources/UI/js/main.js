import { renderLogin } from './pages/login.js'
import { renderApp } from './components/app.js'
import { handleRouting } from './utils/router.js'
import { loadTheme } from './components/theme.js'

// Memuat tema saat aplikasi pertama kali dimuat
loadTheme()

// Fungsi untuk memeriksa status login dari localStorage
const checkLoginStatus = () => {
  return localStorage.getItem('isLoggedIn') === 'true'
}

const initApp = () => {
  const appContainer = document.getElementById('app')

  // Hapus konten yang ada sebelum merender yang baru
  appContainer.innerHTML = ''

  if (checkLoginStatus()) {
    renderApp()
  } else {
    renderLogin()
  }
}

document.addEventListener('DOMContentLoaded', initApp)
window.addEventListener('popstate', handleRouting)
