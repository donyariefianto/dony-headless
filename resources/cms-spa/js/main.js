// js/main.js

import { loadDashboardPage } from './pages/dashboard.js'
import { loadPostsPage } from './pages/posts.js'
import { loadPagesPage } from './pages/pages.js'
import { loadMediaPage } from './pages/media.js'
import { loadUsersPage } from './pages/users.js'
import { loadCollectionsPage } from './pages/collections.js'
import { loadSettingsPage } from './pages/settings_v2.js'

// Get DOM elements
const contentArea = document.getElementById('content-area')
const sidebar = document.getElementById('sidebar')
const pageTitle = document.getElementById('page-title')
const sidebarNavLinks = document.querySelectorAll('.sidebar-nav a')
const themeToggle = document.getElementById('theme-toggle')
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn')
const loadingOverlay = document.getElementById('loadingOverlay')

// --- Loading Overlay Functions ---
export function showLoadingOverlay() {
  loadingOverlay.classList.add('show')
}

export function hideLoadingOverlay() {
  loadingOverlay.classList.remove('show')
}

// --- Fungsi untuk memuat konten ke area utama ---
export async function loadContentIntoMainArea(htmlContent, newPageTitle = null) {
  showLoadingOverlay()

  // Pastikan side panel tertutup saat memuat konten baru ke area utama
  closeSidePanel() // Pastikan sidePanel ditutup

  await new Promise((resolve) => setTimeout(resolve, 100)) // Delay for transition

  contentArea.innerHTML = htmlContent
  if (newPageTitle) {
    pageTitle.textContent = newPageTitle
  }
  contentArea.scrollTo(0, 0)
  hideLoadingOverlay()
}

// --- Side Panel Functions (Kembali digunakan untuk konfigurasi koleksi) ---
const sidePanel = document.getElementById('sidePanel')
const sidePanelOverlay = document.getElementById('sidePanelOverlay')
const sidePanelTitle = document.getElementById('sidePanelTitle')
const sidePanelContent = document.getElementById('sidePanelContent')
const closeSidePanelBtn = document.getElementById('closeSidePanelBtn')

// Fungsi untuk membuka panel samping (diexport untuk collections.js)
export function openSidePanel(title, contentHtml) {
  sidePanelTitle.textContent = title
  sidePanelContent.innerHTML = contentHtml
  sidePanel.classList.add('show')
  sidePanelOverlay.classList.add('show')
  // Tambahkan event listener untuk tombol tutup yang ada di dalam panel, jika ada
  const closeButtonsInPanel = sidePanelContent.querySelectorAll(
    '.btn-cancel-form, .btn-close-panel-content'
  )
  closeButtonsInPanel.forEach((btn) => {
    btn.onclick = closeSidePanel
  })
}

export function closeSidePanel() {
  sidePanel.classList.remove('show')
  sidePanelOverlay.classList.remove('show')
  sidePanelContent.innerHTML = '' // Clear content when closed
}

export function addClass(element, className) {
  if (element && !element.classList.contains(className)) {
      element.classList.add(className);
  }
}

// Fungsi utilitas untuk menghapus kelas CSS
export function removeClass(element, className) {
  if (element && element.classList.contains(className)) {
      element.classList.remove(className);
  }
}


closeSidePanelBtn.onclick = closeSidePanel
sidePanelOverlay.onclick = closeSidePanel

// --- Theme Management ---
function applyTheme(theme) {
  if (theme === 'dark-mode') {
    document.documentElement.classList.add('dark-mode')
    themeToggle.checked = true
  } else {
    document.documentElement.classList.remove('dark-mode')
    themeToggle.checked = false
  }
}

const savedTheme = localStorage.getItem('theme')
applyTheme(savedTheme || 'light-mode')

themeToggle.addEventListener('change', () => {
  if (themeToggle.checked) {
    applyTheme('dark-mode')
    localStorage.setItem('theme', 'dark-mode')
  } else {
    applyTheme('light-mode')
    localStorage.setItem('theme', 'light-mode')
  }
})

// --- Page Loading Logic (for sidebar navigation) ---
const pageLoaders = {
  dashboard: loadDashboardPage,
  posts: loadPostsPage,
  pages: loadPagesPage,
  media: loadMediaPage,
  users: loadUsersPage,
  collections: loadCollectionsPage,
  settings: loadSettingsPage,
}

async function loadContent(pageName) {
  showLoadingOverlay()

  // Pastikan side panel tertutup saat memuat halaman baru
  closeSidePanel()

  await new Promise((resolve) => setTimeout(resolve, 100)) // Delay 100ms

  contentArea.innerHTML = ''

  if (pageName === 'collections') {
    pageTitle.textContent = 'Collections'
  } else {
    pageTitle.textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1)
  }

  sidebarNavLinks.forEach((link) => link.classList.remove('active'))
  const activeLink = document.querySelector(`.sidebar-nav a[data-page="${pageName}"]`)
  if (activeLink) {
    activeLink.classList.add('active')
  }

  const loadPage = pageLoaders[pageName]
  if (loadPage) {
    await loadPage(contentArea)
  } else {
    contentArea.innerHTML = `<div class="card"><h2>Page Not Found</h2><p>The page "${pageName}" does not exist.</p></div>`
  }

  contentArea.scrollTo(0, 0)
  hideLoadingOverlay()
}

sidebarNavLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault()
    const pageName = e.target.closest('a').dataset.page
    loadContent(pageName)
  })
})

// Load default page on initial load
document.addEventListener('DOMContentLoaded', () => {
  loadContent('dashboard')
  // --- Sidebar Toggle Logic ---
sidebarToggleBtn.addEventListener('click', () => {
  console.log('sini');
  
  sidebar.classList.toggle('collapsed')
  document.body.classList.toggle('sidebar-collapsed-body')
})
})
