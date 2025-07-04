// public/script.js

const API_BASE_URL = 'http://localhost:3333/api'
const collectionNav = document.getElementById('collection-nav')
const contentArea = document.getElementById('content-area')

let currentCollection = null // Menyimpan nama koleksi yang sedang aktif
let currentPage = 1 // Menyimpan halaman saat ini
const itemsPerPage = 9 // Jumlah item per halaman untuk grid

// --- Helper Functions ---

/**
 * Membuat elemen HTML dengan tag, kelas, dan atribut opsional.
 * @param {string} tagName - Nama tag HTML (misal: 'div').
 * @param {object} [options] - Objek dengan properti untuk kelas, atribut, dll.
 * @returns {HTMLElement} Elemen HTML yang dibuat.
 */
function createElement(tagName, options = {}) {
  const element = document.createElement(tagName)
  if (options.className) element.className = options.className
  if (options.attributes) {
    for (const key in options.attributes) {
      element.setAttribute(key, options.attributes[key])
    }
  }
  if (options.textContent) element.textContent = options.textContent
  if (options.html) element.innerHTML = options.html
  if (options.value !== undefined) element.value = options.value
  if (options.children) options.children.forEach((child) => element.appendChild(child))
  return element
}

/**
 * Mengambil semua konfigurasi UI dari backend.
 * Fungsi ini sekarang akan dipanggil setiap kali dibutuhkan.
 * @returns {Promise<object>} Objek berisi semua konfigurasi UI per koleksi.
 */
async function fetchAllUIConfigsFromServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/ui-configs`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const configs = await response.json()
    console.log('Konfigurasi UI berhasil dimuat dari server:', configs)
    // Jika backend mengembalikan { data: [...], pagination: {...} }
    return configs.data || configs // Ambil array configs dari properti 'data' jika ada (untuk /api/configs)
  } catch (error) {
    console.error('Gagal memuat konfigurasi UI dari server:', error)
    contentArea.innerHTML = `<p style="color: red;">Gagal memuat konfigurasi. Pastikan backend berjalan dan terhubung ke DB.</p>`
    return {}
  }
}

/**
 * Mengambil konfigurasi UI untuk koleksi spesifik dari backend.
 * @param {string} collectionName - Nama koleksi.
 * @returns {Promise<object>} Objek konfigurasi UI untuk koleksi tersebut.
 */
async function fetchUIConfigForCollection(collectionName) {
  // Untuk ini, kita akan fetch semua configs dan filter di frontend
  // Karena endpoint /ui-configs/:name belum diimplementasikan.
  const allConfigs = await fetchAllUIConfigsFromServer()
  return allConfigs[collectionName]
}

/**
 * Meng-*render* navigasi koleksi di header.
 * @param {object} configs - Objek konfigurasi UI.
 */
async function renderCollectionNav() {
  const allConfigs = await fetchAllUIConfigsFromServer()
  const ul = createElement('ul')
  for (const collectionName in allConfigs) {
    const config = allConfigs[collectionName]
    const li = createElement('li')
    const a = createElement('a', {
      textContent: config.displayName,
      attributes: { href: `#${collectionName}` },
    })
    a.addEventListener('click', (e) => {
      e.preventDefault()
      currentPage = 1 // Reset halaman ke 1 saat mengganti koleksi
      currentCollection = collectionName // Set koleksi aktif
      renderCollectionUI(collectionName)
    })
    li.appendChild(a)
    ul.appendChild(li)
  }
  collectionNav.innerHTML = ''
  collectionNav.appendChild(ul)
}

/**
 * Meng-*render* UI untuk koleksi spesifik (form dan list/table).
 * @param {string} collectionName - Nama koleksi yang akan di-render.
 * @param {object} [dataToEdit] - Data dokumen jika dalam mode edit.
 */
