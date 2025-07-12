const baseUrl = '/' // Base URL for collections API
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const collectionsList = document.getElementById('collections-list')
  const addCollectionBtn = document.getElementById('add-collection-btn')
  const addDashboardnBtn = document.getElementById('add-dashboard-btn')
  const rightFormSidebar = document.getElementById('right-form-sidebar')
  const closeSidebarBtns = document.querySelectorAll('.close-sidebar-btn')
  const overlay = document.getElementById('overlay')
  const sidebarFormTitle = document.getElementById('sidebar-form-title')
  const userDisplayElement = document.getElementById('user-display')
  const logoutBtn = document.getElementById('logout-btn')

  // Generate Dashboard Elements
  const dashboardForm = document.getElementById('data-dashboard-form')
  const dataDashboardIdInput = document.getElementById('data-dashboard-id')
  const dataDashboardFieldsContainer = document.getElementById('data-item-fields-container')

  // Collection Form Elements
  const collectionForm = document.getElementById('collection-form')
  const collectionIdInput = document.getElementById('collection-id')
  const collectionDisplayNameInput = document.getElementById('collection-display-name')
  const collectionNameInput = document.getElementById('collection-name')
  const collectionDescriptionInput = document.getElementById('collection-description')
  const fieldsContainer = document.getElementById('fields-container')
  const addFieldBtn = document.getElementById('add-field-btn')
  const relationsContainer = document.getElementById('relations-container')
  const addRelationBtn = document.getElementById('add-relation-btn')

  // Data Item Form Elements (NEW)
  const dataItemForm = document.getElementById('data-item-form')
  const dataItemIdInput = document.getElementById('data-item-id')
  const dataItemCollectionNameInput = document.getElementById('data-item-collection-name')
  const dataItemFieldsContainer = document.getElementById('data-item-fields-container')
  const pageInfo = document.getElementById('page-info')
  const toggleDarkModeBtn = document.getElementById('toggle-dark-mode')

  const collectionsView = document.getElementById('collections-view')
  const settingsView = document.getElementById('settings-view')
  const boardsView = document.getElementById('dashboard-view')
  const shortcutView = document.getElementById('shortcut-view')
  const navItems = document.querySelectorAll('.nav-item')

  const noCollectionSelectedMessage = document.getElementById('no-collection-selected')
  const collectionDetailView = document.getElementById('collection-detail-view')
  const detailCollectionName = document.getElementById('detail-collection-name')
  const detailCollectionInternalName = document.getElementById('detail-collection-internal-name')
  const detailCollectionDescription = document.getElementById('detail-collection-description')
  const detailCollectionCreatedAt = document.getElementById('detail-collection-createdAt')
  const detailCollectionUpdatedAt = document.getElementById('detail-collection-updatedAt')
  const editCollectionBtn = document.getElementById('edit-collection-btn')
  const deleteCollectionBtn = document.getElementById('delete-collection-btn')

  // Data Items Section Elements (NEW)
  const dataItemsCollectionNameTitle = document.getElementById('data-items-collection-name-title')
  const addDataItemBtn = document.getElementById('add-data-item-btn')
  const dataItemsListContainer = document.getElementById('data-items-list-container')
  const dataItemsPlaceholder = document.getElementById('data-items-placeholder')
  const dataItemsTable = document.getElementById('data-items-table')
  const dataTableHeaderRow = document.getElementById('data-table-header-row')
  const dataTableBody = document.getElementById('data-table-body')
  const dataItemsSearchInput = document.getElementById('data-items-search-input')
  const dataItemsPrevPageBtn = document.getElementById('data-items-prev-page-btn')
  const dataItemsNextPageBtn = document.getElementById('data-items-next-page-btn')
  const dataItemsPageInfo = document.getElementById('data-items-page-info')

  const deleteConfirmModal = document.getElementById('delete-confirm-modal')
  const deleteConfirmName = document.getElementById('delete-confirm-name')
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn')
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn')
  const closeModalBtns = document.querySelectorAll('.close-modal-btn')

  const loadingIndicator = document.getElementById('loading-indicator')
  const errorMessage = document.getElementById('error-message')
  const successMessage = document.getElementById('success-message')
  const prevPageBtn = document.getElementById('prev-page-btn')
  const nextPageBtn = document.getElementById('next-page-btn')
  let currentCollections = [] // Stores all collections data (metadata)
  let currentSelectedCollectionId = null // ID of the currently selected collection (metadata)
  let currentSelectedCollection = null // The full object of the currently selected collection
  let collectionCurrentPage = 1 // Current page for pagination (if needed)
  const collectionPerPage = 4 // Number of items per page for pagination
  let totalCollections = 0 // Total number of collections for pagination
  const collectionSearchInput = document.getElementById('collection-search-input') // <-- Elemen input pencarian

  let currentDataItemPage = 1 // NEW: Halaman saat ini untuk data item
  const dataItemsPerPage = 4 // NEW: Jumlah data item per halaman
  let currentDataItemSearchTerm = '' // NEW: Istilah pencarian untuk data item
  let totalDataItems = 0 // NEW: Total data item untuk koleksi yang dipilih
  let currentDataItemSort = 'createdAt:desc' // NEW: Sorting untuk data item

  let loadingCounter = 0 // Menghitung berapa banyak operasi yang sedang loading
  let loadingStartTime = 0 // Waktu saat loading dimulai (untuk min display time)
  const MIN_LOADING_TIME = 300 // Milidetik, waktu minimum loader ditampilkan
  // --- State Aplikasi untuk Autentikasi ---
  let userToken = localStorage.getItem('token')
  let loggedInUsername = localStorage.getItem('username')
  let loggedInUserRole = localStorage.getItem('userRole')

  async function checkAuthAndLoadUser() {
    if (!userToken) {
      logoutUser() // Jika tidak ada token, langsung redirect
      return
    }
    try {
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({}),
        redirect: 'follow',
      }
      let response = await fetch('/api/profile', requestOptions)
      if (!response.ok) {
        throw new Error('Token tidak valid atau kadaluwarsa.')
      }
      let userData = await response.json()
      userData = userData.data
      loggedInUsername = userData.username
      loggedInUserRole = userData.role

      // Tampilkan informasi pengguna di UI
      if (userDisplayElement) {
        userDisplayElement.textContent = `Halo, ${loggedInUsername} (${loggedInUserRole})`
      }

      // --- Panggil fungsi inisialisasi khusus halaman configure di sini ---
      // loadCollections()
    } catch (error) {
      console.error('Autentikasi gagal di halaman configure:', error.message)
      showNotification(
        error.message || 'Sesi berakhir atau tidak diizinkan. Silakan login kembali.'
      )
      setTimeout(() => logoutUser(), 5000)
    }
  }
  function logoutUser() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userRole')
    window.location.href = '/login' // Redirect ke halaman login
  }
  async function authorizedFetch(url, options = {}) {
    const token = localStorage.getItem('token')
    if (!token) {
      logoutUser()
      throw new Error('Tidak ada token autentikasi.')
    }
  }
  // Menerapkan filter pencarian (hanya pemicu fetchCollections)
  function applySearchFilter(searchTerm) {
    currentSearchTerm = searchTerm.toLowerCase() // <-- Update searchTerm
    // currentPage = 1; // Selalu reset ke halaman pertama setelah filter
    loadCollections(currentSearchTerm) // <-- Panggil ulang fetchCollections dengan parameter 'search' yang baru
  }
  function applyDataItemSearchFilter(searchTerm) {
    currentDataItemSearchTerm = searchTerm.toLowerCase()
    currentDataItemPage = 1 // Selalu reset ke halaman pertama setelah filter
    // fetchDataItemsForCollection(); // Panggil ulang fetch
    loadDataItems(currentSelectedCollection, currentDataItemPage, 4, currentDataItemSearchTerm)
  }
  function updateDataItemsPaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / dataItemsPerPage)
    dataItemsPageInfo.textContent = `Halaman ${currentDataItemPage} dari ${totalPages || 1}`

    dataItemsPrevPageBtn.disabled = currentDataItemPage === 1
    if (currentDataItemPage === 1) {
      dataItemsPrevPageBtn.setAttribute('aria-label', 'Tidak ada halaman sebelumnya data item')
      dataItemsPrevPageBtn.setAttribute('title', 'Anda sudah berada di halaman pertama data item')
    } else {
      const prevPageNumber = currentDataItemPage - 1
      dataItemsPrevPageBtn.setAttribute(
        'aria-label',
        `Pindah ke halaman ${prevPageNumber} data item`
      )
      dataItemsPrevPageBtn.setAttribute('title', `Pindah ke halaman ${prevPageNumber} data item`)
    }

    dataItemsNextPageBtn.disabled = currentDataItemPage === totalPages || totalPages === 0
    if (currentDataItemPage === totalPages || totalPages === 0) {
      dataItemsNextPageBtn.setAttribute('aria-label', 'Tidak ada halaman selanjutnya data item')
      dataItemsNextPageBtn.setAttribute('title', 'Anda sudah berada di halaman terakhir data item')
    } else {
      const nextPageNumber = currentDataItemPage + 1
      dataItemsNextPageBtn.setAttribute(
        'aria-label',
        `Pindah ke halaman ${nextPageNumber} data item`
      )
      dataItemsNextPageBtn.setAttribute('title', `Pindah ke halaman ${nextPageNumber} data item`)
    }
  }
  // Memperbarui status tombol paginasi dan informasi halaman
  function updatePaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / collectionPerPage)
    pageInfo.textContent = `Halaman ${collectionCurrentPage} dari ${totalPages || 1}`

    // Perbarui tombol 'Sebelumnya'
    prevPageBtn.disabled = collectionCurrentPage === 1
    if (collectionCurrentPage === 1) {
      prevPageBtn.setAttribute('aria-label', 'Tidak ada halaman sebelumnya')
      prevPageBtn.setAttribute('title', 'Anda sudah berada di halaman pertama')
    } else {
      const prevPageNumber = collectionCurrentPage - 1
      prevPageBtn.setAttribute('aria-label', `Pindah ke halaman ${prevPageNumber}`)
      prevPageBtn.setAttribute('title', `Pindah ke halaman ${prevPageNumber}`)
    }

    // Perbarui tombol 'Selanjutnya'
    nextPageBtn.disabled = collectionCurrentPage === totalPages || totalPages === 0
    if (collectionCurrentPage === totalPages || totalPages === 0) {
      nextPageBtn.setAttribute('aria-label', 'Tidak ada halaman selanjutnya')
      nextPageBtn.setAttribute('title', 'Anda sudah berada di halaman terakhir')
    } else {
      const nextPageNumber = collectionCurrentPage + 1
      nextPageBtn.setAttribute('aria-label', `Pindah ke halaman ${nextPageNumber}`)
      nextPageBtn.setAttribute('title', `Pindah ke halaman ${nextPageNumber}`)
    }
  }
  // --- Utility Functions ---
  // ---- NEW: Fungsi showLoading yang diperbarui ----
  function showLoading() {
    loadingCounter++
    if (loadingCounter === 1) {
      // Hanya tampilkan jika ini panggilan loading pertama
      loadingStartTime = Date.now()
      if (loadingIndicator) {
        loadingIndicator.style.display = 'flex' // Set display agar elemen punya dimensi dan bisa transisi
        // Gunakan requestAnimationFrame atau setTimeout kecil untuk memastikan DOM direfresh
        // sebelum transisi opacity dimulai. Ini mencegah glitch awal.
        requestAnimationFrame(() => {
          loadingIndicator.style.opacity = '1'
          loadingIndicator.style.pointerEvents = 'auto' // Aktifkan interaksi (jika ada, misal tombol batal) saat terlihat
        })
      }
      document.body.classList.add('loading-active') // Nonaktifkan scroll body
    }
  }
  // ----------------------------------------------------

  // ---- NEW: Fungsi hideLoading yang diperbarui ----
  function hideLoading() {
    loadingCounter--
    if (loadingCounter <= 0) {
      // Hanya sembunyikan jika semua operasi loading selesai
      loadingCounter = 0 // Pastikan counter tidak negatif

      const timeElapsed = Date.now() - loadingStartTime
      const delay = Math.max(0, MIN_LOADING_TIME - timeElapsed) // Hitung delay untuk memenuhi MIN_LOADING_TIME

      setTimeout(() => {
        if (loadingIndicator) {
          loadingIndicator.style.opacity = '0' // Mulai fade out
          loadingIndicator.style.pointerEvents = 'none' // Nonaktifkan interaksi selama fade out

          // Tunggu transisi opacity selesai sebelum mengatur display: none
          // Mengambil durasi transisi dari CSS yang diterapkan
          const transitionDuration =
            parseFloat(getComputedStyle(loadingIndicator).transitionDuration) * 1000
          setTimeout(() => {
            // Pastikan opacity masih 0 sebelum menyetel display: none (untuk menghindari kondisi balapan)
            if (loadingIndicator.style.opacity === '0') {
              loadingIndicator.style.display = 'none'
            }
          }, transitionDuration || 300) // Gunakan durasi transisi CSS, default 300ms jika gagal didapatkan
        }
        document.body.classList.remove('loading-active') // Aktifkan scroll body kembali
      }, delay) // Terapkan delay untuk MIN_LOADING_TIME
    }
  }
  function showNotification(message, type) {
    const notificationElement = type === 'success' ? successMessage : errorMessage
    notificationElement.textContent = message
    notificationElement.style.display = 'block'
    setTimeout(() => {
      notificationElement.style.display = 'none'
      notificationElement.textContent = '' // Clear message
    }, 5000) // Hide after 5 seconds
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
  function formatDateTime(isoString) {
    if (!isoString) return 'N/A'
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
    try {
      return new Date(isoString).toLocaleString('id-ID', options)
    } catch (e) {
      console.error('Invalid date string:', isoString, e)
      return isoString // Return original if invalid
    }
  }
  // Function to get data items for a specific collection from Local Storage
  // Fungsi untuk mendapatkan item data untuk koleksi tertentu dari API
  async function getDataItems(collectionName, page = 1, limit = 5, searchTerm) {
    let url = `${baseUrl}api/${collectionName}/?page=${page}&limit=${limit}` // Sesuaikan dengan endpoint API Anda untuk membaca data
    if (searchTerm) {
      url += `&search=${searchTerm}` // Tambahkan parameter pencarian jika ada
    }
    try {
      showLoading() // Tampilkan indikator loading saat memuat data
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      return result.data || [] // Asumsikan respons memiliki properti 'data' yang berisi array item
    } catch (error) {
      console.error(`Error fetching data for ${collectionName}:`, error)
      showNotification(`Gagal memuat data untuk koleksi ${collectionName}.`, 'error')
      return []
    } finally {
      hideLoading() // Sembunyikan indikator loading setelah selesai
    }
  }
  // Function to save data items for a specific collection to Local Storage
  async function saveDataItems(collectionName, newItemData, isEditing, itemId) {
    try {
      let url = ''
      let method = ''
      if (isEditing) {
        // Jika sedang mengedit, kirim permintaan PUT untuk memperbarui item yang sudah ada
        url = `${baseUrl}api/${collectionName}/${itemId}`
        method = 'PUT'
      } else {
        // Jika membuat item baru, kirim permintaan POST
        url = `${baseUrl}api/${collectionName}`
        method = 'POST'
      }
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: newItemData, // Mengirim data item yang baru/diperbarui
        }), // Mengirim data item yang baru/diperbarui
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Gagal menyimpan data item.')
      }

      showNotification('Data item berhasil disimpan!', 'success')
      // closeSidebar()
      loadDataItems(currentSelectedCollection, currentDataItemPage, 4, currentDataItemSearchTerm)
      // loadDataItems(currentSelectedCollection) // Reload table // Muat ulang tabel untuk koleksi saat ini
    } catch (error) {
      console.error('Error saving data item:', error)
      showNotification(`Gagal menyimpan data item: ${error.message}`, 'error')
    } finally {
      hideLoading()
    }
  }
  // --- Sidebar and Overlay Handlers ---
  function openSidebar() {
    rightFormSidebar.classList.add('open')
    overlay.style.display = 'block'
  }
  function closeSidebar() {
    rightFormSidebar.classList.remove('open')
    overlay.style.display = 'none'

    // Hide all forms and reset
    collectionForm.classList.remove('active-form')
    collectionForm.reset()
    fieldsContainer.innerHTML = ''
    relationsContainer.innerHTML = ''
    collectionIdInput.value = ''

    dataItemForm.classList.remove('active-form')
    dataItemForm.reset()
    dataItemFieldsContainer.innerHTML = ''
    dataItemIdInput.value = ''
    dataItemCollectionNameInput.value = ''

    dashboardForm.classList.remove('active-form')
    dashboardForm.reset()
    dataDashboardFieldsContainer.innerHTML = ''
    dataDashboardIdInput.value = ''
  }

  closeSidebarBtns.forEach((btn) => btn.addEventListener('click', closeSidebar))
  overlay.addEventListener('click', closeSidebar)

  // --- Modal Handlers ---
  function openModal(modalElement) {
    modalElement.style.display = 'flex' // Use flex to center
    overlay.style.display = 'block'
  }
  function closeModal(modalElement) {
    modalElement.style.display = 'none'
    overlay.style.display = 'none'
  }
  // --- Collection Management ---
  function renderCollections(collections) {
    collectionsList.innerHTML = '' // Clear existing cards
    if (collections.length === 0) {
      collectionsList.innerHTML = `
            <div class="placeholder-card">
                <p>Belum ada koleksi. Klik "Tambah Koleksi" untuk membuat yang pertama.</p>
            </div>
        `
      console.log('renderCollections: No collections found')

      updatePaginationControls(0)
      return
    }

    collections.forEach((collection) => {
      const card = document.createElement('div')
      card.className = 'collection-card'
      card.dataset.id = collection.id
      card.innerHTML = `
                <h4>${collection.displayName}</h4>
                <p class="description">${collection.description || 'Tidak ada deskripsi.'}</p>
            `
      card.addEventListener('click', () => showCollectionDetail(collection.id))
      collectionsList.appendChild(card)
    })
    // Re-select if there was a previously selected collection
    if (currentSelectedCollectionId) {
      const activeCard = collectionsList.querySelector(
        `.collection-card[data-id="${currentSelectedCollectionId}"]`
      )
      if (activeCard) {
        activeCard.classList.add('active')
      }
    }
    updatePaginationControls(totalCollections)
  }
  async function loadCollections(search = null) {
    showLoading()
    try {
      const skip = (collectionCurrentPage - 1) * collectionPerPage // Hitung 'skip'
      const limit = collectionPerPage // 'limit' adalah itemsPerPage
      let url = `${baseUrl}configuration/collection/read?skip=${skip}&paging=${limit}` // Sesuaikan dengan endpoint API Anda
      if (search) {
        url += `&search=${search}` // Tambahkan parameter pencarian jika ada
      }
      const response = await fetch(url) // Replace with actual API endpoint
      if (response.status === 200) {
        currentCollections = await response.json()
        totalCollections = currentCollections.total
        currentCollections = currentCollections.data

        renderCollections(currentCollections)
        updatePaginationControls(totalCollections)

        // If a collection was selected, ensure its detail is shown
        if (
          currentSelectedCollectionId &&
          currentCollections.some((col) => col.id === currentSelectedCollectionId)
        ) {
          showCollectionDetail(currentSelectedCollectionId)
        } else {
          noCollectionSelectedMessage.style.display = 'block'
          collectionDetailView.style.display = 'none'
          currentSelectedCollectionId = null // Clear if not found
          currentSelectedCollection = null
        }
      } else {
        totalCollections = 0
        updatePaginationControls(0)
        showNotification('Gagal memuat koleksi.', 'error')
      }
    } catch (error) {
      console.error('Error loading collections:', error)
      showNotification('Terjadi kesalahan saat memuat koleksi.', 'error')
    } finally {
      hideLoading()
    }
  }
  function showCollectionDetail(id) {
    currentSelectedCollectionId = id // Store selected ID
    const selectedCollection = currentCollections.find((col) => col.id === id)
    currentSelectedCollection = selectedCollection // Store full object

    if (!selectedCollection) {
      showNotification('Koleksi tidak ditemukan.', 'error')
      noCollectionSelectedMessage.style.display = 'block'
      collectionDetailView.style.display = 'none'
      return
    }

    // Update active card styling
    document.querySelectorAll('.collection-card').forEach((card) => card.classList.remove('active'))
    const activeCard = collectionsList.querySelector(`.collection-card[data-id="${id}"]`)
    if (activeCard) {
      activeCard.classList.add('active')
    }

    detailCollectionName.textContent = selectedCollection.displayName
    detailCollectionInternalName.textContent = selectedCollection.name
    detailCollectionDescription.textContent =
      selectedCollection.description || 'Tidak ada deskripsi.'
    detailCollectionCreatedAt.textContent = formatDateTime(selectedCollection.created_at)
    detailCollectionUpdatedAt.textContent = formatDateTime(selectedCollection.updated_at)
    dataItemsCollectionNameTitle.textContent = selectedCollection.displayName // Update data items title

    noCollectionSelectedMessage.style.display = 'none'
    collectionDetailView.style.display = 'block'

    // Set up edit/delete buttons for this collection
    editCollectionBtn.onclick = () => populateFormForEdit(selectedCollection)
    deleteCollectionBtn.onclick = () => {
      deleteConfirmName.textContent = selectedCollection.displayName
      openModal(deleteConfirmModal)
      confirmDeleteBtn.onclick = () => handleDeleteCollection(selectedCollection)
    }

    // NEW: Load and render data items for this collection
    loadDataItems(currentSelectedCollection, currentDataItemPage, 4, currentDataItemSearchTerm)
  }
  async function handleDeleteCollection(id) {
    closeModal(deleteConfirmModal)
    showLoading()
    try {
      await fetch(`${baseUrl}configuration/collection/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: id.name,
        }),
      })
      showNotification('Koleksi berhasil dihapus.', 'success')
      currentSelectedCollectionId = null // Clear selected ID
      currentSelectedCollection = null
      loadCollections() // Reload the list
    } catch (error) {
      console.error('Error deleting collection:', error)
      showNotification('Gagal menghapus koleksi.', 'error')
    } finally {
      hideLoading()
    }
  }
  function initMonthlySalesChart() {
    // Mendapatkan elemen DOM wadah chart
    const chartDom = document.getElementById('monthly-sales-chart')
    if (!chartDom) {
      console.warn("Element 'monthly-sales-chart' not found. Chart will not be initialized.")
      return
    }

    // Inisialisasi instance ECharts
    const myChart = echarts.init(chartDom)

    // Opsi konfigurasi chart
    const option = {
      title: {
        text: 'Grafik Penjualan Bulanan',
        left: 'center',
        textStyle: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(),
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        axisLabel: {
          color: getComputedStyle(document.documentElement)
            .getPropertyValue('--secondary-color')
            .trim(),
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: getComputedStyle(document.documentElement)
            .getPropertyValue('--secondary-color')
            .trim(),
        },
        splitLine: {
          lineStyle: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--border-color')
              .trim(),
          },
        },
      },
      series: [
        {
          name: 'Penjualan',
          type: 'bar',
          data: [120, 200, 150, 80, 70, 110, 130, 90, 180, 220, 160, 140],
          itemStyle: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--primary-color')
              .trim(), // Menggunakan warna primer Anda
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    }

    // Mengatur opsi dan merender chart
    myChart.setOption(option)

    // Menyesuaikan ukuran chart saat window di-resize
    window.addEventListener('resize', function () {
      myChart.resize()
    })

    // Contoh bagaimana merespons perubahan mode gelap
    // Anda mungkin sudah memiliki fungsi toggleDarkMode. Panggil myChart.resize() di sana.
    // Atau buat observer untuk class 'dark-mode' pada body.
    const darkModeToggle = document.getElementById('toggle-dark-mode')
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        // Perbarui warna teks chart saat mode gelap diubah
        option.title.textStyle.color = getComputedStyle(document.documentElement)
          .getPropertyValue('--text-color')
          .trim()
        option.xAxis.axisLabel.color = getComputedStyle(document.documentElement)
          .getPropertyValue('--secondary-color')
          .trim()
        option.yAxis.axisLabel.color = getComputedStyle(document.documentElement)
          .getPropertyValue('--secondary-color')
          .trim()
        option.yAxis.splitLine.lineStyle.color = getComputedStyle(document.documentElement)
          .getPropertyValue('--border-color')
          .trim()
        myChart.setOption(option) // Terapkan opsi yang diperbarui
        myChart.resize() // Penting untuk memastikan chart menyesuaikan ukuran dan warna
      })
    }
  }
  // Function to load and render data items for the selected collection
  async function loadDataItems(collection, page = 1, limit = 4, searchQuery = '') {
    let items = await getDataItems(collection.name, page, limit, searchQuery)
    totalDataItems = items.totalCount // Update total count for pagination
    items = items.documents

    // Clear existing table
    dataTableHeaderRow.innerHTML = ''
    dataTableBody.innerHTML = ''

    if (items.length === 0) {
      dataItemsPlaceholder.style.display = 'block'
      dataItemsTable.style.display = 'none'
      totalDataItems = 0
      updateDataItemsPaginationControls(0)
      return
    } else {
      dataItemsPlaceholder.style.display = 'none'
      dataItemsTable.style.display = 'table' // Show table
      updateDataItemsPaginationControls(totalDataItems)
    }

    // Render table headers
    // Include 'id' and system fields by default, then custom fields
    const displayedFields = collection.fields.filter(
      (f) => !['created_at', 'updated_at'].includes(f.name)
    ) // Filter out these for brevity in table

    // Add header for Action buttons
    const actionHeader = document.createElement('th')
    actionHeader.textContent = 'Aksi'
    actionHeader.style.width = '1%'
    actionHeader.style.textAlign = 'center'
    dataTableHeaderRow.appendChild(actionHeader)

    // Reverse the order so custom fields appear first, then 'id'
    const orderedFields = [...displayedFields].reverse()
    orderedFields.forEach((field) => {
      const th = document.createElement('th')
      th.textContent = field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) // Format to Title Case
      dataTableHeaderRow.appendChild(th)
    })

    // Render table rows
    items.forEach((item) => {
      const tr = document.createElement('tr')
      tr.dataset.id = item.id

      // Action buttons column (first column)
      const actionsTd = document.createElement('td')
      actionsTd.className = 'actions-cell'
      actionsTd.innerHTML = `
                <button class="btn btn-outline-info btn-edit-data-item" data-id="${item._id}" title="Edit Data"><i class="fas fa-edit"></i></button>
                <button class="btn btn-outline-danger btn-delete-data-item" data-id="${item._id}" title="Hapus Data"><i class="fas fa-trash"></i></button>
            `
      tr.appendChild(actionsTd)

      // Data columns (reversed order to match header)
      orderedFields.forEach((field) => {
        const td = document.createElement('td')
        let fieldValue = item[field.name]

        if (field.type === 'datetime') {
          fieldValue = formatDateTime(fieldValue)
        } else if (field.type === 'boolean') {
          fieldValue = fieldValue ? 'Ya' : 'Tidak'
        } else if (field.type === 'json') {
          fieldValue = JSON.stringify(fieldValue) // Display as string
        } else if (field.type === 'media') {
          fieldValue = fieldValue
            ? `<a href="${fieldValue}" target="_blank">Lihat Media</a>`
            : 'Tidak Ada'
        } else if (field.type.startsWith('one-to') || field.type.startsWith('many-to')) {
          // Handle relations: Display linked collection display name if available
          const relation = collection.relations.find((rel) => rel.name === field.name)
          if (relation && fieldValue) {
            const targetCollectionData = getDataItems(relation.targetCollection)
            if (Array.isArray(fieldValue)) {
              // Many-to-many, one-to-many
              const linkedNames = fieldValue
                .map((linkedId) => {
                  const linkedItem = targetCollectionData.find((ti) => ti.id === linkedId)
                  return linkedItem
                    ? linkedItem.name || linkedItem.title || linkedItem.id
                    : linkedId // Try to find a display name
                })
                .filter(Boolean)
              fieldValue = linkedNames.length > 0 ? linkedNames.join(', ') : 'Tidak Ada'
            } else {
              // One-to-one, many-to-one
              const linkedItem = targetCollectionData.find((ti) => ti.id === fieldValue)
              fieldValue = linkedItem
                ? linkedItem.name || linkedItem.title || linkedItem.id
                : fieldValue
            }
          } else {
            fieldValue = 'Tidak Ada'
          }
        }

        td.innerHTML =
          fieldValue !== undefined && fieldValue !== null && fieldValue !== '' ? fieldValue : 'N/A'
        tr.appendChild(td)
      })
      dataTableBody.appendChild(tr)
    })

    // Attach event listeners for edit and delete buttons on data items
    dataTableBody.querySelectorAll('.btn-edit-data-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const itemId = e.currentTarget.dataset.id
        const itemToEdit = items.find((item) => item._id === itemId)
        if (itemToEdit) {
          populateDataItemForm(collection, itemToEdit)
        } else {
          showNotification('Item data tidak ditemukan untuk diedit.', 'error')
        }
      })
    })

    dataTableBody.querySelectorAll('.btn-delete-data-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const itemId = e.currentTarget.dataset.id
        const itemToDelete = items.find((item) => item._id === itemId)
        if (itemToDelete) {
          deleteConfirmName.textContent = `data item (ID: ${itemId})`
          openModal(deleteConfirmModal)
          confirmDeleteBtn.onclick = () => handleDeleteDataItem(collection.name, itemId)
        }
      })
    })
  }
  // Function to populate the data item form
  async function populateDataItemForm(collection, dataItem = null) {
    sidebarFormTitle.textContent = dataItem
      ? `Edit Data ${collection.displayName}`
      : `Tambah Data ${collection.displayName}`

    dashboardForm.classList.remove('active-form')
    collectionForm.classList.remove('active-form') // Hide collection form
    dataItemForm.classList.add('active-form') // Show data item form

    dataItemFieldsContainer.innerHTML = '' // Clear previous fields
    dataItemIdInput.value = dataItem ? dataItem._id : ''
    dataItemCollectionNameInput.value = collection.name

    // Render fields based on collection schema
    for (const field of collection.fields) {
      // Skip system fields like id, created_at, updated_at unless they are explicitly editable (unlikely)
      if (['id', 'created_at', 'updated_at'].includes(field.name) && field.readOnly) {
        // If ID is not readOnly, we might include it for manual input, but generally, it's system generated.
        // For now, we skip it as it's typically auto-generated.
        continue
      }
      const fieldValue = dataItem ? dataItem[field.name] : ''
      let inputHtml = ''
      const fieldId = `data-item-${collection.name}-${field.name}` // Unique ID for input
      const isRequiredAttr = field.required ? 'required' : ''
      const isReadOnlyAttr = field.readOnly ? 'readonly' : ''
      const labelText = field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) // Title Case

      switch (field.type) {
        case 'string':
          inputHtml = `<input type="text" id="${fieldId}" value="${fieldValue || ''}" placeholder="${labelText}" ${isRequiredAttr} ${isReadOnlyAttr}>`
          break
        case 'text':
          inputHtml = `<textarea id="${fieldId}" rows="5" placeholder="${labelText}" ${isRequiredAttr} ${isReadOnlyAttr}>${fieldValue || ''}</textarea>`
          break
        case 'number':
          inputHtml = `<input type="number" id="${fieldId}" value="${fieldValue !== null ? fieldValue : ''}" placeholder="${labelText}" ${isRequiredAttr} ${isReadOnlyAttr}>`
          break
        case 'boolean':
          inputHtml = `
                        <select id="${fieldId}" ${isRequiredAttr} ${isReadOnlyAttr}>
                            <option value="">Pilih...</option>
                            <option value="true" ${fieldValue === true ? 'selected' : ''}>Ya</option>
                            <option value="false" ${fieldValue === false ? 'selected' : ''}>Tidak</option>
                        </select>
                    `
          break
        case 'datetime':
          // Convert ISO string to date and time parts for input[type=date] and input[type=time]
          let datePart = ''
          let timePart = ''
          if (fieldValue) {
            try {
              const dateObj = new Date(fieldValue)
              datePart = dateObj.toISOString().split('T')[0] // YYYY-MM-DD
              timePart = dateObj.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
            } catch (e) {
              console.warn('Invalid datetime format for field:', field.name, fieldValue)
            }
          }
          inputHtml = `
            <input type="date" id="${fieldId}-date" value="${datePart}" ${isRequiredAttr} ${isReadOnlyAttr}>
            <input type="time" id="${fieldId}-time" value="${timePart}" ${isRequiredAttr} ${isReadOnlyAttr}>
          `
          break
        case 'json':
          inputHtml = `<textarea id="${fieldId}" rows="8" placeholder="${labelText} (JSON valid)" ${isRequiredAttr} ${isReadOnlyAttr}>${fieldValue ? JSON.stringify(fieldValue, null, 2) : ''}</textarea>`
          break
        case 'media':
          inputHtml = `<input type="text" id="${fieldId}" value="${fieldValue || ''}" placeholder="URL Media" ${isRequiredAttr} ${isReadOnlyAttr}>`
          break
        case 'enum':
          const enumOptions = field.options.values
            .map(
              (val) =>
                `<option value="${val}" ${fieldValue === val ? 'selected' : ''}>${val}</option>`
            )
            .join('')
          inputHtml = `
            <select id="${fieldId}" ${isRequiredAttr} ${isReadOnlyAttr}>
                <option value="">Pilih ${labelText}</option>
                ${enumOptions}
            </select>
          `
          break
        default:
          inputHtml = `<input type="text" id="${fieldId}" value="${fieldValue || ''}" placeholder="${labelText}" ${isRequiredAttr} ${isReadOnlyAttr}>`
          break
      }

      const formGroup = document.createElement('div')
      formGroup.className = 'form-group'
      formGroup.innerHTML = `
            <label for="${fieldId}">${labelText} ${field.required ? '<span class="required">*</span>' : ''}</label>
            ${inputHtml}
            ${field.unique ? '<small class="help-text">Nilai harus unik.</small>' : ''}
        `
      dataItemFieldsContainer.appendChild(formGroup)
    }

    // Render relations
    for (const relation of collection.relations) {
      const relationId = `data-item-${collection.name}-${relation.name}`
      const labelText = relation.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

      const targetCollectionData = await getDataItems(relation.targetCollection)
      // Generate options for related items (e.g., ID and a "display" field if available)
      const targetOptions = targetCollectionData.documents
        .map((item) => {
          const displayValue = item.name || item.title || item.id // Try common display fields
          return `<option value="${item.id}">${displayValue} (ID: ${item.id})</option>`
        })
        .join('')

      let relationInputHtml = ''
      const currentRelationValue = dataItem ? dataItem[relation.name] : null

      switch (relation.type) {
        case 'one-to-one':
        case 'many-to-one':
          relationInputHtml = `
                <select id="${relationId}">
                    <option value="">Tidak Ada</option>
                    ${targetOptions}
                </select>
            `
          // Set selected value
          if (currentRelationValue) {
            setTimeout(() => {
              // Timeout to ensure select is rendered
              const selectElement = document.getElementById(relationId)
              if (selectElement) selectElement.value = currentRelationValue
            }, 0)
          }
          break
        case 'one-to-many':
        case 'many-to-many':
          // For multiple selections, we'll use a multi-select dropdown
          // Note: Basic select with 'multiple' attribute is used. For better UX, a library like Select2 might be preferred.
          relationInputHtml = `
                        <select id="${relationId}" multiple style="min-height: 100px;">
                            ${targetOptions}
                        </select>
                        <small class="help-text">Tahan Ctrl/Cmd untuk memilih beberapa.</small>
                    `
          // Set selected values
          if (currentRelationValue && Array.isArray(currentRelationValue)) {
            setTimeout(() => {
              const selectElement = document.getElementById(relationId)
              if (selectElement) {
                Array.from(selectElement.options).forEach((option) => {
                  if (currentRelationValue.includes(option.value)) {
                    option.selected = true
                  }
                })
              }
            }, 0)
          }
          break
      }

      const formGroup = document.createElement('div')
      formGroup.className = 'form-group'
      formGroup.innerHTML = `
                <label for="${relationId}">Relasi ${labelText}</label>
                ${relationInputHtml}
            `
      dataItemFieldsContainer.appendChild(formGroup)
    }
    openSidebar()
  }
  function populateFormForEdit(collection) {
    sidebarFormTitle.textContent = 'Edit Koleksi'

    collectionForm.classList.add('active-form') // Show collection form
    dataItemForm.classList.remove('active-form') // Hide data item form
    dashboardForm.classList.remove('active-form') // Hide dashboard form

    collectionIdInput.value = collection.id
    collectionDisplayNameInput.value = collection.displayName
    collectionNameInput.value = collection.name
    collectionDescriptionInput.value = collection.description || ''

    fieldsContainer.innerHTML = ''
    // Add existing fields, including system ones
    collection.fields.forEach((field) => addField(field))

    relationsContainer.innerHTML = ''
    collection.relations.forEach((relation) => addRelation(relation))

    openSidebar()
  }

  async function populateDataDashboardForm(dataDashboard = null) {
    sidebarFormTitle.textContent = dataDashboard ? `Edit Dashboard` : `Tambah Dashboard`
    collectionForm.classList.remove('active-form') // Show collection form
    dataItemForm.classList.remove('active-form') // Hide data item form
    dashboardForm.classList.add('active-form') // Hide dashboard form
    openSidebar()
  }

  addCollectionBtn.addEventListener('click', () => {
    sidebarFormTitle.textContent = 'Tambah Koleksi Baru'

    collectionForm.classList.add('active-form') // Show collection form
    dataItemForm.classList.remove('active-form') // Hide data item form
    dashboardForm.classList.remove('active-form') // Hide dashboard form

    collectionForm.reset()
    collectionIdInput.value = ''
    fieldsContainer.innerHTML = ''
    relationsContainer.innerHTML = ''

    addField({
      name: 'created_at',
      type: 'datetime',
      required: false,
      unique: false,
      readOnly: true,
      collapsed: true,
      options: {},
    })
    addField({
      name: 'updated_at',
      type: 'datetime',
      required: false,
      unique: false,
      readOnly: true,
      collapsed: true,
      options: {},
    })

    openSidebar()
  })

  collectionDisplayNameInput.addEventListener('input', () => {
    if (!collectionIdInput.value) {
      // Only auto-fill for new collections
      collectionNameInput.value = slugify(collectionDisplayNameInput.value)
    }
  })

  collectionForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    showLoading()

    const isEditing = !!collectionIdInput.value
    const id = collectionIdInput.value || `col-${Date.now()}`
    const displayName = collectionDisplayNameInput.value.trim()
    const name = collectionNameInput.value.trim()
    const description = collectionDescriptionInput.value.trim()

    const fields = Array.from(fieldsContainer.querySelectorAll('.field-item'))
      .map((item) => {
        const fieldId = item.dataset.id

        // Periksa dan ambil elemen input nama
        const fieldNameInput = item.querySelector(`[id="${fieldId}-name"]`) // Menggunakan ID penuh
        if (!fieldNameInput) {
          console.error(`Error: Nama input field tidak ditemukan untuk ID: ${fieldId}`)
          return null // Lompat item ini atau tangani error
        }
        const fieldName = fieldNameInput.value.trim()
        const isNameReadOnly = fieldNameInput.readOnly // Ambil properti readOnly dari input nama

        // Periksa dan ambil elemen select tipe
        const fieldTypeSelect = item.querySelector(`[id="${fieldId}-type-select"]`) // Menggunakan ID penuh
        if (!fieldTypeSelect) {
          console.error(`Error: Tipe select field tidak ditemukan untuk ID: ${fieldId}`)
          return null
        }
        const fieldType = fieldTypeSelect.value

        // Periksa dan ambil checkbox required
        const isRequiredInput = item.querySelector(`[id="${fieldId}-required"]`) // Menggunakan ID penuh
        if (!isRequiredInput) {
          console.error(`Error: Checkbox 'required' tidak ditemukan untuk ID: ${fieldId}`)
          return null
        }
        const isRequired = isRequiredInput.checked

        // Periksa dan ambil checkbox unique
        const isUniqueInput = item.querySelector(`[id="${fieldId}-unique"]`) // Menggunakan ID penuh
        if (!isUniqueInput) {
          console.error(`Error: Checkbox 'unique' tidak ditemukan untuk ID: ${fieldId}`)
          return null
        }
        const isUnique = isUniqueInput.checked

        const isCollapsed = item
          .querySelector('.collapsible-content')
          .classList.contains('collapsed')

        let options = {}
        // Logika untuk mengumpulkan options tetap sama, pastikan ID elemen juga konsisten
        if (fieldType === 'number') {
          const minInput = item.querySelector(`[id="${fieldId}-min"]`)
          const maxInput = item.querySelector(`[id="${fieldId}-max"]`)
          options.min = minInput && minInput.value !== '' ? parseFloat(minInput.value) : null
          options.max = maxInput && maxInput.value !== '' ? parseFloat(maxInput.value) : null
        } else if (fieldType === 'string' || fieldType === 'text') {
          const minLengthInput = item.querySelector(`[id="${fieldId}-minlength"]`)
          const maxLengthInput = item.querySelector(`[id="${fieldId}-maxlength"]`)
          const patternInput = item.querySelector(`[id="${fieldId}-pattern"]`)
          options.minLength =
            minLengthInput && minLengthInput.value !== '' ? parseInt(minLengthInput.value) : null
          options.maxLength =
            maxLengthInput && maxLengthInput.value !== '' ? parseInt(maxLengthInput.value) : null
          options.pattern = patternInput ? patternInput.value || null : null
        } else if (fieldType === 'enum') {
          const enumValuesInput = item.querySelector(`[id="${fieldId}-enum-values"]`)
          options.values = enumValuesInput
            ? enumValuesInput.value
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v)
            : []
        }

        return {
          id: fieldId,
          name: fieldName,
          type: fieldType,
          required: isRequired,
          unique: isUnique,
          readOnly: isNameReadOnly,
          collapsed: isCollapsed,
          options: options,
        }
      })
      .filter((item) => item !== null) // Filter out any null items if an element was not found

    const relations = Array.from(relationsContainer.querySelectorAll('.relation-item'))
      .map((item) => {
        const relationId = item.dataset.id
        // Pastikan menggunakan ID penuh untuk querySelector
        const relationNameInput = item.querySelector(`[id="${relationId}-name"]`)
        if (!relationNameInput) {
          console.error(`Error: Nama input relasi tidak ditemukan untuk ID: ${relationId}`)
          return null
        }
        const relationName = relationNameInput.value.trim()

        const relationTypeSelect = item.querySelector(`[id="${relationId}-type"]`)
        if (!relationTypeSelect) {
          console.error(`Error: Tipe select relasi tidak ditemukan untuk ID: ${relationId}`)
          return null
        }
        const relationType = relationTypeSelect.value

        const targetCollectionSelect = item.querySelector(`[id="${relationId}-target"]`)
        if (!targetCollectionSelect) {
          console.error(`Error: Target koleksi select tidak ditemukan untuk ID: ${relationId}`)
          return null
        }
        const targetCollection = targetCollectionSelect.value
        const isCollapsed = item
          .querySelector('.collapsible-content')
          .classList.contains('collapsed')
        return {
          id: relationId,
          name: relationName,
          type: relationType,
          targetCollection: targetCollection,
          collapsed: isCollapsed,
        }
      })
      .filter((item) => item !== null) // Filter out any null items

    const newCollection = {
      id: id,
      displayName: displayName,
      name: name,
      description: description,
      fields: fields,
      relations: relations,
      created_at: isEditing
        ? currentCollections.find((c) => c.id === id).created_at
        : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      // Simulate API call
      let url_collections = isEditing
        ? `${baseUrl}configuration/collection/update`
        : `${baseUrl}configuration/collection/create`
      let data_collections = isEditing
        ? { id: `${name}_config`, query: newCollection }
        : { collectionConfigData: newCollection }

      await fetch(url_collections, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data_collections),
      })
      showNotification('Koleksi berhasil disimpan!', 'success')
      closeSidebar()
      loadCollections() // Reload list to reflect changes
      //   showCollectionDetail(newCollection.id) // Show detail of the saved collection
    } catch (error) {
      console.error('Error saving collection:', error)
      showNotification('Gagal menyimpan koleksi.', 'error')
    } finally {
      hideLoading()
    }
  })

  let fieldCounter = 0 // Use a counter for uniqueness within a session
  const fieldTypes = [
    { value: 'string', label: 'Teks Pendek', icon: 'fas fa-font' },
    { value: 'text', label: 'Teks Panjang', icon: 'fas fa-paragraph' },
    { value: 'number', label: 'Angka', icon: 'fas fa-hashtag' },
    { value: 'boolean', label: 'Boolean', icon: 'fas fa-toggle-on' },
    { value: 'datetime', label: 'Tanggal & Waktu', icon: 'fas fa-calendar-alt' },
    { value: 'json', label: 'JSON', icon: 'fas fa-code' },
    { value: 'media', label: 'Media', icon: 'fas fa-image' },
    { value: 'enum', label: 'Pilihan (Enum)', icon: 'fas fa-list' },
  ]

  function addField(fieldData = null) {
    const generatedId = `field-${Date.now()}-${fieldCounter++}` // Ensures truly unique ID
    const defaultFieldData = {
      id: generatedId,
      name: '',
      type: 'string',
      required: false,
      unique: false,
      readOnly: false, // Default for new fields
      collapsed: false,
      options: {},
    }

    // Merge provided fieldData with defaults
    const finalFieldData = { ...defaultFieldData, ...fieldData }

    // Override readOnly for specific system fields
    if (['id', 'created_at', 'updated_at'].includes(finalFieldData.name)) {
      finalFieldData.readOnly = true
    }

    const fieldItem = document.createElement('div')
    fieldItem.className = 'field-item'
    fieldItem.dataset.id = finalFieldData.id

    const isNameReadOnly = finalFieldData.readOnly ? 'readonly' : ''
    const isTypeDisabled = finalFieldData.readOnly ? 'disabled' : '' // Disable type change for system fields
    const isRequiredDisabled = finalFieldData.readOnly ? 'disabled' : ''
    const isUniqueDisabled = finalFieldData.readOnly ? 'disabled' : ''

    const collapsedClass = finalFieldData.collapsed ? 'collapsed' : ''
    const iconClass = finalFieldData.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'

    fieldItem.innerHTML = `
            <div class="field-header">
                <span class="title">
                    <span class="field-name-display">${finalFieldData.name || 'Nama Field Baru'}</span>
                    ${finalFieldData.readOnly ? '<i class="fas fa-lock" title="Field Bawaan Sistem"></i>' : ''}
                </span>
                <div class="item-actions">
                    ${!finalFieldData.readOnly ? `<button type="button" class="remove-item-btn" title="Hapus Field"><i class="fas fa-trash"></i></button>` : ''}
                    <button type="button" class="toggle-collapse-btn" title="Toggle Detail"><i class="fas ${iconClass}"></i></button>
                </div>
            </div>
            <div class="collapsible-content ${collapsedClass}">
                <div class="form-group">
                    <label for="${finalFieldData.id}-name">Nama Field <span class="required">*</span></label>
                    <input type="text" id="${finalFieldData.id}-name" value="${finalFieldData.name}" placeholder="Contoh: judul" ${isNameReadOnly} required>
                    <small class="help-text">Nama unik untuk field ini (akan digunakan di API).</small>
                </div>
                <div class="form-group">
                    <label for="${finalFieldData.id}-type-select">Tipe Data <span class="required">*</span></label>
                    <div class="type-options">
                        ${fieldTypes
                          .map(
                            (type) => `
                            <label class="type-option ${finalFieldData.type === type.value ? 'selected' : ''}" data-type="${type.value}">
                                <i class="${type.icon}"></i> ${type.label}
                                <input type="radio" name="${finalFieldData.id}-type-radio" value="${type.value}" style="display:none;" ${finalFieldData.type === type.value ? 'checked' : ''} ${isTypeDisabled}>
                            </label>
                        `
                          )
                          .join('')}
                    </div>
                    <select id="${finalFieldData.id}-type-select" style="display:none;"> ${fieldTypes.map((type) => `<option value="${type.value}" ${finalFieldData.type === type.value ? 'selected' : ''}>${type.label}</option>`).join('')}
                    </select>
                </div>

                <div class="field-type-specific-options" id="${finalFieldData.id}-options">
                    </div>

                <div class="form-group checkbox-group">
                    <input type="checkbox" id="${finalFieldData.id}-required" ${finalFieldData.required ? 'checked' : ''} ${isRequiredDisabled}>
                    <label for="${finalFieldData.id}-required">Wajib Diisi</label>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="${finalFieldData.id}-unique" ${finalFieldData.unique ? 'checked' : ''} ${isUniqueDisabled}>
                    <label for="${finalFieldData.id}-unique">Nilai Unik</label>
                </div>
            </div>
        `

    fieldsContainer.appendChild(fieldItem)

    // Event Listeners for new field item
    const nameInput = fieldItem.querySelector(`[id="${finalFieldData.id}-name"]`)
    const typeSelect = fieldItem.querySelector(`[id="${finalFieldData.id}-type-select"]`) // Use the hidden select
    const typeOptions = fieldItem.querySelectorAll('.type-option')
    const optionsContainer = fieldItem.querySelector(`[id="${finalFieldData.id}-options"]`)
    const removeBtn = fieldItem.querySelector('.remove-item-btn')
    const toggleCollapseBtn = fieldItem.querySelector('.toggle-collapse-btn')
    const collapsibleContent = fieldItem.querySelector('.collapsible-content')
    const fieldNameDisplay = fieldItem.querySelector('.field-name-display')

    // Initial render of type-specific options
    renderFieldTypeOptions(
      finalFieldData.type,
      optionsContainer,
      finalFieldData.id,
      finalFieldData.options
    )

    // Update field name in header as user types
    nameInput.addEventListener('input', () => {
      fieldNameDisplay.textContent = nameInput.value || 'Nama Field Baru'
    })

    // Handle type selection from custom radio-like buttons
    typeOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const radioInput = option.querySelector('input[type="radio"]')
        if (radioInput.disabled) return // Prevent changing type for disabled fields

        typeOptions.forEach((opt) => opt.classList.remove('selected'))
        option.classList.add('selected')

        radioInput.checked = true // Mark the hidden radio as checked
        typeSelect.value = radioInput.value // Update the hidden select value

        renderFieldTypeOptions(radioInput.value, optionsContainer, finalFieldData.id, {}) // Pass empty options for new selection
      })
    })

    // Toggle collapse
    toggleCollapseBtn.addEventListener('click', () => {
      collapsibleContent.classList.toggle('collapsed')
      const icon = toggleCollapseBtn.querySelector('i')
      icon.classList.toggle('fa-chevron-down')
      icon.classList.toggle('fa-chevron-up')
    })

    // Remove field
    if (removeBtn) {
      // Only add listener if button exists (not for readonly fields)
      removeBtn.addEventListener('click', () => {
        fieldItem.remove()
      })
    }
  }

  function renderFieldTypeOptions(type, container, uniqueId, optionsData) {
    container.innerHTML = '' // Clear previous options
    let html = ''

    switch (type) {
      case 'number':
        html = `
                    <div class="form-group">
                        <label for="${uniqueId}-min">Nilai Minimum</label>
                        <input type="number" id="${uniqueId}-min" value="${optionsData.min !== null ? optionsData.min : ''}" placeholder="Opsional">
                    </div>
                    <div class="form-group">
                        <label for="${uniqueId}-max">Nilai Maksimum</label>
                        <input type="number" id="${uniqueId}-max" value="${optionsData.max !== null ? optionsData.max : ''}" placeholder="Opsional">
                    </div>
                `
        break
      case 'string':
      case 'text':
        html = `
                    <div class="form-group">
                        <label for="${uniqueId}-minlength">Panjang Minimum (Karakter)</label>
                        <input type="number" id="${uniqueId}-minlength" value="${optionsData.minLength !== null ? optionsData.minLength : ''}" placeholder="Opsional">
                    </div>
                    <div class="form-group">
                        <label for="${uniqueId}-maxlength">Panjang Maksimum (Karakter)</label>
                        <input type="number" id="${uniqueId}-maxlength" value="${optionsData.maxLength !== null ? optionsData.maxLength : ''}" placeholder="Opsional">
                    </div>
                    <div class="form-group">
                        <label for="${uniqueId}-pattern">Pola Regex</label>
                        <input type="text" id="${uniqueId}-pattern" value="${optionsData.pattern || ''}" placeholder="Contoh: ^[A-Za-z0-9]+$">
                        <small class="help-text">Validasi dengan pola ekspresi reguler.</small>
                    </div>
                `
        break
      case 'enum':
        html = `
                    <div class="form-group">
                        <label for="${uniqueId}-enum-values">Pilihan Nilai (Dipisahkan koma)</label>
                        <textarea id="${uniqueId}-enum-values" rows="3" placeholder="Contoh: draft, published, archived">${optionsData.values ? optionsData.values.join(', ') : ''}</textarea>
                        <small class="help-text">Pisahkan setiap pilihan dengan koma (contoh: Pria, Wanita, Lainnya).</small>
                    </div>
                `
        break
      // No specific options for boolean, datetime, json, media
    }
    container.innerHTML = html
  }

  // --- Relation Management ---
  addRelationBtn.addEventListener('click', () => addRelation())

  let relationCounter = 0
  const relationTypes = [
    { value: 'one-to-one', label: 'Satu-ke-Satu' },
    { value: 'one-to-many', label: 'Satu-ke-Banyak' },
    { value: 'many-to-one', label: 'Banyak-ke-Satu' },
    { value: 'many-to-many', label: 'Banyak-ke-Banyak' },
  ]

  function addRelation(relationData = null) {
    const generatedId = `relation-${Date.now()}-${relationCounter++}`
    const defaultRelationData = {
      id: generatedId,
      name: '',
      type: 'one-to-one',
      targetCollection: '',
      collapsed: false,
    }

    const finalRelationData = { ...defaultRelationData, ...relationData }

    const relationItem = document.createElement('div')
    relationItem.className = 'relation-item'
    relationItem.dataset.id = finalRelationData.id

    const collapsedClass = finalRelationData.collapsed ? 'collapsed' : ''
    const iconClass = finalRelationData.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'

    // Get collection names for target select
    const collectionOptions = currentCollections
      .map(
        (col) =>
          `<option value="${col.name}" ${finalRelationData.targetCollection === col.name ? 'selected' : ''}>${col.displayName} (${col.name})</option>`
      )
      .join('')

    relationItem.innerHTML = `
            <div class="relation-header">
                <span class="title">
                    Relasi <span class="relation-name-display">${finalRelationData.name || 'Baru'}</span>
                </span>
                <div class="item-actions">
                    <button type="button" class="remove-item-btn" title="Hapus Relasi"><i class="fas fa-trash"></i></button>
                    <button type="button" class="toggle-collapse-btn" title="Toggle Detail"><i class="fas ${iconClass}"></i></button>
                </div>
            </div>
            <div class="collapsible-content ${collapsedClass}">
                <div class="form-group">
                    <label for="${finalRelationData.id}-name">Nama Relasi <span class="required">*</span></label>
                    <input type="text" id="${finalRelationData.id}-name" value="${finalRelationData.name}" placeholder="Contoh: penulis" required>
                    <small class="help-text">Nama unik untuk relasi ini (akan digunakan di API).</small>
                </div>
                <div class="form-group">
                    <label for="${finalRelationData.id}-type">Tipe Relasi <span class="required">*</span></label>
                    <select id="${finalRelationData.id}-type" required>
                        ${relationTypes.map((type) => `<option value="${type.value}" ${finalRelationData.type === type.value ? 'selected' : ''}>${type.label}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="${finalRelationData.id}-target">Target Koleksi <span class="required">*</span></label>
                    <select id="${finalRelationData.id}-target" required>
                        <option value="">Pilih Koleksi</option>
                        ${collectionOptions}
                    </select>
                    <small class="help-text">Koleksi yang akan direlasikan.</small>
                </div>
            </div>
        `
    relationsContainer.appendChild(relationItem)

    // Event Listeners for new relation item
    const nameInput = relationItem.querySelector(`[id="${finalRelationData.id}-name"]`)
    const removeBtn = relationItem.querySelector('.remove-item-btn')
    const toggleCollapseBtn = relationItem.querySelector('.toggle-collapse-btn')
    const collapsibleContent = relationItem.querySelector('.collapsible-content')
    const relationNameDisplay = relationItem.querySelector('.relation-name-display')

    // Update relation name in header as user types
    nameInput.addEventListener('input', () => {
      relationNameDisplay.textContent = nameInput.value || 'Baru'
    })

    // Toggle collapse
    toggleCollapseBtn.addEventListener('click', () => {
      collapsibleContent.classList.toggle('collapsed')
      const icon = toggleCollapseBtn.querySelector('i')
      icon.classList.toggle('fa-chevron-down')
      icon.classList.toggle('fa-chevron-up')
    })

    // Remove relation
    removeBtn.addEventListener('click', () => {
      relationItem.remove()
    })
  }

  closeModalBtns.forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal')))
  })

  cancelDeleteBtn.addEventListener('click', () => closeModal(deleteConfirmModal))

  // --- Dark Mode Toggle ---
  toggleDarkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode')
    const isDarkMode = document.body.classList.contains('dark-mode')
    localStorage.setItem('darkMode', isDarkMode)
    toggleDarkModeBtn.textContent = isDarkMode ? 'Mode Terang' : 'Mode Gelap'
  })

  // Apply dark mode preference on load
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode === 'true') {
    document.body.classList.add('dark-mode')
    toggleDarkModeBtn.textContent = 'Mode Terang'
  } else {
    toggleDarkModeBtn.textContent = 'Mode Gelap'
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser)
  }

  if (dataItemsSearchInput) {
    let dataItemSearchTimeout
    dataItemsSearchInput.addEventListener('keyup', (event) => {
      clearTimeout(dataItemSearchTimeout)
      dataItemSearchTimeout = setTimeout(() => {
        applyDataItemSearchFilter(event.target.value)
      }, 500)
    })
  }
  if (collectionSearchInput) {
    let searchTimeout // Variabel untuk debounce
    collectionSearchInput.addEventListener('keyup', (event) => {
      clearTimeout(searchTimeout) // Hapus timeout sebelumnya
      // Tunda pencarian untuk mengurangi beban API (debounce)
      searchTimeout = setTimeout(() => {
        applySearchFilter(event.target.value) // <-- Memanggil fungsi applySearchFilter
      }, 500) // Tunggu 300ms setelah user berhenti mengetik
    })
  }
  if (dataItemsPrevPageBtn) {
    dataItemsPrevPageBtn.addEventListener('click', () => {
      if (currentDataItemPage > 1) {
        currentDataItemPage--
        loadDataItems(currentSelectedCollection, currentDataItemPage, 4, currentDataItemSearchTerm)
      }
    })
  }

  // NEW: Event listener untuk tombol 'Selanjutnya' data item
  if (dataItemsNextPageBtn) {
    dataItemsNextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(totalDataItems / dataItemsPerPage)
      if (currentDataItemPage < totalPages) {
        currentDataItemPage++
        loadDataItems(currentSelectedCollection, currentDataItemPage, 4, currentDataItemSearchTerm)
      }
    })
  }
  // --- Navigation ---
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const menu = item.dataset.menu
      // Remove active from all nav items
      navItems.forEach((nav) => nav.classList.remove('active'))
      // Add active to clicked nav item
      item.classList.add('active')
      // Hide all content views
      collectionsView.classList.remove('active-view')
      settingsView.classList.remove('active-view')
      boardsView.classList.remove('active-view')
      // Show selected content view
      if (menu === 'collections') {
        collectionsView.classList.add('active-view')
        loadCollections() // Reload collections when navigating back
      } else if (menu === 'settings') {
        settingsView.classList.add('active-view')
      } else if (menu === 'dashboard') {
        boardsView.classList.add('active-view')
      } else if (menu === 'pintasan') {
        shortcutView.classList.add('active-view')
      }
    })
  })

  // --- Field Management ---
  addFieldBtn.addEventListener('click', () => addField())

  // --- Data Item Management (NEW SECTION) ---

  // Event listener for "Tambah Data Baru" button
  addDataItemBtn.addEventListener('click', () => {
    if (!currentSelectedCollection) {
      showNotification('Pilih koleksi terlebih dahulu untuk menambah data.', 'error')
      return
    }
    populateDataItemForm(currentSelectedCollection, null) // Pass null for new item
  })

  addDashboardnBtn.addEventListener('click', () => {
    populateDataDashboardForm()
  })
  // Handle Data Item Form Submission
  dataItemForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    showLoading()

    const collectionName = dataItemCollectionNameInput.value
    const collectionSchema = currentCollections.find((col) => col.name === collectionName)
    if (!collectionSchema) {
      showNotification('Skema koleksi tidak ditemukan.', 'error')
      hideLoading()
      return
    }

    const isEditing = !!dataItemIdInput.value
    const itemId = dataItemIdInput.value || `item-${Date.now()}`
    let newItemData = {
      id: itemId,
      //   created_at: isEditing
      //     ? currentSelectedCollection.data.find((d) => d.id === itemId).created_at
      //     : new Date().toISOString(), // Needs to fetch actual data, not currentSelectedCollection
      updated_at: new Date().toISOString(),
    }
    // Get values from dynamic fields
    for (const field of collectionSchema.fields) {
      if (['id', 'created_at', 'updated_at'].includes(field.name)) {
        // For system fields, if it's new, we already set it. If editing, we keep the original.
        // We don't read them from the form unless they were manually editable.
        continue
      }

      const fieldId = `data-item-${collectionName}-${field.name}`
      let value

      switch (field.type) {
        case 'boolean':
          const boolSelect = document.getElementById(fieldId)
          value = boolSelect
            ? boolSelect.value === 'true'
              ? true
              : boolSelect.value === 'false'
                ? false
                : null
            : null
          break
        case 'number':
          const numInput = document.getElementById(fieldId)
          value = numInput ? (numInput.value !== '' ? parseFloat(numInput.value) : null) : null
          break
        case 'datetime':
          const dateInput = document.getElementById(`${fieldId}-date`)
          const timeInput = document.getElementById(`${fieldId}-time`)
          if (dateInput && dateInput.value) {
            value = dateInput.value
            if (timeInput && timeInput.value) {
              value += `T${timeInput.value}:00.000Z` // ISO 8601 format (simplified)
            } else {
              value += `T00:00:00.000Z`
            }
          } else {
            value = null
          }
          break
        case 'json':
          const jsonTextarea = document.getElementById(fieldId)
          try {
            value = jsonTextarea && jsonTextarea.value ? JSON.parse(jsonTextarea.value) : null
          } catch (e) {
            showNotification(`Invalid JSON for field "${field.name}".`, 'error')
            hideLoading()
            return // Stop submission if JSON is invalid
          }
          break
        default: // string, text, media, enum
          const inputElement = document.getElementById(fieldId)
          value = inputElement ? inputElement.value : null
          break
      }

      // Basic validation for required fields
      if (
        field.required &&
        (value === null || value === '' || (Array.isArray(value) && value.length === 0))
      ) {
        showNotification(
          `Field "${field.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}" wajib diisi.`,
          'error'
        )
        hideLoading()
        return
      }
      newItemData[field.name] = value
    }

    // Get values from dynamic relation fields
    for (const relation of collectionSchema.relations) {
      const relationId = `data-item-${collectionName}-${relation.name}`
      const selectElement = document.getElementById(relationId)
      let value = null

      if (selectElement) {
        if (selectElement.multiple) {
          // One-to-many, Many-to-many
          value = Array.from(selectElement.selectedOptions).map((option) => option.value)
        } else {
          // One-to-one, Many-to-one
          value = selectElement.value || null
        }
      }
      newItemData[relation.name] = value
    }

    try {
      let currentDataItems = await getDataItems(collectionName)
      currentDataItems = currentDataItems.documents
      // Handle unique fields validation
      for (const field of collectionSchema.fields) {
        if (
          field.unique &&
          field.name in newItemData &&
          newItemData[field.name] !== null &&
          newItemData[field.name] !== ''
        ) {
          const isDuplicate = currentDataItems.some(
            (item) => item.id !== itemId && item[field.name] === newItemData[field.name]
          )
          if (isDuplicate) {
            showNotification(
              `Nilai "${newItemData[field.name]}" untuk field "${field.name}" sudah ada (harus unik).`,
              'error'
            )
            hideLoading()
            return
          }
        }
      }

      if (isEditing) {
        const index = currentDataItems.findIndex((item) => item.id === itemId)
        if (index !== -1) {
          // Preserve createdAt from original item if editing
          newItemData.created_at = currentDataItems[index].created_at
          currentDataItems[index] = newItemData
        }
      } else {
        currentDataItems.push(newItemData)
      }
      await saveDataItems(collectionName, newItemData, isEditing, itemId)
      currentDataItems = []
      showNotification('Data item berhasil disimpan!', 'success')
      closeSidebar()
      loadDataItems(currentSelectedCollection, currentDataItemPage, 4, currentDataItemSearchTerm)
    } catch (error) {
      console.error('Error saving data item:', error)
      showNotification('Gagal menyimpan data item.', 'error')
    } finally {
      hideLoading()
    }
  })

  async function handleDeleteDataItem(collectionName, itemId) {
    closeModal(deleteConfirmModal)
    showLoading()
    try {
      await fetch(`${baseUrl}api/${collectionName}/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      showNotification('Koleksi berhasil dihapus.', 'success')
      loadDataItems(currentSelectedCollection, currentDataItemPage, 4, currentDataItemSearchTerm)
      // loadDataItems(currentSelectedCollection) // Reload table
    } catch (error) {
      console.error('Error deleting data item:', error)
      showNotification('Gagal menghapus data item.', 'error')
    } finally {
      hideLoading()
    }
  }
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (collectionCurrentPage > 1) {
        collectionCurrentPage--
        loadCollections() // <-- Ini akan memicu renderCollections yang kemudian memanggil updatePaginationControls
      }
    })
  }
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(totalCollections / collectionPerPage)
      if (collectionCurrentPage < totalPages) {
        collectionCurrentPage++
        loadCollections() // <-- Ini akan memicu renderCollections yang kemudian memanggil updatePaginationControls
      }
    })
  }

  if (
    document.getElementById('dashboard-view') &&
    document.getElementById('dashboard-view').classList.contains('active-view')
  ) {
    initMonthlySalesChart()
  }

  // Initial load
  loadCollections()
  checkAuthAndLoadUser()
})
