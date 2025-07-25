import { BASE_API_URL } from '../config/constants.js';
import {
    showLoadingOverlay,
    hideLoadingOverlay,
    openSidePanel,
    closeSidePanel,
} from '../main.js';

/**
 * Helper function to create a new field widget with pre-filled data.
 */
function buildFieldWidget(fieldData = null) {
    const fieldId = `field-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    const wrapper = document.createElement("div");
    wrapper.className = "card mb-3 field-item";
    wrapper.dataset.id = fieldId;
    wrapper.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center field-header">
            <span class="fw-bold"><span class="field-name-display">${fieldData?.label || fieldData?.name || 'Field Baru'}</span></span>
            <div class="item-actions">
                <button type="button" class="btn btn-sm btn-danger btn-icon remove-item-btn"><i class="fas fa-trash"></i></button>
                <button type="button" class="btn btn-sm btn-secondary btn-icon toggle-collapse-btn"><i class="fas fa-chevron-up"></i></button>
            </div>
        </div>
        <div class="card-body collapsible-content">
            <div class="form-group mb-3">
                <label class="form-label">Nama Field</label>
                <input type="text" class="field-name form-control" value="${fieldData?.name || ''}" />
            </div>
            <div class="form-group mb-3">
                <label class="form-label">Label</label>
                <input type="text" class="field-label form-control" value="${fieldData?.label || ''}" />
            </div>
            <div class="form-group mb-3">
                <label class="form-label">Tipe Field</label>
                <div class="type-options">
                    ${["text", "number", "date", "select", "boolean", "media", "enum", "calculated"].map((t) => {
                        const icons = { text: "fa-font", number: "fa-hashtag", date: "fa-calendar-alt", select: "fa-list", boolean: "fa-toggle-on", media: "fa-image", enum: "fa-list-ul", calculated: "fa-equals" };
                        const labels = { text: "Teks", number: "Angka", date: "Tanggal", select: "Select", boolean: "Boolean", media: "Media", enum: "Enum", calculated: "Hitung" };
                        const isSelected = fieldData ? fieldData.type === t : t === 'text';
                        return `
                            <label class="type-option ${isSelected ? "selected" : ""}">
                                <i class="fas ${icons[t]}"></i> ${labels[t]}
                                <input type="radio" name="${fieldId}-type" value="${t}" style="display:none;" ${isSelected ? "checked" : ""}>
                            </label>`;
                    }).join("")}
                </div>
            </div>
            <div class="form-check mb-3">
                <input class="form-check-input field-required" type="checkbox" id="required-${fieldId}" ${fieldData?.required ? 'checked' : ''} />
                <label class="form-check-label" for="required-${fieldId}">
                    Wajib Diisi
                </label>
            </div>
            <div class="extra-options p-3 border rounded-2 bg-light"></div>
        </div>`;
    
    wrapper.querySelector('.field-name').addEventListener('input', (e) => {
        wrapper.querySelector('.field-name-display').textContent = e.target.value || 'Field Baru';
    });

    wrapper.querySelector('.remove-item-btn').addEventListener('click', () => wrapper.remove());
    wrapper.querySelector('.toggle-collapse-btn').addEventListener('click', (e) => toggleCollapse(e.currentTarget));
    wrapper.querySelectorAll('.type-option').forEach(option => {
        option.addEventListener('click', () => selectType(option));
    });

    if (fieldData?.type === 'select') {
        const extraOptionsContainer = wrapper.querySelector(".extra-options");
        const mode = fieldData.options?.mode || 'static';
        extraOptionsContainer.innerHTML = `
            <div class="form-group">
                <label class="form-label">Mode Select</label>
                <select class="select-mode form-control">
                    <option value="static" ${mode === 'static' ? 'selected' : ''}>Static</option>
                    <option value="relation" ${mode === 'relation' ? 'selected' : ''}>Relasi</option>
                </select>
            </div>
            <div class="select-mode-options">
                ${mode === 'static' ? `<label class="form-label">Opsi Static (pisahkan dengan koma)</label>
                    <input type="text" class="form-control select-static-values" value="${fieldData.options.values?.join(', ') || ''}" />` :
                    `<label class="form-label">Nama Tabel Relasi</label>
                    <input type="text" class="form-control relation-table" value="${fieldData.options.relation?.table || ''}" />
                    <label class="form-label">Kolom Value</label>
                    <input type="text" class="form-control relation-value" value="${fieldData.options.relation?.value_column || ''}" />
                    <label class="form-label">Kolom Label</label>
                    <input type="text" class="form-control relation-label" value="${fieldData.options.relation?.label_column || ''}" />`}
            </div>
        `;
        extraOptionsContainer.querySelector('.select-mode').addEventListener('change', (e) => toggleSelectModeOptions(e.currentTarget));
    }

    return wrapper;
}