async function renderCollectionUI(collectionName, dataToEdit = null) {
  // Mengambil konfigurasi setiap kali fungsi ini dipanggil
  const config = await fetchUIConfigForCollection(collectionName)
  if (!config) {
    contentArea.innerHTML = `<p>Konfigurasi untuk koleksi '${collectionName}' tidak ditemukan.</p>`
    return
  }

  if (currentCollection !== collectionName) {
    currentCollection = collectionName
    currentPage = 1
  }

  contentArea.innerHTML = `
        <h2>${config.displayName} Management</h2>
        <p>${config.description}</p>
        <div id="form-area"></div>
        <div id="list-area" class="grid-container"></div>
        <div id="pagination-controls"></div>
    `

  const formArea = document.getElementById('form-area')
  const listArea = document.getElementById('list-area')

  await renderDynamicForm(formArea, collectionName, config.formFields, dataToEdit)
  await renderDynamicList(listArea, collectionName, config.tableColumns, currentPage, itemsPerPage)
}

/**
 * Meng-*render* formulir dinamis berdasarkan konfigurasi field.
 * @param {HTMLElement} parentElement - Elemen DOM tempat formulir akan di-render.
 * @param {string} collectionName - Nama koleksi.
 * @param {Array<object>} formFields - Array konfigurasi field dari UI config.
 * @param {object} [dataToEdit] - Data dokumen jika dalam mode edit.
 */
