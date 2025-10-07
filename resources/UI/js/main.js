import { renderLogin } from './pages/login.js'
import { renderApp } from './components/app.js'
import { handleRouting } from './utils/router.js'
import { loadTheme } from './components/theme.js'

// Memuat tema saat aplikasi pertama kali dimuat
loadTheme()

// Fungsi untuk memeriksa status login dari localStorage
const checkLoginStatus = async () => {
  try {
    let url = '/api/profile'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
      },
      body: JSON.stringify({}),
    })
    if (!response.ok) {
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

const initApp = async () => {
  const appContainer = document.getElementById('app')

  // Hapus konten yang ada sebelum merender yang baru
  appContainer.innerHTML = ''
  let status = await checkLoginStatus()
  if (status) {
    renderApp()
  } else {
    renderLogin()
  }
}

document.addEventListener('DOMContentLoaded', initApp)
window.addEventListener('popstate', handleRouting)