// --- Helper Functions ---
function handleSelectFieldMode(typeContainer) {
    const selectedType = typeContainer.querySelector("input[type=radio]:checked").value;
    const extraOptionsContainer = typeContainer.closest(".collapsible-content").querySelector(".extra-options");
    if (!extraOptionsContainer) return;
    if (selectedType === "select") {
        extraOptionsContainer.innerHTML = `
            <div class="form-group">
                <label class="form-label">Mode Select</label>
                <select class="select-mode form-control">
                    <option value="static">Static</option>
                    <option value="relation">Relasi</option>
                </select>
            </div>
            <div class="select-mode-options static-options">
                <label class="form-label">Opsi Static (pisahkan dengan koma)</label>
                <input type="text" class="form-control select-static-values" placeholder="cth: Aktif, Tidak Aktif" />
            </div>
        `;
        extraOptionsContainer.querySelector('.select-mode').addEventListener('change', (e) => toggleSelectModeOptions(e.currentTarget));
    } else {
        extraOptionsContainer.innerHTML = "";
    }
}

function toggleSelectModeOptions(selectEl) {
    const container = selectEl.closest(".extra-options");
    const staticHTML = `
        <label class="form-label">Opsi Static (pisahkan dengan koma)</label>
        <input type="text" class="form-control select-static-values" placeholder="cth: Aktif, Tidak Aktif" />
    `;
    const relationHTML = `
        <label class="form-label">Nama Tabel Relasi</label>
        <input type="text" class="form-control relation-table" placeholder="users" />
        <label class="form-label">Kolom Value</label>
        <input type="text" class="form-control relation-value" placeholder="id" />
        <label class="form-label">Kolom Label</label>
        <input type="text" class="form-control relation-label" placeholder="name" />
    `;
    const optionsContainer = container.querySelector(".select-mode-options");
    if (optionsContainer) {
        optionsContainer.innerHTML = selectEl.value === "static" ? staticHTML : relationHTML;
    }
}

function selectType(el) {
    const group = el.closest(".type-options");
    group.querySelectorAll(".type-option").forEach(opt => opt.classList.remove("selected"));
    el.classList.add("selected");
    el.querySelector("input[type=radio]").checked = true;
    handleSelectFieldMode(group);
}

function toggleCollapse(btn) {
    const content = btn.closest(".field-item").querySelector(".collapsible-content");
    content.classList.toggle("collapsed");
    const icon = btn.querySelector("i");
    icon.classList.toggle("fa-chevron-up");
    icon.classList.toggle("fa-chevron-down");
}

function generateSchema(formPanel) {
    const schema = {
        id: formPanel.querySelector("#form-id")?.value || null,
        slug: formPanel.querySelector("#form-slug")?.value || '',
        name: formPanel.querySelector("#form-name")?.value || '',
        table_name: formPanel.querySelector("#form-table")?.value || '',
        submit_label: formPanel.querySelector("#form-submit-label")?.value || '',
        fields: Array.from(formPanel.querySelectorAll("#main-fields .field-item")).map(div => {
            const type = div.querySelector(".type-option.selected input")?.value || '';
            const options = {};
            if (type === "select") {
                const extra = div.querySelector(".extra-options");
                if (extra) {
                    const mode = extra.querySelector(".select-mode")?.value || 'static';
                    options.mode = mode;
                    if (mode === "static") {
                        options.values = (extra.querySelector(".select-static-values")?.value || '').split(",").map(v => v.trim());
                    } else {
                        options.relation = {
                            table: extra.querySelector(".relation-table")?.value || '',
                            value_column: extra.querySelector(".relation-value")?.value || '',
                            label_column: extra.querySelector(".relation-label")?.value || ''
                        };
                    }
                }
            }
            return {
                name: div.querySelector(".field-name")?.value || '',
                label: div.querySelector(".field-label")?.value || '',
                type: type,
                required: div.querySelector(".field-required")?.checked || false,
                options: options
            };
        }),
        subforms: Array.from(formPanel.querySelectorAll("#subform-panels .field-item")).map(sf => ({
            table_name: sf.querySelector(".subform-table")?.value || '',
            foreign_key: sf.querySelector(".subform-fk")?.value || '',
            label: sf.querySelector(".subform-label")?.value || '',
            fields: Array.from(sf.querySelectorAll(".form-subfields .field-item")).map(f => ({
                name: f.querySelector(".field-name")?.value || '',
                label: f.querySelector(".field-label")?.value || '',
                type: f.querySelector(".type-option.selected input")?.value || ''
            }))
        })),
        calculations: [] // calculations sekarang dikosongkan karena sudah tidak digunakan
    };
    formPanel.querySelector("#schema-output").textContent = JSON.stringify(schema, null, 2);
    return schema;
}

