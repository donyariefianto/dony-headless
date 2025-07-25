// js/pages/businessFlowSettings.js

import { BASE_API_URL } from '../config/constants.js'
import { showLoadingOverlay, hideLoadingOverlay, openSidePanel, closeSidePanel } from '../main.js'

/**
 * Melampirkan semua event listener untuk form generator di side panel.
 */
function attachBusinessFlowGeneratorEventListeners() {
  const form = document.getElementById('newBusinessFlowGenerator')
  if (!form) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const flowName = form.querySelector('#flowName').value
    const flowSlug = form.querySelector('#flowSlug').value
    alert(`Business Flow '${flowName}' dengan slug '${flowSlug}' siap disimpan.`)
    // TODO: Panggil API untuk menyimpan business flow baru di sini
    closeSidePanel()
    fetchBusinessFlows()
  })
}

/**
 * Merender form generator di side panel.
 */
export function renderBusinessFlowGenerator(flowData = null) {
    const flowTitle = flowData ? 'Edit Alur Kerja' : 'Buat Business Flow Baru';

    const formHtml = `
        <form id="newBusinessFlowGenerator" class="p-4 active-form">
            ${flowData ? `<input type="hidden" id="flowId" value="${flowData._id || ''}">` : ''}
            <div class="form-section">
                <h4>Informasi Dasar</h4>
                <div class="form-group mb-3">
                    <label class="form-label" for="flowName">Nama Alur Kerja</label>
                    <input type="text" id="flowName" class="form-control" value="${flowData?.name || ''}" required />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" for="flowSlug">Slug</label>
                    <input type="text" id="flowSlug" class="form-control" value="${flowData?.slug || ''}" required />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" for="flowCollection">Koleksi Target</label>
                    <input type="text" id="flowCollection" class="form-control" value="${flowData?.collection_target || ''}" required />
                </div>
            </div>
            <div class="form-section">
                <h4>Tahapan Alur Kerja</h4>
                <div id="flow-steps" class="sortable-list"></div>
                <button type="button" id="addFlowStepBtn" class="btn btn-outline-primary btn-add-item mt-3">+ Tambah Tahapan</button>
            </div>
            <div class="form-section">
                <h4>Hasil Skema</h4>
                <pre id="schema-output" class="p-3 bg-light border rounded"></pre>
                <button type="button" id="generateSchemaBtn" class="btn btn-primary mt-2">📦 Generate Skema JSON</button>
            </div>
            <div class="form-actions mt-4">
                <button type="submit" class="btn btn-primary">Simpan Konfigurasi Alur Kerja</button>
            </div>
        </form>
    `;

    openSidePanel(flowTitle, formHtml);
    window.currentFlowData = flowData;
    attachBusinessFlowGeneratorEventListeners();
}


