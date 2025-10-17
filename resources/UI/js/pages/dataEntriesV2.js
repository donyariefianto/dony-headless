let currentPage = 1
const ITEMS_PER_PAGE = 10
let totalPages = 1
let currentSearchTerm = ''
let FORM_BUILDER_CONFIG = {}

// ==============================================================================
// 1. EKSPOR FUNGSI UTAMA
// ==============================================================================
export const renderDataEntriesV2 = () => {
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

export const setupDataEntriesV2 = () => {
  const closeBtn = document.getElementById('close-panel-btn')
  const overlay = document.getElementById('panel-overlay')

  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', closeFormPanel)
    overlay.addEventListener('click', closeFormPanel)
  }

  const searchInput = document.getElementById('search-input')

  if (searchInput) {
    searchInput.addEventListener(
      'input',
      debounce(() => {
        loadData(1, searchInput.value)
      }, 300)
    )
  }

  const prevBtn = document.getElementById('prev-btn')
  const nextBtn = document.getElementById('next-btn')

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        loadData(currentPage - 1, currentSearchTerm)
      }
    })
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        loadData(currentPage + 1, currentSearchTerm)
      }
    })
  }

  loadData(1, '')
}

// ==============================================================================
// 2. FUNGSI LOAD DATA, RENDER GRID, DAN PANEL
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
  FORM_BUILDER_CONFIG = formConfig
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
  setupCalculatedFields(bodyElement)
  document.getElementById('dynamic-data-entry-form').addEventListener('submit', function (event) {
    event.preventDefault()
    saveFormData(formBuilderId, this)
  })
}
const getWidthClass = (width) => {
  if (width === '1/2') return 'field-width-half'
  if (width === '1/1') return 'field-width-full'
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
  const isCalculatedOrAutofill = field.type === 'calculated' || field.type === 'autofill'
  const infoIconHtml = isCalculatedOrAutofill
    ? `<i class="fa-solid fa-circle-info field-info-icon" title="Lihat detail kalkulasi/autofill"></i>`
    : ''

  if (field.type === 'group') {
    const isRepeatable = field.isRepeatable
    const isRepeatableClass = isRepeatable ? 'is-repeatable-group' : ''

    let childPrefix = finalFieldName
    if (isRepeatable) {
      childPrefix = `${finalFieldName}[0]`
    }

    fieldHtml += `<div class="group-card-wrapper ${widthClass} ${isRepeatableClass}">`
    fieldHtml += `<label class="group-label">${field.label}${requiredStar}</label>`

    fieldHtml += `<div class="group-container" data-group-name="${field.name}">`

    const rowCardClass = isRepeatable ? 'repeat-item-card' : ''

    fieldHtml += `<div class="${rowCardClass}">`

    if (isRepeatable) {
      fieldHtml += `
            <div class="remove-row-action remove-row-top-right" style="visibility: hidden;">
              <button type="button" class="btn btn-danger btn-sm remove-group-row-btn" title="Hapus Baris">
                <i class="fa-solid fa-xmark"></i> 
              </button>
            </div>
      `
    }

    fieldHtml += `<div class="group-row-fields">`
    fieldHtml += field.children.map((child) => renderFieldHtml(child, childPrefix)).join('')

    fieldHtml += `</div>`
    fieldHtml += `</div>`

    if (isRepeatable) {
      fieldHtml += `
      <button type="button" class="btn btn-sm btn-secondary add-group-row-btn" data-group-name="${field.name}">
      <i class="fa-solid fa-plus"></i> Tambah Baris ${field.label}
      </button>`
    }

    fieldHtml += `</div>`
    fieldHtml += `</div>`
    return fieldHtml
  }

  fieldHtml += `<div class="form-field-wrapper ${widthClass}">`
  fieldHtml += `<div class="form-group form-group-type-${field.type}">`
  fieldHtml += `<label for="${finalFieldId}">${field.label}${requiredStar} ${infoIconHtml}</label>`

  let calculatedFormulaNote = ''
  let extraClasses = ''
  let autofillDataAttrs = ''
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

      if (field.type === 'calculated') {
        const formula = field.calculated?.formula || 'N/A'
        calculatedFormulaAttr = `data-calculated-formula="${formula}"`
        const noteContent = `<small class="form-text text-muted">Field dihitung dengan formula: ${formula}</small>`
        calculatedFormulaNote = `<div class="field-note-hover">${noteContent}</div>`
      } else if (field.type === 'autofill') {
        const source = field.autofill?.sourceField || 'N/A'
        const key = field.autofill?.sourceKey || 'N/A'
        const mode = field.autofill?.mode || 'copy-value'

        extraClasses = 'autofill-target-field'
        autofillDataAttrs = `data-autofill-source="${source}" data-autofill-key="${key}" data-autofill-mode="${mode}"`

        const noteContent = `<small class="form-text text-muted">Nilai disalin dari ${source} (Key: ${key}, Mode: ${mode})</small>`
        calculatedFormulaNote = `<div class="field-note-hover">${noteContent}</div>`
      }

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

  fieldHtml += calculatedFormulaNote
  fieldHtml += `</div>`
  fieldHtml += `</div>`
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
  const controls = formElement.querySelectorAll('[name]:not(:disabled)')

  // Regex untuk menangkap Repeatable Group (e.g., items[1].qty)
  const regexRepeatable = /(.+)\[(\d+)\]\.(.+)/
  // Regex untuk menangkap Single Group (e.g., alamat.jalan)
  const regexSingleGroup = /^([a-zA-Z0-9_]+)\.(.+)$/

  controls.forEach((control) => {
    const key = control.name
    let value = control.value

    if (control.type === 'checkbox' || control.type === 'radio') {
      if (!control.checked) {
        return
      }
    }

    let isGroupField = false

    // 1. Cek Repeatable Group
    const matchRepeatable = key.match(regexRepeatable)
    if (matchRepeatable) {
      const [, groupName, indexStr, fieldName] = matchRepeatable
      const index = parseInt(indexStr)
      if (!data[groupName]) {
        data[groupName] = []
      }
      if (!data[groupName][index]) {
        data[groupName][index] = {}
      }
      data[groupName][index][fieldName] = value
      isGroupField = true
    }

    // 2. Cek Single Group (Group Non-Repeatable)
    const matchSingleGroup = key.match(regexSingleGroup)
    if (matchSingleGroup && !isGroupField) {
      const [, groupName, fieldName] = matchSingleGroup

      // Kita perlu cek apakah groupName ini memang didefinisikan sebagai group di config
      // Jika ya, kita paksa ia menjadi array dengan 1 elemen (indeks 0)
      if (isNonRepeatableGroup(groupName)) {
        if (!data[groupName]) {
          data[groupName] = [] // Inisialisasi sebagai Array
        }
        if (!data[groupName][0]) {
          data[groupName][0] = {}
        }
        data[groupName][0][fieldName] = value
        isGroupField = true
      }
    }

    // 3. Field Top-Level (e.g., nama_proyek)
    if (!isGroupField) {
      data[key] = value
    }
  })

  // Penanganan Checkbox/Switch yang tidak dicentang (false/boolean)
  formElement.querySelectorAll('input[type="checkbox"], input[type="switch"]').forEach((input) => {
    const key = input.name
    if (!input.checked) {
      const matchRepeatable = key.match(regexRepeatable)
      const matchSingleGroup = key.match(regexSingleGroup)

      if (matchRepeatable) {
        const [, groupName, indexStr, fieldName] = matchRepeatable
        const index = parseInt(indexStr)
        if (data[groupName] && data[groupName][index]) {
          data[groupName][index][fieldName] = false
        }
      } else if (matchSingleGroup && isNonRepeatableGroup(matchSingleGroup[1])) {
        const [, groupName, fieldName] = matchSingleGroup
        if (data[groupName] && data[groupName][0]) {
          data[groupName][0][fieldName] = false
        }
      } else if (!data.hasOwnProperty(key)) {
        data[key] = false
      }
    }
  })

  // Setelah selesai, hapus elemen array yang mungkin kosong (jika ada)
  for (const key in data) {
    if (Array.isArray(data[key])) {
      data[key] = data[key].filter(
        (item) => item !== null && typeof item === 'object' && Object.keys(item).length > 0
      )
    }
  }

  return data
}
const isNonRepeatableGroup = (groupName) => {
  if (!FORM_BUILDER_CONFIG || !FORM_BUILDER_CONFIG.fields) return false

  // Fungsi rekursif untuk mencari group
  const findGroup = (fields) => {
    for (const field of fields) {
      if (field.type === 'group' && field.name === groupName) {
        // Return true jika ditemukan dan BUKAN repeatable
        return !field.isRepeatable
      }
      if (field.type === 'group' && field.children) {
        const found = findGroup(field.children)
        if (found !== false) return found
      }
    }
    return false
  }

  // Lakukan pencarian
  return findGroup(FORM_BUILDER_CONFIG.fields)
}
const saveFormData = async (formBuilderId, formElement) => {
  const saveButton = document.getElementById('save-data-btn')
  const data = serializeFormData(formElement)

  const url = `/api/dynamics-form/${formBuilderId}` // URL BARU SESUAI PERMINTAAN

  saveButton.disabled = true
  saveButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`
  const currentTheme = JSON.parse(localStorage.getItem('darkMode'))
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      // Tangani error HTTP seperti 400 atau 500
      let errorDetail = 'Terjadi kesalahan saat menyimpan data.'
      try {
        const errorBody = await response.json()
        errorDetail = errorBody.message || errorDetail
      } catch (e) {
        // Abaikan jika body bukan JSON
      }
      throw new Error(`Gagal menyimpan (Status ${response.status}): ${errorDetail}`)
    }
    let config_swal = {
      icon: 'success',
      title: 'Berhasil Disimpan!',
      text: 'Data form Anda telah berhasil dikirim dan disimpan.',
      confirmButtonText: 'OK',
    }
    if (currentTheme) {
      config_swal.theme = 'dark'
    }
    Swal.fire(config_swal)
    formElement.reset()
    closeFormPanel()
  } catch (error) {
    console.error('Error saving data:', error)

    // 3. Tampilkan SweetAlert Gagal
    Swal.fire({
      icon: 'error',
      title: 'Gagal Menyimpan!',
      text: `Detail Error: ${error.message}`,
      confirmButtonText: 'Tutup',
    })
  } finally {
    // 4. Kembalikan kondisi tombol
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

  document.querySelectorAll('.add-data-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = event.currentTarget.dataset.id
      const title = event.currentTarget.closest('.grid-item').dataset.name || 'Untitled Form'
      openFormPanel(`Tambah Data untuk: ${title}`, id)
    })
  })

  document.querySelectorAll('.view-table-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = event.currentTarget.dataset.id
    })
  })
}
const updatePaginationControls = (totalItems) => {
  const prevBtn = document.getElementById('prev-btn')
  const nextBtn = document.getElementById('next-btn')
  const pageInfo = document.getElementById('page-info')

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems)

  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages} (${totalItems} total entri)`

  prevBtn.disabled = currentPage === 1
  nextBtn.disabled = currentPage === totalPages || totalItems === 0 || totalPages === 0
}
// ==============================================================================
// 3. FUNGSI CALCULATED FIELD (Clean Code)
// ==============================================================================

