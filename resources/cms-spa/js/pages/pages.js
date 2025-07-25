// js/pages/pages.js

import { BASE_API_URL } from '../config/constants.js'

export function loadPagesPage(container) {
  let currentPage = 1
  let currentLimit = 5 // Batas item per halaman
  let currentSearch = ''

  const sidePanel = document.getElementById('sidePanel')
  const sidePanelOverlay = document.getElementById('sidePanelOverlay')
  const sidePanelTitle = document.getElementById('sidePanelTitle')
  const sidePanelContent = document.getElementById('sidePanelContent')
  const closeSidePanelBtn = document.getElementById('closeSidePanelBtn')

  // Fungsi untuk membuka panel samping
  const openSidePanel = (title, contentHtml) => {
    sidePanelTitle.textContent = title
    sidePanelContent.innerHTML = contentHtml
    sidePanel.classList.add('show')
    sidePanelOverlay.classList.add('show')
  }

  // Fungsi untuk menutup panel samping
  const closeSidePanel = () => {
    sidePanel.classList.remove('show')
    sidePanelOverlay.classList.remove('show')
    sidePanelContent.innerHTML = '' // Kosongkan konten saat ditutup
  }

  closeSidePanelBtn.onclick = closeSidePanel
  sidePanelOverlay.onclick = closeSidePanel

  // Tampilkan indikator loading
  const showLoading = (targetElement) => {
    targetElement.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                <p style="margin-top: 15px;">Memuat data...</p>
            </div>
        `
  }

  // Tampilkan pesan error
  const showError = (targetElement, message) => {
    targetElement.innerHTML = `
            <div class="card" style="background-color: var(--danger-color); color: white; text-align: center;">
                <h3>Error!</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="window.location.reload()" style="margin-top: 20px;">Refresh Halaman</button>
            </div>
        `
  }

  // Fungsi untuk merender detail form builder di panel samping (hanya preview)
  const renderFormBuilderDetailPreview = async (formId) => {
    showLoading(sidePanelContent) // Tampilkan loading di panel
    let formDetailHtml = ''
    let panelTitle = 'Detail Form Builder'

    try {
      const response = await fetch(`${BASE_API_URL}/configuration/formbuilder/read/${formId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()

      if (result.status && result.data) {
        const formData = result.data
        panelTitle = `Preview Form: ${formData.name}`

        // Bangun HTML form dasar untuk preview
        let formFieldsHtml = ''
        formData.fields.forEach((field) => {
          formFieldsHtml += `
                        <div class="form-group">
                            <label>${field.label} (${field.name})</label>
                            ${
                              field.type === 'textarea'
                                ? `<textarea class="preview-input" readonly placeholder="Type: ${field.type}"></textarea>`
                                : field.type === 'select'
                                  ? `<select class="preview-input" disabled><option>Type: ${field.type}</option></select>`
                                  : `<input type="${field.type === 'number' ? 'number' : 'text'}" class="preview-input" readonly placeholder="Type: ${field.type}">`
                            }
                            ${field.required ? '<span class="status-badge status-danger" style="margin-left: 10px;">Required</span>' : ''}
                            ${field.formula && field.formula.formula ? `<p class="help-text">Formula: <code>${field.formula.formula}</code></p>` : ''}
                            ${field.options && field.options.relation ? `<p class="help-text">Relasi: ${field.options.relation.table} (Kolom nilai: ${field.options.relation.value_column}, Kolom label: ${field.options.relation.label_column})</p>` : ''}
                        </div>
                    `
        })

        let subformsHtml = ''
        formData.subforms.filter(Boolean).forEach((subform) => {
          let subformFieldsHtml = ''
          subform.fields.forEach((subfield) => {
            subformFieldsHtml += `
                            <div class="form-group" style="margin-left: 20px;">
                                <label>${subfield.label} (${subfield.name})</label>
                                ${
                                  subfield.type === 'textarea'
                                    ? `<textarea class="preview-input" readonly placeholder="Type: ${subfield.type}"></textarea>`
                                    : subfield.type === 'select'
                                      ? `<select class="preview-input" disabled><option>Type: ${subfield.type}</option></select>`
                                      : `<input type="${subfield.type === 'number' ? 'number' : 'text'}" class="preview-input" readonly placeholder="Type: ${subfield.type}">`
                                }
                                ${subfield.required ? '<span class="status-badge status-danger" style="margin-left: 10px;">Required</span>' : ''}
                                ${subfield.formula && subfield.formula.formula ? `<p class="help-text">Formula: <code>${subfield.formula.formula}</code></p>` : ''}
                                ${subfield.options && subfield.options.relation ? `<p class="help-text">Relasi: ${subfield.options.relation.table} (Kolom nilai: ${subfield.options.relation.value_column}, Kolom label: ${subfield.options.relation.label_column})</p>` : ''}
                            </div>
                        `
          })
          subformsHtml += `
                        <div class="settings-group" style="margin-top: 25px;">
                            <h4>Subform: ${subform.label} (Tabel: ${subform.table_name})</h4>
                            ${subformFieldsHtml || '<p class="help-text">Tidak ada field di subform ini.</p>'}
                        </div>
                    `
        })

        formDetailHtml = `
                    <form id="formBuilderPreviewForm">
                        <div class="form-group">
                            <label for="previewFormName">Nama Form</label>
                            <input type="text" id="previewFormName" value="${formData.name || ''}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="previewSlug">Slug</label>
                            <input type="text" id="previewSlug" value="${formData.slug || ''}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="previewTableName">Nama Tabel</label>
                            <input type="text" id="previewTableName" value="${formData.table_name || ''}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="previewSubmitLabel">Label Tombol Submit</label>
                            <input type="text" id="previewSubmitLabel" value="${formData.submit_label || ''}" readonly>
                        </div>

                        <h3>Fields Utama</h3>
                        ${formFieldsHtml || '<p class="alert alert-warning">Tidak ada field utama.</p>'}

                        ${
                          subformsHtml
                            ? `
                            <h3>Subforms</h3>
                            ${subformsHtml}
                        `
                            : '<p class="alert alert-warning">Tidak ada subform.</p>'
                        }

                        <div class="form-actions" style="justify-content: center; margin-top: 40px;">
                            <button type="button" class="btn btn-secondary btn-cancel-form">Tutup</button>
                        </div>
                    </form>
                `
      } else {
        formDetailHtml = `<p class="alert alert-warning">Data form tidak ditemukan atau ada masalah dengan API.</p>`
      }
    } catch (error) {
      console.error('Error fetching form detail for preview:', error)
      formDetailHtml = `<p class="alert alert-danger">Gagal memuat detail form: ${error.message}. Pastikan server berjalan.</p>`
    } finally {
      openSidePanel(panelTitle, formDetailHtml)
      // Pasang listener untuk tombol "Tutup" di dalam panel
      const closeButtonInPanel = sidePanelContent.querySelector('.btn-cancel-form')
      if (closeButtonInPanel) {
        closeButtonInPanel.addEventListener('click', closeSidePanel)
      }
    }
  }

  // Fungsi utama untuk mengambil dan merender daftar form builder
  const fetchFormBuilders = async () => {
    showLoading(container.querySelector('#formBuilderListContent')) // Tampilkan loading di area daftar
    try {
      const url = `${BASE_API_URL}/configuration/formbuilder/list?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}`
      console.log('Fetching:', url)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()

      if (result.status && result.data) {
        const {
          documents,
          totalCount,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
        } = result.data
        currentPage = pageNum // Pastikan currentPage selaras dengan API
        currentLimit = limitNum // Pastikan currentLimit selaras dengan API

        let listHtml = `
                    <div class="table-controls">
                        <div class="search-box">
                            <input type="text" id="formSearchInput" placeholder="Cari Nama Form..." value="${currentSearch}">
                            <button id="searchButton" class="btn btn-primary"><i class="fa-solid fa-search"></i></button>
                            ${currentSearch ? `<button id="clearSearchButton" class="btn btn-secondary"><i class="fa-solid fa-times"></i></button>` : ''}
                        </div>
                        </div>

                    <ul class="settings-list-items">
                        ${
                          documents.length > 0
                            ? documents
                                .map(
                                  (form) => `
                            <li data-id="${form._id}">
                                <span>${form.name} <br> <small><em>${form.description || 'Tidak ada deskripsi'}</em></small></span>
                                <div class="item-actions">
                                    <button class="btn btn-icon btn-view-form" data-id="${form._id}" aria-label="Lihat Preview Form"><i class="fa-solid fa-eye"></i> Preview</button>
                                    </div>
                            </li>
                        `
                                )
                                .join('')
                            : '<li style="text-align: center; color: var(--secondary-color);">Tidak ada data form yang ditemukan.</li>'
                        }
                    </ul>

                    <div class="pagination-controls">
                        <p>Total: ${totalCount} form</p>
                        <div class="pagination-buttons">
                            <button class="btn btn-secondary pagination-btn" data-page="prev" ${pageNum === 1 ? 'disabled' : ''}>Previous</button>
                            <span>Page ${pageNum} of ${totalPages}</span>
                            <button class="btn btn-secondary pagination-btn" data-page="next" ${pageNum === totalPages ? 'disabled' : ''}>Next</button>
                        </div>
                    </div>
                `
        container.querySelector('#formBuilderListContent').innerHTML = listHtml
        attachEventListeners() // Pasang event listener setelah konten dimuat
      } else {
        showError(
          container.querySelector('#formBuilderListContent'),
          result.message_en || 'Gagal mengambil data form builder.'
        )
      }
    } catch (error) {
      console.error('Error fetching form builders:', error)
      showError(
        container.querySelector('#formBuilderListContent'),
        `Terjadi kesalahan saat memuat data: ${error.message}. Pastikan server berjalan di ${BASE_API_URL}.`
      )
    }
  }

  // Fungsi untuk memasang semua event listener
  const attachEventListeners = () => {
    // Event listener hanya untuk tombol "Lihat Preview"
    container.querySelectorAll('.btn-view-form').forEach((button) => {
      button.addEventListener('click', (e) => {
        const formId = e.currentTarget.dataset.id
        renderFormBuilderDetailPreview(formId)
      })
    })

    // Event listener untuk Pagination
    container.querySelectorAll('.pagination-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.page
        if (action === 'prev' && currentPage > 1) {
          currentPage--
        } else if (
          action === 'next' &&
          currentPage <
            parseInt(
              container.querySelector('.pagination-buttons span').textContent.split(' of ')[1]
            )
        ) {
          // Pastikan tidak melebihi totalPages
          currentPage++
        }
        fetchFormBuilders() // Muat ulang daftar dengan halaman baru
      })
    })

    // Event listener untuk Search
    const searchInput = container.querySelector('#formSearchInput')
    const searchButton = container.querySelector('#searchButton')
    const clearSearchButton = container.querySelector('#clearSearchButton')

    if (searchButton) {
      searchButton.addEventListener('click', () => {
        currentSearch = searchInput.value
        currentPage = 1 // Reset ke halaman 1 saat pencarian baru
        fetchFormBuilders() // Muat ulang daftar dengan filter pencarian
      })
    }

    if (clearSearchButton) {
      clearSearchButton.addEventListener('click', () => {
        searchInput.value = '' // Kosongkan input
        currentSearch = '' // Hapus filter pencarian
        currentPage = 1 // Reset ke halaman 1
        fetchFormBuilders() // Muat ulang daftar
      })
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          searchButton.click() // Picu klik tombol search saat Enter ditekan
        }
      })
    }
  }

  // Struktur HTML awal untuk halaman Pages (Form Builder)
  container.innerHTML = `
        <div class="card">
            <h2>Preview Form Builder</h2>
            <p class="help-text">Lihat struktur dan detail dari form yang telah Anda buat melalui Form Builder.</p>
            <div class="settings-group">
                <h4>Daftar Formulir</h4>
                <div id="formBuilderListContent">
                    </div>
            </div>
        </div>
    `

  // Panggil fungsi fetchFormBuilders saat halaman Pages dimuat pertama kali
  fetchFormBuilders()
}
