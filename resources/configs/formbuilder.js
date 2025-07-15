document.addEventListener('DOMContentLoaded', async () => {
  const collectionSelect = document.getElementById('formbuilder-collection-select')
  const dom = {
    saveFormBuilderBtn: document.getElementById('data-formbuilder-form'),
    dataDashboardIdInput:document.getElementById('data-dashboard-id'),
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
    const isEditing = !!dom.dataDashboardIdInput.value
    
  })
})
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
            <div class="auto-fill-map">
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary mt-1" onclick="addAutoFillItem(this)">+ Tambah Auto Fill</button>
        </div>
        </div>

    `
  } else if (selectedType === 'calculated') {
    extraOptionsContainer.innerHTML = `
    <div class="form-group calculated-options">
    <label>Formula</label>
    <input type="text" class="form-control field-formula" placeholder="Contoh: qty * harga_satuan" />
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
    <span class="title"><span class="field-name-display">Subform Baru</span></span>
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
        formula.formula = content.querySelector('.field-formula')?.value || ''
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
              formula.formula = fContent.querySelector('.field-formula')?.value || ''
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