async function renderDynamicForm(parentElement, collectionName, formFields, dataToEdit = null) {
  const form = createElement('form', { className: 'dynamic-form' })
  // Mengambil konfigurasi lagi untuk display name
  const currentCollectionConfig = await fetchUIConfigForCollection(collectionName)
  form.innerHTML = `<h3>${dataToEdit ? 'Edit' : 'Tambah'} ${currentCollectionConfig ? currentCollectionConfig.displayName : ''}</h3>`

  const currentId = dataToEdit ? dataToEdit._id : null

  for (const field of formFields) {
    if (!field.visibleInForm) continue

    const formGroup = createElement('div', { className: 'form-group' })
    const label = createElement('label', {
      textContent: field.label,
      attributes: { for: field.name },
    })
    formGroup.appendChild(label)

    let inputElement

    if (field.inputType === 'select' && field.optionsSource) {
      inputElement = createElement('select', {
        attributes: {
          id: field.name,
          name: field.name,
          required: field.required ? '' : undefined,
        },
      })
      const defaultOption = createElement('option', {
        textContent: `-- Pilih ${field.label} --`,
        attributes: { value: '', disabled: '', selected: '' },
      })
      inputElement.appendChild(defaultOption)

      try {
        // Di sini juga perlu config dari koleksi target relasi
        const allConfigs = await fetchAllUIConfigsFromServer()
        // Find the specific config for the target collection using its name
        const targetCollectionConfig = allConfigs[field.optionsSource.targetCollection]
        // Use field.optionsSource directly as it comes from the current field's config

        const response = await fetch(field.optionsSource.endpoint)
        const optionsDataWrapper = await response.json() // Backend API pagination
        const optionsData = optionsDataWrapper.data ? optionsDataWrapper.data : optionsDataWrapper // Ambil data jika ada wrapper

        optionsData.forEach((optionItem) => {
          const option = createElement('option', {
            // Menggunakan labelField dari optionsSource di config asli
            textContent: optionItem[field.optionsSource.labelField] || optionItem._id,
            value: optionItem[field.optionsSource.valueField],
          })
          inputElement.appendChild(option)
        })
      } catch (error) {
        console.error(`Gagal memuat opsi untuk ${field.name}:`, error)
        const errorOption = createElement('option', {
          textContent: 'Gagal memuat opsi',
          attributes: { value: '', disabled: '' },
        })
        inputElement.appendChild(errorOption)
      }
      if (dataToEdit && dataToEdit[field.name]) {
        inputElement.value = dataToEdit[field.name]
      }
    } else if (field.inputType === 'textarea') {
      inputElement = createElement('textarea', {
        attributes: {
          id: field.name,
          name: field.name,
          required: field.required ? '' : undefined,
          placeholder: field.placeholder || `Masukkan ${field.label}`,
        },
      })
      if (dataToEdit) inputElement.value = dataToEdit[field.name] || ''
    } else if (field.inputType === 'checkbox') {
      inputElement = createElement('input', {
        attributes: {
          type: 'checkbox',
          id: field.name,
          name: field.name,
          required: field.required ? '' : undefined,
        },
      })
      if (dataToEdit && dataToEdit[field.name]) inputElement.checked = true
    } else if (field.inputType === 'array' && field.itemSchema) {
      inputElement = createElement('textarea', {
        attributes: {
          id: field.name,
          name: field.name,
          required: field.required ? '' : undefined,
          placeholder: `Masukkan ${field.label} (Array JSON)`,
        },
      })
      if (dataToEdit && dataToEdit[field.name]) {
        inputElement.value = JSON.stringify(dataToEdit[field.name], null, 2)
      }
    } else {
      inputElement = createElement('input', {
        attributes: {
          type: field.inputType,
          id: field.name,
          name: field.name,
          required: field.required ? '' : undefined,
          readOnly: field.readOnly ? '' : undefined,
          placeholder: field.placeholder || `Masukkan ${field.label}`,
        },
      })

      if (field.minLength) inputElement.setAttribute('minlength', field.minLength)
      if (field.maxLength) inputElement.setAttribute('maxlength', field.maxLength)
      if (field.min) inputElement.setAttribute('min', field.min)
      if (field.max) inputElement.setAttribute('max', field.max)
      if (field.pattern) inputElement.setAttribute('pattern', field.pattern)

      if (dataToEdit) {
        if (field.type === 'Date' && dataToEdit[field.name]) {
          const date = new Date(dataToEdit[field.name])
          inputElement.value = date.toISOString().slice(0, 16)
        } else {
          inputElement.value = dataToEdit[field.name] || ''
        }
      }
    }

    formGroup.appendChild(inputElement)
    form.appendChild(formGroup)
  }

  const submitButton = createElement('button', {
    textContent: dataToEdit ? 'Perbarui Data' : 'Tambah Data Baru',
    attributes: { type: 'submit' },
  })
  form.appendChild(submitButton)

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(form)
    const data = {}
    for (const [key, value] of formData.entries()) {
      const fieldConfig = formFields.find((f) => f.name === key)
      if (fieldConfig) {
        if (fieldConfig.type === 'Number') {
          data[key] = parseFloat(value)
        } else if (fieldConfig.type === 'Boolean') {
          data[key] = value === 'on' ? true : false
        } else if (fieldConfig.type === 'Date') {
          data[key] = new Date(value)
        } else if (fieldConfig.type === 'Array' && fieldConfig.itemSchema) {
          try {
            data[key] = JSON.parse(value)
          } catch (err) {
            alert(`Format JSON tidak valid untuk field ${key}.`)
            return
          }
        } else {
          data[key] = value
        }
      } else {
        data[key] = value
      }
    }

    const method = dataToEdit ? 'PUT' : 'POST'
    const url = dataToEdit
      ? `${API_BASE_URL}/dynamic/${collectionName}/${currentId}`
      : `${API_BASE_URL}/dynamic/${collectionName}`

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || `Gagal ${dataToEdit ? 'memperbarui' : 'menambah'} data.`
        )
      }

      alert(`Data ${dataToEdit ? 'diperbarui' : 'ditambah'} berhasil!`)
      form.reset()
      // Menggunakan currentCollection untuk konsistensi
      const configForList = await fetchUIConfigForCollection(currentCollection)
      await renderDynamicList(
        document.getElementById('list-area'),
        currentCollection,
        configForList.tableColumns,
        currentPage,
        itemsPerPage
      )
      renderCollectionUI(currentCollection) // Render ulang UI untuk membersihkan form edit
    } catch (error) {
      console.error('Error submit form:', error)
      alert(`Error: ${error.message}`)
    }
  })

  parentElement.innerHTML = ''
  parentElement.appendChild(form)
}

