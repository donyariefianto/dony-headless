export const toggleTheme = () => {
  const body = document.body
  body.classList.toggle('dark-mode')
  const isDarkMode = body.classList.contains('dark-mode')
  localStorage.setItem('darkMode', isDarkMode)

  // Update the icon in the theme toggle button
  const themeBtn = document.querySelector('.theme-toggle')
  if (themeBtn) {
    themeBtn.innerHTML = isDarkMode
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>'
  }
}

export const loadTheme = () => {
  const isDarkMode = localStorage.getItem('darkMode') === 'true'
  if (isDarkMode) {
    document.body.classList.add('dark-mode')
  }
}

loadTheme()
