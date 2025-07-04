// === Variabel Global / Elemen UI Utama ===
// Mengambil elemen-elemen utama dari DOM menggunakan getElementById
const viewConfigsBtn = document.getElementById('view-configs-btn')
const createNewConfigBtn = document.getElementById('create-new-config-btn')
const configListArea = document.getElementById('config-list-area')
const collectionSettingsArea = document.getElementById('collection-settings-area')
const contentArea = document.getElementById('content-area')
const messageArea = document.getElementById('message-area')

const collectionConfigForm = document.getElementById('collection-config-form')
const configIdInput = document.getElementById('config-id')
const configDisplayNameInput = document.getElementById('config-displayName')
const configNameInput = document.getElementById('config-name')
const configDescriptionInput = document.getElementById('config-description')
const fieldsContainer = document.getElementById('fields-container')
const addFieldBtn = document.getElementById('add-field-btn')
const relationsContainer = document.getElementById('relations-container')
const addRelationBtn = document.getElementById('add-relation-btn')
const settingsFormTitle = document.getElementById('settings-form-title')
const cancelEditBtn = document.getElementById('cancel-edit-btn')

const collectionTitle = document.getElementById('collection-title')
const addRecordBtn = document.getElementById('add-record-btn')
const backToConfigsBtn = document.getElementById('back-to-configs-btn')
const dataGridContainer = document.getElementById('data-grid-container')

const recordModal = document.getElementById('record-modal')
const recordModalCloseBtn = document.getElementById('record-modal-close-btn')
const recordModalTitle = document.getElementById('record-modal-title')
const recordModalForm = document.getElementById('record-modal-form')
const recordModalSubmitBtn = document.getElementById('record-modal-submit-btn')
const recordModalCancelBtn = document.getElementById('record-modal-cancel-btn')

const configSearchInput = document.getElementById('config-search-input')
const configsPaginationControls = document.getElementById('configs-pagination-controls')
const dataPaginationControls = document.getElementById('data-pagination-controls')

// Variabel untuk paginasi
let currentConfigsPage = 1
const configsPerPage = 6 // Jumlah kartu konfigurasi per halaman

let currentDataPage = 1
const dataPerPage = 10 // Jumlah baris data per halaman

// Variabel untuk menyimpan konfigurasi yang sedang aktif
let currentConfig = null

// === Fungsi Utilitas ===

/**
 * Fungsi pembantu untuk membuat elemen HTML dengan properti
 * @param {string} tag - Tag HTML (contoh: 'div', 'span', 'button')
 * @param {object} properties - Objek properti (className, id, textContent, dll.)
 * @returns {HTMLElement} Elemen HTML yang dibuat
 */
function createElement(tag, properties = {}) {
  const element = document.createElement(tag)
  for (const key in properties) {
    if (key === 'textContent') {
      element.textContent = properties[key]
    } else if (key === 'innerHTML') {
      element.innerHTML = properties[key]
    } else if (key === 'dataset') {
      for (const dataKey in properties.dataset) {
        element.dataset[dataKey] = properties.dataset[dataKey]
      }
    } else {
      element.setAttribute(key, properties[key])
    }
  }
  return element
}

/**
 * Menampilkan pesan notifikasi (sukses/error)
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - 'success' atau 'error'
 */
function showNotification(message, type) {
  messageArea.textContent = message
  messageArea.className = `notification-message ${type}`
  messageArea.style.display = 'block'

  setTimeout(() => {
    messageArea.style.display = 'none'
    messageArea.textContent = ''
    messageArea.className = 'notification-message'
  }, 5000) // Pesan akan hilang setelah 5 detik
}

/**
 * Mengganti tampilan bagian di halaman
 * @param {string} view - Nama tampilan yang akan ditampilkan ('list-configs', 'settings-form', 'content-area')
 */
function showView(view) {
  // Sembunyikan semua bagian
  configListArea.style.display = 'none'
  collectionSettingsArea.style.display = 'none'
  contentArea.style.display = 'none'

  // Atur kelas 'active' pada tombol navigasi
  viewConfigsBtn.classList.remove('active')
  createNewConfigBtn.classList.remove('active')

  // Tampilkan bagian yang dipilih
  if (view === 'list-configs') {
    configListArea.style.display = 'block'
    viewConfigsBtn.classList.add('active')
    fetchConfigs() // Muat ulang daftar konfigurasi saat kembali ke tampilan daftar
  } else if (view === 'settings-form') {
    collectionSettingsArea.style.display = 'block'
    createNewConfigBtn.classList.add('active')
  } else if (view === 'content-area') {
    contentArea.style.display = 'block'
    // Tidak ada tombol aktif spesifik di sini, bisa biarkan tombol "Daftar Konfigurasi" aktif
    viewConfigsBtn.classList.add('active')
  }
}

/**
 * Mengambil semua data konfigurasi dari server
 * @returns {Promise<Array>} Array berisi objek konfigurasi
 */
async function fetchConfigs() {
  try {
    const response = await fetch('/api/configs')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const configs = await response.json()
    renderConfigsList(configs)
    return configs
  } catch (error) {
    console.error('Error fetching configurations:', error)
    showNotification('Gagal memuat konfigurasi. Silakan coba lagi.', 'error')
    return []
  }
}

/**
 * Render daftar konfigurasi dalam bentuk kartu
 * @param {Array} configs - Array konfigurasi
 */
