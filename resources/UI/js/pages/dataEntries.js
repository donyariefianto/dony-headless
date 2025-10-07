let currentPage = 1
const ITEMS_PER_PAGE = 10 // Batas item per halaman (sesuai permintaan API)
let totalPages = 1
let currentSearchTerm = ''
let FORM_BUILDER_CONFIG = {}

// ==============================================================================
// 1. EKSPOR FUNGSI UTAMA (Dipertahankan)
// ==============================================================================

export const renderDataEntries = () => {
  // Menggunakan kelas CSS dari main.css Anda
  return `
        <div class="page-container">
            <h1>Data Entries</h1>
            <div id="content-view-container">
                <p>Kelola konfigurasi form builder di sini. Gunakan pencarian untuk menemukan entri spesifik.</p>
                <div class="data-controls">
                    <input type="text" id="search-input" placeholder="Cari...">
                    </div>
                <div id="grid-container" class="grid-view">
                    <p>Loading data...</p>
                </div>
                <div class="pagination" id="pagination-controls" style="visibility: hidden;">
                    <button id="prev-btn" disabled>Previous</button>
                    <span id="page-info"></span>
                    <button id="next-btn" disabled>Next</button>
                </div>
            </div>
        </div>
        <div id="form-panel" class="form-panel">
            <div class="panel-header">
                <h3 id="form-panel-title">Detail Entry</h3>
                <button id="close-panel-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="panel-body">
                 <p>Silakan pilih atau tambahkan data untuk menampilkan detail form.</p>
            </div>
            <div id="form-message" class="form-message"></div>
        </div>
        <div id="panel-overlay" class="panel-overlay"></div>
    `
}

export const setupDataEntries = () => {
  // --- 1. SETUP PANEL KONTROL (OPEN/CLOSE) ---
  const closeBtn = document.getElementById('close-panel-btn')
  const overlay = document.getElementById('panel-overlay')

  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', closeFormPanel)
    overlay.addEventListener('click', closeFormPanel)
  }

  // --- 2. SETUP SEARCH (PENCARIAN) ---
  const searchInput = document.getElementById('search-input')

  if (searchInput) {
    // Panggil loadData dengan halaman 1 dan term baru setelah 300ms user berhenti mengetik
    searchInput.addEventListener(
      'input',
      debounce(() => {
        loadData(1, searchInput.value)
      }, 300)
    )
  }

  // --- 3. SETUP PAGINATION (PREV/NEXT) ---
  const prevBtn = document.getElementById('prev-btn')
  const nextBtn = document.getElementById('next-btn')

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        // Muat halaman sebelumnya, pertahankan searchTerm
        loadData(currentPage - 1, currentSearchTerm)
      }
    })
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        // Muat halaman berikutnya, pertahankan searchTerm
        loadData(currentPage + 1, currentSearchTerm)
      }
    })
  }

  // --- 4. PEMUATAN DATA AWAL ---
  loadData(1, '')

  console.log('Setup Data Entries V2 selesai. Data awal dimuat.')
}

// ==============================================================================
// 2. FUNGSI LOAD DATA, RENDER GRID, DAN PANEL (Dipertahankan)
// ==============================================================================

