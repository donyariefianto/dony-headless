// js/pages/collections.js

import { BASE_API_URL } from '../config/constants.js'
import {
  showLoadingOverlay,
  hideLoadingOverlay,
  loadContentIntoMainArea,
  closeSidePanel,
  openSidePanel,
} from '../main.js'

export function loadCollectionsPage(container) {
  let currentPage = 1
  let currentLimit = 5
  let currentSearch = ''

  // Variabel untuk menyimpan preferensi kolom yang ditampilkan per koleksi
  // Format: { 'collectionName': ['_id', 'field1', 'field2'], ... }
  let columnPreferences = JSON.parse(localStorage.getItem('collectionColumnPreferences')) || {}

  // Variabel untuk menyimpan skema koleksi saat ini, digunakan oleh form CRUD
  let currentCollectionSchema = {}

  // Get side panel elements (even if not used for config anymore, might be useful)
  const sidePanel = document.getElementById('sidePanel')
  const sidePanelOverlay = document.getElementById('sidePanelOverlay')
  const sidePanelTitle = document.getElementById('sidePanelTitle')
  const sidePanelContent = document.getElementById('sidePanelContent')
  const closeSidePanelBtn = document.getElementById('closeSidePanelBtn')

  if (closeSidePanelBtn) closeSidePanelBtn.onclick = closeSidePanel
  if (sidePanelOverlay) sidePanelOverlay.onclick = closeSidePanel

  // Fungsi untuk menampilkan pesan error di area utama
  const displayErrorInMainContent = async (message) => {
    const errorHtml = `
            <div class="card">
                <div class="alert alert-danger">
                    <h3>Error!</h3>
                    <p>${message}</p>
                    <button class="btn btn-secondary" onclick="window.location.reload()" style="margin-top: 15px;">Refresh Halaman</button>
                </div>
            </div>
        `
    await loadContentIntoMainArea(errorHtml, 'Error')
  }

  // Fungsi untuk menyimpan preferensi kolom ke localStorage
  const saveColumnPreferences = (collectionName, selectedFields) => {
    columnPreferences[collectionName] = selectedFields
    localStorage.setItem('collectionColumnPreferences', JSON.stringify(columnPreferences))
  }

  // Fungsi untuk mendapatkan preferred fields atau default fields
  const getPreferredFields = (collectionName, allFields) => {
    if (columnPreferences[collectionName] && columnPreferences[collectionName].length > 0) {
      // Filter out any preferred fields that no longer exist in allFields
      return columnPreferences[collectionName].filter((field) => allFields.includes(field))
    }
    // Default fields to show if no preference or preference is empty
    const defaultFields = ['_id'] // Always show _id
    const commonDefaultFields = ['created_at', 'updated_at'] // Other common fields

    commonDefaultFields.forEach((field) => {
      if (allFields.includes(field) && !defaultFields.includes(field)) {
        defaultFields.push(field)
      }
    })
    return defaultFields
  }

  // --- FUNGSI BARU: renderDataCrudForm ---
  const renderDataCrudForm = async (collectionName, displayName, dataId = null) => {
    showLoadingOverlay()
    let formHtml = ''
    let panelTitle = dataId ? `Edit ${displayName} Data` : `Tambah ${displayName} Data Baru`
    let existingData = {} // Untuk data yang akan diedit

    try {
      // Ambil skema koleksi untuk menentukan field dan relasi
      const configResponse = await fetch(
        `${BASE_API_URL}/configuration/collection/read/${collectionName}`
      )
      if (!configResponse.ok) {
        throw new Error(
          `Failed to fetch collection config for form! status: ${configResponse.status}`
        )
      }
      const configResult = await configResponse.json()
      if (configResult.status && configResult.data) {
        currentCollectionSchema = configResult.data // Simpan skema ke variabel global
      } else {
        throw new Error('Collection schema not found or API issue.')
      }

      // Jika mode edit, ambil data yang sudah ada
      if (dataId) {
        const dataResponse = await fetch(`${BASE_API_URL}/api/${collectionName}/${dataId}`)
        if (!dataResponse.ok) {
          throw new Error(`Failed to fetch data for editing! status: ${dataResponse.status}`)
        }
        const dataResult = await dataResponse.json()
        if (dataResult.status && dataResult.data) {
          existingData = dataResult.data
        } else {
          throw new Error('Data for editing not found or API issue.')
        }
      }

      // Bangun form berdasarkan skema
      let formFieldsHtml = ''
      // Ambil semua field dari skema (baik fields biasa maupun yang didefinisikan sebagai relasi)
      const allFields = currentCollectionSchema.fields || []

      for (const field of allFields) {
        const fieldName = field.name

        // Abaikan field created_at dan updated_at di form CRUD
        if (fieldName === 'created_at' || fieldName === 'updated_at') {
          continue // Lewati iterasi ini, jangan render field
        }

        const fieldType = field.type
        const fieldLabel = fieldName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        const fieldValue = existingData[fieldName] !== undefined ? existingData[fieldName] : ''
        const isRequired = field.isRequired || false
        const isReadOnly = field.readOnly || (fieldName === '_id' && dataId)
        const placeholder = field.placeholder || ''

        if (fieldName === '_id' && !dataId) continue

        if (fieldType === 'relation') {
          const relationConfig = currentCollectionSchema.relations
            ? currentCollectionSchema.relations.find((rel) => rel.field === fieldName)
            : null

          if (!relationConfig) {
            console.warn(
              `Relasi untuk field '${fieldName}' tidak ditemukan dalam skema 'relations'.`
            )
            formFieldsHtml += `
                            <div class="form-group">
                                <label for="${fieldName}">${fieldLabel} ${isRequired ? '<span class="required">*</span>' : ''}</label>
                                <input type="text" id="${fieldName}" name="${fieldName}" class="form-input" value="[Relasi Tidak Terdefinisi]" readonly>
                            </div>
                        `
            continue
          }

          const targetCollection = relationConfig.target_collection
          const relationType = relationConfig.type
          const targetDisplayField = relationConfig.target_display_field || '_id'

          let currentRelationDisplay = ''
          let currentRelationIds = []

          if (relationType === 'one-to-one' || relationType === 'many-to-one') {
            if (fieldValue) {
              currentRelationIds = fieldValue
              const relatedItemResponse = await fetch(
                `${BASE_API_URL}/api/${targetCollection}/${fieldValue}`
              )
              if (relatedItemResponse.ok) {
                const relatedItem = await relatedItemResponse.json()
                currentRelationDisplay = relatedItem.data
                  ? relatedItem.data[targetDisplayField]
                  : `ID: ${fieldValue}`
              } else {
                currentRelationDisplay = `ID: ${fieldValue} (Error)`
              }
            } else {
              currentRelationDisplay = '<span class="help-text">Belum ada item terhubung.</span>'
            }
          } else if (relationType === 'one-to-many' || relationType === 'many-to-many') {
            if (Array.isArray(fieldValue) && fieldValue.length > 0) {
              currentRelationIds = fieldValue
              const relatedItems = await Promise.all(
                fieldValue.map((id) =>
                  fetch(`${BASE_API_URL}/api/${targetCollection}/${id}`)
                    .then((res) => res.json())
                    .then((data) => (data.data ? data.data[targetDisplayField] : `ID: ${id}`))
                    .catch(() => `ID: ${id} (Error)`)
                )
              )
              currentRelationDisplay = relatedItems
                .filter((item) => !item.includes('(Error)'))
                .map((item) => `<span class="relation-badge">${item}</span>`)
                .join('')

              if (currentRelationDisplay === '') {
                currentRelationDisplay = '<span class="help-text">Tidak ada item terhubung.</span>'
              }
            } else {
              currentRelationDisplay = '<span class="help-text">Belum ada item terhubung.</span>'
            }
          }

          formFieldsHtml += `
                        <div class="form-group relation-field">
                            <label for="${fieldName}">${fieldLabel} (${relationType}) ${isRequired ? '<span class="required">*</span>' : ''}</label>
                            <div class="relation-input-group">
                                <div id="${fieldName}-display" class="relation-display">${currentRelationDisplay}</div>
                                <input type="hidden" id="${fieldName}" name="${fieldName}" class="form-input" value="${Array.isArray(currentRelationIds) ? JSON.stringify(currentRelationIds) : currentRelationIds || ''}" ${isReadOnly ? 'readonly' : ''}>
                                <button type="button" class="btn btn-secondary btn-icon btn-open-relation-picker" 
                                    data-field-name="${fieldName}"
                                    data-relation-config='${JSON.stringify(relationConfig)}'
                                    data-current-ids='${Array.isArray(currentRelationIds) ? JSON.stringify(currentRelationIds) : currentRelationIds || ''}'
                                    ${isReadOnly ? 'disabled' : ''}>
                                    <i class="fa-solid fa-ellipsis"></i> ${relationType.includes('many') ? 'Kelola' : 'Pilih'}
                                </button>
                            </div>
                        </div>
                    `
        } else {
          let inputType = 'text'
          let inputAttributes = ''
          let additionalClass = ''
          if (fieldType === 'number') {
            inputType = 'number'
          } else if (fieldType === 'boolean') {
            inputType = 'checkbox'
            inputAttributes += ` ${fieldValue ? 'checked' : ''}`
            additionalClass = 'toggle-switch'
          } else if (fieldType === 'text') {
            formFieldsHtml += `
                            <div class="form-group">
                                <label for="${fieldName}">${fieldLabel} ${isRequired ? '<span class="required">*</span>' : ''}</label>
                                <textarea id="${fieldName}" name="${fieldName}" class="form-input" rows="5" ${isRequired ? 'required' : ''} ${isReadOnly ? 'readonly' : ''} placeholder="${placeholder}">${fieldValue}</textarea>
                            </div>
                        `
            continue
          } else if (fieldType === 'date') {
            inputType = 'date'
            const dateValue = fieldValue ? new Date(fieldValue).toISOString().split('T')[0] : ''
            inputAttributes += ` value="${dateValue}"`
          }
          if (fieldName === '_id') {
            inputAttributes += ` readonly`
          }

          formFieldsHtml += `
                        <div class="form-group ${additionalClass}">
                            <label for="${fieldName}">${fieldLabel} ${isRequired ? '<span class="required">*</span>' : ''}</label>
                            ${
                              inputType === 'checkbox'
                                ? `
                                <input type="checkbox" id="${fieldName}" name="${fieldName}" ${inputAttributes} data-type="boolean" ${isReadOnly ? 'disabled' : ''}>
                                <span class="slider round"></span>
                            `
                                : `
                                <input type="${inputType}" id="${fieldName}" name="${fieldName}" class="form-input" value="${fieldValue}" ${isRequired ? 'required' : ''} ${isReadOnly ? 'readonly' : ''} placeholder="${placeholder}" ${inputAttributes}>
                            `
                            }
                        </div>
                    `
        }
      }

      formHtml = `
                <form id="crudDataForm">
                    ${formFieldsHtml}
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" id="saveDataBtn">
                            <i class="fa-solid fa-save"></i> ${dataId ? 'Simpan Perubahan' : 'Tambah Data'}
                        </button>
                        <button type="button" class="btn btn-secondary btn-cancel-form">
                            <i class="fa-solid fa-times"></i> Batal
                        </button>
                    </div>
                </form>
            `
    } catch (error) {
      console.error('Error rendering CRUD form:', error)
      formHtml = `<p class="alert alert-danger">Gagal memuat form: ${error.message}</p>`
    } finally {
      hideLoadingOverlay()
      openSidePanel(panelTitle, formHtml)
      attachCrudFormEventListeners(collectionName, displayName, dataId)
    }
  }

  const renderCollectionForm = async (collection = {}) => {
    const isEdit = !!collection.name
    const panelTitle = isEdit
      ? `Edit Koleksi: ${collection.displayName || collection.name}`
      : 'Buat Koleksi Baru'

    const renderFieldRow = (field = {}) => {
      const fieldType = field.type || 'string'
      const fieldName = field.name || ''
      const isRequired = field.isRequired || false
      const isReadOnly = field.readOnly || false
      const isSystemField =
        ['_id', 'created_at', 'updated_at'].includes(fieldName) || fieldType === 'relation'

      const disabledAttr = isSystemField ? 'disabled' : ''
      const relationFieldDisabled = fieldType === 'relation' ? 'disabled' : ''
      const draggableAttr = isSystemField ? '' : 'draggable="true"'

      return `
              <tr class="field-row" data-field-name="${fieldName}" ${draggableAttr}>
                  <td class="drag-handle">${!isSystemField ? '<i class="fa-solid fa-grip-vertical"></i>' : ''}</td>
                  <td>
                      <input type="text" name="fieldName" class="form-input field-name-input" value="${fieldName}" placeholder="contoh: judul" required ${disabledAttr}>
                      ${isSystemField ? `<input type="hidden" name="fieldName" value="${fieldName}">` : ''}
                  </td>
                  <td>
                      <select name="fieldType" class="form-input field-type-select" ${disabledAttr} ${relationFieldDisabled}>
                          <option value="string" ${fieldType === 'string' ? 'selected' : ''}>Teks Singkat</option>
                          <option value="text" ${fieldType === 'text' ? 'selected' : ''}>Teks Panjang</option>
                          <option value="number" ${fieldType === 'number' ? 'selected' : ''}>Angka</option>
                          <option value="boolean" ${fieldType === 'boolean' ? 'selected' : ''}>Boolean (Ya/Tidak)</option>
                          <option value="date" ${fieldType === 'date' ? 'selected' : ''}>Tanggal</option>
                          <option value="relation" ${fieldType === 'relation' ? 'selected' : ''} ${isEdit ? '' : 'disabled'}>Relasi (didefinisikan di bawah)</option>
                      </select>
                      ${isSystemField ? `<input type="hidden" name="fieldType" value="${fieldType}">` : ''}
                  </td>
                  <td class="center-align">
                      <input type="checkbox" name="fieldIsRequired" ${isRequired ? 'checked' : ''} ${disabledAttr}>
                      ${isSystemField ? `<input type="hidden" name="fieldIsRequired" value="${isRequired}">` : ''}
                  </td>
                  <td class="center-align">
                      <input type="checkbox" name="fieldIsReadOnly" ${isReadOnly ? 'checked' : ''} ${disabledAttr}>
                      ${isSystemField ? `<input type="hidden" name="fieldIsReadOnly" value="${isReadOnly}">` : ''}
                  </td>
                  <td>
                      ${!isSystemField ? `<button type="button" class="btn btn-icon btn-delete-field" aria-label="Hapus Field"><i class="fa-solid fa-trash"></i></button>` : ''}
                  </td>
              </tr>
          `
    }

    const renderRelationRow = (relation = {}) => {
      const fieldName = relation.field || ''
      const targetCollection = relation.target_collection || ''
      const relationType = relation.type || 'one-to-one'
      const targetDisplayField = relation.target_display_field || ''

      return `
            <tr class="relation-row" draggable="true">
                <td class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></td>
                <td>
                    <input type="text" name="relationField" class="form-input relation-field-input" value="${fieldName}" placeholder="contoh: author" required>
                </td>
                <td>
                    <select name="relationType" class="form-input relation-type-select">
                        <option value="one-to-one" ${relationType === 'one-to-one' ? 'selected' : ''}>One-to-one</option>
                        <option value="one-to-many" ${relationType === 'one-to-many' ? 'selected' : ''}>One-to-many</option>
                        <option value="many-to-one" ${relationType === 'many-to-one' ? 'selected' : ''}>Many-to-one</option>
                        <option value="many-to-many" ${relationType === 'many-to-many' ? 'selected' : ''}>Many-to-many</option>
                    </select>
                </td>
                <td>
                    <input type="text" name="targetCollection" class="form-input target-collection-input" value="${targetCollection}" placeholder="contoh: users" required>
                </td>
                <td>
                    <input type="text" name="targetDisplayField" class="form-input target-display-field-input" value="${targetDisplayField}" placeholder="contoh: nama">
                </td>
                <td>
                    <button type="button" class="btn btn-icon btn-delete-relation" aria-label="Hapus Relasi"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `
    }

    const formHtml = `
          <form id="collectionDetailForm">
              <div class="form-section">
                  <h3>Detail Koleksi</h3>
                  <div class="form-group">
                      <label for="collectionName">Nama Koleksi (Internal, unik)</label>
                      <input type="text" id="collectionName" name="name" class="form-input" value="${collection.name || ''}" placeholder="contoh: products, users" required ${isEdit ? 'readonly' : ''}>
                      ${isEdit ? '<span class="help-text">Nama koleksi tidak dapat diubah setelah dibuat.</span>' : '<span class="help-text">Gunakan nama yang unik dan tidak mengandung spasi atau karakter khusus (contoh: products, user_data).</span>'}
                  </div>
                  <div class="form-group">
                      <label for="collectionDisplayName">Nama Tampilan (Opsional)</label>
                      <input type="text" id="collectionDisplayName" name="displayName" class="form-input" value="${collection.displayName || ''}" placeholder="contoh: Produk, Data Pengguna">
                      <span class="help-text">Nama ini akan ditampilkan di antarmuka pengguna.</span>
                  </div>
                  <div class="form-group">
                      <label for="collectionDescription">Deskripsi (Opsional)</label>
                      <textarea id="collectionDescription" name="description" class="form-input" rows="3" placeholder="Deskripsi singkat tentang koleksi ini">${collection.description || ''}</textarea>
                  </div>
              </div>

              <div class="form-section">
                  <h3>Skema & Fields Koleksi</h3>
                  <p class="help-text">Tambahkan dan konfigurasikan fields untuk koleksi ini. Gunakan drag-and-drop untuk menyusun ulang.</p>
                  <table class="field-table">
                      <thead>
                          <tr>
                              <th style="width: 1%;"></th>
                              <th>Nama Field</th>
                              <th>Tipe Data</th>
                              <th style="width: 1%; text-align: center;">Required</th>
                              <th style="width: 1%; text-align: center;">Read Only</th>
                              <th style="width: 1%;"></th>
                          </tr>
                      </thead>
                      <tbody id="fieldTableBody">
                          ${
                            isEdit && collection.fields && collection.fields.length > 0
                              ? collection.fields
                                  .filter(
                                    (field) => !['created_at', 'updated_at'].includes(field.name)
                                  )
                                  .map((field) => renderFieldRow(field))
                                  .join('')
                              : renderFieldRow({ name: '_id', type: 'string', readOnly: true })
                          }
                      </tbody>
                  </table>
                  <div class="form-actions" style="margin-top: 15px; justify-content: flex-start;">
                      <button type="button" class="btn btn-secondary" id="addFieldBtn">
                          <i class="fa-solid fa-plus"></i> Tambah Field Baru
                      </button>
                  </div>
              </div>
              
              <div class="form-section">
                  <h3>Relasi Koleksi</h3>
                  <p class="help-text">Hubungkan koleksi ini dengan koleksi lain. Gunakan drag-and-drop untuk menyusun ulang.</p>
                  <table class="relation-table">
                      <thead>
                          <tr>
                              <th style="width: 1%;"></th>
                              <th>Nama Field</th>
                              <th>Tipe Relasi</th>
                              <th>Target Koleksi</th>
                              <th>Field Tampilan Target (Opsional)</th>
                              <th style="width: 1%;"></th>
                          </tr>
                      </thead>
                      <tbody id="relationTableBody">
                          ${
                            isEdit && collection.relations && collection.relations.length > 0
                              ? collection.relations
                                  .map((relation) => renderRelationRow(relation))
                                  .join('')
                              : ''
                          }
                      </tbody>
                  </table>
                  <div class="form-actions" style="margin-top: 15px; justify-content: flex-start;">
                      <button type="button" class="btn btn-secondary" id="addRelationBtn">
                          <i class="fa-solid fa-plus"></i> Tambah Relasi Baru
                      </button>
                  </div>
              </div>
              
              <div class="form-actions">
                  <button type="submit" class="btn btn-primary" id="saveCollectionBtn">
                      <i class="fa-solid fa-save"></i> ${isEdit ? 'Simpan Perubahan' : 'Buat Koleksi'}
                  </button>
                  <button type="button" class="btn btn-secondary btn-cancel-form">
                      <i class="fa-solid fa-times"></i> Batal
                  </button>
              </div>
          </form>
      `

    openSidePanel(panelTitle, formHtml)
    attachCollectionFormEventListeners(isEdit, collection)
  }

  const attachCollectionFormEventListeners = (isEditMode, originalCollection = {}) => {
    const collectionDetailForm = document.getElementById('collectionDetailForm')
    const cancelBtn = sidePanelContent.querySelector('.btn-cancel-form')
    const fieldTableBody = document.getElementById('fieldTableBody')
    const relationTableBody = document.getElementById('relationTableBody')
    const addFieldBtn = document.getElementById('addFieldBtn')
    const addRelationBtn = document.getElementById('addRelationBtn')

    const attachFieldRowListeners = (row) => {
      const deleteBtn = row.querySelector('.btn-delete-field')
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          row.remove()
        })
      }
    }

    const attachRelationRowListeners = (row) => {
      const deleteBtn = row.querySelector('.btn-delete-relation')
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          row.remove()
        })
      }
    }

    // --- LOGIKA BARU: Drag and Drop ---
    let draggedRow = null

    const handleDragStart = (e) => {
      draggedRow = e.target.closest('tr')
      e.dataTransfer.effectAllowed = 'move'
      // Add a class to indicate dragging state
      setTimeout(() => draggedRow.classList.add('dragging'), 0)
    }

    const handleDragEnd = (e) => {
      draggedRow.classList.remove('dragging')
      draggedRow = null
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      const targetRow = e.target.closest('tr')
      if (targetRow && draggedRow && targetRow !== draggedRow) {
        const bounding = targetRow.getBoundingClientRect()
        const offset = bounding.y + bounding.height / 2
        if (e.clientY - offset > 0) {
          targetRow.style.borderBottom = '2px solid var(--primary-color)'
          targetRow.style.borderTop = ''
        } else {
          targetRow.style.borderTop = '2px solid var(--primary-color)'
          targetRow.style.borderBottom = ''
        }
      }
    }

    const handleDragLeave = (e) => {
      const targetRow = e.target.closest('tr')
      if (targetRow) {
        targetRow.style.borderTop = ''
        targetRow.style.borderBottom = ''
      }
    }

    const handleDrop = (e) => {
      e.preventDefault()
      const dropTargetRow = e.target.closest('tr')
      const parentTableBody = dropTargetRow.parentElement

      if (dropTargetRow && draggedRow && dropTargetRow !== draggedRow) {
        const bounding = dropTargetRow.getBoundingClientRect()
        const offset = bounding.y + bounding.height / 2
        if (e.clientY - offset > 0) {
          parentTableBody.insertBefore(draggedRow, dropTargetRow.nextSibling)
        } else {
          parentTableBody.insertBefore(draggedRow, dropTargetRow)
        }
      }
      // Bersihkan border
      parentTableBody.querySelectorAll('tr').forEach((row) => {
        row.style.borderTop = ''
        row.style.borderBottom = ''
      })
    }

    // Attach drag-and-drop listeners
    const setupDragAndDrop = (tableBody) => {
      tableBody.querySelectorAll('tr').forEach((row) => {
        if (row.draggable) {
          row.addEventListener('dragstart', handleDragStart)
          row.addEventListener('dragover', handleDragOver)
          row.addEventListener('dragleave', handleDragLeave)
          row.addEventListener('drop', handleDrop)
          row.addEventListener('dragend', handleDragEnd)
        }
      })
    }

    // Panggil fungsi setup untuk tabel fields dan relations
    setupDragAndDrop(fieldTableBody)
    setupDragAndDrop(relationTableBody)

    // Attach delete listeners to initial field rows
    fieldTableBody.querySelectorAll('.field-row').forEach(attachFieldRowListeners)
    relationTableBody.querySelectorAll('.relation-row').forEach(attachRelationRowListeners)

    if (addFieldBtn) {
      addFieldBtn.addEventListener('click', () => {
        const newRow = document.createElement('tr')
        newRow.classList.add('field-row')
        newRow.setAttribute('draggable', 'true')
        newRow.innerHTML = `
                  <td class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></td>
                  <td><input type="text" name="fieldName" class="form-input field-name-input" placeholder="contoh: judul" required></td>
                  <td>
                      <select name="fieldType" class="form-input field-type-select">
                          <option value="string">Teks Singkat</option>
                          <option value="text">Teks Panjang</option>
                          <option value="number">Angka</option>
                          <option value="boolean">Boolean (Ya/Tidak)</option>
                          <option value="date">Tanggal</option>
                          <option value="relation" disabled>Relasi (didefinisikan di bawah)</option>
                      </select>
                  </td>
                  <td class="center-align"><input type="checkbox" name="fieldIsRequired"></td>
                  <td class="center-align"><input type="checkbox" name="fieldIsReadOnly"></td>
                  <td><button type="button" class="btn btn-icon btn-delete-field"><i class="fa-solid fa-trash"></i></button></td>
              `
        fieldTableBody.appendChild(newRow)
        attachFieldRowListeners(newRow)
        // Panggil ulang setup drag-and-drop untuk baris baru
        setupDragAndDrop(fieldTableBody)
      })
    }

    if (addRelationBtn) {
      addRelationBtn.addEventListener('click', () => {
        const newRow = document.createElement('tr')
        newRow.classList.add('relation-row')
        newRow.setAttribute('draggable', 'true')
        newRow.innerHTML = `
                  <td class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></td>
                  <td><input type="text" name="relationField" class="form-input relation-field-input" placeholder="contoh: author" required></td>
                  <td>
                      <select name="relationType" class="form-input relation-type-select">
                          <option value="one-to-one">One-to-one</option>
                          <option value="one-to-many">One-to-many</option>
                          <option value="many-to-one">Many-to-one</option>
                          <option value="many-to-many">Many-to-many</option>
                      </select>
                  </td>
                  <td><input type="text" name="targetCollection" class="form-input target-collection-input" placeholder="contoh: users" required></td>
                  <td><input type="text" name="targetDisplayField" class="form-input target-display-field-input" placeholder="contoh: nama"></td>
                  <td><button type="button" class="btn btn-icon btn-delete-relation" aria-label="Hapus Relasi"><i class="fa-solid fa-trash"></i></button></td>
              `
        relationTableBody.appendChild(newRow)
        attachRelationRowListeners(newRow)
        // Panggil ulang setup drag-and-drop untuk baris baru
        setupDragAndDrop(relationTableBody)
      })
    }

    if (collectionDetailForm) {
      collectionDetailForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        showLoadingOverlay()

        const name = collectionDetailForm.querySelector('#collectionName').value.trim()
        const displayName = collectionDetailForm
          .querySelector('#collectionDisplayName')
          .value.trim()
        const description = collectionDetailForm
          .querySelector('#collectionDescription')
          .value.trim()

        if (!name) {
          alert('Nama Koleksi (Internal) harus diisi.')
          hideLoadingOverlay()
          return
        }

        // Ambil data fields dari tabel dinamis
        const fieldRows = fieldTableBody.querySelectorAll('.field-row')
        const fields = []
        let hasDuplicateFields = false
        const fieldNames = new Set()

        fieldRows.forEach((row) => {
          const fieldNameInput = row.querySelector('input[name="fieldName"]')
          const fieldName = fieldNameInput.value.trim()

          if (fieldName) {
            if (fieldNames.has(fieldName)) {
              hasDuplicateFields = true
            }
            fieldNames.add(fieldName)

            const fieldTypeInput = row.querySelector('select[name="fieldType"]')
            const fieldType = fieldTypeInput.value
            const isRequired = row.querySelector('input[name="fieldIsRequired"]').checked
            const isReadOnly = row.querySelector('input[name="fieldIsReadOnly"]').checked

            fields.push({
              name: fieldName,
              type: fieldType,
              isRequired: isRequired,
              readOnly: isReadOnly,
            })
          }
        })

        // Ambil data relasi dari tabel dinamis
        const relationRows = relationTableBody.querySelectorAll('.relation-row')
        const relations = []
        let hasDuplicateRelations = false

        relationRows.forEach((row) => {
          const field = row.querySelector('input[name="relationField"]').value.trim()
          const type = row.querySelector('select[name="relationType"]').value
          const target_collection = row.querySelector('input[name="targetCollection"]').value.trim()
          const target_display_field = row
            .querySelector('input[name="targetDisplayField"]')
            .value.trim()

          if (field && type && target_collection) {
            if (fieldNames.has(field)) {
              hasDuplicateRelations = true
            }
            fieldNames.add(field)

            relations.push({
              field: field,
              type: type,
              target_collection: target_collection,
              target_display_field: target_display_field || undefined,
            })
          }
        })

        if (hasDuplicateFields || hasDuplicateRelations) {
          alert('Nama field tidak boleh ada yang sama antara fields biasa dan relasi.')
          hideLoadingOverlay()
          return
        }

        // Tambahkan field relasi ke dalam array fields
        relations.forEach((rel) => {
          const existingField = fields.find((f) => f.name === rel.field)
          if (existingField) {
            existingField.type = 'relation'
          } else {
            fields.push({
              name: rel.field,
              type: 'relation',
              isRequired: false,
              readOnly: false,
            })
          }
        })

        // Tambahkan field sistem built-in jika belum ada (terutama saat buat baru)
        const systemFields = [
          { name: 'created_at', type: 'date', isRequired: false, readOnly: true },
          { name: 'updated_at', type: 'date', isRequired: false, readOnly: true },
        ]
        systemFields.forEach((sf) => {
          if (!fieldNames.has(sf.name)) {
            fields.push(sf)
          }
        })

        const payload = {
          displayName: displayName || name,
          description: description,
          fields: fields,
          relations: relations,
        }

        let method = 'POST'
        let url = `${BASE_API_URL}/configuration/collection/create`

        if (isEditMode) {
          method = 'PUT'
          url = `${BASE_API_URL}/configuration/collection/update/${name}`
        } else {
          payload.name = name
        }

        try {
          const response = await fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(
              `Gagal ${isEditMode ? 'memperbarui' : 'membuat'} koleksi: ${errorData.message_en || response.statusText}`
            )
          }

          const result = await response.json()
          alert(`Koleksi "${name}" berhasil ${isEditMode ? 'diperbarui' : 'dibuat'}!`)
          closeSidePanel()
          fetchCollections()
        } catch (error) {
          console.error('Error saving collection:', error)
          alert(`Gagal menyimpan koleksi: ${error.message}`)
        } finally {
          hideLoadingOverlay()
        }
      })
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeSidePanel)
    }
  }

  const openRelationPickerModal = async (fieldConfig, currentSelectedIds, updateCallback) => {
    showLoadingOverlay()
    const targetCollectionName = fieldConfig.target_collection
    const relationType = fieldConfig.type
    const targetDisplayField = fieldConfig.target_display_field || '_id'

    let modalContentHtml = ''
    let modalTitle = `Pilih ${targetCollectionName.charAt(0).toUpperCase() + targetCollectionName.slice(1)}`

    try {
      const response = await fetch(`${BASE_API_URL}/api/${targetCollectionName}?limit=1000`)
      if (!response.ok) {
        throw new Error(`Failed to fetch related items: ${response.status}`)
      }
      const result = await response.json()

      if (result.status && Array.isArray(result.data.documents)) {
        const items = result.data.documents
        let listItemsHtml = ''

        if (items.length === 0) {
          listItemsHtml =
            '<p class="alert alert-warning">Tidak ada item yang tersedia di koleksi ini.</p>'
        } else {
          listItemsHtml = items
            .map((item) => {
              const itemId = item._id
              const itemDisplay = item[targetDisplayField] || itemId

              let isSelected = false
              if (Array.isArray(currentSelectedIds)) {
                isSelected = currentSelectedIds.includes(itemId)
              } else {
                isSelected = currentSelectedIds === itemId
              }

              if (relationType === 'one-to-one' || relationType === 'many-to-one') {
                return `
                                <label class="relation-item-option">
                                    <input type="radio" name="relationSelect" value="${itemId}" ${isSelected ? 'checked' : ''}>
                                    <span>${itemDisplay}</span>
                                </label>
                            `
              } else {
                return `
                                <label class="relation-item-option">
                                    <input type="checkbox" name="relationSelect" value="${itemId}" ${isSelected ? 'checked' : ''}>
                                    <span>${itemDisplay}</span>
                                </label>
                            `
              }
            })
            .join('')
        }

        modalContentHtml = `
                    <div class="relation-picker-body">
                        <div class="search-box" style="margin-bottom: 15px;">
                            <input type="text" id="relationSearchInput" placeholder="Cari..." class="form-input">
                            <button class="btn btn-primary" id="relationSearchBtn"><i class="fa-solid fa-search"></i></button>
                        </div>
                        <div class="relation-list-items">
                            ${listItemsHtml}
                        </div>
                        <div class="form-actions" style="margin-top: 20px;">
                            <button type="button" class="btn btn-primary" id="selectRelationBtn">Pilih</button>
                            <button type="button" class="btn btn-secondary btn-cancel-relation-picker">Batal</button>
                        </div>
                    </div>
                `
      } else {
        modalContentHtml = `<p class="alert alert-warning">Gagal memuat item relasi: ${result.message_en || 'Data tidak ditemukan.'}</p>`
      }
    } catch (error) {
      console.error('Error opening relation picker modal:', error)
      modalContentHtml = `<p class="alert alert-danger">Terjadi kesalahan: ${error.message}</p>`
    } finally {
      hideLoadingOverlay()
      openSidePanel(modalTitle, modalContentHtml)

      const relationPickerEl = document.getElementById('sidePanelContent')

      const selectRelationBtn = relationPickerEl.querySelector('#selectRelationBtn')
      const cancelRelationBtn = relationPickerEl.querySelector('.btn-cancel-relation-picker')

      if (selectRelationBtn) {
        selectRelationBtn.addEventListener('click', () => {
          let selectedIds = []
          if (relationType === 'one-to-one' || relationType === 'many-to-one') {
            const selectedRadio = relationPickerEl.querySelector(
              'input[name="relationSelect"]:checked'
            )
            if (selectedRadio) {
              selectedIds = selectedRadio.value
            } else {
              selectedIds = null
            }
          } else {
            relationPickerEl
              .querySelectorAll('input[name="relationSelect"]:checked')
              .forEach((checkbox) => {
                selectedIds.push(checkbox.value)
              })
          }
          updateCallback(selectedIds)
          closeSidePanel()
        })
      }

      if (cancelRelationBtn) {
        cancelRelationBtn.addEventListener('click', closeSidePanel)
      }

      const relationSearchInput = relationPickerEl.querySelector('#relationSearchInput')
      const relationSearchBtn = relationPickerEl.querySelector('#relationSearchBtn')
      const relationListItems = relationPickerEl.querySelector('.relation-list-items')

      const filterRelationList = () => {
        const searchTerm = relationSearchInput.value.toLowerCase()
        if (relationListItems) {
          relationListItems.querySelectorAll('.relation-item-option').forEach((label) => {
            const text = label.textContent.toLowerCase()
            if (text.includes(searchTerm)) {
              label.style.display = 'flex'
            } else {
              label.style.display = 'none'
            }
          })
        }
      }

      if (relationSearchBtn) relationSearchBtn.addEventListener('click', filterRelationList)
      if (relationSearchInput) {
        relationSearchInput.addEventListener('keyup', filterRelationList)
      }
    }
  }

  const attachCrudFormEventListeners = (collectionName, displayName, dataId = null) => {
    const crudDataForm = document.getElementById('crudDataForm')
    const saveDataBtn = sidePanelContent.querySelector('#saveDataBtn')
    const cancelBtn = sidePanelContent.querySelector('.btn-cancel-form')

    if (crudDataForm) {
      crudDataForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        showLoadingOverlay()

        const formData = new FormData(crudDataForm)
        const dataToSave = {}

        const allFields = currentCollectionSchema.fields || []
        for (const field of allFields) {
          const fieldName = field.name
          const fieldType = field.type

          if (fieldName === '_id' && !dataId) continue

          let value
          if (fieldType === 'boolean') {
            const checkbox = crudDataForm.querySelector(`#${fieldName}`)
            value = checkbox ? checkbox.checked : false
          } else if (fieldType === 'relation') {
            const hiddenInput = crudDataForm.querySelector(`#${fieldName}`)
            if (hiddenInput && hiddenInput.value) {
              try {
                value = JSON.parse(hiddenInput.value)
              } catch (e) {
                value = hiddenInput.value
              }
            } else {
              value = null
            }
          } else if (fieldType === 'number') {
            value = parseFloat(formData.get(fieldName))
            if (isNaN(value)) value = null
          } else if (fieldType === 'date') {
            value = formData.get(fieldName) || null
          } else {
            value = formData.get(fieldName)
          }
          dataToSave[fieldName] = value
        }

        if (dataId) {
          dataToSave._id = dataId
        }

        console.log('Data to save:', dataToSave)

        try {
          const method = dataId ? 'PUT' : 'POST'
          const url = dataId
            ? `${BASE_API_URL}/api/${collectionName}/${dataId}`
            : `${BASE_API_URL}/api/${collectionName}`

          const response = await fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSave),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Failed to save data: ${errorData.message_en || response.statusText}`)
          }

          const result = await response.json()
          alert(`Data berhasil ${dataId ? 'diperbarui' : 'ditambahkan'}!`)
          closeSidePanel()
          renderCollectionDataList(
            collectionName,
            displayName,
            currentPage,
            currentLimit,
            currentSearch
          )
        } catch (error) {
          console.error('Error saving data:', error)
          alert(`Gagal menyimpan data: ${error.message}`)
        } finally {
          hideLoadingOverlay()
        }
      })
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        closeSidePanel()
      })
    }

    sidePanelContent.querySelectorAll('.btn-open-relation-picker').forEach((button) => {
      button.addEventListener('click', (e) => {
        const fieldName = e.currentTarget.dataset.fieldName
        const relationConfig = JSON.parse(e.currentTarget.dataset.relationConfig)
        const currentIdsRaw = e.currentTarget.dataset.currentIds
        let currentIds = []
        try {
          currentIds = JSON.parse(currentIdsRaw)
        } catch (e) {
          currentIds = currentIdsRaw
        }

        openRelationPickerModal(relationConfig, currentIds, async (selectedIds) => {
          const hiddenInput = document.getElementById(fieldName)
          const displayDiv = document.getElementById(`${fieldName}-display`)

          if (hiddenInput) {
            if (Array.isArray(selectedIds)) {
              hiddenInput.value = JSON.stringify(selectedIds)
            } else {
              hiddenInput.value = selectedIds || ''
            }

            if (displayDiv) {
              if (relationConfig.type === 'one-to-one' || relationConfig.type === 'many-to-one') {
                if (selectedIds) {
                  const relatedItemPromise = fetch(
                    `${BASE_API_URL}/api/${relationConfig.target_collection}/${selectedIds}`
                  )
                    .then((res) => res.json())
                    .then((data) =>
                      data.data
                        ? data.data[relationConfig.target_display_field || '_id']
                        : `ID: ${selectedIds}`
                    )
                    .catch(() => `ID: ${selectedIds} (Error)`)
                  relatedItemPromise.then((displayName) => {
                    displayDiv.innerHTML = displayName
                  })
                } else {
                  displayDiv.innerHTML = '<span class="help-text">Belum ada item terhubung.</span>'
                }
              } else {
                if (Array.isArray(selectedIds) && selectedIds.length > 0) {
                  const relatedItemsPromises = selectedIds.map((id) =>
                    fetch(`${BASE_API_URL}/api/${relationConfig.target_collection}/${id}`)
                      .then((res) => res.json())
                      .then((data) =>
                        data.data
                          ? data.data[relationConfig.target_display_field || '_id']
                          : `ID: ${id}`
                      )
                      .catch(() => `ID: ${id} (Error)`)
                  )
                  Promise.all(relatedItemsPromises).then((displayNames) => {
                    displayDiv.innerHTML = displayNames
                      .filter((name) => !name.includes('(Error)'))
                      .map((name) => `<span class="relation-badge">${name}</span>`)
                      .join('')
                    if (displayDiv.innerHTML === '') {
                      displayDiv.innerHTML =
                        '<span class="help-text">Belum ada item terhubung.</span>'
                    }
                  })
                } else {
                  displayDiv.innerHTML = '<span class="help-text">Belum ada item terhubung.</span>'
                }
              }
            }
          }
        })
      })
    })
  }

  const renderCollectionDataList = async (
    collectionName,
    displayName,
    page = 1,
    limit = 10,
    search = ''
  ) => {
    const newPageTitle = `Data: ${displayName || collectionName}`
    showLoadingOverlay()

    let dataListHtml = ''
    let availableFields = []
    currentCollectionSchema = {}

    try {
      const configResponse = await fetch(
        `${BASE_API_URL}/configuration/collection/read/${collectionName}`
      )
      if (!configResponse.ok) {
        throw new Error(`Failed to fetch collection config! status: ${configResponse.status}`)
      }
      const configResult = await configResponse.json()
      if (configResult.status && configResult.data) {
        currentCollectionSchema = configResult.data
        availableFields = currentCollectionSchema.fields.map((f) => f.name)
        if (!availableFields.includes('_id')) availableFields.unshift('_id')
        if (!availableFields.includes('created_at')) availableFields.push('created_at')
        if (!availableFields.includes('updated_at')) availableFields.push('updated_at')
      } else {
        console.warn('No fields found in collection configuration or config fetch failed.')
        availableFields = ['_id', 'created_at', 'updated_at']
      }

      const currentDisplayFields = getPreferredFields(collectionName, availableFields)

      const dataUrl = `${BASE_API_URL}/api/${collectionName}?page=${page}&limit=${limit}&search=${search}`
      console.log(`Fetching data for collection '${collectionName}':`, dataUrl)
      const dataResponse = await fetch(dataUrl)
      if (!dataResponse.ok) {
        throw new Error(`HTTP error! status: ${dataResponse.status}`)
      }
      const dataResult = await dataResponse.json()

      if (dataResult.status && dataResult.data && Array.isArray(dataResult.data.documents)) {
        const { documents, totalCount, totalPages, currentPage: pageNum } = dataResult.data

        closeSidePanel()

        const columnPickerHtml = `
                    <div class="column-picker-container">
                        <button class="btn btn-secondary btn-icon" id="toggleColumnPickerBtn">
                            <i class="fa-solid fa-columns"></i> Pilih Kolom
                        </button>
                        <div class="column-picker-dropdown" id="columnPickerDropdown">
                            ${availableFields
                              .map(
                                (field) => `
                                <label>
                                    <input type="checkbox" 
                                           class="column-toggle-checkbox" 
                                           data-field="${field}" 
                                           ${currentDisplayFields.includes(field) ? 'checked' : ''}>
                                    ${field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                </label>
                            `
                              )
                              .join('')}
                        </div>
                    </div>
                `

        dataListHtml = `
                    <div class="card">
                        <h2>${newPageTitle}</h2>
                        <p class="help-text">Mengelola data aktual dari koleksi "${displayName || collectionName}".</p>
                        
                        <div class="table-controls">
                            <div class="search-box" style="max-width: none;">
                                <input type="text" id="collectionDataSearchInput" placeholder="Cari data di ${displayName || collectionName}..." value="${search}">
                                <button id="searchDataButton" class="btn btn-primary"><i class="fa-solid fa-search"></i></button>
                                ${search ? `<button id="clearDataSearchButton" class="btn btn-secondary"><i class="fa-solid fa-times"></i></button>` : ''}
                            </div>
                            <div class="right-controls">
                                ${columnPickerHtml}
                                <button class="btn btn-primary" id="createNewDataBtn" data-collection-name="${collectionName}" data-display-name="${displayName}"><i class="fa-solid fa-plus"></i> Tambah Data Baru</button>
                            </div>
                        </div>

                        <div class="data-table-container" style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        ${currentDisplayFields.map((header) => `<th>${header.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</th>`).join('')}
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${
                                      documents.length > 0
                                        ? documents
                                            .map(
                                              (doc) => `
                                        <tr>
                                            ${currentDisplayFields
                                              .map((header) => {
                                                let cellValue = doc[header]
                                                const fieldSchema = (
                                                  currentCollectionSchema.fields || []
                                                ).find((f) => f.name === header)
                                                let isJsonCell = false

                                                if (
                                                  fieldSchema &&
                                                  fieldSchema.type === 'relation'
                                                ) {
                                                  const relationConfig = (
                                                    currentCollectionSchema.relations || []
                                                  ).find((rel) => rel.field === header)
                                                  if (relationConfig) {
                                                    const targetDisplayField =
                                                      relationConfig.target_display_field || '_id'
                                                    if (
                                                      relationConfig.type === 'one-to-one' ||
                                                      relationConfig.type === 'many-to-one'
                                                    ) {
                                                      cellValue = cellValue || '-'
                                                    } else {
                                                      cellValue = Array.isArray(cellValue)
                                                        ? `(${cellValue.length} item${cellValue.length !== 1 ? 's' : ''})`
                                                        : '-'
                                                    }
                                                  } else {
                                                    cellValue = JSON.stringify(cellValue) || '-'
                                                    isJsonCell = true
                                                  }
                                                } else if (
                                                  typeof cellValue === 'object' &&
                                                  cellValue !== null
                                                ) {
                                                  cellValue = JSON.stringify(cellValue, null, 2)
                                                  isJsonCell = true
                                                } else if (
                                                  (header === 'created_at' ||
                                                    header === 'updated_at') &&
                                                  cellValue
                                                ) {
                                                  try {
                                                    const date = new Date(cellValue)
                                                    cellValue = date.toLocaleString('id-ID', {
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                      second: '2-digit',
                                                    })
                                                  } catch (e) {
                                                    cellValue = cellValue
                                                  }
                                                }

                                                return `<td ${isJsonCell ? 'class="json-cell"' : ''}>${isJsonCell ? `<code>${cellValue}</code>` : cellValue || '-'}</td>`
                                              })
                                              .join('')}
                                            <td>
                                                <button class="btn btn-icon btn-edit-data" data-id="${doc._id}" data-collection="${collectionName}" data-display-name="${displayName}" title="Edit Data"><i class="fa-solid fa-edit"></i></button>
                                                <button class="btn btn-icon btn-delete-data" data-id="${doc._id}" data-collection="${collectionName}" data-display-name="${displayName}" title="Hapus Data"><i class="fa-solid fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    `
                                            )
                                            .join('')
                                        : `<tr><td colspan="${currentDisplayFields.length + 1}" style="text-align: center; color: var(--secondary-color);">Tidak ada data di koleksi ini.</td></tr>`
                                    }
                                </tbody>
                            </table>
                        </div>

                        <div class="pagination-controls">
                            <p>Total: ${totalCount} data</p>
                            <div class="pagination-buttons">
                                <button class="btn btn-secondary pagination-btn" data-page="prev" ${pageNum === 1 ? 'disabled' : ''}>Previous</button>
                                <span>Page ${pageNum} of ${totalPages}</span>
                                <button class="btn btn-secondary pagination-btn" data-page="next" ${pageNum === totalPages ? 'disabled' : ''}>Next</button>
                            </div>
                        </div>

                        <div class="form-actions" style="justify-content: flex-start; margin-top: 40px;">
                            <button type="button" class="btn btn-secondary btn-back-to-collection-list">
                                <i class="fa-solid fa-arrow-left"></i> Kembali ke Daftar Koleksi
                            </button>
                        </div>
                    </div>
                `
      } else {
        dataListHtml = `<p class="alert alert-warning">Gagal memuat data koleksi: ${dataResult.message_en || 'Data tidak ditemukan atau ada masalah dengan API.'}</p>`
      }
    } catch (error) {
      console.error('Error fetching collection data or config:', error)
      dataListHtml = `<p class="alert alert-danger">Terjadi kesalahan saat memuat data koleksi: ${error.message}. Pastikan server berjalan.</p>`
    } finally {
      await loadContentIntoMainArea(dataListHtml, newPageTitle)
      attachDataListEventListeners(
        collectionName,
        displayName,
        page,
        limit,
        search,
        availableFields
      )
    }
  }

  const attachDataListEventListeners = (
    collectionName,
    displayName,
    currentPage,
    currentLimit,
    currentSearch,
    availableFields
  ) => {
    container.querySelectorAll('.pagination-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.page
        let newPage = currentPage
        const totalPagesElement = container.querySelector('.pagination-buttons span')
        if (totalPagesElement) {
          const totalPages = parseInt(totalPagesElement.textContent.split(' of ')[1])
          if (action === 'prev' && currentPage > 1) {
            newPage--
          } else if (action === 'next' && currentPage < totalPages) {
            newPage++
          }
        }
        renderCollectionDataList(collectionName, displayName, newPage, currentLimit, currentSearch)
      })
    })

    const searchInput = container.querySelector('#collectionDataSearchInput')
    const searchButton = container.querySelector('#searchDataButton')
    const clearSearchButton = container.querySelector('#clearDataSearchButton')

    if (searchButton) {
      searchButton.addEventListener('click', () => {
        const newSearch = searchInput.value
        renderCollectionDataList(collectionName, displayName, 1, currentLimit, newSearch)
      })
    }
    if (clearSearchButton) {
      clearSearchButton.addEventListener('click', () => {
        searchInput.value = ''
        renderCollectionDataList(collectionName, displayName, 1, currentLimit, '')
      })
    }
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          searchButton.click()
        }
      })
    }

    const backToCollectionListBtn = container.querySelector('.btn-back-to-collection-list')
    if (backToCollectionListBtn) {
      backToCollectionListBtn.addEventListener('click', () => {
        fetchCollections()
      })
    }

    const createNewDataBtn = container.querySelector('#createNewDataBtn')
    if (createNewDataBtn) {
      createNewDataBtn.addEventListener('click', (e) => {
        const collection = e.currentTarget.dataset.collectionName
        const display = e.currentTarget.dataset.displayName
        renderDataCrudForm(collection, display)
      })
    }

    container.querySelectorAll('.btn-edit-data').forEach((button) => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id
        const collection = e.currentTarget.dataset.collection
        const display = e.currentTarget.dataset.displayName
        renderDataCrudForm(collection, display, id)
      })
    })

    container.querySelectorAll('.btn-delete-data').forEach((button) => {
      button.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id
        const collection = e.currentTarget.dataset.collection
        const display = e.currentTarget.dataset.displayName

        if (
          confirm(
            `Apakah Anda yakin ingin menghapus data dengan ID: ${id} dari koleksi "${display}"?`
          )
        ) {
          showLoadingOverlay()
          try {
            const response = await fetch(`${BASE_API_URL}/api/${collection}/${id}`, {
              method: 'DELETE',
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(
                `Failed to delete data: ${errorData.message_en || response.statusText}`
              )
            }

            alert(`Data dengan ID: ${id} berhasil dihapus.`)
            renderCollectionDataList(collection, display, currentPage, currentLimit, currentSearch)
          } catch (error) {
            console.error('Error deleting data:', error)
            alert(`Gagal menghapus data: ${error.message}`)
          } finally {
            hideLoadingOverlay()
          }
        }
      })
    })

    const toggleColumnPickerBtn = container.querySelector('#toggleColumnPickerBtn')
    const columnPickerDropdown = container.querySelector('#columnPickerDropdown')

    if (toggleColumnPickerBtn && columnPickerDropdown) {
      toggleColumnPickerBtn.addEventListener('click', (event) => {
        event.stopPropagation()
        columnPickerDropdown.classList.toggle('show')
      })

      document.addEventListener('click', (event) => {
        if (
          !toggleColumnPickerBtn.contains(event.target) &&
          !columnPickerDropdown.contains(event.target)
        ) {
          columnPickerDropdown.classList.remove('show')
        }
      })

      columnPickerDropdown.querySelectorAll('.column-toggle-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          const selectedFields = Array.from(
            columnPickerDropdown.querySelectorAll('.column-toggle-checkbox:checked')
          ).map((cb) => cb.dataset.field)

          const idCheckbox = columnPickerDropdown.querySelector('input[data-field="_id"]')
          if (idCheckbox) {
            if (!selectedFields.includes('_id')) {
              selectedFields.unshift('_id')
              idCheckbox.checked = true
            }
            if (selectedFields.length === 1 && selectedFields[0] === '_id' && !checkbox.checked) {
              alert('Kolom "_id" harus selalu ditampilkan.')
              checkbox.checked = true
              return
            }
            if (idCheckbox.dataset.field === '_id') {
              idCheckbox.disabled = true
            }
          }

          saveColumnPreferences(collectionName, selectedFields)
          renderCollectionDataList(
            collectionName,
            displayName,
            currentPage,
            currentLimit,
            currentSearch
          )
        })
      })
      const idCheckbox = columnPickerDropdown.querySelector('input[data-field="_id"]')
      if (idCheckbox) {
        idCheckbox.disabled = true
      }
    }
  }

  const fetchCollections = async () => {
    showLoadingOverlay()

    container.innerHTML = `
            <div class="card">
                <h2>Pengelola Koleksi (Tabel)</h2>
                <p class="help-text">Lihat dan kelola data aktual dari koleksi Anda.</p>
                <div class="settings-group">
                    <h4>Daftar Koleksi</h4>
                    <div id="collectionListContent">
                        </div>
                </div>
            </div>
        `
    const collectionListContent = container.querySelector('#collectionListContent')

    try {
      const url = `${BASE_API_URL}/configuration/collection/list?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}`
      console.log('Fetching collections:', url)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()

      if (result.status && result.data) {
        const {
          documents,
          totalCount,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
        } = result.data
        currentPage = pageNum
        currentLimit = limitNum

        let listHtml = `
                    <div class="table-controls">
                        <div class="search-box">
                            <input type="text" id="collectionSearchInput" placeholder="Cari Koleksi..." value="${currentSearch}">
                            <button id="searchButton" class="btn btn-primary"><i class="fa-solid fa-search"></i></button>
                            ${currentSearch ? `<button id="clearSearchButton" class="btn btn-secondary"><i class="fa-solid fa-times"></i></button>` : ''}
                        </div>
                        <div class="right-controls">
                             <button class="btn btn-primary" id="createNewCollectionBtn"><i class="fa-solid fa-plus"></i> Buat Koleksi Baru</button>
                        </div>
                    </div>

                    <ul class="settings-list-items">
                        ${
                          documents.length > 0
                            ? documents
                                .map(
                                  (collection) => `
                            <li data-name="${collection.name}">
                                <span><strong>${collection.displayName || collection.name}</strong> <br> <small><em>Nama Internal: ${collection.name}</em></small></span>
                                <div class="item-actions">
                                    <button class="btn btn-icon btn-view-collection-data-main" data-name="${collection.name}" data-display-name="${collection.displayName || collection.name}" aria-label="Lihat Data Koleksi"><i class="fa-solid fa-table"></i> Lihat Data</button>
                                    <button class="btn btn-icon btn-edit-collection" data-name="${collection.name}" aria-label="Edit Koleksi"><i class="fa-solid fa-edit"></i></button>
                                    <button class="btn btn-icon btn-delete-collection" data-name="${collection.name}" data-display-name="${collection.displayName || collection.name}" aria-label="Hapus Koleksi"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </li>
                        `
                                )
                                .join('')
                            : '<li style="text-align: center; color: var(--secondary-color);">Tidak ada koleksi yang ditemukan.</li>'
                        }
                    </ul>

                    <div class="pagination-controls">
                        <p>Total: ${totalCount} koleksi</p>
                        <div class="pagination-buttons">
                            <button class="btn btn-secondary pagination-btn" data-page="prev" ${pageNum === 1 ? 'disabled' : ''}>Previous</button>
                            <span>Page ${pageNum} of ${totalPages}</span>
                            <button class="btn btn-secondary pagination-btn" data-page="next" ${pageNum === totalPages ? 'disabled' : ''}>Next</button>
                        </div>
                    </div>
                `
        collectionListContent.innerHTML = listHtml
        attachEventListeners()
      } else {
        displayErrorInMainContent(result.message_en || 'Gagal mengambil data koleksi.')
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
      displayErrorInMainContent(
        `Terjadi kesalahan saat memuat data: ${error.message}. Pastikan server berjalan di ${BASE_API_URL}.`
      )
    } finally {
      hideLoadingOverlay()
    }
  }

  const attachEventListeners = () => {
    container.querySelectorAll('.btn-view-collection-data-main').forEach((button) => {
      button.addEventListener('click', (e) => {
        const collectionName = e.currentTarget.dataset.name
        const displayName = e.currentTarget.dataset.displayName
        renderCollectionDataList(collectionName, displayName)
      })
    })

    const createNewCollectionBtn = container.querySelector('#createNewCollectionBtn')
    if (createNewCollectionBtn) {
      createNewCollectionBtn.addEventListener('click', () => {
        renderCollectionForm()
      })
    }

    container.querySelectorAll('.btn-edit-collection').forEach((button) => {
      button.addEventListener('click', async (e) => {
        const collectionName = e.currentTarget.dataset.name
        showLoadingOverlay()
        try {
          const response = await fetch(
            `${BASE_API_URL}/configuration/collection/read/${collectionName}`
          )
          if (!response.ok) {
            throw new Error(`Failed to fetch collection config! status: ${response.status}`)
          }
          const result = await response.json()
          if (result.status && result.data) {
            renderCollectionForm(result.data)
          } else {
            alert('Gagal memuat detail koleksi.')
          }
        } catch (error) {
          console.error('Error fetching collection for edit:', error)
          alert(`Terjadi kesalahan: ${error.message}`)
        } finally {
          hideLoadingOverlay()
        }
      })
    })

    container.querySelectorAll('.btn-delete-collection').forEach((button) => {
      button.addEventListener('click', async (e) => {
        const collectionName = e.currentTarget.dataset.name
        const displayName = e.currentTarget.dataset.displayName
        if (
          confirm(
            `Apakah Anda yakin ingin menghapus koleksi "${displayName}" beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`
          )
        ) {
          showLoadingOverlay()
          try {
            const response = await fetch(
              `${BASE_API_URL}/configuration/collection/delete/${collectionName}`,
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
            alert(`Koleksi "${displayName}" berhasil dihapus.`)
            fetchCollections()
          } catch (error) {
            console.error('Error deleting collection:', error)
            alert(`Gagal menghapus koleksi: ${error.message}`)
          } finally {
            hideLoadingOverlay()
          }
        }
      })
    })

    container.querySelectorAll('.pagination-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.page
        if (action === 'prev' && currentPage > 1) {
          currentPage--
        } else if (
          action === 'next' &&
          currentPage <
            parseInt(
              container.querySelector('.pagination-buttons span').textContent.split(' of ')[1]
            )
        ) {
          currentPage++
        }
        fetchCollections()
      })
    })

    const searchInput = container.querySelector('#collectionSearchInput')
    const searchButton = container.querySelector('#searchButton')
    const clearSearchButton = container.querySelector('#clearSearchButton')

    if (searchButton) {
      searchButton.addEventListener('click', () => {
        currentSearch = searchInput.value
        currentPage = 1
        fetchCollections()
      })
    }

    if (clearSearchButton) {
      clearSearchButton.addEventListener('click', () => {
        searchInput.value = ''
        currentSearch = ''
        currentPage = 1
        fetchCollections()
      })
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          searchButton.click()
        }
      })
    }
  }

  fetchCollections()
}