function renderConfigsList(configs) {
  configsGridContainer.innerHTML = '' // Hapus konten sebelumnya
  if (configs.length === 0) {
    configsGridContainer.innerHTML = '<p>Belum ada konfigurasi koleksi. Buat yang baru!</p>'
    configsPaginationControls.innerHTML = ''
    return
  }

  const filteredConfigs = configs.filter((config) => {
    const searchTerm = configSearchInput.value.toLowerCase()
    return (
      config.displayName.toLowerCase().includes(searchTerm) ||
      config.name.toLowerCase().includes(searchTerm)
    )
  })

  // Paginasi
  const totalPages = Math.ceil(filteredConfigs.length / configsPerPage)
  const startIndex = (currentConfigsPage - 1) * configsPerPage
  const endIndex = startIndex + configsPerPage
  const paginatedConfigs = filteredConfigs.slice(startIndex, endIndex)

  paginatedConfigs.forEach((config) => {
    const card = createElement('div', { className: 'config-card' })
    card.innerHTML = `
            <h3>${config.displayName}</h3>
            <p><strong>Kode:</strong> ${config.name}</p>
            <p>${config.description || 'Tidak ada deskripsi.'}</p>
            <div class="card-actions">
                <button class="view-data-btn primary-btn" data-id="${config.id}" data-name="${config.name}" data-display-name="${config.displayName}"><i class="fa-solid fa-table"></i> Lihat Data</button>
                <button class="edit-config-btn secondary-btn" data-id="${config.id}"><i class="fa-solid fa-pencil"></i> Edit</button>
                <button class="delete-config-btn danger-btn" data-id="${config.id}"><i class="fa-solid fa-trash"></i> Hapus</button>
            </div>
        `
    configsGridContainer.appendChild(card)
  })

  renderConfigsPagination(totalPages)
}

/**
 * Render kontrol paginasi untuk daftar konfigurasi
 * @param {number} totalPages - Total halaman
 */
function renderConfigsPagination(totalPages) {
  configsPaginationControls.innerHTML = ''
  if (totalPages <= 1) return

  const createButton = (text, page, isActive = false, isDisabled = false) => {
    const button = createElement('button', {
      textContent: text,
      className: `pagination-btn ${isActive ? 'active' : ''}`,
      dataset: { page: page },
    })
    if (isDisabled) button.disabled = true
    button.addEventListener('click', () => {
      currentConfigsPage = page
      fetchConfigs()
    })
    return button
  }

  configsPaginationControls.appendChild(
    createButton('Prev', currentConfigsPage - 1, false, currentConfigsPage === 1)
  )

  for (let i = 1; i <= totalPages; i++) {
    configsPaginationControls.appendChild(createButton(i, i, i === currentConfigsPage))
  }

  configsPaginationControls.appendChild(
    createButton('Next', currentConfigsPage + 1, false, currentConfigsPage === totalPages)
  )
}

/**
 * Mereset form konfigurasi
 */
function resetConfigForm() {
  collectionConfigForm.reset()
  configIdInput.value = ''
  settingsFormTitle.textContent = 'Buat Konfigurasi Koleksi Baru'
  cancelEditBtn.style.display = 'none'

  fieldsContainer.innerHTML =
    '<p class="placeholder-message">Belum ada field. Klik "Tambah Field Baru" untuk memulai.</p>'
  relationsContainer.innerHTML =
    '<p class="placeholder-message">Belum ada relasi. Klik "Tambah Relasi Baru" untuk memulai.</p>'
}

/**
 * Menambahkan baris field ke form konfigurasi
 * @param {object} field - Objek field (opsional, untuk mode edit)
 */
