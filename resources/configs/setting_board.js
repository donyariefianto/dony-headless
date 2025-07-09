const addWidgetdBtn = document.getElementById('add-widget-btn')
let currentCollections = [
  {
    name: 'products',
    displayName: 'Produk',
    fields: [
      { name: 'name', displayName: 'Nama Produk', type: 'string' },
      { name: 'price', displayName: 'Harga', type: 'number' },
      { name: 'category', displayName: 'Kategori', type: 'string' },
      { name: 'stock', displayName: 'Stok', type: 'number' },
    ],
  },
  {
    name: 'orders',
    displayName: 'Pesanan',
    fields: [
      { name: 'orderId', displayName: 'ID Pesanan', type: 'string' },
      { name: 'amount', displayName: 'Jumlah', type: 'number' },
      { name: 'date', displayName: 'Tanggal', type: 'date' },
      { name: 'status', displayName: 'Status', type: 'string' },
    ],
  },
  {
    name: 'customers',
    displayName: 'Pelanggan',
    fields: [
      { name: 'customerId', displayName: 'ID Pelanggan', type: 'string' },
      { name: 'name', displayName: 'Nama Pelanggan', type: 'string' },
      { name: 'email', displayName: 'Email', type: 'string' },
    ],
  },
  {
    name: 'locations',
    displayName: 'Lokasi',
    fields: [
      { name: 'locationName', displayName: 'Nama Lokasi', type: 'string' },
      { name: 'latitude', displayName: 'Lintang', type: 'number' },
      { name: 'longitude', displayName: 'Bujur', type: 'number' },
      { name: 'population', displayName: 'Populasi', type: 'number' },
    ],
  },
] // Mock data for collections
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const dom = {
    // Dashboard specific elements
    dashboardConfigView: document.getElementById('dashboard-config-view'), // This view is now implicitly handled by sidebar
    addDashboardWidgetBtn: document.getElementById('add-dashboard-widget-btn'),
    dashboardForm: document.getElementById('dashboard-form'),
    dashboardIdInput: document.getElementById('dashboard-id'),
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
                      ${collectionFields
                        .filter((f) => f.type === 'number')
                        .map((f) => `<option value="${f.name}">${f.displayName || f.name}</option>`)
                        .join('')}
                  </select>
              </div>
              <div class="form-group">
                  <label for="map-longitude-field">Bidang Bujur (Longitude):</label>
                  <select class="form-control map-longitude-field-select">
                      <option value="">Pilih Field...</option>
                      ${collectionFields
                        .filter((f) => f.type === 'number')
                        .map((f) => `<option value="${f.name}">${f.displayName || f.name}</option>`)
                        .join('')}
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
                      ${collectionFields
                        .filter((f) => f.type === 'number')
                        .map((f) => `<option value="${f.name}">${f.displayName || f.name}</option>`)
                        .join('')}
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
  async function addWidget(widget = {}) {
    let widgetCounter = 1
    const id = widget.id || `widget-${widgetCounter++}`
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

    if (collectionSelect) {
      // collectionSelect.innerHTML = '<option value="">Pilih Koleksi...</option>'
      // ;
      // [].forEach((col) => {
      //   const option = document.createElement('option')
      //   option.value = col.name // Use internal name as value
      //   option.textContent = col.displayName
      //   collectionSelect.appendChild(option)
      // })
      collectionSelect.innerHTML = '<option value="">Memuat koleksi...</option>';
      collectionSelect.disabled = true;

  // Fetch koleksi dari API
  await fetch('/configuration/read')
    .then(res => res.json())
    .then(data => {
      collectionSelect.innerHTML = '<option value="">Pilih Koleksi...</option>';

      data.data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.displayName;
        collectionSelect.appendChild(option);
      });

      // Jika edit mode, pre-select
      if (widget.collection) {
        collectionSelect.value = widget.collection;
      }

      collectionSelect.disabled = false;
    })
    .catch(err => {
      collectionSelect.innerHTML = '<option value="">Gagal memuat data</option>';
      console.error('Gagal ambil koleksi:', err);
    });

      // Set selected collection if editing
      if (widget.collection) {
        collectionSelect.value = widget.collection
      }
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
    typeSelect.addEventListener('change', () => {
      const selectedCollection = currentCollections.find(
        (col) => col.name === collectionSelect.value
      )
      const collectionFields = selectedCollection ? selectedCollection.fields : []
      renderWidgetOptions(optionsContainer, typeSelect.value, {}, collectionFields)
    })

    collectionSelect.addEventListener('change', () => {
      const selectedCollection = currentCollections.find(
        (col) => col.name === collectionSelect.value
      )
      const collectionFields = selectedCollection ? selectedCollection.fields : []
      renderWidgetOptions(optionsContainer, typeSelect.value, {}, collectionFields)
    })

    // Initial render of options based on type and pre-fill if editing
    if (widget.type) {
      const selectedCollection = currentCollections.find(
        (col) => col.name === collectionSelect.value
      )
      const collectionFields = selectedCollection ? selectedCollection.fields : []
      renderWidgetOptions(optionsContainer, widget.type, widget.options || {}, collectionFields)
    } else {
      renderWidgetOptions(optionsContainer, typeSelect.value, {}, []) // Render default empty for new
    }

    // Set initial display name in header
    widgetDisplayNameHeader.textContent = widget.displayName || widget.name || 'Widget Baru'
  }

  addWidgetdBtn.addEventListener('click', () => addWidget())
})

function openDetail(id) {
  document.getElementById('gridView').style.display = 'none'
  document.querySelectorAll('.settings-detail').forEach((el) => el.classList.remove('active'))
  document.getElementById('detail-' + id).classList.add('active')
}

function showGrid() {
  document.getElementById('gridView').style.display = 'grid'
  document.querySelectorAll('.settings-detail').forEach((el) => el.classList.remove('active'))
}
