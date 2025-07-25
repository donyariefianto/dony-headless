export function setupThemeSwitcher() {
  const themeToggle = document.getElementById('theme-toggle')
  // Ubah dari document.body menjadi document.documentElement
  const rootElement = document.documentElement // Mengacu pada <html> tag

  if (themeToggle && rootElement) {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark-mode') {
      rootElement.classList.add('dark-mode')
      themeToggle.checked = true
    } else {
      rootElement.classList.remove('dark-mode')
      themeToggle.checked = false
    }

    themeToggle.addEventListener('change', () => {
      if (themeToggle.checked) {
        rootElement.classList.add('dark-mode')
        localStorage.setItem('theme', 'dark-mode')
      } else {
        rootElement.classList.remove('dark-mode')
        localStorage.setItem('theme', 'light-mode')
      }
    })
  }
}
