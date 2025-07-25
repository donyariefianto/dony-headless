// js/pages/dashboardPage.js

import { BASE_API_URL } from '../config/constants.js';
import { showLoadingOverlay, hideLoadingOverlay, addClass, removeClass } from '../main.js';

/**
 * Fungsi untuk mengambil data chart dari API
 * (Ini adalah placeholder. Asumsi data diambil dari koleksi)
 */
async function fetchChartData(collection) {
    console.log(`Mengambil data dari koleksi: ${collection}`);
    // Simulasi pengambilan data dari API
    return new Promise(resolve => {
        setTimeout(() => {
            if (collection === 'penjualan_harian') {
                resolve([
                    { value: 120, name: 'Jan' },
                    { value: 200, name: 'Feb' },
                    { value: 150, name: 'Mar' },
                    { value: 80, name: 'Apr' },
                    { value: 70, name: 'May' },
                ]);
            } else if (collection === 'stok_produk') {
                resolve([
                    { value: 50, name: 'Produk A' },
                    { value: 120, name: 'Produk B' },
                    { value: 80, name: 'Produk C' },
                ]);
            } else {
                resolve([]);
            }
        }, 500);
    });
}

/**
 * Fungsi untuk merender satu chart menggunakan ECharts
 */
function renderChart(elementId, type, chartOptions, data) {
    const chartDom = document.getElementById(elementId);
    if (!chartDom) {
        console.error(`Elemen chart dengan ID '${elementId}' tidak ditemukan.`);
        return;
    }
    const myChart = echarts.init(chartDom);
    
    // Logika untuk menyesuaikan format data berdasarkan tipe chart
    let formattedData;
    let xAxisData = [];
    let seriesData = [];

    if (type === 'bar' || type === 'line') {
        xAxisData = data.map(item => item.name);
        seriesData = data.map(item => item.value);
    } else if (type === 'pie') {
        formattedData = data.map(item => ({ value: item.value, name: item.name }));
    } else {
        formattedData = data;
    }

    const resolvedOptions = {
        ...chartOptions,
        xAxis: { ...chartOptions.xAxis, data: xAxisData },
        series: [{ ...chartOptions.series[0], type, data: formattedData || seriesData }]
    };
    
    myChart.setOption(resolvedOptions);
}

/**
 * Merender konten dashboard utama
 */
async function renderDashboardContent(dashboard) {
    const dashboardContentArea = document.getElementById('dashboard-content-area');
    if (!dashboardContentArea) return;

    if (!dashboard || !dashboard.widgets || dashboard.widgets.length === 0) {
        dashboardContentArea.innerHTML = `
            <div class="text-center-subtle p-5">
                <h4>Dashboard tidak memiliki widget atau data.</h4>
                <p>Silakan tambahkan chart melalui halaman pengaturan dashboard.</p>
            </div>
        `;
        return;
    }

    dashboardContentArea.innerHTML = `
        <div class="card p-4 mb-4">
            <h3 class="mb-0">${dashboard.name}</h3>
            <p class="text-secondary mb-0">Nama Internal: ${dashboard.slug}</p>
        </div>
        <div class="dashboard-grid"></div>
    `;
    const grid = dashboardContentArea.querySelector('.dashboard-grid');

    for (const widget of dashboard.widgets) {
        // Buat elemen untuk setiap chart
        const card = document.createElement('div');
        card.className = 'card dashboard-card';
        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${widget.title}</h5>
                <div id="chart-container-${widget._id}" class="chart-container" style="height: 300px;"></div>
            </div>
        `;
        grid.appendChild(card);

        // Ambil data dan render chart
        showLoadingOverlay();
        const chartData = await fetchChartData(widget.data.collection);
        hideLoadingOverlay();
        renderChart(`chart-container-${widget._id}`, widget.type, widget.options, chartData);
    }
}

/**
 * Memilih dashboard yang aktif dan merendernya
 */
function selectDashboard(dashboardId, dashboards) {
    const dashboardItems = document.querySelectorAll('#dashboard-list .dashboard-item');
    dashboardItems.forEach(item => {
        if (item.dataset.dashboardId === dashboardId) {
            addClass(item, 'active');
        } else {
            removeClass(item, 'active');
        }
    });
    
    const selectedDashboard = dashboards.find(d => d._id === dashboardId);
    if (selectedDashboard) {
        renderDashboardContent(selectedDashboard);
    }
}

/**
 * Merender seluruh halaman dashboard
 */
export function loadDashboardPage(container) {
    const fetchDashboards = async () => {
        showLoadingOverlay();
        try {
            const response = await fetch(`${BASE_API_URL}/configuration/dashboard/list`);
            const data = await response.json();
            
            if (data.status) {
                const dashboards = data.data.documents;
                const defaultDashboard = dashboards.find(d => d.is_default); // Mengambil dashboard default
                
                let dashboardHtml = '';
                if (dashboards.length > 0) {
                    dashboards.forEach(d => {
                        dashboardHtml += `
                            <li class="dashboard-item" data-dashboard-id="${d._id}">
                                <a href="#" class="dashboard-link">${d.name} ${d.is_default ? '<i class="fas fa-star default-icon"></i>' : ''}</a>
                            </li>
                        `;
                    });
                } else {
                    dashboardHtml = `
                        <li class="p-2 text-center-subtle">
                            Tidak ada dashboard.
                        </li>
                    `;
                }

                container.innerHTML = `
                    <div class="dashboard-wrapper">
                        <div class="dashboard-sidebar card">
                            <div class="card-body">
                                <h4 class="card-title">Kumpulan Dashboard</h4>
                                <ul id="dashboard-list" class="list-unstyled">
                                    ${dashboardHtml}
                                </ul>
                            </div>
                        </div>
                        <div class="dashboard-main-content">
                            <div id="dashboard-content-area">
                                <div class="text-center-subtle p-5">
                                    <h4>Pilih Dashboard</h4>
                                    <p>Silakan pilih salah satu dashboard dari daftar di samping.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                container.querySelectorAll('#dashboard-list .dashboard-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const dashboardId = e.currentTarget.dataset.dashboardId;
                        selectDashboard(dashboardId, dashboards);
                    });
                });

                if (defaultDashboard) {
                    selectDashboard(defaultDashboard._id, dashboards);
                } else if (dashboards.length > 0) {
                    selectDashboard(dashboards[0]._id, dashboards);
                }

            } else {
                container.innerHTML = `<p class="text-center-subtle">Gagal memuat daftar dashboard.</p>`;
            }
        } catch (error) {
            console.error('Error fetching dashboards:', error);
            container.innerHTML = `<p class="text-center-subtle">Terjadi kesalahan saat memuat dashboard.</p>`;
        } finally {
            hideLoadingOverlay();
        }
    };

    fetchDashboards();
}