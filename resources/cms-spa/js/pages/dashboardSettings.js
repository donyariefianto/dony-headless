import { BASE_API_URL } from '../config/constants.js';
import {
    showLoadingOverlay,
    hideLoadingOverlay,
    openSidePanel,
    closeSidePanel,
} from '../main.js';

/**
 * Helper function to build a single chart widget
 */
function buildChartWidget(chartData = null) {
    const widgetId = `chart-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    const wrapper = document.createElement("div");
    wrapper.className = "card mb-3 chart-widget-item";
    wrapper.dataset.id = widgetId;
    wrapper.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <span class="fw-bold"><span class="chart-title-display">${chartData?.title || 'Chart Baru'}</span></span>
            <div class="item-actions">
                <button type="button" class="btn btn-sm btn-danger btn-icon remove-item-btn"><i class="fas fa-trash"></i></button>
                <button type="button" class="btn btn-sm btn-secondary btn-icon toggle-collapse-btn"><i class="fas fa-chevron-up"></i></button>
            </div>
        </div>
        <div class="card-body collapsible-content">
            <div class="form-group mb-3">
                <label class="form-label">Judul Chart</label>
                <input type="text" class="chart-title form-control" value="${chartData?.title || ''}" />
            </div>
            <div class="form-group mb-3">
                <label class="form-label">Tipe Tampilan Chart (ECharts)</label>
                <select class="chart-type form-control">
                    <option value="bar" ${chartData?.type === 'bar' ? 'selected' : ''}>Bar Chart</option>
                    <option value="line" ${chartData?.type === 'line' ? 'selected' : ''}>Line Chart</option>
                    <option value="pie" ${chartData?.type === 'pie' ? 'selected' : ''}>Pie Chart</option>
                    <option value="gauge" ${chartData?.type === 'gauge' ? 'selected' : ''}>Gauge Chart</option>
                    <option value="scatter" ${chartData?.type === 'scatter' ? 'selected' : ''}>Scatter Chart</option>
                </select>
            </div>
            <div class="form-group mb-3">
                <label class="form-label">Koleksi Data</label>
                <input type="text" class="chart-data-collection form-control" value="${chartData?.data?.collection || ''}" placeholder="misal: penjualan_harian" />
            </div>
            <div class="form-group mb-3">
                <label class="form-label">Konfigurasi ECharts (JSON)</label>
                <textarea class="chart-options-json form-control" rows="5">${chartData?.options ? JSON.stringify(chartData.options, null, 2) : ''}</textarea>
            </div>
        </div>
    `;

    // Event Listeners for the chart widget
    wrapper.querySelector('.chart-title').addEventListener('input', (e) => {
        wrapper.querySelector('.chart-title-display').textContent = e.target.value || 'Chart Baru';
    });
    wrapper.querySelector('.remove-item-btn').addEventListener('click', () => wrapper.remove());
    wrapper.querySelector('.toggle-collapse-btn').addEventListener('click', (e) => {
        const content = e.currentTarget.closest(".chart-widget-item").querySelector(".collapsible-content");
        content.classList.toggle("collapsed");
        const icon = e.currentTarget.querySelector("i");
        icon.classList.toggle("fa-chevron-up");
        icon.classList.toggle("fa-chevron-down");
    });
    return wrapper;
}

/**
 * Generates the JSON schema from the form inputs
 */
function generateDashboardSchema(dashboardPanel) {
    const schema = {
        id: dashboardPanel.querySelector("#dashboardId")?.value || null,
        name: dashboardPanel.querySelector("#dashboardName")?.value || '',
        slug: dashboardPanel.querySelector("#dashboardSlug")?.value || '',
        widgets: Array.from(dashboardPanel.querySelectorAll("#dashboard-widgets .chart-widget-item")).map(widgetDiv => {
            let chartOptions = {};
            try {
                chartOptions = JSON.parse(widgetDiv.querySelector(".chart-options-json").value);
            } catch (e) {
                console.error("Invalid JSON in chart options:", e);
                alert("Konfigurasi ECharts tidak valid, silakan periksa kembali JSON Anda.");
            }
            return {
                title: widgetDiv.querySelector(".chart-title").value,
                type: widgetDiv.querySelector(".chart-type").value,
                data: {
                    collection: widgetDiv.querySelector(".chart-data-collection").value,
                },
                options: chartOptions
            };
        })
    };
    dashboardPanel.querySelector("#schema-output").textContent = JSON.stringify(schema, null, 2);
    return schema;
}

/**
 * Attaches all event listeners for the dashboard generator form
 */