const updateCalculatedField = (formElement, targetFieldName, formula) => {
  // 1. DETEKSI KONTEKS REPEATABLE GROUP
  let currentGroupPrefix = null
  let groupMatch = targetFieldName.match(/([a-zA-Z0-9_]+)\[\d+\]/)

  if (groupMatch) {
    currentGroupPrefix = groupMatch[0]
  }

  // 2. FASE RESOLUSI FUNGSI GRUP (SUM/AVERAGE)
  const groupRegex = /(\w+)\s*\(([^)]+)\)/g
  let formulaToEvaluate = formula

  formulaToEvaluate = formulaToEvaluate.replace(groupRegex, (match, funcName, fieldPath) => {
    const parts = fieldPath.trim().split('.')

    if (parts.length < 2) {
      console.error(`[CALC ERROR] Format formula grup tidak valid: ${fieldPath}`)
      return 0
    }
    const groupName = parts[0]
    const childFieldName = parts.slice(1).join('.')

    const values = getGroupFieldValues(formElement, groupName, childFieldName)
    const result = groupFunctionResolver(funcName, values)

    return String(result)
  })

  // 3. FASE RESOLUSI DEPENDENSI FIELD BIASA ({field})
  let scopeData = {}
  const dependencyRegex = /\{([a-zA-Z0-9_.]+)\}/g

  const dependencies = [...formulaToEvaluate.matchAll(dependencyRegex)]
    .map((match) => match[1])
    .filter((value, index, self) => self.indexOf(value) === index)

  dependencies.forEach((depName) => {
    let depValue = 0
    let depField = null

    if (currentGroupPrefix) {
      // PRIORITAS 1: Cari dependensi INTERNAL di baris yang sama.
      const fullDepName = `${currentGroupPrefix}.${depName}`
      depField = formElement.querySelector(`[name="${fullDepName}"]:not(:disabled)`)

      if (!depField) {
        // PRIORITAS 2: Fallback ke Top-Level (Lintas-Grup)
        depField = formElement.querySelector(`[name="${depName}"]:not(:disabled)`)
      }
    } else {
      // Top-Level Normal: Cari sebagai field Top-Level.
      depField = formElement.querySelector(`[name="${depName}"]:not(:disabled)`)
    }

    if (depField) {
      // FAIL-SAFE NUMERIK
      depValue = parseFloat(depField.value) || 0
    }

    scopeData[depName.replace(/\./g, '_')] = depValue
  })

  // 4. FASE EVALUASI MATH.JS
  const finalFormula = formulaToEvaluate.replace(dependencyRegex, (match, depName) => {
    return depName.replace(/\./g, '_')
  })

  let evaluatedResult = 0
  try {
    evaluatedResult = math.evaluate(finalFormula, scopeData)
    if (isNaN(evaluatedResult)) evaluatedResult = 0
  } catch (e) {
    console.error(
      `[CALC ERROR] Error pada formula field ${targetFieldName}: ${e.message}`,
      finalFormula,
      scopeData
    )
    evaluatedResult = 0
  }

  // 5. UPDATE FIELD DAN PICU BERANTAI
  const targetElement = formElement.querySelector(`[name="${targetFieldName}"]`)
  if (!targetElement) {
    console.warn(`[CALC WARNING] Target element ${targetFieldName} tidak ditemukan.`)
    return
  }

  const newValue = evaluatedResult.toFixed(2)
  const currentValue = targetElement.value

  if (currentValue !== newValue) {
    targetElement.value = newValue

    // Pemicu Berantai (Hanya untuk readonly-field)
    if (targetElement.classList.contains('readonly-field')) {
      targetElement.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
}
const groupFunctionResolver = (funcName, values) => {
  if (values.length === 0) return 0
  const lowerCaseFunc = funcName.toLowerCase()

  switch (lowerCaseFunc) {
    case 'sum':
      return math.sum(values)
    case 'average':
      return math.sum(values) / values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    default:
      return 0
  }
}
const getGroupFieldValues = (formElement, groupName, childFieldName) => {
  const values = []
  const pattern = new RegExp(`${groupName}\\[\\d+\\]\\.${childFieldName}`)

  formElement
    .querySelectorAll(`[name^="${groupName}"][name$=".${childFieldName}"]:not(:disabled)`)
    .forEach((input) => {
      if (input.name.match(pattern)) {
        const value = parseFloat(input.value) || 0
        values.push(value)
      }
    })
  return values
}
const recalculateAllCalculatedFields = (formElement) => {
  const allCalculatedFields = Array.from(
    formElement.querySelectorAll('.form-group-type-calculated input')
  )

  // FASE 1: KALKULASI INTRA-GROUP (PRIORITAS TINGGI)
  // Field yang berada di dalam grup (e.g., items[0].subtotal)
  const intraGroupFields = allCalculatedFields.filter(
    (field) => field.name.includes('[') && field.name.includes(']')
  )

  intraGroupFields.forEach((calcField) => {
    const targetFieldName = calcField.name
    const formula = calcField.dataset.calculatedFormula || ''
    if (targetFieldName && formula) {
      updateCalculatedField(formElement, targetFieldName, formula)
    }
  })

  // FASE 2: KALKULASI GLOBAL DAN AGREGASI (PRIORITAS RENDAH)
  // Field Top-Level (e.g., total_global, atau field lain yang mengandalkan SUM)
  const globalFields = allCalculatedFields.filter(
    (field) => !field.name.includes('[') || !field.name.includes(']')
  )

  globalFields.forEach((calcField) => {
    const targetFieldName = calcField.name
    const formula = calcField.dataset.calculatedFormula || ''
    if (targetFieldName && formula) {
      updateCalculatedField(formElement, targetFieldName, formula)
    }
  })
}
const setupCalculatedFields = (formElement) => {
  formElement.addEventListener('input', (event) => {
    // Loop Protection (Pilar 1.A): Abaikan input dari field yang ReadOnly
    if (event.target.classList.contains('readonly-field')) {
      return
    }

    recalculateAllCalculatedFields(formElement)
  })

  // Initial calculation when form is loaded
  recalculateAllCalculatedFields(formElement)
}

// ==============================================================================
// 4. FUNGSI REPEATABLE GROUP
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
  let newRowHtml = `
        <div class="remove-row-action remove-row-top-right" style="visibility: visible;">
            <button type="button" class="btn btn-danger btn-sm remove-group-row-btn" title="Hapus Baris">
                <i class="fa-solid fa-xmark"></i> 
            </button>
        </div>
        <div class="group-row-fields">`

  newRowHtml += groupConfig.children.map((child) => renderFieldHtml(child, childPrefix)).join('')

  newRowHtml += `</div>`
  newRowCard.innerHTML = newRowHtml
  groupContainer.insertBefore(newRowCard, addButton)

  const newRemoveButton = newRowCard.querySelector('.remove-group-row-btn')
  if (newRemoveButton) {
    newRemoveButton.addEventListener('click', handleRemoveRow)
  }

  reIndexGroupRows(groupContainer)
  setupRelationSelects()

  recalculateAllCalculatedFields(formElement)
}
const handleRemoveRow = (event) => {
  const removeButton = event.currentTarget
  const itemCardToRemove = removeButton.closest('.repeat-item-card')
  const groupContainer = removeButton.closest('.group-container')
  const formElement = removeButton.closest('form')
  const groupName = groupContainer?.dataset.groupName

  if (!itemCardToRemove || !groupContainer || !groupName || !formElement) {
    return
  }

  itemCardToRemove.remove()

  reIndexGroupRows(groupContainer)
  setupRelationSelects()

  recalculateAllCalculatedFields(formElement)
}
const reIndexGroupRows = (groupContainer) => {
  const itemCards = groupContainer.querySelectorAll('.repeat-item-card')
  itemCards.forEach((itemCard, newIndex) => {
    const elementsToUpdate = itemCard.querySelectorAll('[name], [id], [for]')
    if (elementsToUpdate.length > 0) {
      const firstElement = elementsToUpdate[0]
      const oldRowName = firstElement.name || ''
      const oldIndexMatch = oldRowName.match(/\[(\d+)\]/)
      const oldIndex = oldIndexMatch ? parseInt(oldIndexMatch[1]) : newIndex
      const oldIndexPatternForName = new RegExp(`\\[${oldIndex}\\]`, 'g')

      elementsToUpdate.forEach((el) => {
        if (el.name) {
          el.name = el.name.replace(oldIndexPatternForName, `[${newIndex}]`)
          const newFinalFieldName = el.name
          const newFinalFieldId = `field-${newFinalFieldName.replace(/[\[\]\.]/g, '_')}`
          if (el.id) {
            el.id = newFinalFieldId
          }
          if (el.htmlFor) {
            el.htmlFor = newFinalFieldId
          }
        }
      })
    }
    const removeBtnContainer = itemCard.querySelector('.remove-row-action')
    if (removeBtnContainer) {
      removeBtnContainer.style.visibility = newIndex === 0 ? 'hidden' : 'visible'
      const removeButton = removeBtnContainer.querySelector('.remove-group-row-btn')
      if (removeButton) {
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
  document.querySelectorAll('.remove-group-row-btn').forEach((button) => {
    button.removeEventListener('click', handleRemoveRow)
    button.addEventListener('click', handleRemoveRow)
  })
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

// ==============================================================================
// 5. FUNGSI RELATION DAN AUTOFILL
// ==============================================================================

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
      choices.setChoices([{ value: '', label: 'Mencari...' }], 'value', 'label', true)
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
      selected: item[valueField] == selectEl.value,
    }))

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
    })
  })
}
