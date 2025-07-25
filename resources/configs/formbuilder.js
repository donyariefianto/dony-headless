// const listContainer = document.getElementById("form-list");
// const paginationContainer = document.getElementById("pagination");
// const searchInput = document.getElementById("search");
// let currentPage = 1;
const perPageFormbuilder = 4
let currentPageFormbuilder = 1
let numb_item = 1
let filteredData = []
let relationData = []

const searchInputFormBuilder = document.getElementById('search-input')

const grid = document.getElementById('formbuilder-grid')
const paginationInfo = document.getElementById('pagination-info')
const prevBtn = document.getElementById('prev-page')
const nextBtn = document.getElementById('next-page')

const listView = document.getElementById('formbuilder-list-view')
const detailView = document.getElementById('formbuilder-detail-view')

const dashboardForm = document.getElementById('data-dashboard-form')
const dataDashboardIdInput = document.getElementById('data-dashboard-id')
const dataDashboardFieldsContainer = document.getElementById('data-item-fields-container')
const overlay = document.getElementById('overlay')

document.addEventListener('DOMContentLoaded', async () => {
  const collectionSelect = document.getElementById('formbuilder-collection-select')
  const dom = {
    saveFormBuilderBtn: document.getElementById('data-formbuilder-form'),
    dataDashboardIdInput: document.getElementById('data-dashboard-id'),
    rightFormSidebar: document.getElementById('right-form-sidebar'),
  }
  let choicesInstance = null
  if (collectionSelect) {
    let currentPage = 1
    let hasMore = true
    let searchTerm = ''

    // Inisialisasi Choices.js
    choicesInstance = new Choices(collectionSelect, {
      placeholder: true,
      placeholderValue: 'Pilih koleksi...',
      searchEnabled: true,
      searchPlaceholderValue: 'Cari koleksi...',
      shouldSort: false,
      noResultsText: 'Tidak ditemukan',
    })

    const loadCollections = async (search = '', page = 1, append = false) => {
      try {
        const res = await fetch(
          `/configuration/formbuilder/list?page=${page}&search=${encodeURIComponent(search)}`
        )
        const result = await res.json()
        const options = result.data.documents.map((item) => ({
          value: item.name,
          label: item.displayName,
        }))

        if (append) {
          choicesInstance.setChoices(options, 'value', 'label', false)
        } else {
          choicesInstance.clearChoices()
          choicesInstance.setChoices(options, 'value', 'label', true)
        }
        currentPage = page
        searchTerm = search
        hasMore = result.data.currentPage < result.data.totalPages
      } catch (err) {
        console.error('Gagal ambil koleksi:', err)
      }
    }

    // Inisialisasi awal
    await loadCollections()

    // Tambahkan pencarian manual (Choices tidak support AJAX penuh)
    collectionSelect.addEventListener('search', (e) => {
      const searchTerm = e.detail.value
      loadCollections(searchTerm, 1)
    })
    // Tangkap scroll ke bawah → load more
    document.querySelector('.choices__list--dropdown').addEventListener('scroll', (e) => {
      const el = e.target
      if (hasMore && el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
        loadCollections(searchTerm, currentPage + 1, true)
      }
    })
    // Saat koleksi dipilih → ambil field dari API
    collectionSelect.addEventListener('change', async () => {
      const selected = collectionSelect.value
      //   if (!selected) return renderWidgetOptions(optionsContainer, typeSelect.value, {}, [])
      try {
        const res = await fetch(`/configuration/collection/read/${selected}`)
        const detail = await res.json()
        const fields = detail.data?.fields || []

        // renderWidgetOptions(optionsContainer, typeSelect.value, {}, fields)
      } catch (err) {
        console.error('Gagal ambil field:', err)
        // renderWidgetOptions(optionsContainer, typeSelect.value, {}, [])
      }
    })
  }
  dom.saveFormBuilderBtn.addEventListener('submit', async (e) => {
    e.preventDefault()
    let schema = generateSchema()
    console.log(schema)
    overlay.style.display = 'none'
    dom.rightFormSidebar.classList.remove('open')
    dom.saveFormBuilderBtn.classList.remove('active-form')
    dom.saveFormBuilderBtn.reset()
    // dataDashboardFieldsContainer.innerHTML = ''
    // dataDashboardIdInput.value = ''
    const isEditing = !!dom.dataDashboardIdInput.value
  })
  // loadAndRender();

  document.getElementById('back-to-list').addEventListener('click', () => {
    detailView.classList.remove('active-view')
    listView.classList.add('active-view')
  })

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      fetchFormbuilders(currentPage - 1, searchInputFormBuilder.value)
    }
  })

  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      fetchFormbuilders(currentPage + 1, searchInputFormBuilder.value)
    }
  })

  searchInputFormBuilder.addEventListener(
    'input',
    debounce(() => {
      fetchFormbuilders(1, searchInputFormBuilder.value)
    }, 300)
  )
  fetchFormbuilders()
})
async function fetchFormbuilders(page = 1, limit = 4, searchKeyword = '') {
  try {
    const url = new URL('/configuration/formbuilder/list', window.location.origin)
    url.searchParams.set('page', page)
    url.searchParams.set('limit', limit)
    url.searchParams.set('search', searchKeyword)

    const res = await fetch(url.toString())
    const json = await res.json()

    if (!json.status || !json.data) {
      throw new Error(json.message_id || 'Gagal mengambil data')
    }

    const items = json.data.documents ?? []
    totalPages = json.data.totalPages ?? 1
    currentPage = json.data.currentPage ?? 1

    renderGrid(items)

    updatePagination()
  } catch (err) {
    console.error('Gagal memuat data:', err)
    grid.innerHTML = `<div class="info-message">❌ Gagal memuat data: ${err.message}</div>`
  }
}
function renderGrid(items) {
  grid.innerHTML = ''

  if (items.length === 0) {
    grid.innerHTML = `<div class="info-message">Tidak ada form ditemukan.</div>`
    return
  }

  for (const item of items) {
    const card = document.createElement('div')
    card.className = 'collection-card'
    card.innerHTML = `
      <h4>${item.name}</h4>
      <p class="description">Klik untuk melihat detail</p>
    `
    card.addEventListener('click', () => showDetail(item))
    grid.appendChild(card)
  }
  return 'ok'
}
function updatePagination() {
  paginationInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`
  prevBtn.disabled = currentPage === 1
  nextBtn.disabled = currentPage === totalPages
}
function showDetail(item) {
  listView.classList.remove('active-view')
  detailView.classList.add('active-view')

  document.getElementById('form-detail-title').textContent = item.name
  // document.getElementById('form-id').textContent = `${item._id}`
  // document.getElementById('form-description').textContent = item.description ?? '-'
  // document.getElementById('form-fields-count').textContent = item.fields?.length ?? 0
  fetchFormDetail(item._id)
}
async function fetchFormDetail(id) {
  try {
    const res = await fetch(`/configuration/formbuilder/read/${id}`)
    const json = await res.json()

    if (!json.status || !json.data) {
      throw new Error('Form tidak ditemukan')
    }
    const schema = json.data
    renderForm(schema)
  } catch (err) {
    console.log(err)

    console.error('Gagal mengambil detail:', err)
    // document.querySelector('.form-sections-container').innerHTML =
    //   `<p class="text-danger">❌ ${err.message}</p>`
  }
}
function debounce(fn, delay) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn.apply(this, args), delay)
  }
}
function buildFieldWidget(type) {
  const fieldId = `field-${Date.now()}-${Math.floor(Math.random() * 1e3)}`
  const wrapper = document.createElement('div')
  wrapper.className = 'field-item'
  wrapper.dataset.id = fieldId
  wrapper.innerHTML = `
  <div class="sortable-list">
    <div class="field-header">
        <span class="title"><span class="field-name-display">Field Baru</span></span>
        <div class="item-actions">
            <button type="button" class="remove-item-btn" onclick="this.closest('.field-item').remove()"><i class="fas fa-trash"></i></button>
            <button type="button" class="toggle-collapse-btn" onclick="toggleCollapse(this)"><i class="fas fa-chevron-up"></i></button>
        </div>
        </div>
        <div class="collapsible-content">
        <div class="form-group">
            <label>Nama Field</label>
            <input type="text" class="field-name form-control" oninput="updateFieldTitle(this)" />

        </div>
        <div class="form-group">
            <label>Label</label>
            <input type="text" class="field-label form-control" />
        </div>
        <div class="form-group">
            <label>Tipe Field</label>
            <div class="type-options">
            ${['text', 'number', 'date', 'select', 'boolean', 'media', 'enum', 'calculated']
              .map((t, i) => {
                const icons = {
                  text: 'fa-font',
                  number: 'fa-hashtag',
                  date: 'fa-calendar-alt',
                  select: 'fa-list',
                  boolean: 'fa-toggle-on',
                  media: 'fa-image',
                  enum: 'fa-list-ul',
                  calculated: 'fa-equals',
                }
                const labels = {
                  text: 'Teks',
                  number: 'Angka',
                  date: 'Tanggal',
                  select: 'Select',
                  boolean: 'Boolean',
                  media: 'Media',
                  enum: 'Enum',
                  calculated: 'Hitung',
                }
                return `
                <label class="type-option ${i === 0 ? 'selected' : ''}" onclick="selectType(this)">
                <i class="fas ${icons[t]}"></i> ${labels[t]}
                <input type="radio" name="${fieldId}-type" value="${t}" style="display:none;" ${i === 0 ? 'checked' : ''}>
                </label>`
              })
              .join('')}
            </div>
        </div>
        <div class="form-group checkbox-group">
            <input type="checkbox" class="field-required" /> <label>Wajib Diisi</label>
        </div>
        <div class="extra-options"></div>
    </div>
  </div>  
  `
  return wrapper
}
function updateFieldTitle(input) {
  const titleEl = input.closest('.sortable-list').querySelector('.field-name-display')
  titleEl.textContent = input.value.trim() || 'Field Baru'
}
function toggleCalcModeOptions(select) {
  const mode = select.value
  const container = select.closest('.extra-options')
  container.querySelector('.formula-option').style.display = mode === 'formula' ? 'block' : 'none'
  container.querySelector('.aggregate-option').style.display =
    mode === 'aggregate' ? 'block' : 'none'
}
function handleSelectFieldMode(typeContainer) {
  const selectedType = typeContainer.querySelector('input[type=radio]:checked').value
  const extraOptionsContainer = typeContainer
    .closest('.sortable-list')
    .querySelector('.extra-options')
  if (!extraOptionsContainer) return

  if (selectedType === 'select') {
    extraOptionsContainer.innerHTML = `
      <div class="form-group">
        <label>Mode Select</label>
        <select class="select-mode form-control" onchange="toggleSelectModeOptions(this)">
          <option value="static">Static</option>
          <option value="relation">Relasi</option>
        </select>
      </div>
      <div class="form-group">
        <div class="select-mode-options static-options">
          <label>Opsi Static (pisahkan dengan koma)</label>
          <input type="text" class="form-control select-static-values" placeholder="Contoh: A,B,C">
        </div>
      </div>
      <div class="select-mode-options relation-options" style="display:none;">
        <div class="form-group">
          <label>Nama Tabel Relasi</label>
          <input type="text" class="form-control relation-table" placeholder="Contoh: produk">
        </div>
        <div class="form-group">
          <label>Kolom Value</label>
          <input type="text" class="form-control relation-value" placeholder="Contoh: id">
        </div>
        <div class="form-group">
          <label>Kolom Label</label>
          <input type="text" class="form-control relation-label" placeholder="Contoh: nama">
        </div>
        <div class="form-group auto-fill-group mt-2">
          <label>Auto Fill ke Field Lain</label>
          <div class="auto-fill-map"></div>
          <button type="button" class="btn btn-sm btn-outline-secondary mt-1" onclick="addAutoFillItem(this)">+ Tambah Auto Fill</button>
        </div>
      </div>
    `
  } else if (selectedType === 'calculated') {
    extraOptionsContainer.innerHTML = `
      <div class="form-group">
        <label>Jenis Perhitungan</label>
        <select class="form-control calc-mode" onchange="toggleCalcModeOptions(this)">
          <option value="formula">Formula Biasa</option>
          <option value="aggregate">Aggregated</option>
        </select>
      </div>
      <div class="form-group calc-options formula-option">
        <label>Formula</label>
        <input type="text" class="form-control field-formula" placeholder="Contoh: qty * harga">
      </div>
      <div class="calc-options aggregate-option" style="display:none;">
        <div class="form-group">
          <label>Target Subform</label>
          <input type="text" class="form-control aggregate-target" placeholder="Contoh: detail_order">
        </div>
        <div class="form-group">
          <label>Metode Agregasi</label>
          <select class="form-control aggregate-method">
            <option value="sum">Jumlah (Sum)</option>
            <option value="avg">Rata-rata (Average)</option>
            <option value="min">Minimum</option>
            <option value="max">Maksimum</option>
            <option value="count">Jumlah Baris (Count)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Field yang Dijumlahkan</label>
          <input type="text" class="form-control aggregate-field" placeholder="Contoh: total">
        </div>
      </div>
    `
  } else {
    extraOptionsContainer.innerHTML = ''
  }
}
function toggleSelectModeOptions(select) {
  const wrapper = select.closest('.extra-options')
  const mode = select.value
  wrapper.querySelectorAll('.select-mode-options').forEach((div) => {
    div.style.display = 'none'
  })
  const show = wrapper.querySelector(`.${mode}-options`)
  if (show) show.style.display = 'block'
}
function addMainField() {
  document.getElementById('main-fields').appendChild(buildFieldWidget('main'))
}
function addSubform() {
  const container = document.getElementById('subform-panels')
  const id = `subform-${Date.now()}-${Math.floor(Math.random() * 1e3)}`
  const wrapper = document.createElement('div')
  wrapper.className = 'field-item'
  wrapper.dataset.id = id
  wrapper.innerHTML = `
    <div class="field-header">
    <div class="item-actions">
        <button type="button" class="remove-item-btn" onclick="this.closest('.field-item').remove()"><i class="fas fa-trash"></i></button>
        <button type="button" class="toggle-collapse-btn" onclick="toggleCollapse(this)"><i class="fas fa-chevron-up"></i></button>
    </div>
    </div>
    <div class="collapsible-content">
    <div class="form-group">
        <label>Nama Tabel Detail</label>
        <input type="text" class="subform-table form-control" />
    </div>
    <div class="form-group">
        <label>Foreign Key</label>
        <input type="text" class="subform-fk form-control" />
    </div>
    <div class="form-group">
        <label>Label Subform</label>
        <input type="text" class="subform-label form-control" />
    </div>
    <div class="form-subfields"></div>
    <button type="button" class="btn btn-outline-primary btn-add-item" onclick="addSubField(this)">+ Tambah Field Subform</button>
    </div>`
  container.appendChild(wrapper)
}
function addSubField(btn) {
  const container = btn.closest('.field-item').querySelector('.form-subfields')
  container.appendChild(buildFieldWidget('sub'))
}
function addCalculation() {
  const container = document.getElementById('calculation-fields')
  const id = `calc-${Date.now()}-${Math.floor(Math.random() * 1e3)}`
  const wrapper = document.createElement('div')
  wrapper.className = 'field-item'
  wrapper.dataset.id = id
  wrapper.innerHTML = `
                  <div class="field-header">
                    <span class="title"><span class="field-name-display">Formula Baru</span></span>
                    <div class="item-actions">
                      <button type="button" class="remove-item-btn" onclick="this.closest('.field-item').remove()"><i class="fas fa-trash"></i></button>
                      <button type="button" class="toggle-collapse-btn" onclick="toggleCollapse(this)"><i class="fas fa-chevron-up"></i></button>
                    </div>
                  </div>
                  <div class="collapsible-content">
                    <div class="form-group">
                      <label>Nama Field Output</label>
                      <input type="text" class="calc-name form-control" />
                    </div>
                    <div class="form-group">
                      <label>Formula</label>
                      <input type="text" class="calc-formula form-control" />
                    </div>
                  </div>`
  container.appendChild(wrapper)
}
function selectType(el) {
  const group = el.closest('.type-options')
  group.querySelectorAll('.type-option').forEach((opt) => opt.classList.remove('selected'))
  el.classList.add('selected')
  el.querySelector('input[type=radio]').checked = true
  handleSelectFieldMode(group)
}
function toggleCollapse(btn) {
  const content = btn.closest('.field-item').querySelector('.sortable-list .collapsible-content')
  content.classList.toggle('collapsed')
  const icon = btn.querySelector('i')
  icon.classList.toggle('fa-chevron-up')
  icon.classList.toggle('fa-chevron-down')
}
function generateSchema() {
  const schema = {
    slug: document.getElementById('form-slug').value,
    name: document.getElementById('form-name').value,
    table_name: document.getElementById('form-table').value,
    submit_label: document.getElementById('form-submit-label').value,
    submit_subform_label: document.getElementById('form-submit-subform-label').value,
    fields: Array.from(document.querySelectorAll('#main-fields .field-item')).map((div) => {
      const content = div.querySelector('.collapsible-content')
      const type = content.querySelector('.type-option.selected input').value
      let options = {},
        formula = {}
      if (type === 'select') {
        const extra = content.querySelector('.extra-options')
        const mode = extra.querySelector('.select-mode').value
        options.mode = mode
        if (mode === 'static') {
          options.values = extra
            .querySelector('.select-static-values')
            .value.split(',')
            .map((v) => v.trim())
        } else {
          options.relation = {
            table: extra.querySelector('.relation-table').value,
            value_column: extra.querySelector('.relation-value').value,
            label_column: extra.querySelector('.relation-label').value,
          }
          const autoFillItems = extra.querySelectorAll('.auto-fill-item')
          if (autoFillItems.length > 0) {
            options.auto_fill = {}
            autoFillItems.forEach((item) => {
              const key = item.querySelector('.auto-fill-target')?.value
              const value = item.querySelector('.auto-fill-source')?.value
              if (key && value) {
                options.auto_fill[key] = value
              }
            })
          }
        }
      } else if (type === 'calculated') {
        const calcMode = content.querySelector('.calc-mode')?.value || 'formula'
        if (calcMode === 'aggregate') {
          formula = {
            aggregate: true,
            method: content.querySelector('.aggregate-method')?.value || 'sum',
            target: content.querySelector('.aggregate-target')?.value || '',
            field: content.querySelector('.aggregate-field')?.value || '',
          }
        } else {
          formula = {
            formula: content.querySelector('.field-formula')?.value || '',
          }
        }
      }
      return {
        name: content.querySelector('.field-name').value,
        label: content.querySelector('.field-label').value,
        type: type,
        required: content.querySelector('.field-required').checked,
        options: options,
        formula: formula,
      }
    }),
    subforms: Array.from(document.querySelectorAll('#subform-panels .field-item')).map((sf) => {
      const content = sf.querySelector('.sortable-list .collapsible-content')
      if (content.querySelector('.subform-table')?.value) {
        return {
          table_name: content.querySelector('.subform-table')?.value || '',
          foreign_key: content.querySelector('.subform-fk')?.value || '',
          label: content.querySelector('.subform-label')?.value || '',
          fields: Array.from(content.querySelectorAll('.form-subfields .field-item')).map((f) => {
            const fContent = f.querySelector('.sortable-list .collapsible-content')
            const type = fContent.querySelector('.type-option.selected input')?.value || ''
            let options = {},
              formula = {}
            if (type === 'select') {
              const extra = fContent.querySelector('.extra-options')
              const mode = extra.querySelector('.select-mode')?.value || 'static'
              options.mode = mode
              if (mode === 'static') {
                options.values =
                  extra
                    .querySelector('.select-static-values')
                    ?.value.split(',')
                    .map((v) => v.trim())
                    .filter((v) => v) || []
              } else if (mode === 'relation') {
                options.relation = {
                  table: extra.querySelector('.relation-table')?.value || '',
                  value_column: extra.querySelector('.relation-value')?.value || '',
                  label_column: extra.querySelector('.relation-label')?.value || '',
                }
                const autoFillItems = extra.querySelectorAll('.auto-fill-item')
                if (autoFillItems.length > 0) {
                  options.auto_fill = {}
                  autoFillItems.forEach((item) => {
                    const key = item.querySelector('.auto-fill-target')?.value
                    const value = item.querySelector('.auto-fill-source')?.value
                    if (key && value) {
                      options.auto_fill[key] = value
                    }
                  })
                }
              }
            } else if (type === 'calculated') {
              const calcMode = fContent.querySelector('.calc-mode')?.value || 'formula'
              if (calcMode === 'aggregate') {
                formula = {
                  aggregate: true,
                  method: content.querySelector('.aggregate-method')?.value || 'sum',
                  target: content.querySelector('.aggregate-target')?.value || '',
                  field: content.querySelector('.aggregate-field')?.value || '',
                }
              } else {
                formula = {
                  formula: fContent.querySelector('.field-formula')?.value || '',
                }
              }
            }
            return {
              name: fContent.querySelector('.field-name')?.value || '',
              label: fContent.querySelector('.field-label')?.value || '',
              type,
              options,
              formula: formula,
            }
          }),
        }
      }
    }),
    // calculations: Array.from(document.querySelectorAll('#calculation-fields .field-item')).map(
    //   (div) => ({
    //     field: div.querySelector('.calc-name').value,
    //     from: 'subform',
    //     formula: div.querySelector('.calc-formula').value,
    //   })
    // ),
  }
  //   document.getElementById('schema-output').textContent = JSON.stringify(schema, null, 2)
  return schema
}
function addAutoFillItem(btn) {
  const map = btn.closest('.auto-fill-group').querySelector('.auto-fill-map')
  const item = document.createElement('div')
  item.className = 'auto-fill-item'
  item.innerHTML = `
      <input type="text" class="form-control auto-fill-target" placeholder="Field Tujuan">
      <input type="text" class="form-control auto-fill-source" placeholder="Kolom Relasi">
    `
  map.appendChild(item)
}
function setupCollapsible(container) {
  const content = container.querySelector('.collapsible-content')
  const toggleBtn = container.querySelector('.toggle-collapse-btn')
  toggleBtn?.addEventListener('click', () => {
    content.classList.toggle('collapsed')
    toggleBtn.querySelector('i').classList.toggle('fa-chevron-down')
    toggleBtn.querySelector('i').classList.toggle('fa-chevron-up')
  })
}
async function loadFormSchema(formId) {
  try {
    const res = await fetch(`/configuration/formbuilder/read/${formId}`)
    const json = await res.json()
    if (!json.status) throw new Error('Gagal ambil schema')
    return json.data
  } catch (err) {
    console.error(err)
    alert('Gagal mengambil form schema')
  }
}
async function renderField(field, prefix = '', isReadonly = false) {
  const wrapper = document.createElement('div')
  wrapper.className = 'form-group'
  const label = document.createElement('label')
  label.textContent = field.label
  label.setAttribute('for', prefix + field.name)
  wrapper.appendChild(label)
  const isRelationSelect = field.type === 'select' && field.options?.mode === 'relation'
  const input = document.createElement(isRelationSelect ? 'select' : 'input')
  input.className = 'form-control'
  input.name = prefix + field.name
  input.id = prefix + field.name
  if (field.type === 'number' || field.type === 'calculated') input.type = 'number'
  if (field.type === 'text') input.type = 'text'
  wrapper.appendChild(input)
  if (isRelationSelect) {
    const { table, value_column, label_column } = field.options.relation
    let choicesInstance = new Choices(input, {
      placeholderValue: '-- Pilih --',
      searchEnabled: true,
      shouldSort: false,
      noResultsText: 'Tidak ditemukan',
    })
    async function loadOptions(search = '', page = 1) {
      try {
        const url = `/api/${table}?page=${page}&limit=10&search=${encodeURIComponent(search)}`
        const res = await fetch(url)
        const json = await res.json()
        const items = (json?.data?.documents || []).map((item) => ({
          value: item[value_column],
          label: item[label_column],
          customProperties: item,
        }))
        choicesInstance.clearChoices()
        choicesInstance.setChoices(items, 'value', 'label', true)
      } catch (err) {
        console.error('Gagal load relasi:', err)
      }
    }
    await loadOptions()
    input.addEventListener('search', (e) => {
      loadOptions(e.detail.value)
    })
    if (field.options.auto_fill) {
      input.addEventListener('change', () => {
        const selectedData = choicesInstance.getValue()?.customProperties
        if (!selectedData) return
        for (const target in field.options.auto_fill) {
          const sourceKey = field.options.auto_fill[target]
          let targetInput = document.querySelector(`[name="${target}"]`)
          if (!targetInput) {
            targetInput = input.closest('.subform-item')?.querySelector(`[name$="${target}"]`)
          }
          if (targetInput) {
            targetInput.value = selectedData[sourceKey] || ''
            targetInput.disabled = true
          }
        }
      })
    }
  }
  if (field.type === 'calculated' || isReadonly || field.readonly) {
    input.readOnly = true
    input.disabled = true
  }
  return wrapper
}
async function renderSubform(subform, container, button_label) {
  if (!subform) return
  const wrapper = document.createElement('div')
  wrapper.className = 'form-section subform-wrapper'
  const title = document.createElement('h4')
  title.textContent = subform.label
  wrapper.appendChild(title)
  const fieldItem = document.createElement('div')
  fieldItem.className = ''
  fieldItem.dataset.subform = subform.table_name
  const header = document.createElement('div')
  fieldItem.appendChild(header)
  const content = document.createElement('div')
  content.className = 'collapsible-content'
  const rowsContainer = document.createElement('div')
  rowsContainer.dataset.rowsContainer = subform.table_name
  content.appendChild(rowsContainer)
  async function addRow() {
    const item = document.createElement('div')
    item.className = 'field-item subform-item'

    const header = document.createElement('div')
    header.className = 'field-header'

    const titleSpan = document.createElement('span')
    titleSpan.className = 'title'
    titleSpan.innerHTML = `<span class="field-name-display">${subform.label + ' ' + numb_item++}</span>`
    header.appendChild(titleSpan)

    const actions = document.createElement('div')
    actions.className = 'item-actions'

    const collapseBtn = document.createElement('button')
    collapseBtn.type = 'button'
    collapseBtn.className = 'toggle-collapse-btn'
    collapseBtn.title = 'Toggle Detail'
    collapseBtn.innerHTML = '<i class="fas fa-chevron-down"></i>'
    actions.appendChild(collapseBtn)

    const removeBtn = document.createElement('button')
    removeBtn.type = 'button'
    removeBtn.className = 'remove-item-btn'
    removeBtn.title = 'Hapus Field'
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>'
    removeBtn.addEventListener('click', () => {
      item.remove()
      document.getElementById('dynamic-form').dispatchEvent(new Event('input'))
    })
    actions.appendChild(removeBtn)

    header.appendChild(actions)
    item.appendChild(header)

    const content = document.createElement('div')
    content.className = 'collapsible-content collapsed'

    for (const field of subform.fields) {
      const el = await renderField(
        field,
        `${subform.table_name}[]_`,
        field.type === 'calculated' || field.readonly
      )
      content.appendChild(el)
    }

    item.appendChild(content)
    rowsContainer.appendChild(item)
    setupCollapsible(item)
  }

  const addBtn = document.createElement('button')
  addBtn.type = 'button'
  addBtn.className = 'btn btn-outline-primary btn-add-item'
  addBtn.textContent = button_label
  addBtn.addEventListener('click', addRow)
  content.appendChild(addBtn)
  fieldItem.appendChild(content)
  wrapper.appendChild(fieldItem)
  container.appendChild(wrapper)
  await addRow()
}
async function renderForm(schema) {
  numb_item = 1
  const form = document.getElementById('dynamic-form')
  form.innerHTML = ''
  const section_main = document.createElement('div')
  section_main.className = 'form-section'
  const titleForm = document.createElement('h4')
  titleForm.textContent = schema.name
  section_main.appendChild(titleForm)
  for (const field of schema.fields) {
    const el = await renderField(field)
    const contentMain = document.createElement('div')
    contentMain.className = ''
    contentMain.appendChild(el)
    section_main.appendChild(contentMain)
    form.appendChild(section_main)
  }
  if (schema.subforms) {
    for (const sub of schema.subforms) {
      await renderSubform(sub, form, schema.submit_subform_label)
    }
  }
  const btn = document.createElement('button')
  btn.type = 'submit'
  btn.className = 'btn btn-primary'
  btn.textContent = schema.submit_label || 'Simpan'
  const btnGroup = document.createElement('div')
  btnGroup.className = 'form-group text-right'
  btnGroup.appendChild(btn)
  form.appendChild(btnGroup)
  form.dispatchEvent(new Event('input'))
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = {}
    schema.fields.forEach((f) => {
      const el = form.querySelector(`[name="${f.name}"]`)
      data[f.name] = el?.value
    })
    if (schema.subforms) {
      schema.subforms.forEach((sub) => {
        if (!sub) return

        const rows = form.querySelectorAll(`[data-subform="${sub.table_name}"] .subform-item`)

        data[sub.table_name] = []

        rows.forEach((row) => {
          const rowData = {}
          sub.fields.forEach((f) => {
            const el = row.querySelector(`[name^="${sub.table_name}[]_${f.name}"]`)
            rowData[f.name] = el?.value ?? null
          })
          data[sub.table_name].push(rowData)
        })
      })
    }
    alert(JSON.stringify(data))
  })
  form.addEventListener('input', () => {
    document.querySelectorAll('.subform-wrapper').forEach((subform) => {
      subform.querySelectorAll('.subform-item').forEach((row) => {
        const jumlah = parseFloat(row.querySelector("[name*='jumlah']")?.value || 0)
        const harga = parseFloat(row.querySelector("[name*='harga']")?.value || 0)
        const total = row.querySelector("[name*='total']")
        if (total) total.value = jumlah * harga
      })
    })
    if (Array.isArray(schema.fields)) {
      for (const field of schema.fields) {
        if (field.type === 'calculated' && field.formula?.aggregate) {
          const method = field.formula.method || 'sum'
          const targetField = field.formula.field

          let allValues = []

          if (field.formula.target) {
            // Ambil dari subform
            const targetSubform = field.formula.target
            allValues = Array.from(
              form.querySelectorAll(`[name^="${targetSubform}[]_${targetField}"]`)
            )
              .map((el) => parseFloat(el.value || 0))
              .filter((v) => !isNaN(v))
          } else {
            // Ambil dari field main form
            allValues = Array.from(form.querySelectorAll(`[name="${targetField}"]`))
              .map((el) => parseFloat(el.value || 0))
              .filter((v) => !isNaN(v))
          }

          let result = 0
          if (method === 'sum') {
            result = allValues.reduce((acc, val) => acc + val, 0)
          } else if (method === 'avg') {
            result = allValues.length ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0
          } else if (method === 'min') {
            result = allValues.length ? Math.min(...allValues) : 0
          } else if (method === 'max') {
            result = allValues.length ? Math.max(...allValues) : 0
          } else if (method === 'count') {
            result = allValues.length
          }

          const outputField = form.querySelector(`[name="${field.name}"]`)
          if (outputField) outputField.value = result
        }
      }
    }
  })
}