function addFieldRow(field = {}) {
  // Pastikan idSuffix unik dengan kombinasi timestamp dan random string
  const idSuffix = field.id || `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const { name = '', label = '', type = 'String', inputType = 'text', required = false } = field

  const row = createElement('div', { className: 'dynamic-item-row' })
  row.dataset.id = idSuffix

  const placeholder = fieldsContainer.querySelector('.placeholder-message')
  if (placeholder) {
    placeholder.remove()
  }

  row.innerHTML = `
        <div class="row-summary">
            <span class="field-name-display">${label || name || 'Field Baru'}</span>
            <span class="field-badges">
                <span class="field-badge">${type}</span>
                <span class="field-badge">${inputType}</span>
                ${required ? '<span class="field-badge required-badge">Required</span>' : ''}
            </span>
            <div class="row-actions">
                <button type="button" class="edit-row-btn secondary-btn" data-id="${idSuffix}"><i class="fa-solid fa-pencil"></i></button>
                <button type="button" class="delete-row-btn danger-btn" data-id="${idSuffix}"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        <div class="row-details" style="display: none;">
            <div class="form-group">
                <label for="fieldName_${idSuffix}">Nama Kode Field:<span class="required">*</span></label>
                <input type="text" id="fieldName_${idSuffix}" name="fieldName_${idSuffix}" class="form-control" placeholder="Contoh: username, product_name" pattern="^[a-z0-9_]+$" title="Hanya huruf kecil, angka, dan underscore" required value="${name}">
                <small>Nama unik untuk identifikasi di kode (tidak boleh mengandung spasi atau karakter khusus selain underscore).</small>
            </div>

            <div class="form-group">
                <label for="fieldLabel_${idSuffix}">Nama Tampilan Field:<span class="required">*</span></label>
                <input type="text" id="fieldLabel_${idSuffix}" name="fieldLabel_${idSuffix}" class="form-control" placeholder="Contoh: Nama Pengguna, Nama Produk" required value="${label}">
                <small>Nama yang akan ditampilkan di UI.</small>
            </div>

            <div class="form-group">
                <label for="fieldType_${idSuffix}">Tipe Data:<span class="required">*</span></label>
                <select id="fieldType_${idSuffix}" name="fieldType_${idSuffix}" class="form-control" required>
                    <option value="String" ${type === 'String' ? 'selected' : ''}>String</option>
                    <option value="Number" ${type === 'Number' ? 'selected' : ''}>Number</option>
                    <option value="Boolean" ${type === 'Boolean' ? 'selected' : ''}>Boolean</option>
                    <option value="Date" ${type === 'Date' ? 'selected' : ''}>Date</option>
                    <option value="Object" ${type === 'Object' ? 'selected' : ''}>Object</option>
                    <option value="Array" ${type === 'Array' ? 'selected' : ''}>Array</option>
                </select>
            </div>

            <div class="form-group input-type-group" style="display: ${type === 'String' || type === 'Number' ? 'block' : 'none'};">
                <label for="fieldInputType_${idSuffix}">Tipe Input UI:</label>
                <select id="fieldInputType_${idSuffix}" name="fieldInputType_${idSuffix}" class="form-control">
                    <option value="text" ${inputType === 'text' ? 'selected' : ''}>Text</option>
                    <option value="number" ${inputType === 'number' ? 'selected' : ''}>Number</option>
                    <option value="textarea" ${inputType === 'textarea' ? 'selected' : ''}>Textarea</option>
                    <option value="email" ${inputType === 'email' ? 'selected' : ''}>Email</option>
                    <option value="password" ${inputType === 'password' ? 'selected' : ''}>Password</option>
                    <option value="url" ${inputType === 'url' ? 'selected' : ''}>URL</option>
                    <option value="date" ${inputType === 'date' ? 'selected' : ''}>Date Picker</option>
                    <option value="datetime-local" ${inputType === 'datetime-local' ? 'selected' : ''}>Datetime Picker</option>
                    <option value="color" ${inputType === 'color' ? 'selected' : ''}>Color Picker</option>
                    <option value="file" ${inputType === 'file' ? 'selected' : ''}>File Upload</option>
                </select>
            </div>

            <div class="form-group">
                <input type="checkbox" id="fieldRequired_${idSuffix}" name="fieldRequired_${idSuffix}" ${required ? 'checked' : ''}>
                <label for="fieldRequired_${idSuffix}" class="checkbox-label">Wajib Diisi</label>
            </div>
            <button type="button" class="secondary-btn hide-details-btn" data-id="${idSuffix}"><i class="fa-solid fa-eye-slash"></i> Sembunyikan Detail</button>
        </div>
    `

  fieldsContainer.appendChild(row)

  // Dapatkan referensi ke elemen-elemen input, SELECT, dan checkbox
  // Menggunakan getElementById karena ID dibuat unik
  const fieldNameInput = document.getElementById(`fieldName_${idSuffix}`)
  const fieldLabelInput = document.getElementById(`fieldLabel_${idSuffix}`)
  const fieldTypeInput = document.getElementById(`fieldType_${idSuffix}`)
  const fieldInputTypeInput = document.getElementById(`fieldInputType_${idSuffix}`)
  const fieldRequiredCheckbox = document.getElementById(`fieldRequired_${idSuffix}`)
  const inputTypeGroup = row.querySelector('.input-type-group') // Ini masih pakai querySelector karena grup

  // Event listener untuk update summary saat input berubah
  ;[
    fieldNameInput,
    fieldLabelInput,
    fieldTypeInput,
    fieldInputTypeInput,
    fieldRequiredCheckbox,
  ].forEach((inputElement) => {
    const eventType =
      inputElement.tagName === 'SELECT' || inputElement.type === 'checkbox' ? 'change' : 'input'

    inputElement.addEventListener(eventType, () => {
      const summarySpan = row.querySelector('.field-name-display')
      const typeBadge = row.querySelector('.field-badge:nth-of-type(1)')
      const inputTypeBadge = row.querySelector('.field-badge:nth-of-type(2)')
      let requiredBadge = row.querySelector('.required-badge')

      if (fieldLabelInput)
        summarySpan.textContent = fieldLabelInput.value || fieldNameInput.value || 'Field Baru'
      if (fieldTypeInput) typeBadge.textContent = fieldTypeInput.value
      if (fieldInputTypeInput) inputTypeBadge.textContent = fieldInputTypeInput.value

      if (fieldRequiredCheckbox) {
        if (fieldRequiredCheckbox.checked) {
          if (!requiredBadge) {
            requiredBadge = createElement('span', {
              className: 'field-badge required-badge',
              textContent: 'Required',
            })
            if (inputTypeBadge) inputTypeBadge.after(requiredBadge)
          }
        } else {
          if (requiredBadge) {
            requiredBadge.remove()
          }
        }
      }
    })
  })

  // Event listener untuk mengubah visibilitas inputTypeGroup
  fieldTypeInput.addEventListener('change', () => {
    const selectedType = fieldTypeInput.value
    if (selectedType === 'String' || selectedType === 'Number') {
      inputTypeGroup.style.display = 'block'
    } else {
      inputTypeGroup.style.display = 'none'
      // Reset nilai ke 'text' saat disembunyikan
      if (fieldInputTypeInput) fieldInputTypeInput.value = 'text'
    }
  })

  // Event listeners untuk tombol edit dan delete (masih pakai querySelector di dalam row karena tidak ada ID unik untuk tombol ini)
  const editBtn = row.querySelector('.edit-row-btn')
  const deleteBtn = row.querySelector('.delete-row-btn')
  const hideDetailsBtn = row.querySelector('.hide-details-btn')
  const rowDetails = row.querySelector('.row-details')

  editBtn.addEventListener('click', () => {
    rowDetails.style.display = 'block'
    editBtn.style.display = 'none'
  })

  deleteBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghapus field ini?')) {
      row.remove()
      if (fieldsContainer.children.length === 0) {
        fieldsContainer.appendChild(
          createElement('p', {
            className: 'placeholder-message',
            textContent: 'Belum ada field. Klik "Tambah Field Baru" untuk memulai.',
          })
        )
      }
    }
  })

  hideDetailsBtn.addEventListener('click', () => {
    rowDetails.style.display = 'none'
    editBtn.style.display = 'block'
  })

  return row
}

/**
 * Menambahkan baris relasi ke form konfigurasi
 * @param {object} relation - Objek relasi (opsional, untuk mode edit)
 */
async function addRelationRow(relation = {}) {
  // Menggunakan async karena memanggil fetchConfigs
  const idSuffix =
    relation.id || `relation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const { name = '', label = '', type = 'one-to-one', targetCollection = '' } = relation

  const row = createElement('div', { className: 'dynamic-item-row' })
  row.dataset.id = idSuffix

  const placeholder = relationsContainer.querySelector('.placeholder-message')
  if (placeholder) {
    placeholder.remove()
  }

  row.innerHTML = `
        <div class="row-summary">
            <span class="relation-name-display">${label || name || 'Relasi Baru'}</span>
            <span class="relation-badges">
                <span class="relation-badge">${type}</span>
                <span class="relation-badge">${targetCollection}</span>
            </span>
            <div class="row-actions">
                <button type="button" class="edit-row-btn secondary-btn" data-id="${idSuffix}"><i class="fa-solid fa-pencil"></i></button>
                <button type="button" class="delete-row-btn danger-btn" data-id="${idSuffix}"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        <div class="row-details" style="display: none;">
            <div class="form-group">
                <label for="relationName_${idSuffix}">Nama Kode Relasi:<span class="required">*</span></label>
                <input type="text" id="relationName_${idSuffix}" name="relationName_${idSuffix}" class="form-control" placeholder="Contoh: user, comments" pattern="^[a-z0-9_]+$" title="Hanya huruf kecil, angka, dan underscore" required value="${name}">
                <small>Nama unik untuk identifikasi di kode.</small>
            </div>

            <div class="form-group">
                <label for="relationLabel_${idSuffix}">Nama Tampilan Relasi:<span class="required">*</span></label>
                <input type="text" id="relationLabel_${idSuffix}" name="relationLabel_${idSuffix}" class="form-control" placeholder="Contoh: Pengguna, Komentar" required value="${label}">
                <small>Nama yang akan ditampilkan di UI.</small>
            </div>

            <div class="form-group">
                <label for="relationType_${idSuffix}">Tipe Relasi:<span class="required">*</span></label>
                <select id="relationType_${idSuffix}" name="relationType_${idSuffix}" class="form-control" required>
                    <option value="one-to-one" ${type === 'one-to-one' ? 'selected' : ''}>One-to-One</option>
                    <option value="one-to-many" ${type === 'one-to-many' ? 'selected' : ''}>One-to-Many</option>
                    <option value="many-to-one" ${type === 'many-to-one' ? 'selected' : ''}>Many-to-One</option>
                    <option value="many-to-many" ${type === 'many-to-many' ? 'selected' : ''}>Many-to-Many</option>
                </select>
            </div>

            <div class="form-group">
                <label for="relationTargetCollection_${idSuffix}">Target Koleksi:<span class="required">*</span></label>
                <select id="relationTargetCollection_${idSuffix}" name="relationTargetCollection_${idSuffix}" class="form-control" required>
                    <option value="">Pilih Koleksi...</option>
                    </select>
            </div>
            <button type="button" class="secondary-btn hide-details-btn" data-id="${idSuffix}"><i class="fa-solid fa-eye-slash"></i> Sembunyikan Detail</button>
        </div>
    `

  relationsContainer.appendChild(row)

  // --- Mengambil referensi dengan getElementById ---
  const relationNameInput = document.getElementById(`relationName_${idSuffix}`)
  const relationLabelInput = document.getElementById(`relationLabel_${idSuffix}`)
  const relationTypeInput = document.getElementById(`relationType_${idSuffix}`)
  const relationTargetCollectionInput = document.getElementById(
    `relationTargetCollection_${idSuffix}`
  )

  // Event listener untuk update summary saat input berubah
  ;[
    relationNameInput,
    relationLabelInput,
    relationTypeInput,
    relationTargetCollectionInput,
  ].forEach((inputElement) => {
    const eventType =
      inputElement.tagName === 'SELECT' || inputElement.type === 'checkbox' ? 'change' : 'input'

    inputElement.addEventListener(eventType, () => {
      const summarySpan = row.querySelector('.relation-name-display')
      const typeBadge = row.querySelector('.relation-badge:nth-of-type(1)')
      const targetBadge = row.querySelector('.relation-badge:nth-of-type(2)')

      if (relationLabelInput)
        summarySpan.textContent =
          relationLabelInput.value || relationNameInput.value || 'Relasi Baru'
      if (relationTypeInput) typeBadge.textContent = relationTypeInput.value
      if (relationTargetCollectionInput)
        targetBadge.textContent = relationTargetCollectionInput.value
    })
  })

  // Panggil fungsi untuk mengisi dropdown koleksi yang tersedia
  await populateCollectionSelect(relationTargetCollectionInput, targetCollection) // Menggunakan await karena populateCollectionSelect async

  // Event listeners untuk tombol edit dan delete
  const editBtn = row.querySelector('.edit-row-btn')
  const deleteBtn = row.querySelector('.delete-row-btn')
  const hideDetailsBtn = row.querySelector('.hide-details-btn')
  const rowDetails = row.querySelector('.row-details')

  editBtn.addEventListener('click', () => {
    rowDetails.style.display = 'block'
    editBtn.style.display = 'none'
  })

  deleteBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghapus relasi ini?')) {
      row.remove()
      if (relationsContainer.children.length === 0) {
        relationsContainer.appendChild(
          createElement('p', {
            className: 'placeholder-message',
            textContent: 'Belum ada relasi. Klik "Tambah Relasi Baru" untuk memulai.',
          })
        )
      }
    }
  })

  hideDetailsBtn.addEventListener('click', () => {
    rowDetails.style.display = 'none'
    editBtn.style.display = 'block'
  })

  return row
}

