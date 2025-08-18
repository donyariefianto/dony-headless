import { BASE_API_URL } from '../config/constants.js'
import {
  showLoadingOverlay,
  hideLoadingOverlay,
  openSidePanel,
  closeSidePanel,
  showNotification,
} from '../main.js'

/**
 * Merender form generator.
 * @param {HTMLElement} container Elemen DOM tempat formulir akan dirender.
 */
const renderFormGenerator = (formdata, container) => {}

const fetchFormById = async (formId) => {
  showLoadingOverlay()
  try {
    const url = `${BASE_API_URL}/configuration/formbuilder/get?id=${formId}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status && data.data) {
      renderFormGenerator(data.data)
    } else {
      alert('Gagal mengambil data formulir. Silakan coba lagi.')
    }
  } catch (error) {
    console.error('Error fetching form data:', error)
    alert('Terjadi kesalahan saat mengambil data formulir.')
  } finally {
    hideLoadingOverlay()
  }
}

export function renderFormBuilderSettingsPageV2(container) {
  let currentPage = 1
  let currentLimit = 10
  let currentSearch = ''

  const renderFormList = (forms, totalCount, totalPages) => {
    container.innerHTML = `
        <div class="settings-group">
            <h4>Daftar Konfigurasi Formulir</h4>
            <div id="formListContent">
                <div class="table-controls">
                    <div class="search-box">
                        <input type="text" id="formSearchInput" placeholder="Cari Formulir..." value="${currentSearch}">
                        <button id="searchButton" class="btn btn-primary"><i class="fa-solid fa-search"></i></button>
                        <button id="clearSearchButton" class="btn btn-icon"><i class="fa-solid fa-times"></i></button>
                    </div>
                    <div class="right-controls">
                        <button class="btn btn-primary" id="addFormBtn"><i class="fa-solid fa-plus"></i> Buat Formulir Baru</button>
                    </div>
                </div>

                <ul id="formListItems" class="settings-list-items">
                    </ul>

                <div id="formPagination" class="pagination-controls" style="display:none;">
                    <p id="paginationTotal"></p>
                    <div class="pagination-buttons">
                        <button id="prevPageBtn" class="btn btn-secondary pagination-btn" data-page="prev" disabled="">Previous</button>
                        <span id="pageInfo"></span>
                        <button id="nextPageBtn" class="btn btn-secondary pagination-btn" data-page="next" disabled="">Next</button>
                    </div>
                </div>
            </div>
        </div>
        `

    const formListItems = container.querySelector('#formListItems')
    const formPagination = container.querySelector('#formPagination')
    const paginationTotal = container.querySelector('#paginationTotal')
    const pageInfo = container.querySelector('#pageInfo')
    const prevPageBtn = container.querySelector('#prevPageBtn')
    const nextPageBtn = container.querySelector('#nextPageBtn')
    const addFormBtn = container.querySelector('#addFormBtn')
    const formSearchInput = container.querySelector('#formSearchInput')
    const searchButton = container.querySelector('#searchButton')
    const clearSearchButton = container.querySelector('#clearSearchButton')

    if (forms.length === 0) {
      formListItems.innerHTML = `<p class="text-center-subtle">Belum ada formulir yang dibuat.</p>`
      formPagination.style.display = 'none'
    } else {
      formListItems.innerHTML = forms
        .map(
          (form) => `
                <li data-name="${form.slug}" data-display-name="${form.name}">
                    <span><strong>${form.name}</strong> <br> <small><em>Nama Internal: ${form.slug || form._id}</em></small></span>
                    <div class="item-actions">
                        <button class="btn btn-icon btn-edit-form" data-form-id="${form._id}" aria-label="Edit Formulir"><i class="fa-solid fa-edit"></i></button>
                        <button class="btn btn-icon btn-delete-form" data-form-id="${form._id}" data-display-name="${form.name}" aria-label="Hapus Formulir"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </li>
            `
        )
        .join('')

      formPagination.style.display = 'flex'
      paginationTotal.textContent = `Total: ${totalCount} formulir`
      pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`
      prevPageBtn.disabled = currentPage <= 1
      nextPageBtn.disabled = currentPage >= totalPages
    }

    addFormBtn?.addEventListener('click', () => renderFormGenerator(null,container))
    searchButton?.addEventListener('click', () => {
      currentSearch = formSearchInput.value
      currentPage = 1
      fetchForms()
    })
    clearSearchButton?.addEventListener('click', () => {
      formSearchInput.value = ''
      currentSearch = ''
      currentPage = 1
      fetchForms()
    })
    prevPageBtn?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--
        fetchForms()
      }
    })
    nextPageBtn?.addEventListener('click', () => {
      currentPage++
      fetchForms()
    })

    container.querySelectorAll('.btn-edit-form').forEach((button) => {
      button?.addEventListener('click', (e) => {
        const formId = e.currentTarget.dataset.formId
        fetchFormById(formId)
      })
    })

    container.querySelectorAll('.btn-delete-form').forEach((button) => {
      button?.addEventListener('click', async (e) => {
        const formId = e.currentTarget.dataset.formId
        const formName = e.currentTarget.dataset.displayName
        if (confirm(`Apakah Anda yakin ingin menghapus formulir '${formName}' ini?`)) {
          showLoadingOverlay()
          try {
            const response = await fetch(
              `${BASE_API_URL}/configuration/formbuilder/delete/${formId}`,
              {
                method: 'DELETE',
              }
            )
            const result = await response.json()
            if (result.status) {
              showNotification(`Formulir '${formName}' berhasil dihapus.`)
              fetchForms()
            } else {
              alert(`Gagal menghapus formulir: ${result.message}`)
            }
          } catch (error) {
            console.error('Error deleting form:', error)
            alert('Terjadi kesalahan saat menghapus formulir.')
          } finally {
            hideLoadingOverlay()
          }
        }
      })
    })
  }

  const fetchForms = async () => {
    showLoadingOverlay()
    try {
      const url = `${BASE_API_URL}/configuration/formbuilder/list?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status && data.data) {
        renderFormList(data.data.documents, data.data.totalCount, data.data.totalPages)
      } else {
        renderFormList([], 0, 0)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
      renderFormList([], 0, 0)
    } finally {
      hideLoadingOverlay()
    }
  }

  fetchForms()
}