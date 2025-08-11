export const renderDataEntries = () => {
  return `
        <div class="page-container">
            <h1>Data Entries</h1>
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

  const ITEMS_PER_PAGE = 10
  let currentPage = 1
  let totalPages = 1
  let searchTerm = ''

  const fetchData = async () => {
    try {
      gridContainer.innerHTML = `<p>Loading data...</p>`
      const endpoint = `http://localhost:3333/configuration/formbuilder/list?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${searchTerm}`

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
      const endpoint = `http://localhost:3333/configuration/formbuilder/read/${id}`
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

  const initializeAutofill = (container, formConfig) => {
    // Dapatkan semua elemen select yang memiliki atribut data-autofill-fields
    const selectElements = container.querySelectorAll('.choices-select[data-autofill-fields]')

    selectElements.forEach((element) => {
      // Tambahkan event listener untuk event 'change' Choices.js
      element.addEventListener('change', (event) => {
        const selectedValue = event.detail.value
        const autofillFieldsString = element.dataset.autofillFields

        // Jika tidak ada nilai yang dipilih atau string autofill kosong, keluar
        if (!selectedValue || !autofillFieldsString) return
        const endpoint = element.dataset.name,
          table_target = element.dataset.tabletarget,
          uniquerowid = element.dataset.uniquerowid
        if (!endpoint) {
          console.error('Endpoint tidak ditemukan untuk autofill.')
          return
        }

        // Uraikan string "api_key:form_field,api_key:form_field"
        const autofillMappings = autofillFieldsString
          .split(',')
          .map((mapping) => {
            const parts = mapping.split(':')
            if (parts.length !== 2) return null
            return { target: parts[0].trim(), source: parts[1].trim() }
          })
          .filter(Boolean)

        if (autofillMappings.length === 0) return

        // Ambil data detail dari API
        fetch(`/api/${endpoint}/${selectedValue}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Server returned status: ${response.status}`)
            }
            return response.json()
          })
          .then((data) => {
            // Isi field-field yang ditargetkan dengan data dari API
            autofillMappings.forEach((mapping) => {
              const targetElement = document.querySelector(
                `[name="${table_target}[]_${mapping.target}_${uniquerowid}"]`
              )
              if (targetElement && data.data[mapping.source] !== undefined) {
                targetElement.value = data.data[mapping.source]
              } else {
                console.warn(
                  `Field form '${mapping.target}' atau data API '${mapping.source}' tidak ditemukan.`
                )
              }
            })
            updateAllCalculatedFields(formConfig)
          })
          .catch((error) => {
            console.error('Gagal mengambil data autofill:', error)
            // Tambahkan penanganan error di sini jika perlu
          })
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
        console.log('Choices.js sudah diinisialisasi pada elemen ini. Melewati.')
        return // Skip ke elemen berikutnya
      }
      element.classList.add('choices-select--initialized')
      const choices = new Choices(element, {
        searchEnabled: true,
        searchChoices: false,
        itemSelectText: 'Pilih',
        noResultsText: 'Tidak ada hasil yang ditemukan', // Pesan jika tidak ada hasil pencarian
        noChoicesText: 'Pilihan tidak di temukan', // Pesan ketika tidak ada pilihan sama sekali
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
          element.name,
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

  const createDynamicForm = (config) => {
    let formHtml = `<form id="dynamic-form" class="dynamic-form-container">`
    titleformPanel.textContent = config.name || 'Form'
    config.fields.forEach(async (field) => {
      let fieldHtml = `<div class="form-group">`
      fieldHtml += `<label for="${field.name}">${field.label}</label>`
      switch (field.type) {
        case 'select':
          if (field.options && field.options.mode === 'relation') {
            const autofillFields = field.options.relation.autofill_fields
              ? field.options.relation.autofill_fields
              : ''
            const table_target = config.table_name ? config.table_name : ''
            fieldHtml += `
                            <select id="${field.name}" data-tabletarget="${table_target}" data-name="${field.name}" data-autofill-fields="${autofillFields}" form-value="${field.options.relation.value_column}" form-label="${field.options.relation.label_column}" class="choices-select" name="${field.name}" ${field.required ? 'required' : ''}>
                            </select>`
          } else {
            fieldHtml += `
                            <select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
                                <option value="">Pilih...</option>
                            </select>`
          }
          break
        case 'number':
          fieldHtml += `<input type="number" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>`
          break
        case 'calculated':
          fieldHtml += `<input type="text" id="${field.name}" name="${field.name}" value="0.00" data-formula="${field.options?.formula || ''}" readonly>`
          break
        default:
          fieldHtml += `<input type="text" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>`
          break
      }
      fieldHtml += `<div class="error-message" id="error-${field.name}"></div>`
      fieldHtml += `</div>`
      formHtml += fieldHtml
    })

    config.subforms.forEach((subform, index) => {
      if (subform.label) {
        let subformHtml = `<div class="subform-container" data-subform-index="${index}" data-table-name="${subform.table_name}">`
        subformHtml += `<h4>${subform.label} <button type="button" class="add-row-btn" data-subform-index="${index}"><i class="fa-solid fa-plus"></i></button></h4>`
        subformHtml += `<div class="subform-rows">`
        subformHtml += createSubformRow(subform.fields, subform.table_name)
        subformHtml += `</div>`
        subformHtml += `</div>`
        formHtml += subformHtml
      }
    })

    formHtml += `<button type="submit" class="submit-btn">${config.submit_label}</button>`
    formHtml += `</form>`

    return formHtml
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
            subFieldHtml += `
                            <select id="${subField.name}" data-uniquerowid="${uniqueRowId}" data-tabletarget="${tableName}" data-name="${subField.name}" data-autofill-fields="${autofillFields}" form-value="${subField.options.relation.value_column}" form-label="${subField.options.relation.label_column}" class="choices-select" name="${tableName}[]_${subField.name}_${uniqueRowId}" ${subField.required ? 'required' : ''}>
                            </select>`
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
      console.log('Submitting data:', formData)

      try {
        const response = await fetch(`http://localhost:3333/configuration/formbuilder/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('userToken'),
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message_en || 'Gagal mengirim data.')
        }

        formMessageContainer.innerHTML = '<p style="color: green;">Data berhasil dikirim!</p>'
        setTimeout(() => {
          formPanel.classList.remove('open')
          panelOverlay.classList.remove('open')
          fetchData()
        }, 2000)
      } catch (error) {
        formMessageContainer.innerHTML = `<p style="color: red;">${error.message}</p>`
        console.error('Submit error:', error)
      }
    })
    initializeChoicesJS(form)
    initializeAutofill(form, formConfig)
    // updateAllCalculatedFields(formConfig);
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

    formConfig.fields.forEach((field) => {
      data[field.name] = form.querySelector(`#${field.name}`).value
    })

    formConfig.subforms.forEach((subform) => {
      if (subform.label) {
        data[subform.table_name] = []
        const subformRows = form.querySelectorAll(
          `.subform-container[data-table-name="${subform.table_name}"] .subform-row`
        )
        subformRows.forEach((row) => {
          const rowData = {}
          subform.fields.forEach((subField) => {
            console.log(subField)
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