/**
 * Mengisi dropdown select dengan nama-nama koleksi yang tersedia
 * @param {HTMLSelectElement} selectElement - Elemen select yang akan diisi
 * @param {string} selectedValue - Nilai yang harus dipilih secara default
 */
async function populateCollectionSelect(selectElement, selectedValue = '') {
  try {
    const configs = await fetchConfigs() // Mengambil daftar konfigurasi yang ada
    // Hapus opsi yang ada kecuali yang "Pilih Koleksi..."
    selectElement.innerHTML = '<option value="">Pilih Koleksi...</option>'
    configs.forEach((config) => {
      if (config.name !== currentConfig?.name) {
        // Jangan tampilkan koleksi yang sedang diedit
        const option = createElement('option', {
          value: config.name,
          textContent: config.displayName,
        })
        selectElement.appendChild(option)
      }
    })
    if (selectedValue) {
      selectElement.value = selectedValue
    }
  } catch (error) {
    console.error('Error populating collection select:', error)
    showNotification('Gagal memuat daftar koleksi untuk relasi.', 'error')
  }
}

/**
 * Mengambil data dari form konfigurasi
 * @returns {object} Objek data konfigurasi
 */
function getFormData() {
  const id = configIdInput.value
  const displayName = configDisplayNameInput.value.trim()
  const name = configNameInput.value.trim()
  const description = configDescriptionInput.value.trim()

  const fields = []
  fieldsContainer.querySelectorAll('.dynamic-item-row').forEach((row) => {
    const idSuffix = row.dataset.id
    // Mengambil nilai field dengan getElementById
    const fieldNameInput = document.getElementById(`fieldName_${idSuffix}`)
    const fieldLabelInput = document.getElementById(`fieldLabel_${idSuffix}`)
    const fieldTypeInput = document.getElementById(`fieldType_${idSuffix}`)
    const fieldInputTypeInput = document.getElementById(`fieldInputType_${idSuffix}`)
    const fieldRequiredCheckbox = document.getElementById(`fieldRequired_${idSuffix}`)

    if (
      fieldNameInput &&
      fieldLabelInput &&
      fieldTypeInput &&
      fieldInputTypeInput &&
      fieldRequiredCheckbox
    ) {
      fields.push({
        id: idSuffix,
        name: fieldNameInput.value.trim(),
        label: fieldLabelInput.value.trim(),
        type: fieldTypeInput.value,
        inputType: fieldInputTypeInput.value,
        required: fieldRequiredCheckbox.checked,
      })
    }
  })

  const relations = []
  relationsContainer.querySelectorAll('.dynamic-item-row').forEach((row) => {
    const idSuffix = row.dataset.id
    // Mengambil nilai relasi dengan getElementById
    const relationNameInput = document.getElementById(`relationName_${idSuffix}`)
    const relationLabelInput = document.getElementById(`relationLabel_${idSuffix}`)
    const relationTypeInput = document.getElementById(`relationType_${idSuffix}`)
    const relationTargetCollectionInput = document.getElementById(
      `relationTargetCollection_${idSuffix}`
    )

    if (
      relationNameInput &&
      relationLabelInput &&
      relationTypeInput &&
      relationTargetCollectionInput
    ) {
      relations.push({
        id: idSuffix,
        name: relationNameInput.value.trim(),
        label: relationLabelInput.value.trim(),
        type: relationTypeInput.value,
        targetCollection: relationTargetCollectionInput.value,
      })
    }
  })

  return { id, displayName, name, description, fields, relations }
}

