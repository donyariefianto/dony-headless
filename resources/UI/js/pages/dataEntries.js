export const renderDataEntries = () => {
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
            <div class="pagination" id="pagination-controls">
                <button id="prev-btn" disabled>Previous</button>
                <span id="page-info"></span>
                <button id="next-btn" disabled>Next</button>
            </div>
          </div>
      </div>
      <div id="form-panel" class="form-panel">
          <div class="panel-header">
              <h3 id="form-panel-title"></h3>
              <button id="close-panel-btn"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="panel-body">
          </div>
          <div id="form-message" class="form-message"></div>
      </div>
      <div id="panel-overlay" class="panel-overlay"></div>
    `
}

export const setupDataEntries = () => {
  const gridContainer = document.getElementById('grid-container')
  const searchInput = document.getElementById('search-input')
  const prevBtn = document.getElementById('prev-btn')
  const nextBtn = document.getElementById('next-btn')
  const pageInfo = document.getElementById('page-info')
  const formPanel = document.getElementById('form-panel')
  const titleformPanel = document.getElementById('form-panel-title')
  const panelOverlay = document.getElementById('panel-overlay')
  const formMessageContainer = document.getElementById('form-message')
  const contentContainer = document.getElementById('content-view-container')

  let currentView = 'grid' // Bisa 'grid' atau 'table'

  const ITEMS_PER_PAGE = 10
  let currentPage = 1
  let totalPages = 1
  let searchTerm = ''

  const fetchData = async () => {
    try {
      gridContainer.innerHTML = `<p>Loading data...</p>`
      const endpoint = `/configuration/formbuilder/list?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${searchTerm}`

      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('userToken'),
        },
      })

      if (!response.ok) {
        throw new Error('Gagal mengambil data dari API.')
      }

      const result = await response.json()
      const data = result.data
      if (data && data.documents) {
        renderGrid(data.documents)
        totalPages = data.totalPages
        currentPage = data.currentPage
      } else {
        renderGrid([])
        totalPages = 1
        currentPage = 1
      }
      updatePaginationControls()
    } catch (error) {
      gridContainer.innerHTML = `<p style="color: red;">${error.message}</p>`
      console.error('Error fetching data:', error)
    }
  }

  const renderGrid = (documents) => {
    if (documents.length === 0) {
      gridContainer.innerHTML = '<p>Tidak ada data ditemukan.</p>'
      return
    }

    const gridHtml = documents
      .map(
        (doc) => `
            <div class="grid-item">
                <h3>${doc.name}</h3>
                <p>${doc.description}</p>
                <div class="grid-actions">
                    <button class="icon-table-btn" data-id="${doc._id}"><i class="fa-solid fa-eye"></i></button>
                    <button class="icon-only-btn" data-id="${doc._id}"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `
      )
      .join('')

    gridContainer.innerHTML = gridHtml

    document.querySelectorAll('.grid-item .icon-only-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id
        renderFormPanel(id)
      })
    })
    document.querySelectorAll('.grid-item .icon-table-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id
        showTableView(id)
      })
    })
  }

  const createTableFromData = (formConfig, data) => {
    // Ambil field dari konfigurasi form untuk header tabel
    const mainFields = formConfig.fields
    const subforms = formConfig.subforms

    if (!data || data.length === 0) {
      return '<p>Tidak ada data yang tersedia untuk formulir ini.</p>'
    }

    let tableHtml = `
        <div class="data-table-container">
            <h3>Main Data</h3>
            <div class="table-container-scroll">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${mainFields.map((field) => `<th>${field.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data
                          .map(
                            (entry) => `
                            <tr>
                                ${mainFields.map((field) => `<td>${entry[field.name] || '-'}</td>`).join('')}
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `

    // Tambahkan tabel untuk setiap subform jika data tersedia
    subforms.forEach((subform) => {
      if (subform.label) {
        let subformTableHtml = `
                <div class="subform-table-container">
                    <h3>Subform: ${subform.label}</h3>
                    <div class="table-container-scroll">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    ${subform.fields.map((field) => `<th>${field.label}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${data
                                  .map(
                                    (entry) => `
                                    <tr>
                                        ${
                                          entry[subform.table_name] &&
                                          entry[subform.table_name].length > 0
                                            ? entry[subform.table_name]
                                                .map(
                                                  (subEntry) => `
                                                <tr>
                                                    ${subform.fields.map((field) => `<td>${subEntry[field.name] || '-'}</td>`).join('')}
                                                </tr>
                                              `
                                                )
                                                .join('')
                                            : `<tr><td colspan="${subform.fields.length}">Tidak ada data subform.</td></tr>`
                                        }
                                    </tr>
                                `
                                  )
                                  .join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `
        tableHtml += subformTableHtml
      }
    })

    return tableHtml
  }

  const showTableView = async (id) => {
    try {
      contentContainer.innerHTML = `<p>Loading tabel...</p>`
      const endpoint = `/configuration/formbuilder/read/${id}`
      const response = await fetch(endpoint, {
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('userToken'),
        },
      })

      if (!response.ok) {
        throw new Error('Gagal mengambil konfigurasi form.')
      }

      const result = await response.json()
      const formConfig = result.data

      if (formConfig) {
        const tableHtml = `
              <div class="table-view">
                  <div class="table-header">
                      <h2>Tabel : ${formConfig.name}</h2>
                      <div class="table-controls">
                          <input type="text" id="data-search-input" placeholder="Cari data...">
                          <button id="back-to-grid-btn"><i class="fa-solid fa-arrow-left"></i> Kembali</button>
                      </div>
                  </div>
                  <div id="data-table-container">
                      <p>Loading data...</p>
                  </div>
                  <div class="pagination" id="data-pagination-controls">
                      <button id="data-prev-btn" disabled>Previous</button>
                      <span id="data-page-info"></span>
                      <button id="data-next-btn" disabled>Next</button>
                  </div>
              </div>
          `
        contentContainer.innerHTML = tableHtml

        // Dapatkan elemen-elemen baru
        const dataTableContainer = document.getElementById('data-table-container')
        const dataSearchInput = document.getElementById('data-search-input')
        const dataPrevBtn = document.getElementById('data-prev-btn')
        const dataNextBtn = document.getElementById('data-next-btn')
        const dataPageInfo = document.getElementById('data-page-info')

        let currentPage = 1
        let totalPages = 1
        let searchTerm = ''
        const ITEMS_PER_PAGE = 10

        // Fungsi untuk mengambil dan merender data tabel
        const fetchAndRenderTableData = async () => {
          dataTableContainer.innerHTML = `<p>Loading data...</p>`
          try {
            const dataEndpoint = `/api/${formConfig.table_name}?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${searchTerm}`
            const dataResponse = await fetch(dataEndpoint, {
              headers: {
                Authorization: 'Bearer ' + localStorage.getItem('userToken'),
              },
            })
            if (!dataResponse.ok) {
              throw new Error('Gagal mengambil data.')
            }
            const resultData = await dataResponse.json()
            const documents = resultData.data.documents

            // Render tabel dengan data yang sudah difilter/dipaginasi
            const renderedTable = createTableFromData(formConfig, documents)
            dataTableContainer.innerHTML = renderedTable

            // Perbarui kontrol paginasi
            totalPages = resultData.data.totalPages
            dataPrevBtn.disabled = currentPage === 1
            dataNextBtn.disabled = currentPage >= totalPages
            dataPageInfo.textContent = `Page ${currentPage} of ${totalPages}`
          } catch (error) {
            dataTableContainer.innerHTML = `<p style="color: red;">${error.message}</p>`
            console.error('Error fetching table data:', error)
          }
        }

        // Event listener untuk pencarian
        dataSearchInput.addEventListener('input', () => {
          searchTerm = dataSearchInput.value
          currentPage = 1 // Kembali ke halaman pertama saat mencari
          fetchAndRenderTableData()
        })

        // Event listener untuk paginasi
        dataPrevBtn.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--
            fetchAndRenderTableData()
          }
        })

        dataNextBtn.addEventListener('click', () => {
          if (currentPage < totalPages) {
            currentPage++
            fetchAndRenderTableData()
          }
        })

        // Event listener untuk tombol kembali
        document.getElementById('back-to-grid-btn').addEventListener('click', () => {
          contentContainer.innerHTML = `
                  <p>Kelola konfigurasi form builder di sini. Gunakan pencarian untuk menemukan entri spesifik.</p>
                  <div class="data-controls">
                      <input type="text" id="search-input" placeholder="Cari...">
                  </div>
                  <div id="grid-container" class="grid-view">
                      <p>Loading data...</p>
                  </div>
                  <div class="pagination" id="pagination-controls">
                      <button id="prev-btn" disabled>Previous</button>
                      <span id="page-info"></span>
                      <button id="next-btn" disabled>Next</button>
                  </div>
              `
          setupDataEntries()
        })

        // Panggil fungsi pertama kali untuk menampilkan data
        fetchAndRenderTableData()
      } else {
        contentContainer.innerHTML = '<p style="color: red;">Konfigurasi form tidak ditemukan.</p>'
      }
    } catch (error) {
      contentContainer.innerHTML = `<p style="color: red;">${error.message}</p>`
      console.error('Error fetching form config:', error)
    }
  }

  const updatePaginationControls = () => {
    prevBtn.disabled = currentPage === 1
    nextBtn.disabled = currentPage >= totalPages
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`
  }

  const handleSearch = () => {
    searchTerm = searchInput.value
    currentPage = 1
    fetchData()
  }

  const renderFormPanel = async (id) => {
    const panelBody = document.querySelector('.panel-body')
    formMessageContainer.innerHTML = ''
    panelBody.innerHTML = '<p>Loading form...</p>'
    formPanel.classList.add('open')
    panelOverlay.classList.add('open')

    try {
      const endpoint = `/configuration/formbuilder/read/${id}`
      const response = await fetch(endpoint, {
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('userToken'),
        },
      })

      if (!response.ok) {
        throw new Error('Gagal mengambil konfigurasi form.')
      }

      const result = await response.json()
      const formConfig = result.data

      if (formConfig) {
        const formHtml = createDynamicForm(formConfig)
        panelBody.innerHTML = formHtml
        setupFormListeners(formConfig)
      } else {
        panelBody.innerHTML = '<p style="color: red;">Konfigurasi form tidak ditemukan.</p>'
      }
    } catch (error) {
      panelBody.innerHTML = `<p style="color: red;">${error.message}</p>`
      console.error('Error fetching form config:', error)
    }
  }

  // File: dataEntries.js

  const initializeAutofill = (container, formConfig) => {
    const selectElements = container.querySelectorAll('.choices-select[data-autofill-fields]')

    console.log(selectElements)
    selectElements.forEach((element) => {
      // Tambahkan event listener untuk event 'change' Choices.js
      element.addEventListener('change', (event) => {
        const selectedValue = event.detail.value
        const autofillFieldsString = element.dataset.autofillFields
        const table_target = element.dataset.tabletarget
        const uniquerowid = element.dataset.uniquerowid

        const autofillMappings = autofillFieldsString
          .split(',')
          .map((mapping) => {
            const parts = mapping.split(':')
            return { target: parts[0].trim(), source: parts[1].trim() }
          })
          .filter(Boolean)

        // 1. Logika untuk membersihkan field target jika tidak ada nilai yang dipilih
        if (!selectedValue) {
          autofillMappings.forEach((mapping) => {
            let targetSelector
            if (table_target && uniquerowid) {
              targetSelector = `[name="${table_target}[]_${mapping.target}_${uniquerowid}"]`
            } else {
              targetSelector = `[name="${mapping.target}"]`
            }
            const targetElement = document.querySelector(targetSelector)
            if (targetElement) {
              targetElement.value = ''
            }
          })
          updateAllCalculatedFields(formConfig)
          return
        }

        // 2. --- BAGIAN KRITIS: AMBIL DATA LANGSUNG DARI MAP LOKAL ---

        // Dapatkan seluruh objek data yang tersimpan di Map
        const fullItemData = element.autofillDataMap.get(selectedValue)

        if (!fullItemData) {
          console.warn(
            `Data lengkap untuk nilai '${selectedValue}' tidak ditemukan di cache lokal.`
          )
          return
        }

        // Isi field-field yang ditargetkan dengan data dari Map lokal
        autofillMappings.forEach((mapping) => {
          let targetSelector

          if (table_target && uniquerowid) {
            // Subform: [name="table_name[]_field_name_row_id"]
            targetSelector = `[name="${table_target}[]_${mapping.target}_${uniquerowid}"]`
          } else {
            // Main Form: [name="field_name"]
            targetSelector = `[name="${mapping.target}"]`
          }

          const targetElement = document.querySelector(targetSelector)

          // mapping.source adalah key di objek data (misal: 'price', 'stock')
          if (targetElement && fullItemData[mapping.source] !== undefined) {
            targetElement.value = fullItemData[mapping.source]
          } else {
            console.warn(
              `Field form '${mapping.target}' atau data key API '${mapping.source}' tidak ditemukan.`
            )
          }
        })

        updateAllCalculatedFields(formConfig)

        // 3. --- Panggilan fetch yang lama Dihapus ---
      })
    })
  }

  const initializeChoicesJS = (container) => {
    const selectElements = container.querySelectorAll('.choices-select')
    selectElements.forEach(async (element) => {
      let currentPage = 1
      let isLoading = false
      let hasMore = true
      let currentSearchTerm = ''
      if (element.classList.contains('choices-select--initialized')) {
        // console.log('Choices.js sudah diinisialisasi pada elemen ini. Melewati.')
        return // Skip ke elemen berikutnya
      }
      element.classList.add('choices-select--initialized')
      const choices = new Choices(element, {
        removeItemButton: true,
        searchEnabled: true,
        searchChoices: false,
        noResultsText: 'Tidak ada hasil yang ditemukan', // Pesan jika tidak ada hasil pencarian
        noChoicesText: 'Pilihan tidak di temukan', // Pesan ketika tidak ada pilihan sama sekali
        removeItems: true,
        removeItemButtonAlignLeft: true,
        duplicateItemsAllowed: false,
        searchFields: ['label', 'value'],
        loadingText: 'Loading...',
        itemSelectText: 'Press to select',
        uniqueItemText: 'Only unique values can be added',
        customAddItemText: 'Only values matching specific conditions can be added',
        classNames: {
          containerOuter: 'choices',
          containerInner: 'choices__inner',
          input: 'choices__input',
          inputCloned: 'choices__input--cloned',
          list: 'choices__list',
          listItems: 'choices__list--multiple',
          listSingle: 'choices__list--single',
          listDropdown: 'choices__list--dropdown',
          item: 'choices__item',
          itemSelectable: 'choices__item--selectable',
          itemDisabled: 'choices__item--disabled',
          itemOption: 'choices__item--choice',
          group: 'choices__group',
          groupHeading: 'choices__heading',
          button: 'choices__button',
          activeState: 'is-active',
          focusState: 'is-focused',
          openState: 'is-open',
          disabledState: 'is-disabled',
          highlightedState: 'is-highlighted',
          hiddenState: 'is-hidden',
          flippedState: 'is-flipped',
          selectedState: 'is-highlighted',
        },
      })

      const fetchData = async (page, searchTerm = '', endpoint, value, label) => {
        if (isLoading) return
        isLoading = true
        try {
          const url = new URL(`/api/${endpoint}`, window.location.origin)
          url.searchParams.append('page', page)
          url.searchParams.append('search', searchTerm)
          url.searchParams.append('limit', 10)

          const response = await fetch(url)

          if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`)
          }

          const result = await response.json()
          const options = result.data.documents.map((item) => {
            return {
              value: item[value],
              label: item[label],
            }
          })
          const replace = page === 1
          choices.setChoices(options, 'value', 'label', replace)

          hasMore = options.length > 0
          currentPage++
        } catch (error) {
          console.error(`Gagal memuat pilihan dari:`, error)

          // Tampilkan pesan error di Choices.js
          choices.setChoices([], 'value', 'label', true) // Hapus semua pilihan yang ada
          choices.config.noResultsText = 'Gagal memuat data. Silakan coba lagi.'
          choices.showDropdown() // Tampilkan dropdown untuk melihat pesan error
        } finally {
          isLoading = false
        }
      }
      // Muat data halaman pertama
      fetchData(
        currentPage,
        currentSearchTerm,
        element.dataset.name,
        element.getAttribute('form-value'),
        element.getAttribute('form-label')
      )
      element.addEventListener('search', (event) => {
        currentSearchTerm = event.detail.value
        currentPage = 1
        hasMore = true
        fetchData(
          currentPage,
          currentSearchTerm,
          element.dataset.name,
          element.getAttribute('form-value'),
          element.getAttribute('form-label')
        )
      })

      const dropdown = document.querySelector('.choices__list--dropdown')
      dropdown.addEventListener('scroll', () => {
        if (hasMore && dropdown.scrollTop + dropdown.clientHeight >= dropdown.scrollHeight - 50) {
          fetchData(
            currentPage,
            currentSearchTerm,
            endpoint,
            element.name,
            element.getAttribute('form-value'),
            element.getAttribute('form-label')
          )
        }
      })
    })
  }

  /**
   * Helper function to generate HTML for a single form field.
   * @param {object} fieldConfig - Configuration object for the field.
   * @returns {string} - The HTML string for the field.
   */
  const createFieldHtml = (fieldConfig) => {
    const { id, label, name, type, required, defaultValue, options } = fieldConfig
    const isRequired = required ? 'required' : ''
    let fieldHtml = ''

    // Tentukan class lebar kolom. Asumsi width seperti "1/2", "1/1", dsb.
    // fieldConfig.width harus selalu ada, jika tidak ada, gunakan default 1/1
    const widthClass = fieldConfig.width ? `col-${fieldConfig.width.replace('/', '-')}` : 'col-1-1'

    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      case 'date':
      case 'file':
        fieldHtml = `
                <div class="form-field">
                    <label for="${id}">${label} ${required ? '*' : ''}</label>
                    <input type="${type}" id="${id}" name="${name}" value="${defaultValue || ''}" ${isRequired}>
                </div>
            `
        break
      case 'textarea':
        fieldHtml = `
                <div class="form-field">
                    <label for="${id}">${label} ${required ? '*' : ''}</label>
                    <textarea id="${id}" name="${name}" ${isRequired}>${defaultValue || ''}</textarea>
                </div>
            `
        break
      case 'select':
        const selectOptions = options
          .map((opt) => {
            // Asumsi options adalah array string atau array object {value, label}
            const optValue = typeof opt === 'object' ? opt.value : opt
            const optLabel = typeof opt === 'object' ? opt.label : opt
            return `<option value="${optValue}" ${defaultValue === optValue ? 'selected' : ''}>${optLabel}</option>`
          })
          .join('')
        fieldHtml = `
                <div class="form-field">
                    <label for="${id}">${label} ${required ? '*' : ''}</label>
                    <select id="${id}" name="${name}" ${isRequired}>
                        ${selectOptions}
                    </select>
                </div>
            `
        break
      case 'radio':
        const radioOptions = options
          .map((opt) => {
            // Asumsi options adalah array string atau array object {value, label}
            const optValue = typeof opt === 'object' ? opt.value : opt
            const optLabel = typeof opt === 'object' ? opt.label : opt
            return `
                            <div class="radio-option">
                                <input type="radio" id="${id}_${optValue}" name="${name}" value="${optValue}" ${defaultValue === optValue ? 'checked' : ''} ${isRequired}>
                                <label for="${id}_${optValue}">${optLabel}</label>
                            </div>
                        `
          })
          .join('')
        fieldHtml = `
                <div class="form-field">
                    <label>${label} ${required ? '*' : ''}</label>
                    <div class="radio-group">${radioOptions}</div>
                </div>
            `
        break
      case 'checkbox':
      case 'switch':
        fieldHtml = `
                <div class="form-field form-field-inline">
                    <input type="checkbox" id="${id}" name="${name}" value="1" ${defaultValue ? 'checked' : ''} ${isRequired}>
                    <label for="${id}">${label} ${required ? '*' : ''}</label>
                </div>
            `
        break
      case 'group':
        const groupFieldsHtml = fieldConfig.children
          .map((childField) => createFieldHtml(childField))
          .join('')
        fieldHtml = `
                <fieldset class="form-group">
                    <legend>${label}</legend>
                    <div class="dynamic-form-container">${groupFieldsHtml}</div>
                </fieldset>
            `
        break

      // --- IMPLEMENTASI FIELD RELATION ---
      case 'relation':
        const relationConfig = fieldConfig.relation || {}
        const { targetTable, labelField, valueField, allowSearch } = relationConfig

        // Asumsi defaultValue untuk relation adalah objek {value: string, label: string}
        const defaultOption =
          defaultValue &&
          typeof defaultValue === 'object' &&
          defaultValue.value &&
          defaultValue.label
            ? `<option value="${defaultValue.value}" selected>${defaultValue.label}</option>`
            : ''

        fieldHtml = `
                <div class="form-field">
                    <label for="${id}">${label} ${required ? '*' : ''}</label>
                    <select 
                        class="choices-select" 
                        id="${id}" 
                        name="${name}" 
                        data-name="${targetTable || ''}" 
                        form-value="${valueField || ''}" 
                        form-label="${labelField || ''}" 
                        data-allow-search="${allowSearch ? 'true' : 'false'}"
                        ${isRequired}>
                        ${defaultOption}
                    </select>
                </div>
            `
        break

      // --- IMPLEMENTASI FIELD AUTOFILL ---
      case 'autofill':
        fieldHtml = `
                <div class="form-field">
                    <label for="${id}">${label} ${required ? '*' : ''}</label>
                    <input 
                        type="text" 
                        id="${id}" 
                        name="${name}" 
                        value="${defaultValue || ''}" 
                        class="autofill-target" 
                        readonly 
                        ${isRequired}>
                    <p class="special-field-info">Nilai ini akan diisi otomatis berdasarkan pilihan field lain.</p>
                </div>
            `
        break

      case 'calculated':
        fieldHtml = `
                <div class="form-field">
                    <label for="${id}">${label} (calculated) ${required ? '*' : ''}</label>
                    <input type="text" id="${id}" name="${name}" value="${defaultValue || ''}" class="calculated-target" readonly ${isRequired}>
                    <p class="special-field-info">Nilai ini dihitung otomatis.</p>
                </div>
            `
        break
      default:
        fieldHtml = `<p>Unsupported field type: ${type}</p>`
        break
    }

    return `<div class="field-container ${widthClass}">${fieldHtml}</div>`
  }

  /**
   * Main function to create a dynamic form based on a configuration object.
   * @param {object} config - The form configuration JSON.
   * @returns {string} - The full HTML string for the form.
   */
  const createDynamicForm = (config) => {
    let formHtml = `<form id="dynamic-form" class="dynamic-form-container">`

    // Set form title
    const titleformPanel = document.getElementById('titleformPanel')
    if (titleformPanel) {
      titleformPanel.textContent = config.name || 'Form'
    }

    // Map through the main field groups
    const formFieldsHtml = config.fields
      .map((groupConfig) => {
        if (groupConfig.isRepeatable) {
          // Logic for repeatable groups
          const repeatableFields = groupConfig.children
            .map((field) => createFieldHtml(field))
            .join('')
          return `
                <div class="repeatable-group" data-group-name="${groupConfig.name}">
                    <h4>${groupConfig.label}</h4>
                    <button type="button" class="add-group-btn">Add More</button>
                    <div class="repeatable-content">
                        ${repeatableFields}
                    </div>
                </div>
            `
        } else {
          // Logic for non-repeatable groups (or single fields)
          return createFieldHtml(groupConfig)
        }
      })
      .join('')

    formHtml += formFieldsHtml
    formHtml += `<button type="submit" class="submit-btn">Save</button>`
    formHtml += `</form>`

    return formHtml
  }

  const activateRepeatableGroups = () => {
    document.querySelectorAll('.add-group-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        const repeatableGroup = e.target.closest('.repeatable-group')
        const repeatableContent = repeatableGroup.querySelector(':scope > .repeatable-content')
        const groupName = repeatableGroup.dataset.groupName

        const existingGroupsCount = repeatableGroup.querySelectorAll(
          ':scope > .repeatable-content'
        ).length
        const newGroupClone = repeatableContent.cloneNode(true)
        updateNamesAndResetValues(newGroupClone, groupName, existingGroupsCount)
        let removeButton = newGroupClone.querySelector('.remove-group-btn')
        if (!removeButton) {
          removeButton = document.createElement('button')
          removeButton.type = 'button'
          removeButton.className = 'remove-group-btn'
          removeButton.innerHTML = '<i class="fa-solid fa-minus"></i> Hapus Grup'
          newGroupClone.appendChild(removeButton)
        }
        removeButton.addEventListener('click', () => {
          newGroupClone.remove()
        })
        repeatableGroup.insertBefore(newGroupClone, repeatableGroup.querySelector('.button-group'))
        initializeChoicesJS(newGroupClone)
        initializeAutofill(newGroupClone)
      })
    })
    document.querySelectorAll('.remove-group-btn').forEach((removeButton) => {
      removeButton.addEventListener('click', () => {
        removeButton.closest('.repeatable-content').remove()
      })
    })
  }

  const updateNamesAndResetValues = (element, groupName, instanceIndex) => {
    element.querySelectorAll('[name]').forEach((input) => {
      let oldName = input.getAttribute('name')
      const nameRegex = new RegExp(`(${groupName})\\[\\d+\\]`)
      let newName = oldName.replace(nameRegex, `$1[${instanceIndex}]`)
      const mainIndexString = `${groupName}[${instanceIndex}]`
      const mainIndexPosition = newName.indexOf(mainIndexString) + mainIndexString.length

      if (mainIndexPosition !== -1) {
        const prefix = newName.substring(0, mainIndexPosition)
        let suffix = newName.substring(mainIndexPosition)
        suffix = suffix.replace(/\[\d+\]/g, '[0]')
        newName = prefix + suffix
      }
      input.setAttribute('name', newName)
      if (input.type !== 'file' && input.type !== 'checkbox' && input.type !== 'radio') {
        input.value = ''
      } else if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = false
      }
    })
  }

  const createSubformRow = (fields, tableName) => {
    const uniqueRowId = Date.now()
    fields.uniqueRowId = uniqueRowId
    let rowHtml = `<div class="subform-row" data-rowid="${uniqueRowId}">`
    fields.forEach((subField) => {
      let subFieldHtml = `<div class="subform-field-group">`
      subFieldHtml += `<label>${subField.label}</label>`
      switch (subField.type) {
        case 'select':
          if (subField.options && subField.options.mode === 'relation') {
            const autofillFields = subField.options.relation.autofill_fields
              ? subField.options.relation.autofill_fields
              : ''
            subFieldHtml += `<select id="${subField.name}" data-uniquerowid="${uniqueRowId}" data-tabletarget="${tableName}" data-name="${subField.name}" data-autofill-fields="${autofillFields}" form-value="${subField.options.relation.value_column}" form-label="${subField.options.relation.label_column}" class="choices-select" name="${tableName}[]_${subField.name}_${uniqueRowId}" ${subField.required ? 'required' : ''}></select>`
          } else {
            subFieldHtml += `<select name="${tableName}[]_${subField.name}_${uniqueRowId}"></select>`
          }
          break
        case 'number':
          subFieldHtml += `<input type="number" name="${tableName}[]_${subField.name}_${uniqueRowId}">`
          break
        case 'calculated':
          subFieldHtml += `<input type="text" name="${tableName}[]_${subField.name}_${uniqueRowId}" value="0.00" data-formula="${subField.options?.formula || ''}" readonly>`
          break
        default:
          subFieldHtml += `<input type="text" name="${tableName}[]_${subField.name}_${uniqueRowId}">`
          break
      }
      subFieldHtml += `</div>`
      rowHtml += subFieldHtml
    })
    rowHtml += `<button type="button" class="remove-row-btn"><i class="fa-solid fa-minus"></i></button>`
    rowHtml += `</div>`
    return rowHtml
  }

  const setupFormListeners = (formConfig) => {
    const form = document.getElementById('dynamic-form')

    // Menambahkan listener untuk tombol Add More
    activateRepeatableGroups()

    document.querySelectorAll('.add-row-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        const subformIndex = e.currentTarget.dataset.subformIndex
        const subformConfig = formConfig.subforms[subformIndex]
        const newRowHtml = createSubformRow(subformConfig.fields, subformConfig.table_name)
        const subformRowsContainer = e.currentTarget
          .closest('.subform-container')
          .querySelector('.subform-rows')
        subformRowsContainer.insertAdjacentHTML('beforeend', newRowHtml)
        const newRow = subformRowsContainer.lastElementChild
        newRow.querySelector('.remove-row-btn').addEventListener('click', (e) => {
          e.currentTarget.closest('.subform-row').remove()
          updateAllCalculatedFields(formConfig)
        })
        initializeChoicesJS(form)
        initializeAutofill(form, formConfig)
        // updateAllCalculatedFields(formConfig);
      })
    })

    document.querySelectorAll('.remove-row-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.currentTarget.closest('.subform-row').remove()
        initializeChoicesJS(form)
        initializeAutofill(form, formConfig)
        // updateAllCalculatedFields(formConfig);
      })
    })

    form.addEventListener('input', (e) => {
      updateAllCalculatedFields(formConfig)
    })

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      formMessageContainer.innerHTML = ''

      if (!validateForm(formConfig, form)) {
        formMessageContainer.innerHTML =
          '<p style="color: red;">Ada kesalahan dalam pengisian form.</p>'
        return
      }

      const formData = collectFormData(formConfig, form)
      await saveDynamicFormConfig(formConfig, formData)
      // try {
      //   const response = await fetch(`http://localhost:3333/configuration/formbuilder/submit`, {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'Authorization': 'Bearer ' + localStorage.getItem('userToken'),
      //     },
      //     body: JSON.stringify(formData),
      //   })

      //   if (!response.ok) {
      //     const errorData = await response.json()
      //     throw new Error(errorData.message_en || 'Gagal mengirim data.')
      //   }

      //   formMessageContainer.innerHTML = '<p style="color: green;">Data berhasil dikirim!</p>'
      //   setTimeout(() => {
      //     formPanel.classList.remove('open')
      //     panelOverlay.classList.remove('open')
      //     fetchData()
      //   }, 2000)
      // } catch (error) {
      //   formMessageContainer.innerHTML = `<p style="color: red;">${error.message}</p>`
      //   console.error('Submit error:', error)
      // }
    })
    initializeChoicesJS(form)
    initializeAutofill(form, formConfig)
    // updateAllCalculatedFields(formConfig);
  }

  const saveDynamicFormConfig = async (formConfig, formData) => {
    let mainTable = formConfig.table_name
    let subTable = formConfig.subforms.filter((x) => x.table_name !== null).map((x) => x.table_name)
    console.log(mainTable)
    console.log(subTable)
  }

  const validateForm = (formConfig, form) => {
    let isValid = true
    const allErrorMessages = document.querySelectorAll('.error-message')
    allErrorMessages.forEach((el) => (el.textContent = ''))

    formConfig.fields.forEach((field) => {
      if (field.required) {
        const input = form.querySelector(`#${field.name}`)
        if (!input.value) {
          isValid = false
          document.getElementById(`error-${field.name}`).textContent = `${field.label} wajib diisi.`
        }
      }
    })

    return isValid
  }

  const collectFormData = (formConfig, form) => {
    const data = {}

    // Mengambil data dari main fields
    formConfig.fields.forEach((field) => {
      if (field.isRepeatable) {
        // Proses repeatable group
        data[field.name] = []
        const repeatableGroups = form.querySelectorAll(
          `.repeatable-group[data-group-name="${field.name}"]`
        )
        repeatableGroups.forEach((group) => {
          const groupData = {}
          group.querySelectorAll('input, select, textarea').forEach((input) => {
            // Pola name: groupName[instanceIndex][fieldName]
            const fieldNameMatch = input.name.match(/\[(\w+)\]$/)
            if (fieldNameMatch) {
              const fieldName = fieldNameMatch[1]
              groupData[fieldName] = input.value
            }
          })
          data[field.name].push(groupData)
        })
      } else {
        // Proses non-repeatable fields
        const input = form.querySelector(`#${field.name}`)
        if (input) {
          data[field.name] = input.value
        }
      }
    })

    // Mengambil data dari subforms (jika ada)
    formConfig.subforms.forEach((subform) => {
      if (subform.label) {
        data[subform.table_name] = []
        const subformRows = form.querySelectorAll(
          `.subform-container[data-table-name="${subform.table_name}"] .subform-row`
        )
        subformRows.forEach((row) => {
          const rowData = {}
          subform.fields.forEach((subField) => {
            const el = row.querySelector(
              `[name="${subform.table_name}[]_${subField.name}_${row.dataset.rowid}"]`
            )
            if (el) {
              rowData[subField.name] = el.value
            }
          })
          data[subform.table_name].push(rowData)
        })
      }
    })

    return data
  }

  const updateAllCalculatedFields = (formConfig) => {
    return
    // Step 1: Hitung total per baris di dalam subform
    formConfig.subforms.forEach((subform) => {
      const subformRows = document.querySelectorAll(
        `.subform-container[data-table-name="${subform.table_name}"] .subform-row`
      )
      subformRows.forEach((row) => {
        const rowId = row.dataset.rowid
        subform.fields.forEach((subField) => {
          if (subField.type === 'calculated') {
            const formula = subField.options?.formula
            if (formula) {
              const result = calculateFormulaInRow(formula, row, subform.table_name, rowId)
              row.querySelector(
                `[name="${subform.table_name}[]_${subField.name}_${rowId}"]`
              ).value = result
            }
          }
        })
      })
    })

    // Step 2: Hitung total keseluruhan pada main field
    formConfig.fields.forEach((field) => {
      if (field.type === 'calculated') {
        const formula = field.options?.formula
        if (formula) {
          const result = calculateMainFormula(formula)
          document.getElementById(field.name).value = result
        }
      }
    })
  }

  const calculateMainFormula = (formula) => {
    const match = formula.match(/^(SUM|AVG|MIN|MAX)\((.*?)\)/)
    if (match) {
      let form_element = document.getElementById('dynamic-form')
      const operator = match[1]
      const [tableName, fieldName] = match[2].split('.')
      const values = []
      document.querySelectorAll(`[name*='${tableName}[]_${fieldName}']`).forEach((input) => {
        const value = parseFloat(input.value) || 0
        values.push(value)
      })

      if (values.length === 0) return '0.00'

      switch (operator) {
        case 'SUM':
          return values.reduce((acc, val) => acc + val, 0).toFixed(2)
        case 'AVG':
          const sum = values.reduce((acc, val) => acc + val, 0)
          return (sum / values.length).toFixed(2)
        case 'MIN':
          return Math.min(...values).toFixed(2)
        case 'MAX':
          return Math.max(...values).toFixed(2)
        default:
          return '0.00'
      }
    }
    return '0.00'
  }

  const calculateFormulaInRow = (formula, row, tableName, id) => {
    const parts = formula.split(/([+\-*/])/).map((p) => p.trim())
    let expression = ''
    for (const part of parts) {
      if (['+', '-', '*', '/'].includes(part)) {
        expression += part
      } else {
        const value = parseFloat(
          row.querySelector(`[name="${tableName}[]_${part}_${id}"]`)?.value || 0
        )
        expression += value
      }
    }

    try {
      // Menggunakan eval() untuk mengevaluasi ekspresi matematika.
      // PENTING: Penggunaan eval() bisa berisiko, pastikan formula dari database aman.
      const result = eval(expression)
      return result.toFixed(2)
    } catch (e) {
      console.error('Error evaluating formula:', formula, e)
      return '0.00'
    }
  }

  searchInput.addEventListener('input', handleSearch)

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--
      fetchData()
    }
  })

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++
      fetchData()
    }
  })

  document.getElementById('close-panel-btn').addEventListener('click', () => {
    formPanel.classList.remove('open')
    panelOverlay.classList.remove('open')
  })

  panelOverlay.addEventListener('click', () => {
    formPanel.classList.remove('open')
    panelOverlay.classList.remove('open')
  })

  fetchData()
}
