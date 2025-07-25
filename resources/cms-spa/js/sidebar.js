// js/sidebar.js

export function setupSidebar(loadContentCallback) {
  const sidebar = document.getElementById('sidebar')
  const toggleButton = document.getElementById('sidebarToggle')
  const mainContent = document.getElementById('mainContent')

  toggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed')
    mainContent.classList.toggle('sidebar-collapsed')
  })

  // Handle initial state on page load based on screen width
  const applyInitialSidebarState = () => {
    if (window.innerWidth < 768) {
      // Example breakpoint for mobile
      sidebar.classList.add('collapsed')
      mainContent.classList.add('sidebar-collapsed')
    } else {
      sidebar.classList.remove('collapsed')
      mainContent.classList.remove('sidebar-collapsed')
    }
  }
  applyInitialSidebarState()
  window.addEventListener('resize', applyInitialSidebarState)

  // Navigation item click handler
  sidebar.querySelectorAll('a.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const page = e.currentTarget.dataset.page
      const title = e.currentTarget.textContent.trim()

      // Remove active class from all nav items
      sidebar.querySelectorAll('a.nav-item').forEach((nav) => nav.classList.remove('active'))
      // Add active class to the clicked nav item
      e.currentTarget.classList.add('active')

      // Collapse sidebar on mobile after clicking a link
      if (window.innerWidth < 768) {
        sidebar.classList.add('collapsed')
        mainContent.classList.add('sidebar-collapsed')
      }

      loadContentCallback(page) // Call the callback from main.js
    })
  })

  // --- Tambahkan ini di bagian inisialisasi menu default ---
  // Atur 'Dashboard' sebagai menu aktif default saat pertama kali loading
  const defaultNavItem = sidebar.querySelector('a.nav-item[data-page="dashboard"]')
  if (defaultNavItem) {
    defaultNavItem.classList.add('active')
  }
}
