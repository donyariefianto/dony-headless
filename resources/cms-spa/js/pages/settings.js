export function loadSettingsPage(container) {
  // Pastikan innerHTML ini hanya berisi struktur tab dan area konten utama Settings
  container.innerHTML = `
        <div class="card settings-card">
            <h2>Pengaturan Aplikasi</h2>
            <div class="settings-tabs">
                <button class="tab-button active" data-tab="formbuilder">Form Builder</button>
                <button class="tab-button" data-tab="businessflow">Business Flow Manager</button>
                <button class="tab-button" data-tab="dashboard">Dashboard</button>
                <button class="tab-button" data-tab="account">Account</button>
            </div>
            <div class="tab-content-area" id="settingsTabContent">
                </div>
            <div id="saveConfirmation" class="save-confirmation">
                Pengaturan berhasil disimpan!
            </div>
        </div>
    `

  const settingsTabContent = container.querySelector('#settingsTabContent')
  const tabButtons = container.querySelectorAll('.tab-button')
  const saveConfirmation = container.querySelector('#saveConfirmation')

  // --- Referensi ke Elemen Panel Samping ---
  const sidePanel = document.getElementById('sidePanel')
  const sidePanelOverlay = document.getElementById('sidePanelOverlay')
  const sidePanelTitle = document.getElementById('sidePanelTitle')
  const sidePanelContent = document.getElementById('sidePanelContent')
  const closeSidePanelBtn = document.getElementById('closeSidePanelBtn')

  // --- Fungsi untuk Mengelola Tampilan Panel Samping ---
  const openSidePanel = (title, formHtml) => {
    sidePanelTitle.textContent = title
    sidePanelContent.innerHTML = formHtml
    sidePanel.classList.add('show')
    sidePanelOverlay.classList.add('show')
    // Pasang event listener untuk form setelah dimuat ke panel
    attachFormSubmitListeners(sidePanelContent)
  }

  const closeSidePanel = () => {
    sidePanel.classList.remove('show')
    sidePanelOverlay.classList.remove('show')
    sidePanelContent.innerHTML = '' // Bersihkan konten saat ditutup
    currentEditedWidget = null // Reset state editing
  }

  // Tambahkan event listener untuk tombol tutup panel dan overlay
  closeSidePanelBtn.addEventListener('click', closeSidePanel)
  sidePanelOverlay.addEventListener('click', closeSidePanel) // Tutup saat klik di luar panel

  const showConfirmation = () => {
    saveConfirmation.classList.add('show')
    setTimeout(() => {
      saveConfirmation.classList.remove('show')
    }, 3000)
  }

  // --- Data Mock untuk Contoh (Nantinya dari Backend/State Management) ---
  let dashboardWidgets = [
    { id: 'widget1', name: 'Grafik Pengunjung Harian', type: 'chart', isActive: true },
    { id: 'widget2', name: 'Daftar Tugas Terbaru', type: 'list', isActive: false },
    { id: 'widget3', name: 'Ringkasan Penjualan', type: 'summary', isActive: true },
  ]

  let currentEditedWidget = null // Menyimpan widget yang sedang diedit

  // --- Fungsi untuk Merender Daftar Widget Dashboard ---
  const renderDashboardWidgetList = () => {
    let listHtml = `
            <h3>Manajemen Widget Dashboard</h3>
            <div class="settings-group">
                <h4>Daftar Widget Aktif</h4>
                <ul class="settings-list-items">
                    ${dashboardWidgets
                      .map(
                        (widget) => `
                        <li data-id="${widget.id}">
                            <span>${widget.name} (${widget.isActive ? 'Aktif' : 'Nonaktif'})</span>
                            <div class="item-actions">
                                <button class="btn btn-icon btn-edit-widget" data-id="${widget.id}" aria-label="Edit Widget"><i class="fa-solid fa-edit"></i></button>
                                <button class="btn btn-icon btn-delete-widget" data-id="${widget.id}" aria-label="Hapus Widget"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </li>
                    `
                      )
                      .join('')}
                </ul>
                <button class="btn btn-primary btn-add-new-widget" style="margin-top: 20px;">
                    <i class="fa-solid fa-plus" style="margin-right: 8px;"></i> Tambah Widget Baru
                </button>
            </div>

            <div class="settings-group">
                <h4>Pengaturan Umum Dashboard</h4>
                <form id="dashboardGeneralSettingsForm">
                    <div class="form-group">
                        <label for="defaultLayout">Tata Letak Dashboard Default</label>
                        <select id="defaultLayout">
                            <option value="compact">Compact</option>
                            <option value="expanded">Expanded</option>
                            <option value="custom">Custom</option>
                        </select>
                        <span class="help-text">Pilih bagaimana widget akan diatur secara default.</span>
                    </div>
                    <div class="form-group">
                        <label for="widgetSpacing">Jarak Antar Widget (px)</label>
                        <input type="number" id="widgetSpacing" value="20" min="0">
                        <span class="help-text">Sesuaikan ruang kosong di antara setiap widget.</span>
                    </div>
                    <button type="submit" class="btn btn-primary">Simpan Pengaturan Umum Dashboard</button>
                </form>
            </div>
        `
    settingsTabContent.innerHTML = listHtml
    attachDashboardWidgetEventListeners() // Pasang event listener setelah render
    attachFormSubmitListeners(settingsTabContent) // Pasang listener untuk form umum
  }

  // --- Fungsi untuk Merender Form Widget Dashboard (Tambah/Edit) KE PANEL Samping ---
  const renderDashboardWidgetForm = (widgetData = {}) => {
    currentEditedWidget = widgetData
    const isEdit = !!widgetData.id

    let formHtml = `
            <form id="dashboardWidgetDetailForm">
                <input type="hidden" id="widgetId" value="${widgetData.id || ''}">
                <div class="form-group">
                    <label for="widgetName">Nama Widget</label>
                    <input type="text" id="widgetName" value="${widgetData.name || ''}" placeholder="Misal: Grafik Pengunjung">
                    <span class="help-text">Nama yang akan ditampilkan untuk widget ini.</span>
                </div>
                <div class="form-group">
                    <label for="widgetType">Tipe Widget</label>
                    <select id="widgetType">
                        <option value="chart" ${widgetData.type === 'chart' ? 'selected' : ''}>Grafik</option>
                        <option value="list" ${widgetData.type === 'list' ? 'selected' : ''}>Daftar</option>
                        <option value="summary" ${widgetData.type === 'summary' ? 'selected' : ''}>Ringkasan</option>
                    </select>
                    <span class="help-text">Pilih jenis konten yang akan ditampilkan widget.</span>
                </div>
                <div class="form-group">
                    <label for="widgetIsActive">
                        <input type="checkbox" id="widgetIsActive" ${widgetData.isActive ? 'checked' : ''}> Aktifkan Widget
                    </label>
                    <span class="help-text">Tampilkan atau sembunyikan widget di dashboard.</span>
                </div>
                <div class="form-actions"> <button type="submit" class="btn btn-primary">${isEdit ? 'Update Widget' : 'Tambah Widget'}</button>
                    <button type="button" class="btn btn-secondary btn-cancel-form" style="margin-left: 10px;">Batal</button>
                </div>
            </form>
        `
    openSidePanel(isEdit ? 'Edit Widget Dashboard' : 'Tambah Widget Baru', formHtml)
  }

  // --- Event Listeners untuk Aksi Widget Dashboard ---
  const attachDashboardWidgetEventListeners = () => {
    // Tombol Tambah Baru
    settingsTabContent.querySelector('.btn-add-new-widget').addEventListener('click', () => {
      renderDashboardWidgetForm({})
    })

    // Tombol Edit
    settingsTabContent.querySelectorAll('.btn-edit-widget').forEach((button) => {
      button.addEventListener('click', () => {
        const widgetId = button.dataset.id
        const widgetToEdit = dashboardWidgets.find((w) => w.id === widgetId)
        if (widgetToEdit) {
          renderDashboardWidgetForm(widgetToEdit)
        }
      })
    })

    // Tombol Delete
    settingsTabContent.querySelectorAll('.btn-delete-widget').forEach((button) => {
      button.addEventListener('click', () => {
        const widgetId = button.dataset.id
        if (confirm('Apakah Anda yakin ingin menghapus widget ini?')) {
          dashboardWidgets = dashboardWidgets.filter((w) => w.id !== widgetId)
          renderDashboardWidgetList()
          showConfirmation()
        }
      })
    })

    // Event listener untuk tombol Batal di dalam panel samping
    sidePanelContent.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-cancel-form')) {
        closeSidePanel()
      }
    })

    // Tangani submit form detail (Tambah/Edit) yang berada di panel samping
    const detailForm = sidePanelContent.querySelector('#dashboardWidgetDetailForm')
    if (detailForm) {
      // Pastikan form ada saat listener dipasang
      detailForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const id = detailForm.querySelector('#widgetId').value
        const name = detailForm.querySelector('#widgetName').value
        const type = detailForm.querySelector('#widgetType').value
        const isActive = detailForm.querySelector('#widgetIsActive').checked

        if (id) {
          // Update existing widget
          dashboardWidgets = dashboardWidgets.map((w) =>
            w.id === id ? { ...w, name, type, isActive } : w
          )
        } else {
          // Add new widget (generate simple ID)
          const newId =
            'widget' + (dashboardWidgets.length + 1) + Math.random().toString(36).substr(2, 5) // ID lebih unik
          dashboardWidgets.push({ id: newId, name, type, isActive })
        }
        closeSidePanel() // Tutup panel setelah simpan
        renderDashboardWidgetList() // Render ulang daftar
        showConfirmation()
      })
    }
  }

  // --- Fungsi Umum untuk Memasang Event Listener Form ---
  // Fungsi ini sekarang lebih fokus pada form yang ada langsung di main content-area
  const attachFormSubmitListeners = (parentContainer) => {
    parentContainer.querySelectorAll('form').forEach((form) => {
      // Hindari memasang listener dua kali jika form sudah ada (misal general settings form)
      if (!form.dataset.listenerAttached) {
        const submitHandler = function (e) {
          e.preventDefault()
          const formId = form.id
          console.log(`Form ${formId} submitted!`)
          const formData = {}
          form
            .querySelectorAll(
              'input[type="text"], input[type="email"], input[type="password"], textarea, select, input[type="number"]'
            )
            .forEach((input) => {
              formData[input.id] = input.value
            })
          form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            formData[checkbox.id] = checkbox.checked
          })
          console.log('Data Formulir:', formData)
          showConfirmation()
        }
        form.addEventListener('submit', submitHandler)
        form.dataset.listenerAttached = 'true' // Tandai bahwa listener sudah terpasang
      }
    })
  }

  // --- Fungsi Utama untuk Memuat Konten Tab (Sekarang Hanya Menampilkan Daftar) ---
  const loadTabContent = (tabName) => {
    closeSidePanel() // Pastikan panel tertutup saat ganti tab
    switch (tabName) {
      case 'formbuilder':
        // Implementasi untuk Form Builder (List View)
        settingsTabContent.innerHTML = `
                    <h3>Manajemen Form Builder</h3>
                    <div class="settings-group">
                        <h4>Daftar Formulir Aktif</h4>
                        <ul class="settings-list-items">
                            <li>Formulir Kontak Utama <div class="item-actions"><button class="btn btn-icon btn-edit-form"><i class="fa-solid fa-edit"></i></button><button class="btn btn-icon btn-delete-form"><i class="fa-solid fa-trash"></i></button></div></li>
                            <li>Formulir Pendaftaran Newsletter <div class="item-actions"><button class="btn btn-icon btn-edit-form"><i class="fa-solid fa-edit"></i></button><button class="btn btn-icon btn-delete-form"><i class="fa-solid fa-trash"></i></button></div></li>
                            <li>Survei Kepuasan Pelanggan <div class="item-actions"><button class="btn btn-icon btn-delete-form"><i class="fa-solid fa-trash"></i></button></div></li>
                        </ul>
                        <button class="btn btn-primary btn-add-new-form" style="margin-top: 20px;">
                            <i class="fa-solid fa-plus" style="margin-right: 8px;"></i> Buat Formulir Baru
                        </button>
                    </div>
                    <div class="settings-group">
                        <h4>Pengaturan Umum Formulir</h4>
                        <form id="formBuilderGeneralSettingsForm">
                            <div class="form-group">
                                <label for="formTemplate">Pilih Template Formulir Default</label>
                                <select id="formTemplate">
                                    <option value="basic">Basic Contact Form</option>
                                    <option value="survey">Customer Survey</option>
                                    <option value="registration">User Registration</option>
                                </select>
                                <span class="help-text">Template ini akan digunakan saat membuat formulir baru.</span>
                            </div>
                            <div class="form-group">
                                <label for="enableCaptcha">
                                    <input type="checkbox" id="enableCaptcha" checked> Aktifkan Captcha untuk Formulir Publik
                                </label>
                                <span class="help-text">Melindungi formulir dari spam bot.</span>
                            </div>
                            <button type="submit" class="btn btn-primary">Simpan Pengaturan Dasar</button>
                        </form>
                    </div>
                `
        // Contoh event listener untuk tombol add/edit/delete form builder (perlu implementasi renderFormBuilderForm)
        settingsTabContent.querySelector('.btn-add-new-form').addEventListener('click', () => {
          openSidePanel(
            'Buat Formulir Baru',
            `
                        <form id="formBuilderDetailForm">
                            <div class="form-group">
                                <label for="formName">Nama Formulir</label>
                                <input type="text" id="formName" placeholder="Nama Formulir Anda">
                            </div>
                            <div class="form-group">
                                <label for="formDescription">Deskripsi</label>
                                <textarea id="formDescription" rows="3" placeholder="Deskripsi singkat formulir ini"></textarea>
                            </div>
                             <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Simpan Formulir</button>
                                <button type="button" class="btn btn-secondary btn-cancel-form" style="margin-left: 10px;">Batal</button>
                             </div>
                        </form>
                    `
          )
        })
        attachFormSubmitListeners(settingsTabContent)
        break
      case 'businessflow':
        // Implementasi untuk Business Flow Manager (List View)
        settingsTabContent.innerHTML = `
                    <h3>Manajemen Business Flow Manager</h3>
                    <div class="settings-group">
                        <h4>Daftar Alur Kerja Aktif</h4>
                        <ul class="settings-list-items">
                            <li>Proses Onboarding Karyawan Baru <div class="item-actions"><button class="btn btn-icon btn-edit-flow"><i class="fa-solid fa-edit"></i></button><button class="btn btn-icon btn-delete-flow"><i class="fa-solid fa-trash"></i></button></div></li>
                            <li>Persetujuan Pengeluaran <div class="item-actions"><button class="btn btn-icon btn-edit-flow"><i class="fa-solid fa-edit"></i></button><button class="btn btn-icon btn-delete-flow"><i class="fa-solid fa-trash"></i></button></div></li>
                            <li>Manajemen Proyek <div class="item-actions"><button class="btn btn-icon btn-delete-flow"><i class="fa-solid fa-trash"></i></button></div></li>
                        </ul>
                        <button class="btn btn-primary btn-add-new-flow" style="margin-top: 20px;">
                            <i class="fa-solid fa-plus" style="margin-right: 8px;"></i> Buat Alur Kerja Baru
                        </button>
                    </div>
                    <div class="settings-group">
                        <h4>Pengaturan Umum Alur Kerja</h4>
                        <form id="businessFlowGeneralSettingsForm">
                            <div class="form-group">
                                <label for="workflowApproval">
                                    <input type="checkbox" id="workflowApproval" checked> Aktifkan Persetujuan Alur Kerja
                                </label>
                                <span class="help-text">Membutuhkan persetujuan manual untuk alur kerja kritis.</span>
                            </div>
                            <div class="form-group">
                                <label for="defaultApprover">Persetujuan Default</label>
                                <input type="text" id="defaultApprover" value="Manajer Umum" placeholder="Nama atau Jabatan">
                                <span class="help-text">Siapa yang menjadi pemberi persetujuan utama.</span>
                            </div>
                            <button type="submit" class="btn btn-primary">Simpan Pengaturan Umum</button>
                        </form>
                    </div>
                `
        settingsTabContent.querySelector('.btn-add-new-flow').addEventListener('click', () => {
          openSidePanel(
            'Buat Alur Kerja Baru',
            `
                        <form id="businessFlowDetailForm">
                            <div class="form-group">
                                <label for="flowName">Nama Alur Kerja</label>
                                <input type="text" id="flowName" placeholder="Nama Alur Kerja Anda">
                            </div>
                            <div class="form-group">
                                <label for="flowDescription">Deskripsi</label>
                                <textarea id="flowDescription" rows="3" placeholder="Deskripsi singkat alur kerja ini"></textarea>
                            </div>
                             <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Simpan Alur Kerja</button>
                                <button type="button" class="btn btn-secondary btn-cancel-form" style="margin-left: 10px;">Batal</button>
                             </div>
                        </form>
                    `
          )
        })
        attachFormSubmitListeners(settingsTabContent)
        break
      case 'dashboard':
        renderDashboardWidgetList() // Panggil fungsi render khusus dashboard
        break
      case 'account':
        // Implementasi untuk Account (form langsung, karena biasanya hanya ada 1 akun yang dikonfigurasi)
        settingsTabContent.innerHTML = `
                    <h3>Pengaturan Akun Saya</h3>
                    <div class="settings-group">
                        <h4>Informasi Profil</h4>
                        <form id="accountProfileSettingsForm">
                            <div class="form-group">
                                <label for="userName">Nama Pengguna</label>
                                <input type="text" id="userName" value="Admin User" placeholder="Nama Lengkap Anda">
                                <span class="help-text">Nama yang akan ditampilkan di seluruh aplikasi.</span>
                            </div>
                            <div class="form-group">
                                <label for="userEmail">Email Akun</label>
                                <input type="email" id="userEmail" value="admin@example.com" placeholder="Email Anda">
                                <span class="help-text">Digunakan untuk notifikasi dan pemulihan akun.</span>
                            </div>
                            <button type="submit" class="btn btn-primary">Simpan Informasi Profil</button>
                        </form>
                    </div>

                    <div class="settings-group">
                        <h4>Keamanan Akun</h4>
                        <form id="accountSecuritySettingsForm">
                            <div class="form-group">
                                <label for="newPassword">Kata Sandi Baru</label>
                                <input type="password" id="newPassword" placeholder="Biarkan kosong jika tidak ingin mengubah">
                                <span class="help-text">Minimal 8 karakter, kombinasi huruf besar, kecil, angka, dan simbol.</span>
                            </div>
                            <div class="form-group">
                                <label for="confirmPassword">Konfirmasi Kata Sandi Baru</label>
                                <input type="password" id="confirmPassword" placeholder="Ulangi kata sandi baru">
                            </div>
                            <div class="form-group">
                                <label for="twoFactorAuth">
                                    <input type="checkbox" id="twoFactorAuth"> Autentikasi Dua Faktor (2FA)
                                </label>
                                <span class="help-text">Aktifkan untuk keamanan tambahan saat login.</span>
                            </div>
                            <button type="submit" class="btn btn-primary">Simpan Pengaturan Keamanan</button>
                        </form>
                    </div>
                `
        attachFormSubmitListeners(settingsTabContent) // Pasang listener untuk form akun
        break
      default:
        settingsTabContent.innerHTML = '<p>Pilih kategori pengaturan.</p>'
    }
  }

  // Tangani klik tombol tab
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      tabButtons.forEach((btn) => btn.classList.remove('active'))
      button.classList.add('active')
      loadTabContent(button.dataset.tab)
    })
  })

  // Muat konten tab default saat halaman pertama kali dimuat
  loadTabContent('dashboard') // Default ke Dashboard untuk demonstrasi fitur ini
}
