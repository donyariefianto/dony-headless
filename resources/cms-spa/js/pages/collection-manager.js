// js/pages/collection-manager.js

import { BASE_API_URL } from '../config/constants.js'
import {
  showLoadingOverlay,
  hideLoadingOverlay,
  loadContentIntoMainArea,
  openSidePanel,
  closeSidePanel,
} from '../main.js'

export function loadCollectionManagerPage(container) {
  let currentCollectionConfig = null // Menyimpan konfigurasi koleksi yang sedang diedit

  const renderCollectionList = async () => {
    showLoadingOverlay()
    try {
      const response = await fetch(`${BASE_API_URL}/configuration/collection/list?limit=1000`) // Ambil semua konfigurasi
      if (!response.ok) throw new Error(`Failed to fetch collection configs: ${response.status}`)
      const result = await response.json()

      if (result.status && Array.isArray(result.data.documents)) {
        const collections = result.data.documents
        let listHtml = `
                    <div class="card">
                        <h2>Pengelola Konfigurasi Koleksi</h2>
                        <p class="help-text">Definisikan struktur data, field, dan relasi untuk koleksi Anda.</p>
                        <div class="table-controls" style="justify-content: flex-end;">
                            <button class="btn btn-primary" id="addNewCollectionBtn"><i class="fa-solid fa-plus"></i> Tambah Koleksi Baru</button>
                        </div>
                        <ul class="settings-list-items">
                            ${
                              collections.length > 0
                                ? collections
                                    .map(
                                      (col) => `
                                <li>
                                    <span><strong>${col.displayName || col.name}</strong> <br> <small><em>Nama Internal: ${col.name}</em></small></span>
                                    <div class="item-actions">
                                        <button class="btn btn-icon btn-edit-collection-config" data-name="${col.name}" title="Edit Konfigurasi"><i class="fa-solid fa-edit"></i></button>
                                        <button class="btn btn-icon btn-delete-collection-config" data-name="${col.name}" title="Hapus Koleksi"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </li>
                            `
                                    )
                                    .join('')
                                : '<li style="text-align: center; color: var(--secondary-color);">Belum ada koleksi yang didefinisikan.</li>'
                            }
                        </ul>
                    </div>
                `
        await loadContentIntoMainArea(listHtml, 'Collection Manager')
        attachListEventListeners()
      } else {
        await loadContentIntoMainArea(
          `<p class="alert alert-warning">Gagal memuat daftar koleksi: ${result.message_en || 'Data tidak ditemukan.'}</p>`,
          'Collection Manager Error'
        )
      }
    } catch (error) {
      console.error('Error loading collection manager page:', error)
      await loadContentIntoMainArea(
        `<p class="alert alert-danger">Terjadi kesalahan: ${error.message}</p>`,
        'Collection Manager Error'
      )
    } finally {
      hideLoadingOverlay()
    }
  }

  const renderCollectionConfigForm = async (collectionName = null) => {
    showLoadingOverlay()
    let formTitle = collectionName ? `Edit Koleksi: ${collectionName}` : 'Tambah Koleksi Baru'
    let formHtml = ''
    currentCollectionConfig = null // Reset current config

    try {
      let existingConfig = {
        name: '',
        displayName: '',
        description: '',
        fields: [],
        relations: [],
        timestamps: true,
        softDelete: false,
      }

      if (collectionName) {
        const response = await fetch(
          `${BASE_API_URL}/configuration/collection/read/${collectionName}`
        )
        if (!response.ok)
          throw new Error(`Failed to fetch config for ${collectionName}: ${response.status}`)
        const result = await response.json()
        if (result.status && result.data) {
          existingConfig = result.data
          currentCollectionConfig = result.data // Simpan untuk referensi global saat edit field
        } else {
          throw new Error('Collection configuration not found.')
        }
      } else {
        // Untuk koleksi baru, tambahkan _id, created_at, updated_at sebagai default hidden fields
        existingConfig.fields = [
          { name: '_id', type: 'string', readOnly: true, hidden: true, isRequired: true },
          { name: 'created_at', type: 'date', readOnly: true, hidden: true },
          { name: 'updated_at', type: 'date', readOnly: true, hidden: true },
        ]
      }

      // Dapatkan daftar semua koleksi yang ada untuk dropdown target_collection
      const allCollectionsResponse = await fetch(
        `${BASE_API_URL}/configuration/collection/list?limit=1000`
      )
      const allCollectionsResult = await allCollectionsResponse.json()
      const allAvailableCollections =
        allCollectionsResult.status && Array.isArray(allCollectionsResult.data.documents)
          ? allCollectionsResult.data.documents.map((c) => c.name)
          : []

      // Filter koleksi saat ini dari daftar target_collection (tidak bisa berelasi dengan dirinya sendiri)
      const targetableCollections = allAvailableCollections.filter(
        (name) => name !== collectionName
      )

      formHtml = `
                <form id="collectionConfigForm">
                    <div class="form-group">
                        <label for="collectionName">Nama Internal Koleksi (ID) <span class="required">*</span></label>
                        <input type="text" id="collectionName" name="name" class="form-input" value="${existingConfig.name}" ${collectionName ? 'readonly' : 'required'} placeholder="misal: users, products">
                        ${collectionName ? '<small class="help-text">Nama internal koleksi tidak bisa diubah.</small>' : ''}
                    </div>
                    <div class="form-group">
                        <label for="collectionDisplayName">Nama Tampilan Koleksi <span class="required">*</span></label>
                        <input type="text" id="collectionDisplayName" name="displayName" class="form-input" value="${existingConfig.displayName}" required placeholder="misal: Pengguna, Produk">
                    </div>
                    <div class="form-group">
                        <label for="collectionDescription">Deskripsi</label>
                        <textarea id="collectionDescription" name="description" class="form-input" rows="3" placeholder="Deskripsi singkat koleksi ini">${existingConfig.description}</textarea>
                    </div>

                    <hr>

                    <h3>Field Koleksi</h3>
                    <div id="fieldsContainer">
                        </div>
                    <button type="button" class="btn btn-secondary mt-3" id="addNewFieldBtn"><i class="fa-solid fa-plus"></i> Tambah Field Baru</button>

                    <hr>

                    <div class="form-group toggle-switch">
                        <label for="timestamps">Otomatisasi Timestamp (created_at, updated_at)</label>
                        <input type="checkbox" id="timestamps" name="timestamps" ${existingConfig.timestamps ? 'checked' : ''} data-type="boolean">
                        <span class="slider round"></span>
                    </div>
                    <div class="form-group toggle-switch">
                        <label for="softDelete">Soft Delete (field is_deleted)</label>
                        <input type="checkbox" id="softDelete" name="softDelete" ${existingConfig.softDelete ? 'checked' : ''} data-type="boolean">
                        <span class="slider round"></span>
                    </div>

                    <div class="form-actions mt-4">
                        <button type="submit" class="btn btn-primary" id="saveCollectionConfigBtn">
                            <i class="fa-solid fa-save"></i> Simpan Konfigurasi
                        </button>
                        <button type="button" class="btn btn-secondary btn-cancel-form">
                            <i class="fa-solid fa-times"></i> Batal
                        </button>
                    </div>
                </form>
            `
    } catch (error) {
      console.error('Error rendering collection config form:', error)
      formHtml = `<p class="alert alert-danger">Gagal memuat form konfigurasi: ${error.message}</p>`
    } finally {
      hideLoadingOverlay()
      openSidePanel(formTitle, formHtml)
      attachFormEventListeners(collectionName, existingConfig, targetableCollections)
    }
  }

  const attachListEventListeners = () => {
    container.querySelector('#addNewCollectionBtn').addEventListener('click', () => {
      renderCollectionConfigForm()
    })

    container.querySelectorAll('.btn-edit-collection-config').forEach((button) => {
      button.addEventListener('click', (e) => {
        const name = e.currentTarget.dataset.name
        renderCollectionConfigForm(name)
      })
    })

    container.querySelectorAll('.btn-delete-collection-config').forEach((button) => {
      button.addEventListener('click', async (e) => {
        const name = e.currentTarget.dataset.name
        if (
          confirm(
            `Apakah Anda yakin ingin menghapus koleksi "${name}" beserta semua datanya? Tindakan ini tidak dapat dibatalkan!`
          )
        ) {
          showLoadingOverlay()
          try {
            const response = await fetch(
              `${BASE_API_URL}/configuration/collection/delete/${name}`,
              {
                method: 'DELETE',
              }
            )
            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(
                `Failed to delete collection: ${errorData.message_en || response.statusText}`
              )
            }
            alert(`Koleksi "${name}" berhasil dihapus.`)
            renderCollectionList() // Refresh list
          } catch (error) {
            console.error('Error deleting collection config:', error)
            alert(`Gagal menghapus koleksi: ${error.message}`)
          } finally {
            hideLoadingOverlay()
          }
        }
      })
    })
  }

  const attachFormEventListeners = (collectionName, existingConfig, targetableCollections) => {
    const form = document.getElementById('collectionConfigForm')
    const fieldsContainer = document.getElementById('fieldsContainer')
    const addNewFieldBtn = document.getElementById('addNewFieldBtn')
    const cancelBtn = document.querySelector('.btn-cancel-form')

    // Render existing fields
    const renderField = (field = {}, index) => {
      // Default untuk field baru
      const isExistingField = field.name && field.type
      const fieldName = field.name || ''
      const fieldType = field.type || 'string'
      const isRequired = field.isRequired || false
      const readOnly = field.readOnly || false
      const hidden = field.hidden || false
      const placeholder = field.placeholder || ''
      const defaultValue = field.defaultValue !== undefined ? field.defaultValue : ''
      const options = Array.isArray(field.options) ? field.options.join(', ') : ''

      // Cek apakah field adalah field sistem otomatis (tidak boleh diubah atau dihapus)
      const isSystemField = ['_id', 'created_at', 'updated_at', 'is_deleted'].includes(fieldName)

      let relationFieldsHtml = ''
      let relationConfig = existingConfig.relations
        ? existingConfig.relations.find((rel) => rel.field === fieldName)
        : null
      if (relationConfig && fieldType === 'relation') {
        relationFieldsHtml = `
                    <div class="field-relation-options mt-2 p-3 border rounded">
                        <h5>Opsi Relasi</h5>
                        <div class="form-group">
                            <label for="relationType-${index}">Tipe Relasi</label>
                            <select id="relationType-${index}" class="form-input relation-type" data-index="${index}" ${isSystemField ? 'disabled' : ''}>
                                <option value="one-to-one" ${relationConfig.type === 'one-to-one' ? 'selected' : ''}>One-to-One</option>
                                <option value="one-to-many" ${relationConfig.type === 'one-to-many' ? 'selected' : ''}>One-to-Many</option>
                                <option value="many-to-one" ${relationConfig.type === 'many-to-one' ? 'selected' : ''}>Many-to-One</option>
                                <option value="many-to-many" ${relationConfig.type === 'many-to-many' ? 'selected' : ''}>Many-to-Many</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="targetCollection-${index}">Koleksi Target</label>
                            <select id="targetCollection-${index}" class="form-input target-collection" data-index="${index}" ${isSystemField ? 'disabled' : ''}>
                                <option value="">-- Pilih Koleksi --</option>
                                ${targetableCollections.map((col) => `<option value="${col}" ${relationConfig.target_collection === col ? 'selected' : ''}>${col}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="targetDisplayField-${index}">Field Tampilan Target</label>
                            <input type="text" id="targetDisplayField-${index}" class="form-input target-display-field" data-index="${index}" value="${relationConfig.target_display_field || ''}" placeholder="Nama field yang akan ditampilkan (misal: name)" ${isSystemField ? 'readonly' : ''}>
                            <small class="help-text">Nama field dari koleksi target yang akan ditampilkan di UI.</small>
                        </div>
                    </div>
                `
      }

      const fieldHtml = `
                <div class="field-item card p-3 mb-3" data-index="${index}">
                    <div class="field-header d-flex justify-content-between align-items-center">
                        <h5>Field #${index + 1}</h5>
                        <button type="button" class="btn btn-danger btn-sm ${isSystemField ? 'd-none' : 'btn-remove-field'}" data-index="${index}" ${isSystemField ? 'disabled' : ''}><i class="fa-solid fa-trash"></i> Hapus</button>
                    </div>
                    <div class="form-group">
                        <label for="fieldName-${index}">Nama Field <span class="required">*</span></label>
                        <input type="text" id="fieldName-${index}" class="form-input field-name" data-index="${index}" value="${fieldName}" ${isExistingField && !isSystemField ? 'readonly' : 'required'} ${isSystemField ? 'readonly' : ''} placeholder="misal: firstName, price">
                        ${isExistingField && !isSystemField ? '<small class="help-text">Nama field tidak bisa diubah setelah dibuat.</small>' : ''}
                        ${isSystemField ? '<small class="help-text">Ini adalah field sistem dan tidak bisa diubah.</small>' : ''}
                    </div>
                    <div class="form-group">
                        <label for="fieldType-${index}">Tipe Data <span class="required">*</span></label>
                        <select id="fieldType-${index}" class="form-input field-type" data-index="${index}" ${isSystemField ? 'disabled' : ''}>
                            <option value="string" ${fieldType === 'string' ? 'selected' : ''}>String</option>
                            <option value="number" ${fieldType === 'number' ? 'selected' : ''}>Number</option>
                            <option value="boolean" ${fieldType === 'boolean' ? 'selected' : ''}>Boolean</option>
                            <option value="text" ${fieldType === 'text' ? 'selected' : ''}>Text (Multiline String)</option>
                            <option value="date" ${fieldType === 'date' ? 'selected' : ''}>Date</option>
                            <option value="object" ${fieldType === 'object' ? 'selected' : ''}>Object (JSON)</option>
                            <option value="array" ${fieldType === 'array' ? 'selected' : ''}>Array</option>
                            <option value="relation" ${fieldType === 'relation' ? 'selected' : ''}>Relation</option>
                        </select>
                    </div>
                    
                    ${relationFieldsHtml}

                    <div class="form-group toggle-switch">
                        <label for="isRequired-${index}">Wajib Diisi</label>
                        <input type="checkbox" id="isRequired-${index}" class="field-required" data-index="${index}" ${isRequired ? 'checked' : ''} ${isSystemField ? 'disabled' : ''}>
                        <span class="slider round"></span>
                    </div>
                    <div class="form-group toggle-switch">
                        <label for="readOnly-${index}">Hanya Baca</label>
                        <input type="checkbox" id="readOnly-${index}" class="field-readonly" data-index="${index}" ${readOnly ? 'checked' : ''} ${isSystemField ? 'disabled' : ''}>
                        <span class="slider round"></span>
                    </div>
                     <div class="form-group toggle-switch">
                        <label for="hidden-${index}">Sembunyikan di Form</label>
                        <input type="checkbox" id="hidden-${index}" class="field-hidden" data-index="${index}" ${hidden ? 'checked' : ''} ${isSystemField ? 'disabled' : ''}>
                        <span class="slider round"></span>
                        <small class="help-text">Menyembunyikan field ini di form CRUD, cocok untuk field otomatis.</small>
                    </div>
                    <div class="form-group additional-options-group" style="display: ${['string', 'number', 'date', 'text'].includes(fieldType) ? 'block' : 'none'};">
                        <label for="placeholder-${index}">Placeholder</label>
                        <input type="text" id="placeholder-${index}" class="form-input field-placeholder" data-index="${index}" value="${placeholder}" placeholder="Teks bantuan di input field" ${isSystemField ? 'readonly' : ''}>
                    </div>
                     <div class="form-group additional-options-group" style="display: ${['string', 'number', 'boolean', 'date', 'text'].includes(fieldType) ? 'block' : 'none'};">
                        <label for="defaultValue-${index}">Default Value</label>
                        <input type="${fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}" id="defaultValue-${index}" class="form-input field-default-value" data-index="${index}" value="${defaultValue}" placeholder="Nilai default untuk field baru" ${isSystemField ? 'readonly' : ''}>
                    </div>
                    <div class="form-group additional-options-group" style="display: ${fieldType === 'string' ? 'block' : 'none'};">
                        <label for="options-${index}">Pilihan Opsi (untuk Dropdown/Radio)</label>
                        <input type="text" id="options-${index}" class="form-input field-options" data-index="${index}" value="${options}" placeholder="Pisahkan dengan koma: Opsi A, Opsi B" ${isSystemField ? 'readonly' : ''}>
                        <small class="help-text">Untuk field tipe 'string' yang memiliki pilihan tetap.</small>
                    </div>
                </div>
            `
      fieldsContainer.insertAdjacentHTML('beforeend', fieldHtml)

      // Re-attach event listeners for newly added field
      attachFieldEventListeners(index)
    }

    const attachFieldEventListeners = (index) => {
      const fieldItem = fieldsContainer.querySelector(`.field-item[data-index="${index}"]`)
      if (!fieldItem) return

      const fieldTypeSelect = fieldItem.querySelector(`#fieldType-${index}`)
      const fieldNameInput = fieldItem.querySelector(`#fieldName-${index}`)
      const removeFieldBtn = fieldItem.querySelector(`.btn-remove-field[data-index="${index}"]`)
      const relationTypeSelect = fieldItem.querySelector(`#relationType-${index}`)
      const targetCollectionSelect = fieldItem.querySelector(`#targetCollection-${index}`)
      const targetDisplayFieldInput = fieldItem.querySelector(`#targetDisplayField-${index}`)

      // Function to update visibility of additional options based on field type
      const updateAdditionalOptionsVisibility = () => {
        const currentType = fieldTypeSelect.value
        fieldItem.querySelectorAll('.additional-options-group').forEach((group) => {
          group.style.display = 'none'
        })
        fieldItem.querySelectorAll('.field-relation-options').forEach((group) => {
          group.style.display = 'none'
        })

        if (currentType === 'string') {
          fieldItem.querySelector('.field-placeholder').closest('.form-group').style.display =
            'block'
          fieldItem.querySelector('.field-default-value').closest('.form-group').style.display =
            'block'
          fieldItem.querySelector('.field-options').closest('.form-group').style.display = 'block'
        } else if (currentType === 'number' || currentType === 'date' || currentType === 'text') {
          fieldItem.querySelector('.field-placeholder').closest('.form-group').style.display =
            'block'
          fieldItem.querySelector('.field-default-value').closest('.form-group').style.display =
            'block'
        } else if (currentType === 'boolean') {
          fieldItem.querySelector('.field-default-value').closest('.form-group').style.display =
            'block'
        } else if (currentType === 'relation') {
          // Render relation options if not already rendered
          if (!fieldItem.querySelector('.field-relation-options')) {
            const newRelationOptionsHtml = `
                            <div class="field-relation-options mt-2 p-3 border rounded">
                                <h5>Opsi Relasi</h5>
                                <div class="form-group">
                                    <label for="relationType-${index}">Tipe Relasi</label>
                                    <select id="relationType-${index}" class="form-input relation-type" data-index="${index}">
                                        <option value="one-to-one">One-to-One</option>
                                        <option value="one-to-many">One-to-Many</option>
                                        <option value="many-to-one">Many-to-One</option>
                                        <option value="many-to-many">Many-to-Many</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="targetCollection-${index}">Koleksi Target</label>
                                    <select id="targetCollection-${index}" class="form-input target-collection" data-index="${index}">
                                        <option value="">-- Pilih Koleksi --</option>
                                        ${targetableCollections.map((col) => `<option value="${col}">${col}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="targetDisplayField-${index}">Field Tampilan Target</label>
                                    <input type="text" id="targetDisplayField-${index}" class="form-input target-display-field" data-index="${index}" placeholder="Nama field yang akan ditampilkan (misal: name)">
                                    <small class="help-text">Nama field dari koleksi target yang akan ditampilkan di UI.</small>
                                </div>
                            </div>
                        `
            fieldTypeSelect
              .closest('.form-group')
              .insertAdjacentHTML('afterend', newRelationOptionsHtml)
            // Re-fetch elements after they are added to DOM
            const newRelationTypeSelect = fieldItem.querySelector(`#relationType-${index}`)
            const newTargetCollectionSelect = fieldItem.querySelector(`#targetCollection-${index}`)
            const newTargetDisplayFieldInput = fieldItem.querySelector(
              `#targetDisplayField-${index}`
            )

            // Re-attach event listeners for newly created relation fields
            if (newRelationTypeSelect)
              newRelationTypeSelect.addEventListener('change', updateAdditionalOptionsVisibility)
            if (newTargetCollectionSelect)
              newTargetCollectionSelect.addEventListener(
                'change',
                updateAdditionalOptionsVisibility
              )
            if (newTargetDisplayFieldInput)
              newTargetDisplayFieldInput.addEventListener(
                'input',
                updateAdditionalOptionsVisibility
              )
          }
          fieldItem.querySelector('.field-relation-options').style.display = 'block'
        }
      }

      fieldTypeSelect.addEventListener('change', updateAdditionalOptionsVisibility)

      if (removeFieldBtn) {
        removeFieldBtn.addEventListener('click', () => {
          if (confirm('Apakah Anda yakin ingin menghapus field ini?')) {
            fieldItem.remove()
            // Re-index remaining fields if necessary (for display or data collection)
            // For simplicity in this demo, we'll rely on querying all fields at submission
          }
        })
      }

      // Call once to set initial visibility
      updateAdditionalOptionsVisibility()
    }

    // Render semua field yang ada
    if (existingConfig.fields && existingConfig.fields.length > 0) {
      existingConfig.fields.forEach((field, index) => {
        renderField(field, index)
      })
    }

    addNewFieldBtn.addEventListener('click', () => {
      renderField({}, fieldsContainer.children.length) // Pass empty object for new field
    })

    cancelBtn.addEventListener('click', () => {
      closeSidePanel()
      renderCollectionList() // Kembali ke daftar koleksi
    })

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      showLoadingOverlay()

      const collectionConfig = {
        name: form.elements['collectionName'].value.trim(),
        displayName: form.elements['collectionDisplayName'].value.trim(),
        description: form.elements['collectionDescription'].value.trim(),
        fields: [],
        relations: [],
        timestamps: form.elements['timestamps'].checked,
        softDelete: form.elements['softDelete'].checked,
      }

      // Collect fields data
      fieldsContainer.querySelectorAll('.field-item').forEach((fieldItemEl) => {
        const index = parseInt(fieldItemEl.dataset.index)
        const fieldName = fieldItemEl.querySelector(`#fieldName-${index}`).value.trim()
        const fieldType = fieldItemEl.querySelector(`#fieldType-${index}`).value

        // Skip if name is empty (e.g., partially filled new field)
        if (!fieldName) return

        const field = {
          name: fieldName,
          type: fieldType,
          isRequired: fieldItemEl.querySelector(`#isRequired-${index}`).checked,
          readOnly: fieldItemEl.querySelector(`#readOnly-${index}`).checked,
          hidden: fieldItemEl.querySelector(`#hidden-${index}`).checked,
        }

        // Add additional options based on type
        if (['string', 'number', 'date', 'text'].includes(fieldType)) {
          field.placeholder = fieldItemEl.querySelector(`#placeholder-${index}`).value.trim()
        }
        if (['string', 'number', 'boolean', 'date', 'text'].includes(fieldType)) {
          const defaultValueInput = fieldItemEl.querySelector(`#defaultValue-${index}`)
          if (defaultValueInput) {
            if (fieldType === 'number') {
              const val = parseFloat(defaultValueInput.value)
              field.defaultValue = isNaN(val) ? undefined : val
            } else if (fieldType === 'boolean') {
              field.defaultValue = defaultValueInput.checked
            } else if (fieldType === 'date') {
              field.defaultValue = defaultValueInput.value || undefined // Store as string date
            } else {
              field.defaultValue = defaultValueInput.value || undefined
            }
          }
        }
        if (fieldType === 'string') {
          const optionsInput = fieldItemEl.querySelector(`#options-${index}`)
          if (optionsInput && optionsInput.value.trim()) {
            field.options = optionsInput.value.split(',').map((opt) => opt.trim())
          }
        }

        collectionConfig.fields.push(field)

        // Collect relation data if type is 'relation'
        if (fieldType === 'relation') {
          const relationType = fieldItemEl.querySelector(`#relationType-${index}`).value
          const targetCollection = fieldItemEl.querySelector(`#targetCollection-${index}`).value
          const targetDisplayField = fieldItemEl
            .querySelector(`#targetDisplayField-${index}`)
            .value.trim()

          if (!targetCollection) {
            alert(`Field relasi '${fieldName}' memerlukan Koleksi Target.`)
            hideLoadingOverlay()
            return // Stop form submission
          }

          collectionConfig.relations.push({
            field: fieldName,
            type: relationType,
            target_collection: targetCollection,
            target_display_field: targetDisplayField,
          })
        }
      })

      console.log('Saving collection config:', collectionConfig)

      try {
        const method = collectionName ? 'PUT' : 'POST'
        const url = collectionName
          ? `${BASE_API_URL}/configuration/collection/update/${collectionName}`
          : `${BASE_API_URL}/configuration/collection/create`

        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectionConfig),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(
            `Failed to save configuration: ${errorData.message_en || response.statusText}`
          )
        }

        alert(`Konfigurasi koleksi "${collectionConfig.displayName}" berhasil disimpan.`)
        closeSidePanel()
        renderCollectionList() // Refresh daftar koleksi
      } catch (error) {
        console.error('Error saving collection configuration:', error)
        alert(`Gagal menyimpan konfigurasi: ${error.message}`)
      } finally {
        hideLoadingOverlay()
      }
    })
  }

  renderCollectionList()
}