export function renderBusinessFlowSettingsPage(container) {
  let currentPage = 1
  let currentLimit = 10
  let currentSearch = ''

  const renderBusinessFlowList = (flows, totalCount, totalPages) => {
    container.innerHTML = `
            <div class="settings-group">
                <h4>Daftar Business Flow</h4>
                <div id="businessFlowListContent">
                    <div class="table-controls">
                        <div class="search-box">
                            <input type="text" id="flowSearchInput" placeholder="Cari Business Flow..." value="${currentSearch}">
                            <button id="searchButton" class="btn btn-primary"><i class="fa-solid fa-search"></i></button>
                            <button id="clearSearchButton" class="btn btn-icon"><i class="fa-solid fa-times"></i></button>
                        </div>
                        <div class="right-controls">
                            <button class="btn btn-primary" id="addFlowBtn"><i class="fa-solid fa-plus"></i> Buat Business Flow Baru</button>
                        </div>
                    </div>
    
                    <ul id="flowListItems" class="settings-list-items">
                        </ul>
    
                    <div id="flowPagination" class="pagination-controls" style="display:none;">
                        <p id="paginationTotal"></p>
                        <div class="pagination-buttons">
                            <button id="prevPageBtn" class="btn btn-secondary pagination-btn" data-page="prev" disabled="">Previous</button>
                            <span id="pageInfo"></span>
                            <button id="nextPageBtn" class="btn btn-secondary pagination-btn" data-page="next" disabled="">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        `

    const flowListItems = container.querySelector('#flowListItems')
    const flowPagination = container.querySelector('#flowPagination')
    const paginationTotal = container.querySelector('#paginationTotal')
    const pageInfo = container.querySelector('#pageInfo')
    const prevPageBtn = container.querySelector('#prevPageBtn')
    const nextPageBtn = container.querySelector('#nextPageBtn')
    const addFlowBtn = container.querySelector('#addFlowBtn')
    const flowSearchInput = container.querySelector('#flowSearchInput')
    const searchButton = container.querySelector('#searchButton')
    const clearSearchButton = container.querySelector('#clearSearchButton')

    if (flows.length === 0) {
      flowListItems.innerHTML = `<p class="text-center-subtle">Belum ada business flow yang dibuat.</p>`
      flowPagination.style.display = 'none'
    } else {
      flowListItems.innerHTML = flows
        .map(
          (flow) => `
                <li data-name="${flow.slug}" data-display-name="${flow.name}">
                    <span><strong>${flow.name}</strong> <br> <small><em>Nama Internal: ${flow.slug || flow._id}</em></small></span>
                    <div class="item-actions">
                        <button class="btn btn-icon btn-edit-flow" data-flow-id="${flow._id}" aria-label="Edit Business Flow"><i class="fa-solid fa-edit"></i></button>
                        <button class="btn btn-icon btn-delete-flow" data-flow-id="${flow._id}" data-display-name="${flow.name}" aria-label="Hapus Business Flow"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </li>
            `
        )
        .join('')

      flowPagination.style.display = 'flex'
      paginationTotal.textContent = `Total: ${totalCount} business flow`
      pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`
      prevPageBtn.disabled = currentPage <= 1
      nextPageBtn.disabled = currentPage >= totalPages
    }

    addFlowBtn.addEventListener('click', renderBusinessFlowGenerator)
    searchButton.addEventListener('click', () => {
      currentSearch = flowSearchInput.value
      currentPage = 1
      fetchBusinessFlows()
    })
    clearSearchButton.addEventListener('click', () => {
      flowSearchInput.value = ''
      currentSearch = ''
      currentPage = 1
      fetchBusinessFlows()
    })
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--
        fetchBusinessFlows()
      }
    })
    nextPageBtn.addEventListener('click', () => {
      currentPage++
      fetchBusinessFlows()
    })

    container.querySelectorAll('.btn-edit-flow').forEach((button) => {
      button.addEventListener('click', (e) => {
        const flowId = e.currentTarget.dataset.flowId
        alert(`Mengedit business flow dengan ID: ${flowId}`)
      })
    })

    container.querySelectorAll('.btn-delete-flow').forEach((button) => {
      button.addEventListener('click', (e) => {
        const flowId = e.currentTarget.dataset.flowId
        const flowName = e.currentTarget.dataset.displayName
        if (confirm(`Apakah Anda yakin ingin menghapus business flow '${flowName}' ini?`)) {
          alert(`Business Flow '${flowName}' (ID: ${flowId}) dihapus.`)
        }
      })
    })
  }

  const fetchBusinessFlows = async () => {
    showLoadingOverlay()
    try {
      const url = `${BASE_API_URL}/configuration/flow-manager/list?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status) {
        renderBusinessFlowList(data.data.documents, data.data.totalCount, data.data.totalPages)
      } else {
        renderBusinessFlowList([], 0, 0)
      }
    } catch (error) {
      console.error('Error fetching business flows:', error)
      renderBusinessFlowList([], 0, 0)
    } finally {
      hideLoadingOverlay()
    }
  }

  fetchBusinessFlows()
}
