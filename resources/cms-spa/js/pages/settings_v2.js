// settings.js

// Import fungsi render untuk setiap sub-menu
import { renderDashboardSettingsPage } from './dashboardSettings.js'
import { renderFormBuilderSettingsPage } from './formBuilderSettings.js'
import { renderBusinessFlowSettingsPage } from './businessFlowSettings.js'

// Definisikan item-item sub-menu di sini
// Ini adalah satu-satunya tempat Anda perlu menambahkan/mengedit item baru.
const subMenuItems = [
  {
    id: 'dashboard-settings',
    title: 'Dashboard Settings',
    description: 'Kelola widget, tata letak, dan sumber data dashboard.',
    icon: 'fa-chart-bar',
    renderFunction: renderDashboardSettingsPage, // Fungsi render tanpa dipanggil
  },
  {
    id: 'formbuilder-settings',
    title: 'Form Builder Settings',
    description: 'Buat dan kelola formulir kustom aplikasi Anda.',
    icon: 'fa-wpforms',
    renderFunction: renderFormBuilderSettingsPage,
  },
  {
    id: 'businessflow-settings',
    title: 'Business Flow Settings',
    description: 'Atur alur kerja bisnis dan otomatisasi proses.',
    icon: 'fa-code-branch',
    renderFunction: renderBusinessFlowSettingsPage,
  },
]

// Fungsi utama untuk memuat halaman Settings
export function loadSettingsPage(container) {
  // Render struktur dasar halaman settings
  container.innerHTML = `
        <div class="settings-main-container">
            <div class="settings-header">
                <button id="backToSettingsBtn" class="btn btn-secondary" style="display:none;"><i class="fa-solid fa-arrow-left"></i> Kembali</button>
                <h2 id="settingsTitle">Pengaturan Aplikasi</h2>
            </div>
            <p id="settingsIntro" class="settings-intro">Pilih kategori pengaturan yang ingin Anda kelola.</p>
            <div class="settings-content-area">
                <div class="settings-submenu-grid" id="settingsSubMenuGrid"></div>
                <div id="settingsDetailsPage" style="display:none;"></div>
            </div>
        </div>
    `

  const subMenuGrid = container.querySelector('#settingsSubMenuGrid')
  const settingsDetailsPage = container.querySelector('#settingsDetailsPage')
  const backButton = container.querySelector('#backToSettingsBtn')
  const settingsTitle = container.querySelector('#settingsTitle')
  const settingsIntro = container.querySelector('#settingsIntro')

  // Fungsi untuk menampilkan kembali tampilan grid utama
  const showMainMenu = () => {
    settingsTitle.textContent = 'Pengaturan Aplikasi'
    settingsIntro.style.display = 'block'
    subMenuGrid.style.display = 'grid'
    settingsDetailsPage.style.display = 'none'
    backButton.style.display = 'none'
  }

  // Fungsi untuk merender tampilan submenu
  const renderSubmenuPage = (itemId) => {
    const selectedMenuItem = subMenuItems.find((item) => item.id === itemId)
    if (selectedMenuItem && selectedMenuItem.renderFunction) {
      // Tampilkan judul submenu
      settingsTitle.textContent = selectedMenuItem.title
      settingsIntro.style.display = 'none'

      // Sembunyikan grid utama dan tampilkan detail
      subMenuGrid.style.display = 'none'
      settingsDetailsPage.style.display = 'block'
      backButton.style.display = 'inline-flex'

      // Bersihkan detail page dan panggil fungsi render yang sesuai
      settingsDetailsPage.innerHTML = ''
      selectedMenuItem.renderFunction(settingsDetailsPage)
    }
  }

  // Render kartu-kartu sub-menu pada saat pertama kali
  subMenuGrid.innerHTML = subMenuItems
    .map(
      (item) => `
            <div class="card settings-submenu-card" data-id="${item.id}">
                <div class="card-icon"><i class="fas ${item.icon}"></i></div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
          `
    )
    .join('')

  // Tambahkan event listener untuk setiap kartu sub-menu
  subMenuGrid.querySelectorAll('.settings-submenu-card').forEach((card) => {
    card.addEventListener('click', () => {
      const itemId = card.dataset.id
      renderSubmenuPage(itemId)
    })
  })

  // Tambahkan event listener untuk tombol kembali
  backButton.addEventListener('click', showMainMenu)
}