/**
 * Mengirim data konfigurasi ke server
 * @param {object} configData - Objek data konfigurasi
 */
async function saveConfig(configData) {
  const isNew = !configData.id
  const method = isNew ? 'POST' : 'PUT'
  const url = isNew ? '/api/configs' : `/api/configs/${configData.id}`

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const result = await response.json()
    showNotification(`Konfigurasi "${result.displayName}" berhasil disimpan!`, 'success')
    resetConfigForm()
    showView('list-configs')
  } catch (error) {
    console.error('Error saving configuration:', error)
    showNotification(`Gagal menyimpan konfigurasi: ${error.message}`, 'error')
  }
}

/**
 * Menghapus konfigurasi dari server
 * @param {string} id - ID konfigurasi yang akan dihapus
 */
async function deleteConfig(id) {
  if (
    !confirm(
      'Apakah Anda yakin ingin menghapus konfigurasi ini? Ini juga akan menghapus data terkaitnya!'
    )
  ) {
    return
  }
  try {
    const response = await fetch(`/api/configs/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    showNotification('Konfigurasi berhasil dihapus!', 'success')
    fetchConfigs()
  } catch (error) {
    console.error('Error deleting configuration:', error)
    showNotification(`Gagal menghapus konfigurasi: ${error.message}`, 'error')
  }
}

/**
 * Mengisi form konfigurasi untuk diedit
 * @param {object} config - Objek konfigurasi yang akan diedit
 */
function editConfig(config) {
  showView('settings-form')
  settingsFormTitle.textContent = `Edit Konfigurasi: ${config.displayName}`
  cancelEditBtn.style.display = 'inline-block'

  currentConfig = config // Simpan konfigurasi yang sedang diedit

  // Mengisi form utama dengan variabel yang sudah diambil dengan getElementById
  configIdInput.value = config.id
  configDisplayNameInput.value = config.displayName
  configNameInput.value = config.name
  configDescriptionInput.value = config.description

  // Hapus field dan relasi yang ada sebelum mengisi ulang
  fieldsContainer.innerHTML = ''
  relationsContainer.innerHTML = ''

  // Isi field
  if (config.fields && config.fields.length > 0) {
    config.fields.forEach((field) => addFieldRow(field))
  } else {
    fieldsContainer.innerHTML =
      '<p class="placeholder-message">Belum ada field. Klik "Tambah Field Baru" untuk memulai.</p>'
  }

  // Isi relasi
  if (config.relations && config.relations.length > 0) {
    config.relations.forEach((relation) => addRelationRow(relation))
  } else {
    relationsContainer.innerHTML =
      '<p class="placeholder-message">Belum ada relasi. Klik "Tambah Relasi Baru" untuk memulai.</p>'
  }
}

/**
 * Mengambil data untuk koleksi tertentu dari server
 * @param {string} configName - Nama kode koleksi
 */
async function fetchDataForCollection(configName, page = 1) {
  currentDataPage = page // Set halaman saat ini
  dataGridContainer.innerHTML = '<p>Memuat data...</p>' // Tampilkan pesan loading
  collectionTitle.textContent = `Data Koleksi: ${currentConfig ? currentConfig.displayName : configName}`

  try {
    const response = await fetch(
      `/api/data/${configName}?page=${currentDataPage}&limit=${dataPerPage}`
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const { data, total, page: currentPage, pages: totalPages } = await response.json()
    renderCollectionData(data, total, totalPages)
  } catch (error) {
    console.error(`Error fetching data for ${configName}:`, error)
    showNotification(`Gagal memuat data koleksi: ${error.message}`, 'error')
    dataGridContainer.innerHTML = `<p>Gagal memuat data. Error: ${error.message}</p>`
  }
}

/**
 * Render data koleksi dalam bentuk tabel
 * @param {Array} data - Array data record
 * @param {number} total - Total record
 * @param {number} totalPages - Total halaman
 */
function renderCollectionData(data, total, totalPages) {
  dataGridContainer.innerHTML = ''
  if (data.length === 0) {
    dataGridContainer.innerHTML = '<p>Belum ada data untuk koleksi ini.</p>'
    dataPaginationControls.innerHTML = ''
    return
  }

  // Buat tabel
  const table = createElement('table', { className: 'data-table' })
  const thead = createElement('thead')
  const tbody = createElement('tbody')

  // Buat header tabel
  const headerRow = createElement('tr')
  if (currentConfig && currentConfig.fields) {
    // Tambahkan ID ke header, jika tidak ingin, hapus baris ini
    headerRow.appendChild(createElement('th', { textContent: 'ID' }))
    currentConfig.fields.forEach((field) => {
      headerRow.appendChild(createElement('th', { textContent: field.label }))
    })
  }
  headerRow.appendChild(createElement('th', { textContent: 'Aksi' }))
  thead.appendChild(headerRow)
  table.appendChild(thead)

  // Isi baris data
  data.forEach((record) => {
    const dataRow = createElement('tr')
    dataRow.dataset.id = record._id // Simpan ID record di dataset

    // Tambahkan ID record ke baris, jika tidak ingin, hapus baris ini
    dataRow.appendChild(createElement('td', { textContent: record._id }))

    if (currentConfig && currentConfig.fields) {
      currentConfig.fields.forEach((field) => {
        const cell = createElement('td')
        const value = record[field.name]
        // Menampilkan nilai yang lebih ramah pengguna untuk tipe data tertentu
        if (field.type === 'Boolean') {
          cell.textContent = value ? 'Ya' : 'Tidak'
        } else if (field.type === 'Date' && value) {
          cell.textContent = new Date(value).toLocaleString()
        } else if (field.inputType === 'file' && value) {
          // Jika itu adalah jalur file, buat link
          cell.innerHTML = `<a href="/uploads/${value}" target="_blank">${value.split('/').pop()}</a>`
        } else {
          cell.textContent = value || ''
        }
        dataRow.appendChild(cell)
      })
    }

    // Tombol aksi (Edit & Hapus)
    const actionsCell = createElement('td')
    const editBtn = createElement('button', {
      className: 'edit-data-btn secondary-btn',
      dataset: { id: record._id },
      innerHTML: '<i class="fa-solid fa-pencil"></i>',
    })
    const deleteBtn = createElement('button', {
      className: 'delete-data-btn danger-btn',
      dataset: { id: record._id },
      innerHTML: '<i class="fa-solid fa-trash"></i>',
    })
    actionsCell.appendChild(editBtn)
    actionsCell.appendChild(deleteBtn)
    dataRow.appendChild(actionsCell)

    tbody.appendChild(dataRow)
  })

  table.appendChild(tbody)
  dataGridContainer.appendChild(table)

  renderDataPagination(totalPages)
}

/**
 * Render kontrol paginasi untuk data koleksi
 * @param {number} totalPages - Total halaman
 */
function renderDataPagination(totalPages) {
  dataPaginationControls.innerHTML = ''
  if (totalPages <= 1) return

  const createButton = (text, page, isActive = false, isDisabled = false) => {
    const button = createElement('button', {
      textContent: text,
      className: `pagination-btn ${isActive ? 'active' : ''}`,
      dataset: { page: page },
    })
    if (isDisabled) button.disabled = true
    button.addEventListener('click', () => {
      fetchDataForCollection(currentConfig.name, page)
    })
    return button
  }

  dataPaginationControls.appendChild(
    createButton('Prev', currentDataPage - 1, false, currentDataPage === 1)
  )

  for (let i = 1; i <= totalPages; i++) {
    dataPaginationControls.appendChild(createButton(i, i, i === currentDataPage))
  }

  dataPaginationControls.appendChild(
    createButton('Next', currentDataPage + 1, false, currentDataPage === totalPages)
  )
}

/**
 * Membangun dan menampilkan modal form untuk menambah/mengedit record data
 * @param {object} record - Objek record (opsional, untuk edit)
 */
function showRecordModal(record = null) {
  recordModalForm.innerHTML = '' // Kosongkan form sebelumnya
  recordModalTitle.textContent = record ? 'Edit Data' : 'Tambah Data Baru'

  if (!currentConfig || !currentConfig.fields) {
    showNotification('Tidak ada definisi field untuk koleksi ini.', 'error')
    return
  }

  // Tambahkan input hidden untuk _id jika mengedit
  if (record && record._id) {
    const idInput = createElement('input', {
      type: 'hidden',
      id: 'record_id',
      name: '_id',
      value: record._id,
    })
    recordModalForm.appendChild(idInput)
  }

  currentConfig.fields.forEach((field) => {
    const formGroup = createElement('div', { className: 'form-group' })
    const label = createElement('label', {
      for: `recordField_${field.name}`,
      textContent: `${field.label}:`,
    })
    if (field.required) {
      label.innerHTML += '<span class="required">*</span>'
    }

    let inputElement
    const fieldValue = record ? record[field.name] : ''

    // Tentukan tipe input berdasarkan field.inputType atau field.type
    switch (field.inputType || field.type) {
      case 'textarea':
        inputElement = createElement('textarea', {
          id: `recordField_${field.name}`,
          name: field.name,
          className: 'form-control',
          rows: '3',
          textContent: fieldValue,
        })
        break
      case 'boolean': // Untuk boolean, pakai checkbox
      case 'Boolean':
        inputElement = createElement('input', {
          type: 'checkbox',
          id: `recordField_${field.name}`,
          name: field.name,
          checked: !!fieldValue, // Convert to boolean
        })
        formGroup.appendChild(inputElement) // Tambahkan checkbox sebelum label
        inputElement.after(label) // Pindahkan label setelah checkbox
        break
      case 'date':
      case 'Date':
        inputElement = createElement('input', {
          type: 'date', // HTML5 date input
          id: `recordField_${field.name}`,
          name: field.name,
          className: 'form-control',
          value: fieldValue ? new Date(fieldValue).toISOString().split('T')[0] : '',
        })
        break
      case 'datetime-local':
        inputElement = createElement('input', {
          type: 'datetime-local', // HTML5 datetime-local input
          id: `recordField_${field.name}`,
          name: field.name,
          className: 'form-control',
          value: fieldValue ? new Date(fieldValue).toISOString().substring(0, 16) : '',
        })
        break
      case 'file':
        inputElement = createElement('input', {
          type: 'file',
          id: `recordField_${field.name}`,
          name: field.name,
          className: 'form-control',
        })
        // Tampilkan nama file yang sudah ada jika mengedit
        if (fieldValue) {
          const currentFile = createElement('span', {
            innerHTML: `<br>File saat ini: <a href="/uploads/${fieldValue}" target="_blank">${fieldValue.split('/').pop()}</a>`,
          })
          formGroup.appendChild(label) // Tambahkan label terlebih dahulu
          formGroup.appendChild(inputElement) // Lalu input
          formGroup.appendChild(currentFile) // Lalu informasi file
        } else {
          formGroup.appendChild(label)
          formGroup.appendChild(inputElement)
        }
        break
      default: // Default to text input for string, number, password, email, url, color
        let inputType = field.inputType || 'text' // Fallback ke 'text'
        if (field.type === 'Number' && inputType === 'text') inputType = 'number' // Pastikan number jika tipe data Number

        inputElement = createElement('input', {
          type: inputType,
          id: `recordField_${field.name}`,
          name: field.name,
          className: 'form-control',
          value: fieldValue,
        })
        break
    }

    // Untuk checkbox, label sudah diatur berbeda
    if (field.type !== 'Boolean' && field.type !== 'boolean' && field.inputType !== 'file') {
      formGroup.appendChild(label)
      formGroup.appendChild(inputElement)
    } else if (field.inputType === 'file' && fieldValue) {
      // Sudah ditangani di atas
    } else if (field.type === 'Boolean' || field.type === 'boolean') {
      // Label sudah diatur di atas untuk checkbox
    } else {
      formGroup.appendChild(label)
      formGroup.appendChild(inputElement)
    }

    if (field.required) {
      // Atribut 'required' hanya untuk input/select/textarea, bukan untuk checkbox
      if (inputElement.tagName !== 'INPUT' || inputElement.type !== 'checkbox') {
        inputElement.setAttribute('required', '')
      }
    }
    recordModalForm.appendChild(formGroup)
  })

  recordModal.style.display = 'block'
}

/**
 * Mengambil data dari modal form record
 * @returns {FormData} Objek FormData yang berisi data record
 */
function getRecordFormData() {
  const formData = new FormData(recordModalForm)
  // Convert checkbox value to boolean for consistency
  currentConfig.fields.forEach((field) => {
    if (field.type === 'Boolean' || field.type === 'boolean') {
      formData.set(field.name, recordModalForm.querySelector(`#recordField_${field.name}`).checked)
    }
    // Handle Date and Datetime-local conversion if needed
    if ((field.type === 'Date' || field.type === 'Date') && formData.has(field.name)) {
      const dateValue = formData.get(field.name)
      if (dateValue) {
        formData.set(field.name, new Date(dateValue).toISOString())
      }
    }
  })

  return formData
}

