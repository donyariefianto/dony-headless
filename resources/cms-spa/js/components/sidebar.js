export function setupSidebarToggle() {
  const sidebar = document.getElementById('sidebar')
  const sidebarToggleBtn = document.getElementById('sidebarToggle')

  if (sidebar && sidebarToggleBtn) {
    // Load sidebar state from localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
    if (isCollapsed) {
      sidebar.classList.add('collapsed')
    }

    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed')
      // Save sidebar state to localStorage
      const newCollapsedState = sidebar.classList.contains('collapsed')
      localStorage.setItem('sidebarCollapsed', newCollapsedState)
    })
  }
}