/**
 * Builds a subform widget with optional pre-filled data.
 */
function buildSubformWidget(subformData = null) {
    const id = `subform-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    const wrapper = document.createElement("div");
    wrapper.className = "card mb-3 field-item subform-item";
    wrapper.dataset.id = id;
    wrapper.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center field-header">
            <span class="fw-bold"><span class="subform-name-display">${subformData?.label || 'Subform Baru'}</span></span>
            <div class="item-actions">
                <button type="button" class="btn btn-sm btn-danger btn-icon remove-item-btn"><i class="fas fa-trash"></i></button>
                <button type="button" class="btn btn-sm btn-secondary btn-icon toggle-collapse-btn"><i class="fas fa-chevron-up"></i></button>
            </div>
        </div>
        <div class="card-body collapsible-content">
            <div class="form-group mb-3">
                <label class="form-label">Nama Tabel Detail</label>
                <input type="text" class="subform-table form-control" value="${subformData?.table_name || ''}" />
            </div>
            <div class="form-group mb-3">
                <label class="form-label">Foreign Key</label>
                <input type="text" class="subform-fk form-control" value="${subformData?.foreign_key || ''}" />
            </div>
            <div class="form-group mb-3">
                <label class="form-label">Label Subform</label>
                <input type="text" class="subform-label form-control" value="${subformData?.label || ''}" />
            </div>
            <h6 class="mt-4">Field Subform</h6>
            <div class="form-subfields sortable-list"></div>
            <button type="button" class="btn btn-outline-primary btn-sm mt-3 add-subfield-btn">+ Tambah Field Subform</button>
        </div>`;

    wrapper.querySelector('.subform-label').addEventListener('input', (e) => {
        wrapper.querySelector('.subform-name-display').textContent = e.target.value || 'Subform Baru';
    });
    wrapper.querySelector('.remove-item-btn').addEventListener('click', () => wrapper.remove());
    wrapper.querySelector('.toggle-collapse-btn').addEventListener('click', (e) => toggleCollapse(e.currentTarget));
    wrapper.querySelector('.add-subfield-btn').addEventListener('click', (e) => addSubField(e.currentTarget));

    if (subformData?.fields) {
        const subfieldsContainer = wrapper.querySelector(".form-subfields");
        subformData.fields.forEach(field => {
            subfieldsContainer.appendChild(buildFieldWidget(field));
        });
    }

    return wrapper;
}


/**
 * Melampirkan semua event listener untuk form generator di side panel
 * setelah konten HTML-nya dimuat.
 */
function attachFormGeneratorEventListeners() {
    const formPanel = document.getElementById("formbuilder-generator-form");
    if (!formPanel) return;

    function addMainField() {
        formPanel.querySelector("#main-fields").appendChild(buildFieldWidget());
    }

    function addSubform() {
        formPanel.querySelector("#subform-panels").appendChild(buildSubformWidget());
    }

    function addSubField(btn) {
        const container = btn.closest(".field-item").querySelector(".form-subfields");
        container.appendChild(buildFieldWidget());
    }

    formPanel.querySelector("#addMainFieldBtn").addEventListener('click', addMainField);
    formPanel.querySelector("#addSubformBtn").addEventListener('click', addSubform);
    formPanel.querySelector("#generateSchemaBtn").addEventListener('click', () => generateSchema(formPanel));

    formPanel.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const schema = generateSchema(formPanel);
        const formId = schema.id;

        showLoadingOverlay();
        try {
            const method = formId ? 'PUT' : 'POST';
            const url = formId ? `${BASE_API_URL}/configuration/formbuilder/update/${formId}` : `${BASE_API_URL}/configuration/formbuilder/create`;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(schema)
            });
            const result = await response.json();

            if (result.status) {
                alert(`Formulir '${schema.name}' berhasil disimpan.`);
                closeSidePanel();
                fetchForms();
            } else {
                alert(`Gagal menyimpan formulir: ${result.message}`);
            }
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Terjadi kesalahan saat menyimpan formulir.');
        } finally {
            hideLoadingOverlay();
        }
    });

    if (window.currentFormData) {
        formPanel.querySelector("#form-name").value = window.currentFormData.name || '';
        formPanel.querySelector("#form-slug").value = window.currentFormData.slug || '';
        formPanel.querySelector("#form-table").value = window.currentFormData.table_name || '';
        formPanel.querySelector("#form-submit-label").value = window.currentFormData.submit_label || 'Simpan';

        const mainFieldsContainer = formPanel.querySelector("#main-fields");
        (window.currentFormData.fields || []).forEach(field => {
            mainFieldsContainer.appendChild(buildFieldWidget(field));
        });

        const subformsContainer = formPanel.querySelector("#subform-panels");
        (window.currentFormData.subforms || []).forEach(subform => {
            subformsContainer.appendChild(buildSubformWidget(subform));
        });
        
        // Menghapus bagian untuk calculations
        // (window.currentFormData.calculations || []).forEach(calc => {
        //     calculationsContainer.appendChild(buildCalculationWidget(calc));
        // });

        window.currentFormData = null;
    }
}