/**
 * Menyimpan data record ke server
 * @param {FormData} formData - Objek FormData berisi data record
 */
async function saveRecord(formData) {
  const recordId = formData.get('_id')
  const isNew = !recordId
  const method = isNew ? 'POST' : 'PUT'
  const url = isNew
    ? `/api/data/${currentConfig.name}`
    : `/api/data/${currentConfig.name}/${recordId}`

  try {
    const response = await fetch(url, {
      method: method,
      body: formData, // FormData secara otomatis mengatur Content-Type untuk multipart/form-data
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const result = await response.json()
    showNotification(
      `Data berhasil disimpan untuk koleksi "${currentConfig.displayName}"!`,
      'success'
    )
    recordModal.style.display = 'none'
    fetchDataForCollection(currentConfig.name, currentDataPage) // Muat ulang data
  } catch (error) {
    console.error('Error saving record:', error)
    showNotification(`Gagal menyimpan data: ${error.message}`, 'error')
  }
}

/**
 * Menghapus data record dari server
 * @param {string} recordId - ID record yang akan dihapus
 */
async function deleteRecord(recordId) {
  if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
    return
  }
  try {
    const response = await fetch(`/api/data/${currentConfig.name}/${recordId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    showNotification('Data berhasil dihapus!', 'success')
    fetchDataForCollection(currentConfig.name, currentDataPage) // Muat ulang data
  } catch (error) {
    console.error('Error deleting record:', error)
    showNotification(`Gagal menghapus data: ${error.message}`, 'error')
  }
}

// === Event Listeners Global ===

document.addEventListener('DOMContentLoaded', () => {
  fetchConfigs() // Muat daftar konfigurasi saat halaman dimuat

  // Navigasi utama
  viewConfigsBtn.addEventListener('click', () => showView('list-configs'))
  createNewConfigBtn.addEventListener('click', (e) => {
    e.preventDefault()
    resetConfigForm() // Selalu reset form saat membuat baru
    currentConfig = null // Pastikan tidak ada konfigurasi aktif saat membuat baru
    showView('settings-form')
  })

  // Pencarian Konfigurasi
  configSearchInput.addEventListener('input', () => {
    currentConfigsPage = 1 // Reset halaman ke 1 saat mencari
    fetchConfigs()
  })

  // Submit Form Konfigurasi Koleksi
  collectionConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const configData = getFormData()
    await saveConfig(configData)
  })

  // Batal Edit Konfigurasi
  cancelEditBtn.addEventListener('click', () => {
    resetConfigForm()
    currentConfig = null
    showView('list-configs')
  })

  // Tambah Field & Relasi
  addFieldBtn.addEventListener('click', () => addFieldRow())
  addRelationBtn.addEventListener('click', () => addRelationRow())

  // Event Delegation untuk tombol di daftar konfigurasi (edit, delete, view data)
  configsGridContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-config-btn') || e.target.closest('.edit-config-btn')) {
      const id = e.target.dataset.id || e.target.closest('.edit-config-btn').dataset.id
      // Cari config di daftar yang sudah diambil, atau fetch ulang
      fetch(`/api/configs/${id}`)
        .then((res) => res.json())
        .then((config) => editConfig(config))
        .catch((error) => {
          console.error('Error fetching config for edit:', error)
          showNotification('Gagal memuat detail konfigurasi untuk diedit.', 'error')
        })
    } else if (
      e.target.classList.contains('delete-config-btn') ||
      e.target.closest('.delete-config-btn')
    ) {
      const id = e.target.dataset.id || e.target.closest('.delete-config-btn').dataset.id
      deleteConfig(id)
    } else if (e.target.classList.contains('view-data-btn') || e.target.closest('.view-data-btn')) {
      const id = e.target.dataset.id || e.target.closest('.view-data-btn').dataset.id
      const configName = e.target.dataset.name || e.target.closest('.view-data-btn').dataset.name
      // Fetch the full config to set currentConfig
      fetch(`/api/configs/${id}`)
        .then((res) => res.json())
        .then((config) => {
          currentConfig = config // Set currentConfig
          showView('content-area')
          fetchDataForCollection(configName)
        })
        .catch((error) => {
          console.error('Error fetching config for data view:', error)
          showNotification('Gagal memuat detail konfigurasi untuk melihat data.', 'error')
        })
    }
  })

  // Kembali ke Daftar Konfigurasi dari tampilan data
  backToConfigsBtn.addEventListener('click', () => {
    currentConfig = null // Hapus konfigurasi aktif
    showView('list-configs')
  })

  // Tombol Tambah Data Baru
  addRecordBtn.addEventListener('click', () => showRecordModal())

  // Event Delegation untuk tombol di tabel data (edit, delete)
  dataGridContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-data-btn') || e.target.closest('.edit-data-btn')) {
      const recordId = e.target.dataset.id || e.target.closest('.edit-data-btn').dataset.id
      try {
        const response = await fetch(`/api/data/${currentConfig.name}/${recordId}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const record = await response.json()
        showRecordModal(record)
      } catch (error) {
        console.error('Error fetching record for edit:', error)
        showNotification('Gagal memuat data untuk diedit.', 'error')
      }
    } else if (
      e.target.classList.contains('delete-data-btn') ||
      e.target.closest('.delete-data-btn')
    ) {
      const recordId = e.target.dataset.id || e.target.closest('.delete-data-btn').dataset.id
      deleteRecord(recordId)
    }
  })

  // Event listener untuk Submit Form Record Modal
  recordModalSubmitBtn.addEventListener('click', async () => {
    const formData = getRecordFormData()
    await saveRecord(formData)
  })

  // Event listener untuk Batal di Record Modal
  recordModalCancelBtn.addEventListener('click', () => {
    recordModal.style.display = 'none'
  })

  // Event listener untuk Tutup Modal Record
  recordModalCloseBtn.addEventListener('click', () => {
    recordModal.style.display = 'none'
  })

  // Tutup modal jika klik di luar area konten modal
  window.addEventListener('click', (e) => {
    if (e.target === recordModal) {
      recordModal.style.display = 'none'
    }
  })
})
console.log('RUN')