function attachDashboardGeneratorEventListeners() {
    const form = document.getElementById('newDashboardGenerator');
    if (!form) return;

    function addChartWidget() {
        form.querySelector("#dashboard-widgets").appendChild(buildChartWidget());
    }

    form.querySelector("#addChartBtn").addEventListener('click', addChartWidget);
    form.querySelector("#generateSchemaBtn").addEventListener('click', () => generateDashboardSchema(form));
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const schema = generateDashboardSchema(form);
        const dashboardId = schema.id;

        showLoadingOverlay();
        try {
            const method = dashboardId ? 'PUT' : 'POST';
            const url = dashboardId ? `${BASE_API_URL}/configuration/dashboard/update/${dashboardId}` : `${BASE_API_URL}/configuration/dashboard/create`;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(schema)
            });
            const result = await response.json();

            if (result.status) {
                alert(`Dashboard '${schema.name}' berhasil disimpan.`);
                closeSidePanel();
            } else {
                alert(`Gagal menyimpan dashboard: ${result.message}`);
            }
        } catch (error) {
            console.error('Error saving dashboard:', error);
            alert('Terjadi kesalahan saat menyimpan dashboard.');
        } finally {
            hideLoadingOverlay();
        }
    });

    if (window.currentDashboardData) {
        form.querySelector("#dashboardId").value = window.currentDashboardData._id || '';
        form.querySelector("#dashboardName").value = window.currentDashboardData.name || '';
        form.querySelector("#dashboardSlug").value = window.currentDashboardData.slug || '';
        
        const widgetsContainer = form.querySelector("#dashboard-widgets");
        (window.currentDashboardData.widgets || []).forEach(widget => {
            widgetsContainer.appendChild(buildChartWidget(widget));
        });

        window.currentDashboardData = null;
    }
}

/**
 * Renders the dashboard generator form in a side panel
 */
export function renderDashboardGenerator(dashboardData = null) {
    const dashboardTitle = dashboardData ? 'Edit Dashboard' : 'Buat Dashboard Baru';

    const formHtml = `
        <form id="newDashboardGenerator" class="p-4 active-form">
            ${dashboardData ? `<input type="hidden" id="dashboardId" value="${dashboardData._id || ''}">` : ''}
            <div class="form-section">
                <h4>Informasi Dasar</h4>
                <div class="form-group mb-3">
                    <label class="form-label" for="dashboardName">Nama Dashboard</label>
                    <input type="text" id="dashboardName" class="form-control" value="${dashboardData?.name || ''}" required />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" for="dashboardSlug">Slug</label>
                    <input type="text" id="dashboardSlug" class="form-control" value="${dashboardData?.slug || ''}" required />
                </div>
            </div>
            <div class="form-section">
                <h4>Widget / Chart</h4>
                <div id="dashboard-widgets" class="sortable-list"></div>
                <button type="button" id="addChartBtn" class="btn btn-outline-primary btn-add-item mt-3">+ Tambah Chart</button>
            </div>
            <div class="form-section">
                <h4>Hasil Skema</h4>
                <pre id="schema-output" class="p-3 bg-light border rounded"></pre>
                <button type="button" id="generateSchemaBtn" class="btn btn-primary mt-2">📦 Generate Skema JSON</button>
            </div>
            <div class="form-actions mt-4">
                <button type="submit" class="btn btn-primary">Simpan Konfigurasi Dashboard</button>
            </div>
        </form>
    `;

    openSidePanel(dashboardTitle, formHtml);
    window.currentDashboardData = dashboardData;
    attachDashboardGeneratorEventListeners();
}

/**
 * Renders the list of dashboards on the main page
 */