/**
 * Merender form generator di side panel.
 * Menerima data untuk pra-isi form jika sedang dalam mode edit.
 */
const renderFormGenerator = (formData = null) => {
    const formTitle = formData ? 'Edit Formulir' : 'Generator Form Builder';

    const formHtml = `
        <form id="formbuilder-generator-form" class="active-form">
            ${formData ? `<input type="hidden" id="form-id" value="${formData._id || ''}">` : ''}
            <div class="form-section">
                <h4>Info Form Builder</h4>
                <div class="form-group mb-3">
                    <label class="form-label" for="form-name">Nama Form</label>
                    <input type="text" id="form-name" class="form-control" required value="${formData?.name || ''}" />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" for="form-slug">Slug Form</label>
                    <input type="text" id="form-slug" class="form-control" required value="${formData?.slug || ''}" />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" for="form-table">Nama Tabel Utama</label>
                    <input type="text" id="form-table" class="form-control" value="${formData?.table_name || ''}" />
                </div>
                <div class="form-group mb-3">
                    <label class="form-label" for="form-submit-label">Label Tombol Submit</label>
                    <input type="text" id="form-submit-label" class="form-control" value="${formData?.submit_label || 'Simpan'}" />
                </div>
            </div>
            <div class="form-section">
                <h4>Field Utama</h4>
                <div id="main-fields" class="sortable-list"></div>
                <button type="button" id="addMainFieldBtn" class="btn btn-outline-primary btn-add-item">+ Tambah Field</button>
            </div>
            <div class="form-section">
                <h4>Subforms</h4>
                <div id="subform-panels" class="sortable-list"></div>
                <button type="button" id="addSubformBtn" class="btn btn-outline-primary btn-add-item">+ Tambah Subform</button>
            </div>
            <div class="form-section">
                <h4>Hasil Skema</h4>
                <pre id="schema-output"></pre>
                <button type="button" id="generateSchemaBtn" class="btn btn-primary">📦 Generate Skema JSON</button>
            </div>
            <div class="form-actions mt-4">
                <button type="submit" class="btn btn-primary">Simpan Konfigurasi Form</button>
            </div>
        </form>
    `;

    openSidePanel(formTitle, formHtml);
    
    window.currentFormData = formData;
    attachFormGeneratorEventListeners();
};