const loadData = async (page = 1, searchTerm = '') => {
  const gridContainer = document.getElementById('grid-container')
  const paginationControls = document.getElementById('pagination-controls')

  gridContainer.innerHTML = '<p>Sedang memuat data...</p>'
  paginationControls.style.visibility = 'hidden'

  const encodedSearchTerm = encodeURIComponent(searchTerm)
  const url = `/configuration/formbuilder/list?page=${page}&limit=${ITEMS_PER_PAGE}&search=${encodedSearchTerm}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = await response.json()
    const data = result.data.documents || []
    const totalItems = result.data.totalCount || 0
    currentPage = result.current_page || page
    totalPages = result.last_page || Math.ceil(totalItems / ITEMS_PER_PAGE)
    currentSearchTerm = searchTerm
    renderGrid(data)
    updatePaginationControls(totalItems)
  } catch (error) {
    console.error('Gagal memuat data entri:', error)
    gridContainer.innerHTML = `
    <div style="color: red; padding: 20px;">
        <p>⚠️ Terjadi kesalahan saat memuat data Form Builder.</p>
        <p>Detail: ${error.message}</p>
    </div>
    `
    totalPages = 1
    updatePaginationControls(0)
  } finally {
    paginationControls.style.visibility = 'visible'
  }
}
const closeFormPanel = () => {
  document.getElementById('form-panel').classList.remove('open')
  document.getElementById('panel-overlay').classList.remove('open')
}
const openFormPanel = (title, formBuilderId) => {
  const formPanel = document.getElementById('form-panel')
  const overlay = document.getElementById('panel-overlay')
  const titleElement = document.getElementById('form-panel-title')
  const bodyElement = formPanel.querySelector('.panel-body')
  const formMessageElement = document.getElementById('form-message')
  titleElement.textContent = title
  formMessageElement.textContent = ''
  bodyElement.innerHTML = `<p class="loading-message"><i class="fa-solid fa-spinner fa-spin"></i> Sedang memuat konfigurasi form...</p>`

  formPanel.classList.add('open')
  overlay.classList.add('open')
  fetchAndRenderForm(formBuilderId)
}
const fetchAndRenderForm = async (formBuilderId) => {
  const bodyElement = document.getElementById('form-panel').querySelector('.panel-body')
  const url = `/configuration/formbuilder/read/${formBuilderId}`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Gagal memuat struktur form. Status: ${response.status}`)
    }
    let result = await response.json()
    result = result.data || {}
    const fields = result.fields || []
    if (fields.length === 0) {
      bodyElement.innerHTML = `<p class="error-message">❌ Konfigurasi form kosong atau tidak valid.</p>`
      return
    }
    renderDynamicForm(fields, formBuilderId)
    setupRelationSelects()
  } catch (error) {
    console.error('Error fetching form structure:', error)
    bodyElement.innerHTML = `<p class="error-message">❌ Terjadi kesalahan jaringan saat memuat form: ${error.message}</p>`
  }
}
const renderDynamicForm = (fields, formBuilderId) => {
  const formPanel = document.getElementById('form-panel')
  if (!formPanel) return
  const bodyElement = formPanel.querySelector('.panel-body')
  if (!bodyElement) return
  const formConfig = { fields: fields }
  FORM_BUILDER_CONFIG = formConfig // Set variabel global
  let formHtml = `<form id="dynamic-data-entry-form" data-form-id="${formBuilderId}">`
  formHtml += `<div class="dynamic-form-layout form-row">`
  fields.forEach((field) => {
    formHtml += renderFieldHtml(field)
  })
  formHtml += `</div>`
  formHtml += `
        <div class="form-actions sticky-footer">
            <button type="submit" class="submit-btn" id="save-data-btn">
                <i class="fa-solid fa-save"></i> Simpan Data
            </button>
        </div>
    `
  formHtml += `</form>`
  bodyElement.innerHTML = formHtml
  setupRepeatableGroupLogic(formConfig)
  initializeCalculatedFields(bodyElement)
  setupCalculatedFields(FORM_BUILDER_CONFIG, bodyElement)
  document.getElementById('dynamic-data-entry-form').addEventListener('submit', function (event) {
    event.preventDefault()
    // const isFilePresent = this.querySelector('input[type="file"]') !== null
    // saveFormData(formBuilderId, this, isFilePresent); // Asumsi ini adalah fungsi eksternal Anda
    saveFormData(formBuilderId, this) // Asumsi: Kita hanya menggunakan 2 argumen di sini
  })
}
const getWidthClass = (width) => {
  if (width === '1/2') return 'field-width-half' // Misalnya: .field-width-half { width: 50%; float: left; }
  if (width === '1/1') return 'field-width-full' // Misalnya: .field-width-full { width: 100%; }
  return 'field-width-full'
}
const renderFieldHtml = (field, namePrefix = '') => {
  const requiredAttr = field.required ? 'required' : ''
  const requiredStar = field.required ? '<span class="required-star">*</span>' : ''
  const widthClass = getWidthClass(field.width)
  const finalFieldName = namePrefix ? `${namePrefix}.${field.name}` : field.name
  const finalFieldId = `field-${finalFieldName.replace(/[\[\]\.]/g, '_')}`
  const isCalculated = field.calculated || field.type === 'calculated'
  const isAutofill = field.type === 'autofill'
  const isReadonly = isCalculated || isAutofill || field.readonly
  const readonlyClass = isReadonly ? 'readonly-field' : ''
  const readonlyAttr = isReadonly ? 'readonly' : ''
  const disabledAttr = isReadonly ? 'disabled' : ''

  let fieldHtml = ''

  // Tentukan ikon info di label
  const isCalculatedOrAutofill = field.type === 'calculated' || field.type === 'autofill'
  const infoIconHtml = isCalculatedOrAutofill
    ? `<i class="fa-solid fa-circle-info field-info-icon" title="Lihat detail kalkulasi/autofill"></i>`
    : ''

  // =========================================================================
  // KASUS: GROUP
  // =========================================================================
  if (field.type === 'group') {
    const isRepeatable = field.isRepeatable
    const isRepeatableClass = isRepeatable ? 'is-repeatable-group' : ''

    let childPrefix = finalFieldName
    if (isRepeatable) {
      childPrefix = `${finalFieldName}[0]`
    }

    // 1. Outer Wrapper (Grup)
    fieldHtml += `<div class="group-card-wrapper ${widthClass} ${isRepeatableClass}">`
    fieldHtml += `<label class="group-label">${field.label}${requiredStar}</label>`

    fieldHtml += `<div class="group-container" data-group-name="${field.name}">`

    // 2. Wrapper untuk Baris (Row)
    const rowCardClass = isRepeatable ? 'repeat-item-card' : ''

    fieldHtml += `<div class="${rowCardClass}">` // START: Card untuk Item yang Diulang

    // Tombol Hapus: DIPINDAHKAN ke pojok kanan atas (.remove-row-top-right)
    if (isRepeatable) {
      fieldHtml += `
            <div class="remove-row-action remove-row-top-right" style="visibility: hidden;">
              <button type="button" class="btn btn-danger btn-sm remove-group-row-btn" title="Hapus Baris">
                <i class="fa-solid fa-xmark"></i> 
              </button>
            </div>
      `
    }

    // Area Field Input: Wrapper dengan class kustom untuk layout horizontal
    fieldHtml += `<div class="group-row-fields">`
    fieldHtml += field.children.map((child) => renderFieldHtml(child, childPrefix)).join('')

    fieldHtml += `</div>` // End .group-row-fields
    fieldHtml += `</div>` // END: Card untuk Item yang Diulang

    if (isRepeatable) {
      fieldHtml += `
      <button type="button" class="btn btn-sm btn-secondary add-group-row-btn" data-group-name="${field.name}">
      <i class="fa-solid fa-plus"></i> Tambah Baris ${field.label}
      </button>`
    }

    fieldHtml += `</div>` // End .group-container
    fieldHtml += `</div>` // End .group-card-wrapper
    return fieldHtml
  }

  // =========================================================================
  // KASUS: FIELD NON-GROUP (Semua Field Anak)
  // =========================================================================

  fieldHtml += `<div class="form-field-wrapper ${widthClass}">`
  fieldHtml += `<div class="form-group form-group-type-${field.type}">`
  // Label dan ikon info
  fieldHtml += `<label for="${finalFieldId}">${field.label}${requiredStar} ${infoIconHtml}</label>`

  let calculatedFormulaNote = ''
  let extraClasses = ''
  let autofillDataAttrs = ''
  // Variabel baru untuk atribut formula di input
  let calculatedFormulaAttr = ''

  switch (field.type) {
    case 'text':
    case 'number':
    case 'date':
    case 'email':
    case 'password':
    case 'calculated':
    case 'autofill':
      let inputType = 'text'
      if (field.type === 'email') inputType = 'email'
      else if (field.type === 'password') inputType = 'password'
      else if (field.type === 'date') inputType = 'date'
      else if (field.type === 'number') inputType = 'number'

      if (field.type === 'calculated' || field.type === 'autofill') {
        inputType = 'text'
      }

      // --- PENANGANAN FIELD CALCULATED DAN AUTOFILL (Fix untuk Engine JS) ---
      if (field.type === 'calculated') {
        const formula = field.calculated?.formula || 'N/A'
        // FIX KRITIS: Mempertahankan tag <small> agar engine JS tidak rusak
        const noteContent = `<small class="form-text text-muted">Field dihitung dengan formula: ${formula}</small>`
        // Membungkus <small> dengan div untuk efek hover
        calculatedFormulaNote = `<div class="field-note-hover">${noteContent}</div>`

        // FIX ROBUST: Menambahkan data formula ke input
        calculatedFormulaAttr = `data-calculated-formula="${formula}"`
      } else if (field.type === 'autofill') {
        const source = field.autofill?.sourceField || 'N/A'
        const key = field.autofill?.sourceKey || 'N/A'
        const mode = field.autofill?.mode || 'copy-value'

        extraClasses = 'autofill-target-field'
        autofillDataAttrs = `data-autofill-source="${source}" data-autofill-key="${key}" data-autofill-mode="${mode}"`

        const noteContent = `<small class="form-text text-muted">Nilai disalin dari ${source} (Key: ${key}, Mode: ${mode})</small>`
        calculatedFormulaNote = `<div class="field-note-hover">${noteContent}</div>`
      }

      // --- RENDERING INPUT AKHIR ---
      fieldHtml += `<input 
          type="${inputType}" 
          id="${finalFieldId}" 
          name="${finalFieldName}" 
          class="form-control ${readonlyClass} ${extraClasses}" 
          value="${field.defaultValue || ''}" 
          ${autofillDataAttrs} 
          ${calculatedFormulaAttr}
          ${requiredAttr} 
          ${readonlyAttr}
      >`
      break

    // ... (cases textarea, select, radio, checkbox, file tetap sama)
    case 'textarea':
      fieldHtml += `<textarea id="${finalFieldId}" name="${finalFieldName}" class="form-control ${readonlyClass}" rows="3" ${requiredAttr} ${readonlyAttr} ${disabledAttr}>${field.defaultValue || ''}</textarea>`
      break

    case 'relation':
    case 'select':
      const isRelation = field.type === 'relation'
      const dataAttrs = isRelation
        ? `data-type="relation" data-table="${field.relation.sourceTable}" data-value-field="${field.relation.valueField}" data-label-field="${field.relation.labelField}"`
        : ''

      const selectClass = 'choices-select'

      fieldHtml += `<select id="${finalFieldId}" name="${finalFieldName}" class="form-control ${selectClass} ${readonlyClass}" ${requiredAttr} ${dataAttrs} ${disabledAttr}>`

      fieldHtml += `<option value="">Pilih ${field.label}</option>`

      if (!isRelation) {
        ;(field.options || []).forEach((option) => {
          const value = typeof option === 'string' ? option : option.value
          const label = typeof option === 'string' ? option : option.label
          fieldHtml += `<option value="${value}" ${value == field.defaultValue ? 'selected' : ''}>${label}</option>`
        })
      }
      fieldHtml += `</select>`
      break

    case 'radio':
      fieldHtml += `<div class="radio-group">`
      ;(field.options || []).forEach((option, index) => {
        const optionValue = typeof option === 'string' ? option : option.value
        const optionLabel = typeof option === 'string' ? option : option.label
        const uniqueId = `radio-${finalFieldId}-${index}`
        const isChecked = optionValue == field.defaultValue

        fieldHtml += `
          <div class="form-check form-check-inline">
            <input type="radio" id="${uniqueId}" name="${finalFieldName}" value="${optionValue}" class="form-check-input" ${requiredAttr} ${disabledAttr} ${isChecked ? 'checked' : ''}>
            <label class="form-check-label" for="${uniqueId}">${optionLabel}</label>
          </div>`
      })
      fieldHtml += `</div>`
      break

    case 'checkbox':
    case 'switch':
      const inputClass =
        field.type === 'switch' ? 'form-check-input form-switch' : 'form-check-input'
      const isChecked =
        field.defaultValue === true || field.defaultValue === 'true' || field.defaultValue === '1'

      fieldHtml += `
        <div class="form-check form-check-inline">
          <input type="checkbox" id="${finalFieldId}" name="${finalFieldName}" class="${inputClass}" value="true" ${isChecked ? 'checked' : ''} ${disabledAttr}>
          <label class="form-check-label" for="${finalFieldId}"></label>
        </div>`
      break

    case 'file':
      fieldHtml += `<input type="file" id="${finalFieldId}" name="${finalFieldName}" class="form-control-file" ${requiredAttr}>`
      fieldHtml += `<small class="form-text text-muted">Maks. ukuran file: 5MB</small>`
      break

    default:
      fieldHtml += `<input type="text" id="${finalFieldId}" name="${finalFieldName}" class="form-control" placeholder="Tipe field '${field.type}' belum didukung" value="${field.defaultValue || ''}">`
  }

  fieldHtml += calculatedFormulaNote // Tambahkan catatan hover
  fieldHtml += `</div>` // End .form-group
  fieldHtml += `</div>` // End .form-field-wrapper (Wrapper widthClass)
  return fieldHtml
}
const debounce = (func, delay) => {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}
const serializeFormData = (formElement) => {
  const data = {}

  // 1. Kumpulkan SEMUA elemen form dengan atribut 'name' yang TIDAK dinonaktifkan.
  // Ini lebih andal daripada FormData() untuk elemen yang dimanipulasi oleh JS.
  const controls = formElement.querySelectorAll('[name]:not(:disabled)')

  controls.forEach((control) => {
    const key = control.name
    let value = control.value

    // Tangani checkbox/radio: hanya ambil yang tercentang
    if (control.type === 'checkbox' || control.type === 'radio') {
      if (!control.checked) {
        // Skip yang tidak tercentang. Kita akan mengolahnya secara terpisah nanti.
        return
      }
    }

    // 2. Gunakan Regex untuk mendeteksi notasi Array/Group
    const regex = /(.+)\[(\d+)\]\.(.+)/
    const match = key.match(regex)

    if (match) {
      // Field berulang (Group)
      const [, groupName, indexStr, fieldName] = match
      const index = parseInt(indexStr)

      // Inisialisasi struktur array
      if (!data[groupName]) {
        data[groupName] = []
      }
      if (!data[groupName][index]) {
        data[groupName][index] = {}
      }

      // Tambahkan nilai field
      data[groupName][index][fieldName] = value
    } else {
      // Field tunggal (Non-Group)
      data[key] = value
    }
  })

  // 3. Penanganan Khusus untuk Checkbox/Switch yang TIDAK tercentang.
  // Kita set nilainya secara eksplisit ke 'false'.
  formElement.querySelectorAll('input[type="checkbox"], input[type="switch"]').forEach((input) => {
    const key = input.name
    if (!input.checked) {
      const regex = /(.+)\[(\d+)\]\.(.+)/
      const match = key.match(regex)

      if (match) {
        // Group Checkbox
        const [, groupName, indexStr, fieldName] = match
        const index = parseInt(indexStr)

        if (data[groupName] && data[groupName][index]) {
          data[groupName][index][fieldName] = false
        }
      } else if (!data.hasOwnProperty(key)) {
        // Single Checkbox
        data[key] = false
      }
    }
  })

  return data
}
const saveFormData = async (formBuilderId, formElement) => {
  const formMessageElement = document.getElementById('form-message')
  const saveButton = document.getElementById('save-data-btn')
  formMessageElement.textContent = ''
  formMessageElement.className = 'form-message' // Reset class
  const data = serializeFormData(formElement)
  saveButton.disabled = true
  saveButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`
  const url = `/data/entry/save/${formBuilderId}`

  try {
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // Tambahkan header Autorisasi jika diperlukan
    //   },
    //   body: JSON.stringify(data),
    // })

    // const result = await response.json()

    // if (!response.ok) {
    //   const errorMessage = result.message || 'Gagal menyimpan data karena kesalahan server.'
    //   throw new Error(errorMessage)
    // }

    // Success
    formMessageElement.textContent = '✅ Data berhasil disimpan!'
    formMessageElement.classList.add('success')

    // Opsional: Muat ulang grid setelah data baru tersimpan (jika datanya terlihat di grid)
    // loadData(currentPage, currentSearchTerm);
    // formElement.reset(); // Reset form
  } catch (error) {
    console.error('Error saving data:', error)
    formMessageElement.textContent = `❌ Gagal menyimpan data: ${error.message}`
    formMessageElement.classList.add('error')
  } finally {
    // Aktifkan kembali tombol
    saveButton.disabled = false
    saveButton.innerHTML = `<i class="fa-solid fa-save"></i> Simpan Data`
  }
}
const renderGrid = (data) => {
  const gridContainer = document.getElementById('grid-container')

  if (data.length === 0) {
    gridContainer.innerHTML = `<p style="padding: 20px;">Tidak ada data yang ditemukan untuk: <b>${currentSearchTerm}</b></p>`
    return
  }

  const html = data
    .map(
      (item) => `
        <div class="grid-item" data-id="${item._id}" data-name="${item.name || 'Untitled Form'}">
            <h3>${item.name || 'Untitled Form'}</h3>
            <p>${item.description || 'Deskripsi tidak tersedia.'}</p>
            <div class="grid-actions">
                <button class="icon-only-btn add-data-btn" data-id="${item._id}" title="Tambah Data Baru">
                    <i class="fa-solid fa-plus"></i> Tambah Data
                </button>
                <button class="icon-only-btn view-table-btn" data-id="${item._id}" title="Lihat Semua Entri Data">
                    <i class="fa-solid fa-table"></i> Lihat Data
                </button>
            </div>
        </div>
    `
    )
    .join('')

  gridContainer.innerHTML = html

  // Melampirkan event listener untuk tombol TAMBAH DATA
  document.querySelectorAll('.add-data-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = event.currentTarget.dataset.id
      const title = event.currentTarget.closest('.grid-item').dataset.name || 'Untitled Form'
      openFormPanel(`Tambah Data untuk: ${title}`, id)
    })
  })

  // Melampirkan event listener untuk tombol LIHAT DATA (Tabel)
  document.querySelectorAll('.view-table-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = event.currentTarget.dataset.id
      // Panggil fungsi untuk beralih tampilan
      // hideGridAndShowTable(id) // Asumsi fungsi ini eksternal
    })
  })
}
const updatePaginationControls = (totalItems) => {
  const prevBtn = document.getElementById('prev-btn')
  const nextBtn = document.getElementById('next-btn')
  const pageInfo = document.getElementById('page-info')

  // Update info halaman
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems)

  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages} (${totalItems} total entri)`

  // Update status tombol
  prevBtn.disabled = currentPage === 1
  nextBtn.disabled = currentPage === totalPages || totalItems === 0 || totalPages === 0
}
// ==============================================================================
// 3. FUNGSI CALCULATED FIELD (DIREVISI KRITIS)
// ==============================================================================