export function renderDashboardSettingsPage(container) {
  let currentPage = 1;
  let currentLimit = 10;
  let currentSearch = '';

  const renderDashboardList = (dashboards, totalCount, totalPages) => {
    container.innerHTML = `
        <div class="settings-group">
            <h4>Daftar Konfigurasi Dashboard</h4>
            <div id="dashboardListContent">
                <div class="table-controls">
                    <div class="search-box">
                        <input type="text" id="dashboardSearchInput" placeholder="Cari Dashboard..." value="${currentSearch}">
                        <button id="searchButton" class="btn btn-primary"><i class="fa-solid fa-search"></i></button>
                        <button id="clearSearchButton" class="btn btn-icon"><i class="fa-solid fa-times"></i></button>
                    </div>
                    <div class="right-controls">
                        <button class="btn btn-primary" id="addDashboardBtn"><i class="fa-solid fa-plus"></i> Buat Dashboard Baru</button>
                    </div>
                </div>

                <ul id="dashboardListItems" class="settings-list-items">
                    </ul>

                <div id="dashboardPagination" class="pagination-controls" style="display:none;">
                    <p id="paginationTotal"></p>
                    <div class="pagination-buttons">
                        <button id="prevPageBtn" class="btn btn-secondary pagination-btn" data-page="prev" disabled="">Previous</button>
                        <span id="pageInfo"></span>
                        <button id="nextPageBtn" class="btn btn-secondary pagination-btn" data-page="next" disabled="">Next</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const dashboardListItems = container.querySelector('#dashboardListItems');
    const dashboardPagination = container.querySelector('#dashboardPagination');
    const paginationTotal = container.querySelector('#paginationTotal');
    const pageInfo = container.querySelector('#pageInfo');
    const prevPageBtn = container.querySelector('#prevPageBtn');
    const nextPageBtn = container.querySelector('#nextPageBtn');
    const addDashboardBtn = container.querySelector('#addDashboardBtn');
    const dashboardSearchInput = container.querySelector('#dashboardSearchInput');
    const searchButton = container.querySelector('#searchButton');
    const clearSearchButton = container.querySelector('#clearSearchButton');

    if (dashboards.length === 0) {
        dashboardListItems.innerHTML = `<p class="text-center-subtle">Belum ada dashboard yang dibuat.</p>`;
        dashboardPagination.style.display = 'none';
    } else {
        dashboardListItems.innerHTML = dashboards.map(dashboard => `
            <li data-name="${dashboard.slug}" data-display-name="${dashboard.name}">
                <span><strong>${dashboard.name}</strong> <br> <small><em>Nama Internal: ${dashboard.slug || dashboard._id}</em></small></span>
                <div class="item-actions">
                    <button class="btn btn-icon btn-edit-dashboard" data-dashboard-id="${dashboard._id}" aria-label="Edit Dashboard"><i class="fa-solid fa-edit"></i></button>
                    <button class="btn btn-icon btn-delete-dashboard" data-dashboard-id="${dashboard._id}" data-display-name="${dashboard.name}" aria-label="Hapus Dashboard"><i class="fa-solid fa-trash"></i></button>
                </div>
            </li>
        `).join('');

        dashboardPagination.style.display = 'flex';
        paginationTotal.textContent = `Total: ${totalCount} dashboard`;
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    if (addDashboardBtn) {
        addDashboardBtn.addEventListener('click', () => renderDashboardGenerator());
    }
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            currentSearch = dashboardSearchInput.value;
            currentPage = 1;
            fetchDashboards();
        });
    }
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', () => {
            dashboardSearchInput.value = '';
            currentSearch = '';
            currentPage = 1;
            fetchDashboards();
        });
    }
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchDashboards();
            }
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            fetchDashboards();
        });
    }

    container.querySelectorAll('.btn-edit-dashboard').forEach((button) => {
      button.addEventListener('click', (e) => {
        const dashboardId = e.currentTarget.dataset.dashboardId;
        fetchDashboardById(dashboardId);
      });
    });

    container.querySelectorAll('.btn-delete-dashboard').forEach((button) => {
      button.addEventListener('click', async (e) => {
        const dashboardId = e.currentTarget.dataset.dashboardId;
        const dashboardName = e.currentTarget.dataset.displayName;
        if (confirm(`Apakah Anda yakin ingin menghapus dashboard '${dashboardName}' ini?`)) {
          showLoadingOverlay();
          try {
              const response = await fetch(`${BASE_API_URL}/configuration/dashboard/delete/${dashboardId}`, {
                  method: 'DELETE'
              });
              const result = await response.json();
              if (result.status) {
                  alert(`Dashboard '${dashboardName}' berhasil dihapus.`);
                  fetchDashboards();
              } else {
                  alert(`Gagal menghapus dashboard: ${result.message}`);
              }
          } catch (error) {
              console.error('Error deleting dashboard:', error);
              alert('Terjadi kesalahan saat menghapus dashboard.');
          } finally {
              hideLoadingOverlay();
          }
        }
      });
    });
  };

  const fetchDashboards = async () => {
    showLoadingOverlay();
    try {
      const url = `${BASE_API_URL}/configuration/dashboard/list?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status) {
        renderDashboardList(data.data.documents, data.data.totalCount, data.data.totalPages);
      } else {
        renderDashboardList([], 0, 0);
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      renderDashboardList([], 0, 0);
    } finally {
      hideLoadingOverlay();
    }
  };

  const fetchDashboardById = async (dashboardId) => {
    showLoadingOverlay();
    try {
        const url = `${BASE_API_URL}/configuration/dashboard/read/${dashboardId}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status && data.data) {
            renderDashboardGenerator(data.data);
        } else {
            alert('Gagal mengambil data dashboard. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        alert('Terjadi kesalahan saat mengambil data dashboard.');
    } finally {
        hideLoadingOverlay();
    }
  };

  fetchDashboards();
}