const fetchFormById = async (formId) => {
    showLoadingOverlay();
    try {
        const url = `${BASE_API_URL}/configuration/formbuilder/read/${formId}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status && data.data) {
            renderFormGenerator(data.data);
        } else {
            alert('Gagal mengambil data formulir. Silakan coba lagi.');
        }
    } catch (error) {
        console.error('Error fetching form data:', error);
        alert('Terjadi kesalahan saat mengambil data formulir.');
    } finally {
        hideLoadingOverlay();
    }
};

export function renderFormBuilderSettingsPage(container) {
    let currentPage = 1;
    let currentLimit = 10;
    let currentSearch = '';
    
    const renderFormList = (forms, totalCount, totalPages) => {
        container.innerHTML = `
            <div class="settings-group">
                <h4>Daftar Konfigurasi Formulir</h4>
                <div id="formListContent">
                    <div class="table-controls">
                        <div class="search-box">
                            <input type="text" id="formSearchInput" placeholder="Cari Formulir..." value="${currentSearch}">
                            <button id="searchButton" class="btn btn-primary"><i class="fa-solid fa-search"></i></button>
                            <button id="clearSearchButton" class="btn btn-icon"><i class="fa-solid fa-times"></i></button>
                        </div>
                        <div class="right-controls">
                            <button class="btn btn-primary" id="addFormBtn"><i class="fa-solid fa-plus"></i> Buat Formulir Baru</button>
                        </div>
                    </div>
    
                    <ul id="formListItems" class="settings-list-items">
                        </ul>
    
                    <div id="formPagination" class="pagination-controls" style="display:none;">
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
        
        const formListItems = container.querySelector('#formListItems');
        const formPagination = container.querySelector('#formPagination');
        const paginationTotal = container.querySelector('#paginationTotal');
        const pageInfo = container.querySelector('#pageInfo');
        const prevPageBtn = container.querySelector('#prevPageBtn');
        const nextPageBtn = container.querySelector('#nextPageBtn');
        const addFormBtn = container.querySelector('#addFormBtn');
        const formSearchInput = container.querySelector('#formSearchInput');
        const searchButton = container.querySelector('#searchButton');
        const clearSearchButton = container.querySelector('#clearSearchButton');

        if (forms.length === 0) {
            formListItems.innerHTML = `<p class="text-center-subtle">Belum ada formulir yang dibuat.</p>`;
            formPagination.style.display = 'none';
        } else {
            formListItems.innerHTML = forms.map(form => `
                <li data-name="${form.slug}" data-display-name="${form.name}">
                    <span><strong>${form.name}</strong> <br> <small><em>Nama Internal: ${form.slug || form._id}</em></small></span>
                    <div class="item-actions">
                        <button class="btn btn-icon btn-edit-form" data-form-id="${form._id}" aria-label="Edit Formulir"><i class="fa-solid fa-edit"></i></button>
                        <button class="btn btn-icon btn-delete-form" data-form-id="${form._id}" data-display-name="${form.name}" aria-label="Hapus Formulir"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </li>
            `).join('');

            formPagination.style.display = 'flex';
            paginationTotal.textContent = `Total: ${totalCount} formulir`;
            pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
            prevPageBtn.disabled = currentPage <= 1;
            nextPageBtn.disabled = currentPage >= totalPages;
        }
        
        addFormBtn.addEventListener('click', () => renderFormGenerator());
        searchButton.addEventListener('click', () => {
            currentSearch = formSearchInput.value;
            currentPage = 1;
            fetchForms();
        });
        clearSearchButton.addEventListener('click', () => {
            formSearchInput.value = '';
            currentSearch = '';
            currentPage = 1;
            fetchForms();
        });
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchForms();
            }
        });
        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            fetchForms();
        });

        container.querySelectorAll('.btn-edit-form').forEach(button => {
            button.addEventListener('click', (e) => {
                const formId = e.currentTarget.dataset.formId;
                fetchFormById(formId);
            });
        });

        container.querySelectorAll('.btn-delete-form').forEach(button => {
            button.addEventListener('click', async (e) => {
                const formId = e.currentTarget.dataset.formId;
                const formName = e.currentTarget.dataset.displayName;
                if (confirm(`Apakah Anda yakin ingin menghapus formulir '${formName}' ini?`)) {
                    showLoadingOverlay();
                    try {
                        const response = await fetch(`${BASE_API_URL}/configuration/formbuilder/delete/${formId}`, {
                            method: 'DELETE'
                        });
                        const result = await response.json();
                        if (result.status) {
                            alert(`Formulir '${formName}' berhasil dihapus.`);
                            fetchForms();
                        } else {
                            alert(`Gagal menghapus formulir: ${result.message}`);
                        }
                    } catch (error) {
                        console.error('Error deleting form:', error);
                        alert('Terjadi kesalahan saat menghapus formulir.');
                    } finally {
                        hideLoadingOverlay();
                    }
                }
            });
        });
    };

    const fetchForms = async () => {
        showLoadingOverlay();
        try {
            const url = `${BASE_API_URL}/configuration/formbuilder/list?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status && data.data) {
                renderFormList(data.data.documents, data.data.totalCount, data.data.totalPages);
            } else {
                renderFormList([], 0, 0);
            }
        } catch (error) {
            console.error('Error fetching forms:', error);
            renderFormList([], 0, 0);
        } finally {
            hideLoadingOverlay();
        }
    };
    
    fetchForms();
}