const updateCalculatedField = (formElement, targetFieldName, formula) => {
  let targetElement = formElement.querySelector(`[name="${targetFieldName}"]`)
  if (!targetElement) {
    // Fallback ID (menggunakan konvensi DUA UNDERSCORE '__' dari DOM)
    const safeIdTwoUnderscores = `field-${targetFieldName
      .replace(/\[(\d+)\]\./g, '_$1__') // Mengganti [0]. dengan _0__
      .replace(/[\[\]\.]/g, '_')}` // Membersihkan sisa [ ] atau .

    targetElement = document.getElementById(safeIdTwoUnderscores)

    if (!targetElement) {
      console.error(`❌ Target Element TIDAK DITEMUKAN: ${targetFieldName}`)
      return
    }
  }
  let executableFormula = String(formula || '')
  const scope = {}
  let rowIndex = ''
  let targetGroupBase = ''

  const groupMatch = targetFieldName.match(/([a-zA-Z0-9_]+)\[(\d+)\]\.([a-zA-Z0-9_]+)/)
  if (groupMatch) {
    targetGroupBase = groupMatch[1]
    rowIndex = `[${groupMatch[2]}]`
  } else if (targetFieldName.includes('.')) {
    targetGroupBase = targetFieldName.substring(0, targetFieldName.lastIndexOf('.'))
    rowIndex = ''
  }
  executableFormula = executableFormula.replace(
    /([a-zA-Z_]+)\s*\(\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\)/g,
    (match, funcName, groupName, childFieldName) => {
      // === DEBUG 1: Konfirmasi Deteksi Regex ===
      const fieldValues = getGroupFieldValues(formElement, groupName, childFieldName)

      const result = groupFunctionResolver(funcName, fieldValues) // === DEBUG 3: Konfirmasi Hasil Akhir ===
      return result.toFixed(2).toString()
    }
  )
  executableFormula = executableFormula.replace(
    /{([a-zA-Z0-9_\.]+)}/g,
    (match, depFieldNameInFormula) => {
      let lookupName

      // Jika dependency adalah field di dalam grup (misalnya 'x1' dalam formula {x1} * {x2})
      if (!depFieldNameInFormula.includes('.') && targetGroupBase) {
        // Bentuk nama field lengkap di baris yang sama: group_name[N].x1
        lookupName = `${targetGroupBase}${rowIndex}.${depFieldNameInFormula}`
      } else {
        // Dependency adalah Top-Level (misalnya {total_grup_x}) atau sudah lengkap (misalnya {group_a.field_b})
        lookupName = depFieldNameInFormula
      }

      const depElement = formElement.querySelector(`[name="${lookupName}"]`)
      const value = parseFloat(depElement?.value) || 0

      // Gunakan nama field sebagai kunci scope setelah dibersihkan
      const scopeKey = lookupName.replace(/[^a-zA-Z0-9_]/g, '_')
      scope[scopeKey] = value

      return scopeKey // Ganti {dependency} dengan scopeKey di formula
    }
  )
  let result = 0
  try {
    if (typeof math === 'undefined' || typeof math.evaluate !== 'function') {
      throw new Error('math.js is not loaded.')
    }
    result = math.evaluate(executableFormula, scope)
    if (typeof result === 'number' && !isNaN(result)) {
      result = parseFloat(result.toFixed(2))
    } else {
      result = result.toString()
    }
  } catch (e) {
    console.error(`❌ Error calculating formula: ${executableFormula}. ${e.message}`)
    result = 'SYNTAX ERROR'
  }
  targetElement.value = result
  if (targetElement.classList.contains('readonly-field')) {
    targetElement.dispatchEvent(new Event('change', { bubbles: true }))
  }
}
const resolveCalculatedTargetName = (dependencyElement, originalTargetName) => {
  const depName = dependencyElement.name
  if (!originalTargetName.includes('.')) {
    return originalTargetName // Contoh: 'total_all_group'
  }
  const depGroupMatch = depName.match(/^([a-zA-Z0-9_]+)\[(\d+)\]\.([a-zA-Z0-9_]+)$/)

  if (depGroupMatch) {
    const groupBaseName = depGroupMatch[1] // group_1nrbt
    const rowIndex = depGroupMatch[2] // 0
    const indexString = `[${rowIndex}]` // [0]
    const targetField = originalTargetName.split('.').pop()
    const finalTargetName = `${groupBaseName}${indexString}.${targetField}`
    return finalTargetName
  }

  // Fallback: Untuk field di Top-Level Group (jika ada)
  return originalTargetName
}
const getGroupFieldValues = (formElement, groupName, childFieldName) => {
  const values = []

  // 1. Selector untuk Grup Berulang (yang sudah ada)
  const repeatableSelector = `[name^="${groupName}["][name$=".${childFieldName}"]`

  // 2. Selector untuk Grup Non-Berulang (Hanya 1 Baris)
  const singleRowSelector = `[name="${groupName}.${childFieldName}"]`

  // Kombinasikan selector
  const combinedSelector = `${repeatableSelector}, ${singleRowSelector}`

  formElement.querySelectorAll(combinedSelector).forEach((inputElement) => {
    const value = parseFloat(inputElement.value)
    if (!isNaN(value) && isFinite(value)) {
      values.push(value)
    } else {
      values.push(0)
    }
  })
  return values
}
const groupFunctionResolver = (funcName, values) => {
  if (values.length === 0) return 0
  const count = values.length

  switch (funcName.toUpperCase()) {
    case 'SUM':
      return values.reduce((acc, val) => acc + val, 0)
    case 'AVG':
      const sum = values.reduce((acc, val) => acc + val, 0)
      return sum / count
    case 'COUNT':
      return count
    case 'MIN':
      return Math.min(...values)
    case 'MAX':
      return Math.max(...values)
    default:
      console.warn(`Fungsi agregat kustom '${funcName}' tidak dikenal. Default ke 0.`)
      return 0
  }
}