/**
 * Meng-*render* daftar dokumen dalam bentuk grid dengan paginasi.
 * @param {HTMLElement} parentElement - Elemen DOM tempat grid akan di-render.
 * @param {string} collectionName - Nama koleksi.
 * @param {Array<object>} displayFields - Array konfigurasi kolom/field yang akan ditampilkan di kartu grid.
 * @param {number} page - Halaman saat ini.
 * @param {number} limit - Jumlah item per halaman.
 */
async function renderDynamicList(parentElement, collectionName, displayFields, page, limit) {
  parentElement.innerHTML = '<p>Memuat data...</p>'
  const paginationControls = document.getElementById('pagination-controls')
  paginationControls.innerHTML = ''

  try {
    const response = await fetch(
      `${API_BASE_URL}/dynamic/${collectionName}?page=${page}&limit=${limit}`
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()
    const data = result.data
    const pagination = result.pagination

    if (data.length === 0 && pagination.currentPage === 1) {
      parentElement.innerHTML = `<p>Tidak ada data di koleksi ini.</p>`
      return
    } else if (data.length === 0 && pagination.currentPage > 1) {
      currentPage = Math.max(1, currentPage - 1)
      // Mengambil konfigurasi lagi untuk recursive call
      const configForList = await fetchUIConfigForCollection(collectionName)
      return await renderDynamicList(
        parentElement,
        collectionName,
        configForList.tableColumns,
        currentPage,
        limit
      )
    }

    parentElement.innerHTML = ''

    const currentCollectionConfig = await fetchUIConfigForCollection(collectionName) // Mengambil lagi

    for (const item of data) {
      // Menggunakan for...of untuk await di dalam loop
      const card = createElement('div', { className: 'grid-item' })
      card.innerHTML = `<h4>${currentCollectionConfig ? currentCollectionConfig.displayName : collectionName}</h4>` // Judul kartu

      for (const field of displayFields) {
        let cellValue = item[field.name]

        if (
          typeof cellValue === 'object' &&
          cellValue !== null &&
          cellValue._bsontype === 'ObjectId'
        ) {
          cellValue = cellValue.toString()
        } else if (
          typeof cellValue === 'object' &&
          cellValue !== null &&
          field.name.endsWith('Details')
        ) {
          // Di sini, kita perlu config dari koleksi target relasi
          const allConfigs = await fetchAllUIConfigsFromServer() // MUNGKIN PERLU FETCH LAGI
          // field.name.replace('Details', '') adalah nama koleksi target (misal 'userIdDetails' -> 'userId')
          const targetCollectionName = field.name.replace('Details', '')

          // Mencari field asli dari config koleksi saat ini untuk mendapatkan optionsSource
          const originalFieldConfig = currentCollectionConfig.formFields.find(
            (f) => f.name === targetCollectionName
          )

          if (
            originalFieldConfig &&
            originalFieldConfig.optionsSource &&
            cellValue[originalFieldConfig.optionsSource.labelField]
          ) {
            cellValue = cellValue[originalFieldConfig.optionsSource.labelField]
          } else if (cellValue.name) {
            cellValue = cellValue.name
          } else if (cellValue.title) {
            cellValue = cellValue.title
          } else {
            cellValue = JSON.stringify(cellValue)
          }
        } else if (cellValue instanceof Date) {
          cellValue = cellValue.toLocaleString()
        } else if (Array.isArray(cellValue)) {
          if (
            cellValue.length > 0 &&
            typeof cellValue[0] === 'object' &&
            ('name' in cellValue[0] || 'title' in cellValue[0])
          ) {
            cellValue =
              cellValue.map((i) => i.name || i.title).join(', ') + ` (${cellValue.length} items)`
          } else {
            cellValue = `[${cellValue.length} items]`
          }
        } else if (cellValue === undefined || cellValue === null || cellValue === '') {
          cellValue = '-'
        }

        const fieldElement = createElement('p', {
          html: `<strong>${field.label}:</strong> ${cellValue}`,
        })
        card.appendChild(fieldElement)
      }

      const actionDiv = createElement('div', { className: 'card-actions' })
      const editButton = createElement('button', {
        textContent: 'Edit',
        attributes: { 'data-id': item._id },
      })
      editButton.addEventListener('click', () => {
        const itemForEdit = { ...item, _id: item._id.toString() }
        renderCollectionUI(collectionName, itemForEdit)
      })

      const deleteButton = createElement('button', {
        textContent: 'Hapus',
        className: 'delete',
        attributes: { 'data-id': item._id },
      })
      deleteButton.addEventListener('click', async () => {
        if (confirm(`Anda yakin ingin menghapus data ini?`)) {
          try {
            const response = await fetch(`${API_BASE_URL}/dynamic/${collectionName}/${item._id}`, {
              method: 'DELETE',
            })
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            alert('Data berhasil dihapus!')
            // Mengambil konfigurasi lagi
            const configForList = await fetchUIConfigForCollection(currentCollection)
            await renderDynamicList(
              parentElement,
              currentCollection,
              configForList.tableColumns,
              currentPage,
              itemsPerPage
            )
          } catch (error) {
            console.error('Error deleting data:', error)
            alert(`Error menghapus data: ${error.message}`)
          }
        }
      })

      actionDiv.appendChild(editButton)
      actionDiv.appendChild(deleteButton)
      card.appendChild(actionDiv)
      parentElement.appendChild(card)
    }

    // --- Render Pagination Controls (Sama seperti sebelumnya) ---
    if (pagination.totalPages > 1) {
      const nav = createElement('nav', { className: 'pagination' })
      const ul = createElement('ul')

      const prevLi = createElement('li')
      const prevLink = createElement('a', {
        textContent: 'Previous',
        attributes: { 'href': '#', 'data-page': pagination.currentPage - 1 },
      })
      if (pagination.currentPage === 1) {
        prevLink.style.pointerEvents = 'none'
        prevLink.style.opacity = '0.5'
      }
      prevLink.addEventListener('click', (e) => {
        e.preventDefault()
        if (pagination.currentPage > 1) {
          currentPage = pagination.currentPage - 1
          renderCollectionUI(collectionName)
        }
      })
      prevLi.appendChild(prevLink)
      ul.appendChild(prevLi)

      for (let i = 1; i <= pagination.totalPages; i++) {
        const pageLi = createElement('li')
        const pageLink = createElement('a', {
          textContent: i,
          attributes: { 'href': '#', 'data-page': i },
        })
        if (i === pagination.currentPage) {
          pageLink.style.fontWeight = 'bold'
          pageLink.style.color = '#28a745'
        }
        pageLink.addEventListener('click', (e) => {
          e.preventDefault()
          currentPage = i
          renderCollectionUI(collectionName)
        })
        pageLi.appendChild(pageLink)
        ul.appendChild(pageLi)
      }

      const nextLi = createElement('li')
      const nextLink = createElement('a', {
        textContent: 'Next',
        attributes: { 'href': '#', 'data-page': pagination.currentPage + 1 },
      })
      if (pagination.currentPage === pagination.totalPages) {
        nextLink.style.pointerEvents = 'none'
        nextLink.style.opacity = '0.5'
      }
      nextLink.addEventListener('click', (e) => {
        e.preventDefault()
        if (pagination.currentPage < pagination.totalPages) {
          currentPage = pagination.currentPage + 1
          renderCollectionUI(collectionName)
        }
      })
      nextLi.appendChild(nextLink)
      ul.appendChild(nextLi)

      nav.appendChild(ul)
      paginationControls.appendChild(nav)
    }
  } catch (error) {
    console.error('Gagal memuat daftar data:', error)
    parentElement.innerHTML = `<p style="color: red;">Gagal memuat daftar data: ${error.message}</p>`
  }
}

// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  // Tidak ada lagi fetchAllUIConfigs() di sini, langsung render nav
  await renderCollectionNav()

  // Untuk inisialisasi koleksi pertama, kita perlu fetch semua configs lagi
  const allInitialConfigs = await fetchAllUIConfigsFromServer()
  const firstCollectionName = Object.keys(allInitialConfigs)[0]
  if (firstCollectionName) {
    currentCollection = firstCollectionName
    currentPage = 1
    renderCollectionUI(firstCollectionName)
  }
})
