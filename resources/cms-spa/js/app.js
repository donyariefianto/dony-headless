// js/app.js

console.log('Aplikasi Native SPA AdminLTE-like siap!')

document.addEventListener('DOMContentLoaded', () => {
  // --- Sidebar Toggle Logic ---
  const sidebarToggleButton = document.getElementById('sidebarToggle')
  if (sidebarToggleButton) {
    sidebarToggleButton.addEventListener('click', (e) => {
      e.preventDefault()
      document.body.classList.toggle('sidebar-collapse') // Untuk desktop
      document.body.classList.toggle('sidebar-open') // Untuk mobile
    })
  }

  // --- Dark Mode Toggle Logic ---
  const darkModeToggleButton = document.getElementById('darkModeToggle')
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)')

  // Function to apply the theme
  const applyTheme = (theme) => {
    document.body.classList.remove('light-mode', 'dark-mode')
    document.body.classList.add(theme + '-mode')
    localStorage.setItem('theme', theme) // Save preference
    // Update icon
    if (theme === 'dark') {
      darkModeToggleButton.querySelector('i').classList.replace('fa-moon', 'fa-sun')
    } else {
      darkModeToggleButton.querySelector('i').classList.replace('fa-sun', 'fa-moon')
    }
  }

  // Initial theme load
  const currentTheme = localStorage.getItem('theme')
  if (currentTheme) {
    applyTheme(currentTheme)
  } else if (prefersDarkScheme.matches) {
    applyTheme('dark') // Apply dark if user's system prefers it
  } else {
    applyTheme('light') // Default to light
  }

  // Toggle button event listener
  if (darkModeToggleButton) {
    darkModeToggleButton.addEventListener('click', (e) => {
      e.preventDefault()
      const theme = document.body.classList.contains('dark-mode') ? 'light' : 'dark'
      applyTheme(theme)
    })
  }

  // Listen for changes in system preference
  prefersDarkScheme.addEventListener('change', (e) => {
    // Only change if user hasn't explicitly set a theme
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light')
    }
  })

  // Anda bisa menambahkan inisialisasi JS lain di sini
})