// ==============================================================================
// 4. FUNGSI REPEATABLE GROUP (Dipertahankan dan Diperbaiki)
// ==============================================================================

const handleAddRow = (event) => {
  const addButton = event.currentTarget
  const groupName = addButton.dataset.groupName
  const groupContainer = addButton.closest('.group-container')
  const formElement = addButton.closest('form')

  if (!groupContainer || !groupName || !formElement) return

  const groupConfig = getGroupConfig(groupName)
  if (!groupConfig || !groupConfig.children) {
    console.error(`Konfigurasi grup '${groupName}' tidak ditemukan.`)
    return
  }

  const itemCards = groupContainer.querySelectorAll('.repeat-item-card')
  const newIndex = itemCards.length
  const childPrefix = `${groupName}[${newIndex}]`

  const newRowCard = document.createElement('div')
  newRowCard.className = 'repeat-item-card'

  // =========================================================================
  // PERBAIKAN KRITIS PADA STRING HTML (Untuk penempatan Tombol Kanan Atas)
  // =========================================================================
  let newRowHtml = `
        <div class="remove-row-action remove-row-top-right" style="visibility: visible;">
            <button type="button" class="btn btn-danger btn-sm remove-group-row-btn" title="Hapus Baris">
                <i class="fa-solid fa-xmark"></i> 
            </button>
        </div>
        <div class="group-row-fields">` // START: Area Field Input

  // Tambahkan field anak yang sudah dirender dengan class lebar (widthClass)
  newRowHtml += groupConfig.children.map((child) => renderFieldHtml(child, childPrefix)).join('')

  newRowHtml += `</div>` // Tutup div.group-row-fields

  newRowCard.innerHTML = newRowHtml
  groupContainer.insertBefore(newRowCard, addButton)

  // -------------------------------------------------------------------------
  // INISIALISASI DAN PERHITUNGAN (Sudah Benar)
  // -------------------------------------------------------------------------

  // 1. Inisialisasi Event Listener
  const newRemoveButton = newRowCard.querySelector('.remove-group-row-btn')
  if (newRemoveButton) {
    newRemoveButton.addEventListener('click', handleRemoveRow)
  }

  // 2. Re-index dan Setup
  reIndexGroupRows(groupContainer)
  setupRelationSelects()
  setupRowCalculatedListeners(newRowCard, groupConfig.children, childPrefix)

  // 3. Perhitungan Ulang
  initializeCalculatedFields(newRowCard)
  recalculateAllCalculatedFields(formElement)
}
const handleRemoveRow = (event) => {
  const removeButton = event.currentTarget
  const itemCardToRemove = removeButton.closest('.repeat-item-card')
  const groupContainer = removeButton.closest('.group-container')
  const formElement = removeButton.closest('form')
  const groupName = groupContainer?.dataset.groupName // Gunakan optional chaining untuk keamanan

  // Periksa apakah semua elemen penting ditemukan
  if (!itemCardToRemove || !groupContainer || !groupName || !formElement) {
    return
  }

  // 1. Hapus Baris
  itemCardToRemove.remove()

  // 2. Re-index dan Setup
  // PENTING: Panggil reIndexGroupRows terlebih dahulu agar indeks field lain benar
  reIndexGroupRows(groupContainer)

  // Panggil setupRelationSelects untuk pembersihan/re-inisialisasi choices.js
  setupRelationSelects()

  // 3. Perhitungan Ulang Global
  // Panggil fungsi recalculate global sekali.
  // Fungsi ini harus dirancang untuk mencari semua calculated field, termasuk agregasi,
  // dan menghitung ulang nilainya.
  recalculateAllCalculatedFields(formElement)

  // Hapus blok kode terakhir yang berulang-ulang dan tidak efisien:
  /*
    formElement.querySelectorAll(`[data-calc-listener-for*="${groupName}"]`).forEach((calcField) => {
        // ... kode perhitungan berulang
    })
    */

  // Catatan: Jika recalculateAllCalculatedFields Anda belum menangani agregasi (SUM/AVG)
  // dengan benar setelah baris dihapus, Anda harus memperbaiki logika di dalam
  // recalculateAllCalculatedFields, bukan menambah loop manual di sini.
}
const reIndexGroupRows = (groupContainer) => {
  const itemCards = groupContainer.querySelectorAll('.repeat-item-card')
  itemCards.forEach((itemCard, newIndex) => {
    // Cari semua elemen yang perlu diupdate (Input, Select, Textarea, Label)
    const elementsToUpdate = itemCard.querySelectorAll('[name], [id], [for]')

    if (elementsToUpdate.length > 0) {
      const firstElement = elementsToUpdate[0]
      const oldRowName = firstElement.name || ''
      const oldIndexMatch = oldRowName.match(/\[(\d+)\]/)

      const oldIndex = oldIndexMatch ? parseInt(oldIndexMatch[1]) : newIndex

      const oldIndexPatternForName = new RegExp(`\\[${oldIndex}\\]`, 'g')

      elementsToUpdate.forEach((el) => {
        // 1. Update Name (e.g., group_name[OLD].field -> group_name[NEW].field)
        if (el.name) {
          el.name = el.name.replace(oldIndexPatternForName, `[${newIndex}]`)

          // 2. Update ID & FOR: RE-GENERATE ID dari NAME BARU (Ini paling aman)
          const newFinalFieldName = el.name
          const newFinalFieldId = `field-${newFinalFieldName.replace(/[\[\]\.]/g, '_')}` // Single Underscore!

          if (el.id) {
            el.id = newFinalFieldId
          }
          if (el.htmlFor) {
            el.htmlFor = newFinalFieldId
          }
        }
        // Catatan: Jika elemen tidak punya `name` (misalnya <label> untuk radio/checkbox), kita tidak bisa memperbarui ID-nya di sini
        // Namun, radio/checkbox memerlukan ID yang sangat unik. Logika di renderFieldHtml sudah menangani ID yang sangat unik
      })
    }

    // Mengatur visibilitas tombol hapus dan memasang listener
    const removeBtnContainer = itemCard.querySelector('.remove-row-action')
    if (removeBtnContainer) {
      removeBtnContainer.style.visibility = newIndex === 0 ? 'hidden' : 'visible'
      const removeButton = removeBtnContainer.querySelector('.remove-group-row-btn')
      if (removeButton) {
        // Asumsi handleRemoveRow adalah fungsi yang didefinisikan secara global
        removeButton.removeEventListener('click', handleRemoveRow)
        removeButton.addEventListener('click', handleRemoveRow)
      }
    }
  })
}
const setupRepeatableGroupLogic = (formConfig) => {
  if (formConfig) {
    FORM_BUILDER_CONFIG = formConfig
  }
  document.querySelectorAll('.add-group-row-btn').forEach((button) => {
    button.removeEventListener('click', handleAddRow)
    button.addEventListener('click', handleAddRow)
  })

  // Listener Hapus Baris (untuk semua yang sudah ada)
  document.querySelectorAll('.remove-group-row-btn').forEach((button) => {
    button.removeEventListener('click', handleRemoveRow)
    button.addEventListener('click', handleRemoveRow)
  })

  // Inisialisasi: Lakukan re-indexing untuk mengatur visibilitas tombol hapus di awal
  document.querySelectorAll('.group-container').forEach((container) => {
    reIndexGroupRows(container)
  })
}
const getGroupConfig = (groupName) => {
  const formConfig = FORM_BUILDER_CONFIG
  if (!formConfig || !formConfig.fields) return null
  const findGroup = (fields) => {
    for (const field of fields) {
      if (field.type === 'group' && field.name === groupName) {
        return field
      }
      if (field.type === 'group' && field.children) {
        const found = findGroup(field.children)
        if (found) return found
      }
    }
    return null
  }
  return findGroup(formConfig.fields)
}
const setupRowCalculatedListeners = (rowCardElement, groupFields, groupPrefix) => {
  groupFields.forEach((field) => {
    if (field.type === 'calculated' && field.calculated?.formula) {
      const { formula } = field.calculated
      const targetNameInConfig = field.name
      const dependencies = [...new Set(formula.match(/{([a-zA-Z0-9_]+)}/g) || [])].map((match) =>
        match.replace(/[{}]/g, '')
      )

      dependencies.forEach((depName) => {
        const fullDepName = `${groupPrefix}.${depName}`
        const dependencyElement = rowCardElement.querySelector(`[name="${fullDepName}"]`)

        if (dependencyElement) {
          dependencyElement.addEventListener('input', (event) => {
            const groupBaseName = groupPrefix.substring(0, groupPrefix.lastIndexOf('['))
            const originalTargetName = `${groupBaseName}.${targetNameInConfig}`
            const resolvedTargetName = resolveCalculatedTargetName(event.target, originalTargetName)
            const formElement = event.target.closest('form')
            if (resolvedTargetName && formElement) {
              updateCalculatedField(formElement, resolvedTargetName, formula)
            }
          })
        }
      })
    }
  })
}
const initializeCalculatedFields = (formElement) => {
  formElement.querySelectorAll('.form-group-type-calculated input').forEach((calcField) => {
    const targetFieldName = calcField.name
    const formula =
      calcField
        .closest('.form-group')
        .querySelector('small.form-text')
        ?.textContent.match(/formula: (.+)/)?.[1] || ''

    if (targetFieldName && formula) {
      updateCalculatedField(formElement, targetFieldName, formula)
    }
  })
}
const recalculateAllCalculatedFields = (formElement) => {
  formElement.querySelectorAll('.form-group-type-calculated input').forEach((calcField) => {
    const targetFieldName = calcField.name
    const formulaElement = calcField.closest('.form-group')?.querySelector('small.form-text')
    const formula = formulaElement?.textContent.match(/formula: (.+)/)?.[1] || ''
    if (targetFieldName && formula) {
      updateCalculatedField(formElement, targetFieldName, formula)
    }
  })
}
const setupCalculatedFields = (formConfig, formElement) => {
  formElement.addEventListener('input', (event) => {
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'SELECT' ||
      event.target.tagName === 'TEXTAREA'
    ) {
      recalculateAllCalculatedFields(formElement)
    }
  })
  recalculateAllCalculatedFields(formElement)
}
const fetchRelationOptions = async (targetTable, page = 1, searchTerm = '') => {
  const encodedSearchTerm = encodeURIComponent(searchTerm)
  const url = `/api/${targetTable}?limit=10&page=${page}&search=${encodedSearchTerm}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Gagal memuat data relasi ${targetTable}. Status: ${response.status}`)
    }

    const result = await response.json()
    return {
      options: result.data.documents || [],
      totalPages: result.totalPages || 1,
      totalItems: result.totalCount || 0,
    }
  } catch (error) {
    console.error('Error fetching relation data:', error)
    return { options: [], totalPages: 1, totalItems: 0 }
  }
}
const setupRelationSelects = () => {
  document.querySelectorAll('.choices-select[data-type="relation"]').forEach(async (selectEl) => {
    const targetTable = selectEl.dataset.table
    const valueField = selectEl.dataset.valueField
    const labelField = selectEl.dataset.labelField

    if (typeof Choices !== 'function') {
      console.error('Choices.js not loaded. Skipping relation select setup.')
      return
    }
    if (selectEl.classList.contains('choices-select--initialized')) {
      return
    }
    const choices = new Choices(selectEl, {
      searchEnabled: true,
      removeItemButton: true,
      loadingText: 'Memuat data...',
      noResultsText: 'Tidak ditemukan',
      noChoicesText: 'Tidak ada pilihan',
      shouldSort: false,
    })
    selectEl.classList.add('choices-select--initialized')
    selectEl.addEventListener('search', async (event) => {
      const searchTerm = event.detail.value
      choices.setChoices([{ value: '', label: 'Mencari...' }], 'value', 'label', true) // Tampilkan loading
      const { options } = await fetchRelationOptions(targetTable, 1, searchTerm)

      const choicesOptions = options.map((item) => ({
        value: item[valueField],
        label: item[labelField],
        customProperties: item,
      }))

      choices.setChoices(choicesOptions, 'value', 'label', true)
    })
    selectEl.addEventListener('change', (event) => {
      const selectedId = event.target.value
      const formElement = selectEl.closest('form')
      const sourceFieldName = selectEl.name
      const normalizedSourceName = sourceFieldName.replace(/\[\d+\]/, '')

      const repeatableGroupCard = selectEl.closest('.repeat-item-card')
      const searchRoot = repeatableGroupCard || formElement
      const allAutofillTargets = searchRoot.querySelectorAll(`.autofill-target-field`)
      const targetFields = Array.from(allAutofillTargets).filter((targetField) => {
        const targetSource = targetField.dataset.autofillSource
        return normalizedSourceName.includes(targetSource)
      })
      const selectedOption = selectEl.querySelector(`option[value="${selectedId}"]`)

      if (selectedOption) {
        const dataJsonString = selectedOption.dataset.customProperties
        if (dataJsonString) {
          try {
            const fullData = JSON.parse(dataJsonString)
            targetFields.forEach((targetField) => {
              const mode = targetField.dataset.autofillMode
              let keyVal = ''
              if (mode === 'copy-value') {
                keyVal = 'id'
              } else if (mode === 'copy-label' && targetField.value) {
                keyVal = 'label'
              } else {
                keyVal = targetField.dataset.autofillKey
              }

              targetField.value = fullData[keyVal] || ''
              if (targetField.classList.contains('readonly-field')) {
                targetField.dispatchEvent(new Event('input', { bubbles: true }))
              }
            })
            if (formElement) {
              recalculateAllCalculatedFields(formElement)
            }
          } catch (e) {
            console.error('Gagal parse data-custom-properties JSON:', e)
          }
        }
      }
    })

    const initialFetchTerm = selectEl.value || ''
    const { options } = await fetchRelationOptions(targetTable, 1, initialFetchTerm)
    const initialOptions = options.map((item) => ({
      value: item[valueField],
      label: item[labelField],
      customProperties: item,
      // Jika field ini memiliki nilai default, pastikan opsi yang cocok ditandai 'selected'
      selected: item[valueField] == selectEl.value,
    }))
    if (selectEl.value && !initialOptions.some((opt) => opt.value == selectEl.value)) {
      // Dalam skenario nyata, Anda harus melakukan fetch khusus untuk nilai yang terpilih
      // Namun, untuk kesederhanaan, kita asumsikan fetch awal mencakup nilai default jika ada.
    }
    choices.setChoices(initialOptions, 'value', 'label', true)
    if (selectEl.value) {
      choices.setChoiceByValue(selectEl.value)
    }
  })

  document.querySelectorAll('.choices-select:not([data-type="relation"])').forEach((selectEl) => {
    new Choices(selectEl, {
      searchEnabled: true,
      removeItemButton: true,
      shouldSort: false,
      // ...
    })
  })
}
