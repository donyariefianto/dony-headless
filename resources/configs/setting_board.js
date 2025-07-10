const addWidgetdBtn = document.getElementById('add-widget-btn')
const saveDashboardBtn = document.getElementById('data-dashboard-form')
const errorMessage = document.getElementById('error-message')
  const successMessage = document.getElementById('success-message')

let currentCollections = [] // Mock data for collections
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const dom = {
    // Dashboard specific elements
    dashboardConfigView: document.getElementById('dashboard-config-view'), // This view is now implicitly handled by sidebar
    addDashboardWidgetBtn: document.getElementById('add-dashboard-widget-btn'),
    dashboardForm: document.getElementById('dashboard-form'),
    dashboardIdInput: document.getElementById('data-dashboard-id'),
    dashboardNameInput: document.getElementById('dashboard-name'),
    dashboardDescriptionInput: document.getElementById('dashboard-description'),
    dashboardWidgetsContainer: document.getElementById('dashboard-widgets-container'),
    noWidgetsPlaceholder: document.getElementById('no-widgets-placeholder'),
    saveDashboardBtn: document.getElementById('save-dashboard-btn'),
    previewDashboardBtn: document.getElementById('preview-dashboard-btn'), // New preview button
  }
  /**
   * Renders dynamic options for a widget based on its type.
   * @param {HTMLElement} container - The container element for widget-specific options.
   * @param {string} type - The type of the widget ('chart', 'table', 'single-value', etc.).
   * @param {object} optionsData - Existing options data to pre-fill the form.
   * @param {Array<object>} collectionFields - Fields of the selected collection to populate dropdowns.
   */
  function renderWidgetOptions(container, type, optionsData = {}, collectionFields = []) {
    container.innerHTML = '' // Clear existing options
    let html = ''
    const fieldOptions = collectionFields
      .map((f) => `<option value="${f.name}">${f.displayName || f.name}</option>`)
      .join('')

    switch (type) {
      case 'chart':
        html = `
        <div class="sortable-list">
          <div class="form-group">
              <label for="chart-type">Tipe Chart:</label>
              <select class="form-control chart-type-select">
                  <option value="bar" ${optionsData.chartType === 'bar' ? 'selected' : ''}>Bar</option>
                  <option value="line" ${optionsData.chartType === 'line' ? 'selected' : ''}>Line</option>
                  <option value="pie" ${optionsData.chartType === 'pie' ? 'selected' : ''}>Pie</option>
              </select>
          </div>
          <div class="form-group">
              <label for="chart-x-axis">Sumbu X (Field Kategori):</label>
              <select class="form-control chart-x-axis-select">
                  <option value="">Pilih Field...</option>
                  ${fieldOptions}
              </select>
          </div>
          <div class="form-group">
              <label for="chart-y-axis">Sumbu Y (Field Nilai):</label>
              <select class="form-control chart-y-axis-select">
                  <option value="">Pilih Field...</option>
                  ${fieldOptions}
              </select>
          </div>
          <div class="form-group">
              <label for="chart-title">Judul Chart:</label>
              <input type="text" class="form-control chart-title-input" value="${optionsData.title || ''}" />
          </div>
        </div>`
        break
      case 'table':
        html = `
          <div class="sortable-list">
            <div class="form-group">
                <label for="table-fields">Field yang Ditampilkan (pisahkan dengan koma):</label>
                <input type="text" class="form-control table-fields-input" value="${optionsData.fields ? optionsData.fields.join(', ') : ''}" placeholder="field1, field2, field3" />
            </div>
            <div class="form-group">
                <label for="table-limit">Batas Baris:</label>
                <input type="number" class="form-control table-limit-input" value="${optionsData.limit || 10}" min="1" />
            </div>
          </div>
          `
        break
      case 'single-value':
        html = `
          <div class="sortable-list">
              <div class="form-group">
                  <label for="single-value-field">Field untuk Ditampilkan:</label>
                  <select class="form-control single-value-field-select">
                      <option value="">Pilih Field...</option>
                      ${fieldOptions}
                  </select>
              </div>
              <div class="form-group">
                  <label for="single-value-aggregation">Agregasi (opsional):</label>
                  <select class="form-control single-value-aggregation-select">
                      <option value="" ${optionsData.aggregation === '' ? 'selected' : ''}>Tidak Ada</option>
                      <option value="count" ${optionsData.aggregation === 'count' ? 'selected' : ''}>Jumlah (Count)</option>
                      <option value="sum" ${optionsData.aggregation === 'sum' ? 'selected' : ''}>Total (Sum)</option>
                      <option value="avg" ${optionsData.aggregation === 'avg' ? 'selected' : ''}>Rata-rata (Average)</option>
                      <option value="min" ${optionsData.aggregation === 'min' ? 'selected' : ''}>Minimum</option>
                      <option value="max" ${optionsData.aggregation === 'max' ? 'selected' : ''}>Maksimum</option>
                  </select>
              </div>
              <div class="form-group">
                  <label for="single-value-label">Label Nilai:</label>
                  <input type="text" class="form-control single-value-label-input" value="${optionsData.label || ''}" />
              </div>
          </div>`
        break
      case 'custom-text':
        html = `
        <div class="sortable-list">
              <div class="form-group">
                  <label for="custom-text-content">Konten Teks/HTML:</label>
                  <textarea class="form-control custom-text-content" rows="5">${optionsData.content || ''}</textarea>
              </div>
              <div class="form-group form-check">
                  <input type="checkbox" class="form-check-input custom-text-is-html" id="custom-text-is-html" ${optionsData.isHtml ? 'checked' : ''}>
                  <label class="form-check-label" for="custom-text-is-html">Interpretasi sebagai HTML</label>
              </div>
              <div class="form-group">
                  <label for="custom-text-css-class">Kelas CSS Kustom (opsional):</label>
                  <input type="text" class="form-control custom-text-css-class" value="${optionsData.cssClass || ''}" />
              </div>
              <div class="form-group">
                  <label for="custom-text-title">Judul Widget Teks (opsional):</label>
                  <input type="text" class="form-control custom-text-title" value="${optionsData.title || ''}" />
              </div>
        </div>
          `
        break
      case 'image':
        html = `
        <div class="sortable-list">
              <div class="form-group">
                  <label for="image-url">URL Gambar:</label>
                  <input type="url" class="form-control image-url" value="${optionsData.imageUrl || ''}" required />
              </div>
              <div class="form-group">
                  <label for="image-alt-text">Teks Alternatif Gambar:</label>
                  <input type="text" class="form-control image-alt-text" value="${optionsData.altText || ''}" />
              </div>
              <div class="form-group">
                  <label for="image-link-url">URL Tautan (opsional):</label>
                  <input type="url" class="form-control image-link-url" value="${optionsData.linkUrl || ''}" />
              </div>
              <div class="form-group">
                  <label for="image-width">Lebar (mis. 100%, 200px):</label>
                  <input type="text" class="form-control image-width" value="${optionsData.width || ''}" />
              </div>
              <div class="form-group">
                  <label for="image-height">Tinggi (mis. 150px):</label>
                  <input type="text" class="form-control image-height" value="${optionsData.height || ''}" />
              </div>
              <div class="form-group">
                  <label for="image-caption">Keterangan Gambar (opsional):</label>
                  <input type="text" class="form-control image-caption" value="${optionsData.caption || ''}" />
              </div>
            </div>
          `
        break
      case 'map':
        html = `
        <div class="sortable-list">
              <div class="form-group">
                  <label for="map-provider">Penyedia Peta:</label>
                  <select class="form-control map-provider-select">
                      <option value="openstreetmap" ${optionsData.mapProvider === 'openstreetmap' ? 'selected' : ''}>OpenStreetMap</option>
                      <option value="googlemaps" ${optionsData.mapProvider === 'googlemaps' ? 'selected' : ''}>Google Maps (Butuh API Key)</option>
                  </select>
              </div>
              <div class="form-group">
                  <label for="map-latitude-field">Bidang Lintang (Latitude):</label>
                  <select class="form-control map-latitude-field-select">
                      <option value="">Pilih Field...</option>
                      ${fieldOptions}
                  </select>
              </div>
              <div class="form-group">
                  <label for="map-longitude-field">Bidang Bujur (Longitude):</label>
                  <select class="form-control map-longitude-field-select">
                      <option value="">Pilih Field...</option>
                      ${fieldOptions}
                  </select>
              </div>
              <div class="form-group">
                  <label for="map-marker-title-field">Bidang Judul Marker (opsional):</label>
                  <select class="form-control map-marker-title-field-select">
                      <option value="">Pilih Field...</option>
                      ${fieldOptions}
                  </select>
              </div>
              <div class="form-group">
                  <label for="map-initial-zoom">Zoom Awal:</label>
                  <input type="number" class="form-control map-initial-zoom" value="${optionsData.initialZoom || 10}" min="1" max="18" />
              </div>
              <div class="form-group form-check">
                  <input type="checkbox" class="form-check-input map-show-heatmap" id="map-show-heatmap" ${optionsData.showHeatmap ? 'checked' : ''}>
                  <label class="form-check-label" for="map-show-heatmap">Tampilkan sebagai Heatmap</label>
              </div>
              </div>
          `
        break
      case 'list':
        html = `
        <div class="sortable-list">
              <div class="form-group">
                  <label for="list-display-fields">Bidang yang Ditampilkan (pisahkan dengan koma):</label>
                  <input type="text" class="form-control list-display-fields" value="${optionsData.displayFields ? optionsData.displayFields.join(', ') : ''}" placeholder="field1, field2" />
              </div>
              <div class="form-group">
                  <label for="list-limit">Batas Item:</label>
                  <input type="number" class="form-control list-limit" value="${optionsData.limit || 5}" min="1" />
              </div>
              <div class="form-group">
                  <label for="list-sort-by">Urutkan Berdasarkan Bidang:</label>
                  <select class="form-control list-sort-by-select">
                      <option value="">Pilih Field...</option>
                      ${fieldOptions}
                  </select>
              </div>
              <div class="form-group">
                  <label for="list-sort-order">Urutan Pengurutan:</label>
                  <select class="form-control list-sort-order-select">
                      <option value="asc" ${optionsData.sortOrder === 'asc' ? 'selected' : ''}>Ascending</option>
                      <option value="desc" ${optionsData.sortOrder === 'desc' ? 'selected' : ''}>Descending</option>
                  </select>
              </div>
              <div class="form-group">
                  <label for="list-title-field">Bidang Judul Item (opsional):</label>
                  <select class="form-control list-title-field-select">
                      <option value="">Pilih Field...</option>
                      ${fieldOptions}
                  </select>
              </div>
              </div>
          `
        break
      case 'stat-card':
        html = `
        <div class="sortable-list">
              <div class="form-group">
                  <label for="stat-card-metric-type">Tipe Metrik:</label>
                  <select class="form-control stat-card-metric-type-select">
                      <option value="count" ${optionsData.metricType === 'count' ? 'selected' : ''}>Jumlah Item (Count)</option>
                      <option value="sum" ${optionsData.metricType === 'sum' ? 'selected' : ''}>Total (Sum)</option>
                      <option value="avg" ${optionsData.metricType === 'avg' ? 'selected' : ''}>Rata-rata (Average)</option>
                      <option value="min" ${optionsData.metricType === 'min' ? 'selected' : ''}>Minimum</option>
                      <option value="max" ${optionsData.metricType === 'max' ? 'selected' : ''}>Maksimum</option>
                      <option value="custom-value" ${optionsData.metricType === 'custom-value' ? 'selected' : ''}>Nilai Kustom</option>
                  </select>
              </div>
              <div class="form-group">
                  <label for="stat-card-value-field">Bidang Nilai (jika Sum/Avg/Min/Max):</label>
                  <select class="form-control stat-card-value-field-select">
                      <option value="">Pilih Field...</option>
                      ${fieldOptions}
                  </select>
              </div>
              <div class="form-group">
                  <label for="stat-card-custom-value">Nilai Kustom (jika dipilih):</label>
                  <input type="text" class="form-control stat-card-custom-value" value="${optionsData.customValue || ''}" placeholder="Misal: 12345, atau rumus" />
              </div>
              <div class="form-group">
                  <label for="stat-card-label">Label Metrik:</label>
                  <input type="text" class="form-control stat-card-label" value="${optionsData.label || ''}" required />
              </div>
              <div class="form-group">
                  <label for="stat-card-prefix">Prefix Nilai (opsional):</label>
                  <input type="text" class="form-control stat-card-prefix" value="${optionsData.prefix || ''}" placeholder="Misal: $" />
              </div>
              <div class="form-group">
                  <label for="stat-card-suffix">Suffix Nilai (opsional):</label>
                  <input type="text" class="form-control stat-card-suffix" value="${optionsData.suffix || ''}" placeholder="Misal: %" />
              </div>
              <div class="form-group">
                  <label for="stat-card-icon">Ikon (FontAwesome, misal: fa-users):</label>
                  <input type="text" class="form-control stat-card-icon" value="${optionsData.icon || ''}" />
              </div>
              <div class="form-group">
                  <label for="stat-card-target-value">Nilai Target (opsional, untuk progress):</label>
                  <input type="number" class="form-control stat-card-target-value" value="${optionsData.targetValue || ''}" />
              </div>
              </div>
          `
        break
      case 'iframe':
        html = `
        <div class="sortable-list">
              <div class="form-group">
                  <label for="iframe-source-url">URL Sumber Iframe:</label>
                  <input type="url" class="form-control iframe-source-url" value="${optionsData.sourceUrl || ''}" required />
              </div>
              <div class="form-group">
                  <label for="iframe-width">Lebar (mis. 100%, 800px):</label>
                  <input type="text" class="form-control iframe-width" value="${optionsData.width || ''}" />
              </div>
              <div class="form-group">
                  <label for="iframe-height">Tinggi (mis. 400px):</label>
                  <input type="text" class="form-control iframe-height" value="${optionsData.height || ''}" />
              </div>
              <div class="form-group">
                  <label for="iframe-sandbox-attributes">Atribut Sandbox (pisahkan dengan spasi, opsional):</label>
                  <input type="text" class="form-control iframe-sandbox-attributes" value="${optionsData.sandboxAttributes || ''}" placeholder="misal: allow-scripts allow-same-origin" />
              </div>
              </div>
          `
        break
      case 'action-button':
        html = `
        <div class="sortable-list">
          <div class="form-group">
              <label for="action-button-text">Teks Tombol:</label>
              <input type="text" class="form-control action-button-text" value="${optionsData.buttonText || ''}" required />
          </div>
          <div class="form-group">
              <label for="action-button-type">Tipe Aksi:</label>
              <select class="form-control action-button-type-select">
                  <option value="link" ${optionsData.actionType === 'link' ? 'selected' : ''}>Buka Tautan (Link)</option>
                  <option value="webhook" ${optionsData.actionType === 'webhook' ? 'selected' : ''}>Kirim Webhook</option>
                  <option value="modal" ${optionsData.actionType === 'modal' ? 'selected' : ''}>Tampilkan Modal</option>
              </select>
          </div>
          <div class="form-group">
              <label for="action-button-target">URL Tujuan / ID Modal:</label>
              <input type="text" class="form-control action-button-target" value="${optionsData.target || ''}" placeholder="URL atau ID Modal" />
          </div>
          <div class="form-group">
              <label for="action-button-payload">Payload Webhook (JSON, opsional):</label>
              <textarea class="form-control action-button-payload" rows="3">${optionsData.payload || ''}</textarea>
          </div>
          <div class="form-group">
              <label for="action-button-style">Gaya Tombol (kelas CSS, misal: btn-primary):</label>
              <input type="text" class="form-control action-button-style" value="${optionsData.buttonStyle || ''}" />
          </div>
          <div class="form-group">
              <label for="action-button-icon">Ikon Tombol (FontAwesome, misal: fa-plus):</label>
              <input type="text" class="form-control action-button-icon" value="${optionsData.icon || ''}" />
          </div>
        </div>
          `
        break
      default:
        html = '<p class="text-muted">Pilih tipe widget untuk melihat opsi konfigurasi.</p>'
        break
    }
    container.innerHTML = html

    // Pre-select values for new dropdowns/checkboxes based on optionsData
    if (
      type === 'map' &&
      optionsData.mapProvider &&
      container.querySelector('.map-provider-select')
    )
      container.querySelector('.map-provider-select').value = optionsData.mapProvider
    if (
      type === 'map' &&
      optionsData.latitudeField &&
      container.querySelector('.map-latitude-field-select')
    )
      container.querySelector('.map-latitude-field-select').value = optionsData.latitudeField
    if (
      type === 'map' &&
      optionsData.longitudeField &&
      container.querySelector('.map-longitude-field-select')
    )
      container.querySelector('.map-longitude-field-select').value = optionsData.longitudeField
    if (
      type === 'map' &&
      optionsData.markerTitleField &&
      container.querySelector('.map-marker-title-field-select')
    )
      container.querySelector('.map-marker-title-field-select').value = optionsData.markerTitleField
    if (type === 'map' && optionsData.showHeatmap && container.querySelector('.map-show-heatmap'))
      container.querySelector('.map-show-heatmap').checked = optionsData.showHeatmap

    if (type === 'list' && optionsData.sortBy && container.querySelector('.list-sort-by-select'))
      container.querySelector('.list-sort-by-select').value = optionsData.sortBy
    if (
      type === 'list' &&
      optionsData.sortOrder &&
      container.querySelector('.list-sort-order-select')
    )
      container.querySelector('.list-sort-order-select').value = optionsData.sortOrder
    if (
      type === 'list' &&
      optionsData.titleField &&
      container.querySelector('.list-title-field-select')
    )
      container.querySelector('.list-title-field-select').value = optionsData.titleField

    if (
      type === 'stat-card' &&
      optionsData.metricType &&
      container.querySelector('.stat-card-metric-type-select')
    )
      container.querySelector('.stat-card-metric-type-select').value = optionsData.metricType
    if (
      type === 'stat-card' &&
      optionsData.valueField &&
      container.querySelector('.stat-card-value-field-select')
    )
      container.querySelector('.stat-card-value-field-select').value = optionsData.valueField
    if (
      type === 'action-button' &&
      optionsData.actionType &&
      container.querySelector('.action-button-type-select')
    )
      container.querySelector('.action-button-type-select').value = optionsData.actionType
    // ... (existing pre-selects for chart, table, single-value)
    if (optionsData.chartType && container.querySelector('.chart-type-select')) {
      container.querySelector('.chart-type-select').value = optionsData.chartType
    }
    if (optionsData.xAxis && container.querySelector('.chart-x-axis-select')) {
      container.querySelector('.chart-x-axis-select').value = optionsData.xAxis
    }
    if (optionsData.yAxis && container.querySelector('.chart-y-axis-select')) {
      container.querySelector('.chart-y-axis-select').value = optionsData.yAxis
    }
    if (optionsData.field && container.querySelector('.single-value-field-select')) {
      container.querySelector('.single-value-field-select').value = optionsData.field
    }
    if (optionsData.aggregation && container.querySelector('.single-value-aggregation-select')) {
      container.querySelector('.single-value-aggregation-select').value = optionsData.aggregation
    }
  }
  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  }

  /**
   * Adds a new widget input group to the dashboard form.
   * @param {object} [widget={}] - Optional widget object to pre-fill the form for editing.
   */
  let widgetCounter = 1
  function getNextWidgetId() {
    return `widget-${widgetCounter++}`
  }
  async function addWidget(widget = {}) {
    // const id = widget.id || `widget-${widgetCounter++}`
    const id = widget.id || getNextWidgetId()
    const widgetTemplate = document.getElementById('widget-template')
    const widgetItem = widgetTemplate.content.firstElementChild.cloneNode(true)
    widgetItem.dataset.id = id

    // Update IDs and names for unique elements within the cloned template
    const elementsToUpdate = widgetItem.querySelectorAll('[id], [for]')
    elementsToUpdate.forEach((el) => {
      if (el.id) el.id = `${id}-${el.id}`
      if (el.htmlFor) el.htmlFor = `${id}-${el.htmlFor}`
    })

    // Set unique data-target for collapse button
    const toggleCollapseBtn = widgetItem.querySelector('.toggle-collapse-widget')
    if (toggleCollapseBtn) {
      toggleCollapseBtn.dataset.targetSuffix = `${id}-content` // Unique target for this widget
      toggleCollapseBtn.setAttribute('data-target-id', `${id}-content`) // New attribute for easier access
    }
    const collapsibleContent = widgetItem.querySelector('.collapsible-content')
    if (collapsibleContent) {
      collapsibleContent.id = `${id}-content`
      if (widget.collapsed) {
        collapsibleContent.classList.add('collapsed')
        if (toggleCollapseBtn) {
          toggleCollapseBtn.querySelector('i').classList.remove('fa-chevron-up')
          toggleCollapseBtn.querySelector('i').classList.add('fa-chevron-down')
        }
      }
    }

    dom.dashboardWidgetsContainer.appendChild(widgetItem)
    dom.noWidgetsPlaceholder.style.display = 'none' // Hide placeholder if adding widgets

    // Populate the collection dropdown
    const collectionSelect = widgetItem.querySelector('.widget-collection-select')

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
            `/configuration/list?skip${page - 1}&search=${encodeURIComponent(search)}`
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
        if (!selected) return renderWidgetOptions(optionsContainer, typeSelect.value, {}, [])
        try {
          const res = await fetch(`/configuration/read/${selected}`)
          const detail = await res.json()
          const fields = detail.data?.fields || []
          renderWidgetOptions(optionsContainer, typeSelect.value, {}, fields)
        } catch (err) {
          console.error('Gagal ambil field:', err)
          renderWidgetOptions(optionsContainer, typeSelect.value, {}, [])
        }
      })
    }

    // Get references to elements within the new widget item
    const nameInput = widgetItem.querySelector('.widget-name')
    const displayNameInput = widgetItem.querySelector('.widget-display-name-input')
    const typeSelect = widgetItem.querySelector('.widget-type-select')
    const optionsContainer = widgetItem.querySelector('.widget-options-container')
    const removeBtn = widgetItem.querySelector('.remove-widget-btn')
    const widgetDisplayNameHeader = widgetItem.querySelector('.widget-display-name')

    // Pre-fill values if editing
    if (widget.name) {
      nameInput.value = widget.name
    }
    if (widget.displayName) {
      displayNameInput.value = widget.displayName
    }
    if (widget.type) {
      typeSelect.value = widget.type
    }

    // Event Listeners for the new widget
    displayNameInput.addEventListener('input', () => {
      widgetDisplayNameHeader.textContent =
        displayNameInput.value || nameInput.value || 'Widget Baru'
      if (!widget.id) {
        // Only auto-fill internal name for new widgets
        nameInput.value = slugify(displayNameInput.value)
      }
    })
    nameInput.addEventListener('input', () => {
      widgetDisplayNameHeader.textContent =
        displayNameInput.value || nameInput.value || 'Widget Baru'
    })

    removeBtn.addEventListener('click', () => {
      widgetItem.remove()
      if (dom.dashboardWidgetsContainer.children.length === 1) {
        // Only the placeholder remains
        dom.noWidgetsPlaceholder.style.display = 'block'
      }
    })

    if (toggleCollapseBtn) {
      toggleCollapseBtn.addEventListener('click', () => {
        const contentId = toggleCollapseBtn.getAttribute('data-target-id')
        const contentElement = document.getElementById(contentId)
        if (contentElement) {
          contentElement.classList.toggle('collapsed')
          toggleCollapseBtn.querySelector('i').classList.toggle('fa-chevron-up')
          toggleCollapseBtn.querySelector('i').classList.toggle('fa-chevron-down')
        }
      })
    }
    // IMPORTANT: Re-attach event listener for type change to re-render options
    typeSelect.addEventListener('change', async () => {
      const selected = collectionSelect.value
      if (!selected) return renderWidgetOptions(optionsContainer, typeSelect.value, {}, [])
      try {
        const res = await fetch(`/configuration/read/${selected}`)
        const detail = await res.json()
        const fields = detail.data?.fields || []
        renderWidgetOptions(optionsContainer, typeSelect.value, {}, fields)
      } catch (err) {
        console.error('Gagal ambil field:', err)
        renderWidgetOptions(optionsContainer, typeSelect.value, {}, [])
      }
    })

    // Initial render of options based on type and pre-fill if editing
    if (widget.type) {
      const selected = collectionSelect.value
      if (!selected) return renderWidgetOptions(optionsContainer, typeSelect.value, {}, [])
      try {
        const res = await fetch(`/configuration/read/${selected}`)
        const detail = await res.json()
        const fields = detail.data?.fields || []
        renderWidgetOptions(optionsContainer, typeSelect.value, {}, fields)
      } catch (err) {
        console.error('Gagal ambil field:', err)
        renderWidgetOptions(optionsContainer, typeSelect.value, {}, [])
      }
    } else {
      renderWidgetOptions(optionsContainer, typeSelect.value, {}, []) // Render default empty for new
    }

    // Set initial display name in header
    widgetDisplayNameHeader.textContent = widget.displayName || widget.name || 'Widget Baru'
  }
  function getFormDataAsDashboardObject() {
    const id = dom.dashboardIdInput.value || `dashboard-${Date.now()}`
    const name = dom.dashboardNameInput.value.trim()
    const description = dom.dashboardDescriptionInput.value.trim()
    const widgets = Array.from(dom.dashboardWidgetsContainer.querySelectorAll('.widget-item'))
      .filter((item) => item.id !== 'no-widgets-placeholder')
      .map((item) => {
        const widgetId = item.dataset.id
        const nameInput = item.querySelector('.widget-name')
        const displayNameInput = item.querySelector('.widget-display-name-input')
        const typeSelect = item.querySelector('.widget-type-select')
        const collectionSelect = item.querySelector('.widget-collection-select')
        const optionsContainer = item.querySelector('.widget-options-container')
        const collapsibleContent = item.querySelector('.collapsible-content')
        if (
          !nameInput ||
          !displayNameInput ||
          !typeSelect ||
          !collectionSelect ||
          !optionsContainer ||
          !collapsibleContent
        ) {
          console.error(`Error: Missing elements for widget ID: ${widgetId}`)
          return null
        }
        const widgetName = nameInput.value.trim()
        const widgetDisplayName = displayNameInput.value.trim()
        const widgetType = typeSelect.value
        const widgetCollection = collectionSelect.value
        const isCollapsed = collapsibleContent.classList.contains('collapsed')
        // Basic validation for widget during preview/save
        if (!widgetName || !widgetDisplayName) {
          return null // Return null to indicate an invalid widget
        }
        let options = {}
        // Collect widget-specific options based on type
        if (widgetType === 'chart') {
          const chartTypeSelect = optionsContainer.querySelector('.chart-type-select')
          const xAxisSelect = optionsContainer.querySelector('.chart-x-axis-select')
          const yAxisSelect = optionsContainer.querySelector('.chart-y-axis-select')
          const titleInput = optionsContainer.querySelector('.chart-title-input')
          options.chartType = chartTypeSelect ? chartTypeSelect.value : ''
          options.xAxis = xAxisSelect ? xAxisSelect.value : ''
          options.yAxis = yAxisSelect ? yAxisSelect.value : ''
          options.title = titleInput ? titleInput.value.trim() : ''
        } else if (widgetType === 'table') {
          const fieldsInput = optionsContainer.querySelector('.table-fields-input')
          const limitInput = optionsContainer.querySelector('.table-limit-input')
          options.fields = fieldsInput
            ? fieldsInput.value
                .split(',')
                .map((f) => f.trim())
                .filter((f) => f)
            : []
          options.limit = limitInput ? parseInt(limitInput.value) : 10
        } else if (widgetType === 'single-value') {
          const fieldSelect = optionsContainer.querySelector('.single-value-field-select')
          const aggregationSelect = optionsContainer.querySelector(
            '.single-value-aggregation-select'
          )
          const labelInput = optionsContainer.querySelector('.single-value-label-input')
          options.field = fieldSelect ? fieldSelect.value : ''
          options.aggregation = aggregationSelect ? aggregationSelect.value : ''
          options.label = labelInput ? labelInput.value.trim() : ''
        } else if (widgetType === 'custom-text') {
          const contentInput = optionsContainer.querySelector('.custom-text-content')
          const isHtmlCheckbox = optionsContainer.querySelector('.custom-text-is-html')
          const cssClassInput = optionsContainer.querySelector('.custom-text-css-class')
          const titleInput = optionsContainer.querySelector('.custom-text-title')
          options.content = contentInput ? contentInput.value.trim() : ''
          options.isHtml = isHtmlCheckbox ? isHtmlCheckbox.checked : false
          options.cssClass = cssClassInput ? cssClassInput.value.trim() : ''
          options.title = titleInput ? titleInput.value.trim() : ''
        } else if (widgetType === 'image') {
          const imageUrlInput = optionsContainer.querySelector('.image-url')
          const altTextInput = optionsContainer.querySelector('.image-alt-text')
          const linkUrlInput = optionsContainer.querySelector('.image-link-url')
          const widthInput = optionsContainer.querySelector('.image-width')
          const heightInput = optionsContainer.querySelector('.image-height')
          const captionInput = optionsContainer.querySelector('.image-caption')
          options.imageUrl = imageUrlInput ? imageUrlInput.value.trim() : ''
          options.altText = altTextInput ? altTextInput.value.trim() : ''
          options.linkUrl = linkUrlInput ? linkUrlInput.value.trim() : ''
          options.width = widthInput ? widthInput.value.trim() : ''
          options.height = heightInput ? heightInput.value.trim() : ''
          options.caption = captionInput ? captionInput.value.trim() : ''
        } else if (widgetType === 'map') {
          const mapProviderSelect = optionsContainer.querySelector('.map-provider-select')
          const latitudeFieldSelect = optionsContainer.querySelector('.map-latitude-field-select')
          const longitudeFieldSelect = optionsContainer.querySelector('.map-longitude-field-select')
          const markerTitleFieldSelect = optionsContainer.querySelector(
            '.map-marker-title-field-select'
          )
          const initialZoomInput = optionsContainer.querySelector('.map-initial-zoom')
          const showHeatmapCheckbox = optionsContainer.querySelector('.map-show-heatmap')
          options.mapProvider = mapProviderSelect ? mapProviderSelect.value : ''
          options.latitudeField = latitudeFieldSelect ? latitudeFieldSelect.value : ''
          options.longitudeField = longitudeFieldSelect ? longitudeFieldSelect.value : ''
          options.markerTitleField = markerTitleFieldSelect ? markerTitleFieldSelect.value : ''
          options.initialZoom = initialZoomInput ? parseInt(initialZoomInput.value) : 10
          options.showHeatmap = showHeatmapCheckbox ? showHeatmapCheckbox.checked : false
        } else if (widgetType === 'list') {
          const displayFieldsInput = optionsContainer.querySelector('.list-display-fields')
          const limitInput = optionsContainer.querySelector('.list-limit')
          const sortBySelect = optionsContainer.querySelector('.list-sort-by-select')
          const sortOrderSelect = optionsContainer.querySelector('.list-sort-order-select')
          const titleFieldSelect = optionsContainer.querySelector('.list-title-field-select')
          options.displayFields = displayFieldsInput
            ? displayFieldsInput.value
                .split(',')
                .map((f) => f.trim())
                .filter((f) => f)
            : []
          options.limit = limitInput ? parseInt(limitInput.value) : 5
          options.sortBy = sortBySelect ? sortBySelect.value : ''
          options.sortOrder = sortOrderSelect ? sortOrderSelect.value : 'asc'
          options.titleField = titleFieldSelect ? titleFieldSelect.value : ''
        } else if (widgetType === 'stat-card') {
          const metricTypeSelect = optionsContainer.querySelector('.stat-card-metric-type-select')
          const valueFieldSelect = optionsContainer.querySelector('.stat-card-value-field-select')
          const customValueInput = optionsContainer.querySelector('.stat-card-custom-value')
          const labelInput = optionsContainer.querySelector('.stat-card-label')
          const prefixInput = optionsContainer.querySelector('.stat-card-prefix')
          const suffixInput = optionsContainer.querySelector('.stat-card-suffix')
          const iconInput = optionsContainer.querySelector('.stat-card-icon')
          const targetValueInput = optionsContainer.querySelector('.stat-card-target-value')
          options.metricType = metricTypeSelect ? metricTypeSelect.value : 'count'
          options.valueField = valueFieldSelect ? valueFieldSelect.value : ''
          options.customValue = customValueInput ? customValueInput.value.trim() : ''
          options.label = labelInput ? labelInput.value.trim() : ''
          options.prefix = prefixInput ? prefixInput.value.trim() : ''
          options.suffix = suffixInput ? suffixInput.value.trim() : ''
          options.icon = iconInput ? iconInput.value.trim() : ''
          options.targetValue = targetValueInput ? parseInt(targetValueInput.value) : undefined
        } else if (widgetType === 'iframe') {
          const sourceUrlInput = optionsContainer.querySelector('.iframe-source-url')
          const widthInput = optionsContainer.querySelector('.iframe-width')
          const heightInput = optionsContainer.querySelector('.iframe-height')
          const sandboxAttributesInput = optionsContainer.querySelector(
            '.iframe-sandbox-attributes'
          )
          options.sourceUrl = sourceUrlInput ? sourceUrlInput.value.trim() : ''
          options.width = widthInput ? widthInput.value.trim() : ''
          options.height = heightInput ? heightInput.value.trim() : ''
          options.sandboxAttributes = sandboxAttributesInput
            ? sandboxAttributesInput.value.trim()
            : ''
        } else if (widgetType === 'action-button') {
          const buttonTextInput = optionsContainer.querySelector('.action-button-text')
          const actionTypeSelect = optionsContainer.querySelector('.action-button-type-select')
          const targetInput = optionsContainer.querySelector('.action-button-target')
          const payloadInput = optionsContainer.querySelector('.action-button-payload')
          const buttonStyleInput = optionsContainer.querySelector('.action-button-style')
          const iconInput = optionsContainer.querySelector('.action-button-icon')
          options.buttonText = buttonTextInput ? buttonTextInput.value.trim() : ''
          options.actionType = actionTypeSelect ? actionTypeSelect.value : 'link'
          options.target = targetInput ? targetInput.value.trim() : ''
          options.payload = payloadInput ? payloadInput.value.trim() : ''
          options.buttonStyle = buttonStyleInput ? buttonStyleInput.value.trim() : ''
          options.icon = iconInput ? iconInput.value.trim() : ''
        }
        return {
          id: widgetId,
          name: widgetName,
          displayName: widgetDisplayName,
          type: widgetType,
          collection: widgetCollection === '' ? undefined : widgetCollection,
          collapsed: isCollapsed,
          options: options,
        }
      })
    // Filter out any widgets that returned null due to invalid data
    const validWidgets = widgets.filter((widget) => widget !== null)
    return {
      id: id,
      name: name,
      description: description,
      widgets: validWidgets,
    }
  }

  addWidgetdBtn.addEventListener('click', () => addWidget())
  saveDashboardBtn.addEventListener('submit', async (e) => {
    e.preventDefault()
    const dashboardData = getFormDataAsDashboardObject();
    // Basic validation before saving
    if (!dashboardData.name) {
      showNotification("Nama Dashboard wajib diisi.", "error");
      return;
    }
    if (dashboardData.widgets.includes(null)) {
      showNotification("Beberapa widget memiliki data yang tidak lengkap. Harap periksa semua widget.", "error");
      return;
    }
    if (dashboardData.widgets.length === 0) {
      showNotification("Dashboard harus memiliki setidaknya satu widget.", "error");
      return;
    }
    console.log(dashboardData)
  })
})

function showNotification(message, type) {
  const notificationElement = type === 'success' ? successMessage : errorMessage
  notificationElement.textContent = message
  notificationElement.style.display = 'block'
  setTimeout(() => {
    notificationElement.style.display = 'none'
    notificationElement.textContent = '' // Clear message
  }, 5000) // Hide after 5 seconds
}
function openDetail(id) {
  document.getElementById('gridView').style.display = 'none'
  document.querySelectorAll('.settings-detail').forEach((el) => el.classList.remove('active'))
  document.getElementById('detail-' + id).classList.add('active')
}

function showGrid() {
  document.getElementById('gridView').style.display = 'grid'
  document.querySelectorAll('.settings-detail').forEach((el) => el.classList.remove('active'))
}
