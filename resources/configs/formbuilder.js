document.addEventListener('DOMContentLoaded', async () => {
  const collectionSelect = document.getElementById('formbuilder-collection-select')
  const dom = {
    saveFormBuilderBtn: document.getElementById('data-formbuilder-form'),
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
          `/configuration/collection/list?page=${page}&search=${encodeURIComponent(search)}`
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
    console.log('SINI',generateSchema())
  })
})

function addMainField() {
  const container = document.getElementById('main-fields')
  container.appendChild(buildFieldWidget('main'))
}

function addSubField() {
  const container = document.getElementById('subform-fields')
  container.appendChild(buildFieldWidget('sub'))
}

function buildFieldWidget(type) {
  const fieldId = `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const wrapper = document.createElement('div')
  wrapper.className = 'field-item'
  wrapper.dataset.id = fieldId
  wrapper.innerHTML = `
          <div class="field-header">
            <span class="title"><span class="field-name-display">Field Baru</span></span>
            <div class="item-actions">
              <button type="button" class="remove-item-btn" onclick="this.closest('.field-item').remove()"><i class="fas fa-trash"></i></button>
              <button type="button" class="toggle-collapse-btn" onclick="toggleCollapse(this)"><i class="fas fa-chevron-up"></i></button>
            </div>
          </div>
          <div class="collapsible-content">
            <div class="form-group">
              <label for="${fieldId}-name">Nama Field <span class="required">*</span></label>
              <input type="text" id="${fieldId}-name" class="field-name form-control" required />
            </div>
            <div class="form-group">
              <label for="${fieldId}-label">Label Field</label>
              <input type="text" id="${fieldId}-label" class="field-label form-control" />
            </div>
            <div class="form-group">
              <label>Tipe Field</label>
              <div class="type-options">
                ${[
                  'text',
                  'number',
                  'date',
                  'select',
                  'boolean',
                  'media',
                  'enum',
                  ...(type === 'main' ? ['calculated'] : []),
                ]
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
                      text: 'Teks Pendek',
                      number: 'Angka',
                      date: 'Tanggal & Waktu',
                      select: 'Select',
                      boolean: 'Boolean',
                      media: 'Media',
                      enum: 'Enum',
                      calculated: 'Hitung Otomatis',
                    }
                    return `
                  <label class="type-option ${i === 0 ? 'selected' : ''}" onclick="selectType(this)">
                    <i class="fas ${icons[t]}"></i> ${labels[t]}
                    <input type="radio" name="${fieldId}-type-radio" value="${t}" style="display:none;" ${i === 0 ? 'checked' : ''}>
                  </label>`
                  })
                  .join('')}
              </div>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="${fieldId}-required" class="field-required" />
              <label for="${fieldId}-required">Wajib Diisi</label>
            </div>
          </div>`
  return wrapper
}

function addCalculation() {
  const container = document.getElementById('calculation-fields')
  const id = `calc-${Date.now()}-${Math.floor(Math.random() * 1000)}`
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
              <label for="${id}-field">Nama Field Output</label>
              <input type="text" class="calc-name form-control" id="${id}-field" placeholder="Contoh: total" />
            </div>
            <div class="form-group">
              <label for="${id}-formula">Formula</label>
              <input type="text" class="calc-formula form-control" id="${id}-formula" placeholder="jumlah * harga_satuan" />
            </div>
          </div>
        `
  container.appendChild(wrapper)
}

function toggleCollapse(btn) {
  const content = btn.closest('.field-item').querySelector('.collapsible-content')
  content.classList.toggle('collapsed')
  const icon = btn.querySelector('i')
  icon.classList.toggle('fa-chevron-up')
  icon.classList.toggle('fa-chevron-down')
}

function selectType(el) {
  const group = el.closest('.type-options')
  group.querySelectorAll('.type-option').forEach((opt) => opt.classList.remove('selected'))
  el.classList.add('selected')
  el.querySelector('input[type=radio]').checked = true
}

function generateSchema() {
  const schema = {
    slug: document.getElementById('form-slug').value,
    name: document.getElementById('form-name').value,
    table_name: document.getElementById('formbuilder-collection-select').value,
    submit_label: document.getElementById('form-submit-label').value,
    fields: [],
    subform: {
      table_name: document.getElementById('subform-table').value,
      foreign_key: document.getElementById('subform-fk').value,
      label: document.getElementById('subform-label').value,
      fields: [],
    },
    calculations: Array.from(document.querySelectorAll('#calculation-fields .field-item')).map(
      (div) => ({
        field: div.querySelector('.calc-name').value,
        from: 'subform',
        formula: div.querySelector('.calc-formula').value,
      })
    ),
  }

  document.querySelectorAll('#main-fields .field-item').forEach((div) => {
    schema.fields.push({
      name: div.querySelector('.field-name').value,
      label: div.querySelector('.field-label').value,
      type: div.querySelector('.type-option.selected input').value,
      required: div.querySelector('.field-required').checked,
    })
  })

  document.querySelectorAll('#subform-fields .field-item').forEach((div) => {
    schema.subform.fields.push({
      name: div.querySelector('.field-name').value,
      label: div.querySelector('.field-label').value,
      type: div.querySelector('.type-option.selected input').value,
    })
  })
  console.log(schema);
  
//   document.getElementById('schema-output').textContent = JSON.stringify(schema, null, 2)
}
