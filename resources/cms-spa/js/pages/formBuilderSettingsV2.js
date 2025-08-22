import { BASE_API_URL } from '../config/constants.js'
import {
  showLoadingOverlay,
  hideLoadingOverlay,
  openSidePanel,
  closeSidePanel,
  showNotification,
} from '../main.js'

// ===== Utilities =====
const uid = () => Math.random().toString(36).slice(2);
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel))
let selectedEl = null;

/**
 * Merender form generator.
 * @param {HTMLElement} container Elemen DOM tempat formulir akan dirender.
 */
const renderFormGenerator = (formdata, container) => {
  container.innerHTML = `
    <div class="settings-group">
      <div class="table-controls">
        <div class="search-box"><h2>Buat Formulir</h2></div>
        <div class="right-controls">
          <button id="btnClear" class="btn danger">Hapus Semua</button>
          <button id="btnExport" class="btn ghost">Simpan</button>
        </div>
      </div>
      <div class="container-formbuilder">
        <div class="column-formbuilder toolbox-formbuilder scroll-container">
          <aside id="toolbox">
            <div class="tool-group">
                <div class="tool-title">Inputs <span class="arrow-fomrbuilder">&#9660;</span></div>
                <div class="tool-items-container" id="inputs-container">
                  <div class="tool-item" data-type="text">Text</div>
                  <div class="tool-item" data-type="number">Number</div>
                  <div class="tool-item" data-type="date">Date</div>
                  <div class="tool-item" data-type="email">Email</div>
                  <div class="tool-item" data-type="password">Password</div>
                  <div class="tool-item" data-type="textarea">Textarea</div>
                </div>
            </div>

            <div class="tool-group">
                <div class="tool-title">Choices <span class="arrow-fomrbuilder">&#9660;</span></div>
                <div class="tool-items-container" id="choices-container">
                  <div class="tool-item" data-type="select">Select</div>
                  <div class="tool-item" data-type="radio">Radio</div>
                  <div class="tool-item" data-type="checkbox">Checkbox</div>
                  <div class="tool-item" data-type="switch">Switch</div>
                </div>
            </div>

            <div class="tool-group">
                <div class="tool-title">Others <span class="arrow-fomrbuilder">&#9660;</span></div>
                <div class="tool-items-container" id="others-container">
                  <div class="tool-item" data-type="file">File Upload</div>
                  <div class="tool-item" data-type="relation">Relation</div>
                  <div class="tool-item" data-type="group">Group / Section</div>
                  <div class="tool-item" data-type="calculated">Calculated</div>
                  <div class="tool-item" data-type="autofill">Autofill</div>
                </div>
            </div>
          </aside>
        </div>
        <div class="column-formbuilder canvas-formbuilder scroll-container" id="canvasWrap">
          <h2>Canvas (Drag & Drop here)</h2>
          <p>Drop elemen dari toolbox di sini.</p>
          <div id="canvas-column"></div>
        </div>
        <div class="column-formbuilder properties-formbuilder scroll-container">
          <h4>Field Properties</h4>
          <div id="propsBody">
            Pilih field di canvas untuk mengedit.
          </div>
        </div>
      </div>
    </div>
  ` 
  attachFormGeneratorEventListeners() 
}

const fetchFormById = async (formId) => {
  showLoadingOverlay()
  try {
    const url = `${BASE_API_URL}/configuration/formbuilder/get?id=${formId}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status && data.data) {
      renderFormGenerator(data.data)
    } else {
      alert('Gagal mengambil data formulir. Silakan coba lagi.')
    }
  } catch (error) {
    console.error('Error fetching form data:', error)
    alert('Terjadi kesalahan saat mengambil data formulir.')
  } finally {
    hideLoadingOverlay()
  }
}

function attachFormGeneratorEventListeners() {
  // --- Logic untuk Collapse Toolbox (sama seperti sebelumnya) ---
  const toolTitles = document.querySelectorAll('.tool-title');
  toolTitles.forEach(title => {
    const container = title.nextElementSibling;
    // auto collapsed saat load
    title.classList.add('collapsed');
    container.classList.add('collapsed');

    // toggle saat diklik
    title.addEventListener('click', function() {
      this.classList.toggle('collapsed');
      container.classList.toggle('collapsed');
    });
  });

  // --- Logic Drag-and-Drop dengan Sortable.js ---
  const canvas = document.getElementById('canvas-column');
  const toolboxContainers = document.querySelectorAll('.tool-items-container');
  // Toolbox: clone only
  
  // Menginisialisasi Sortable untuk setiap kontainer toolbox
  toolboxContainers.forEach(container => {
      new Sortable(container, {
          group: {
            name: 'shared',
            pull: 'clone',
            put: false
          },
          sort: false,
          animation: 150
      });
  });
  canvas.addEventListener("click", () => selectField(null));
  canvas.addEventListener("dragover", () => {
    $(".hint", canvas)?.remove();
  });
  canvas.addEventListener("click", e => {
    const f = e.target.closest(".field");
    if (f) selectField(f);
  });
  // Menginisialisasi Sortable untuk canvas
  // new Sortable(canvas, {
  //     group: 'shared',
  //     animation: 150,
  //     onAdd: function (evt) {
  //         // evt.item adalah elemen yang baru saja ditambahkan oleh Sortable
  //         const newlyAddedElement = evt.item;
  //         const dataType = newlyAddedElement.dataset.type;

  //         // Membuat elemen baru yang akan menggantikan elemen bawaan Sortable
  //         const newItem = document.createElement('div');
  //         newItem.textContent = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Item`;
  //         newItem.classList.add('tool-item');
  //         newItem.classList.add('canvas-item');
          
  //         // Mengganti elemen bawaan Sortable dengan elemen kustom kita
  //         evt.to.replaceChild(newItem, newlyAddedElement);
  //     }
  // });
  makeCanvasSortable(canvas);
  btnExport.addEventListener('click', () => {
    console.log(buildSchema(canvas));
  })
  btnClear.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua field?')) {
      canvas.innerHTML = '';
      selectField(null,canvas);
    }
  });
}

function buildSchema(container) {
  const arr = [];
  $$(".field", container).forEach(el => {
    if (el.parentElement !== container) return;
    const d = el.dataset;
    const obj = {
      id: d.id,
      label: d.label || "",
      name: d.name || "",
      type: d.type,
      width: d.width || "1/1",
      required: d.required === "true",
      defaultValue: d.defaultValue || ""
    };
    if (d.type === "select" || d.type === "radio" || d.type === "relation") {
      obj.options = JSON.parse(d.options || "[]");
    }
    if (d.type === "relation") {
      obj.relation = {
        targetTable: d.targetTable || "",
        foreignKey: d.foreignKey || "",
        type: d.relationType || "one-to-one",
        sourceTable: d.sourceTable || "",
        labelField: d.labelField || "",
        valueField: d.valueField || "",
        allowSearch: d.allowSearch === "true"
      };
    }
    if (d.type === "group") {
      const childWrap = $(".field-children-formbuilder", el);
      obj.children = childWrap ? buildSchema(childWrap) : [];
      if (d.type === "group") { // <-- Tambahkan blok ini
          obj.collection = d.collection || "";
          obj.isRepeatable = d.isRepeatable === "true";
      }
    }
    if (d.type === "calculated") {
      obj.calculated = {
        formula: d.formula || "",
        dependencies: (d.dependencies || "").split(",").map(s => s.trim()).filter(Boolean)
      };
    }
    if (d.type === "autofill") {
      obj.autofill = {
        sourceField: d.sourceField || "",
        mode: d.autofillMode || "copy-label",
        mapRules: JSON.parse(d.mapRules || "[]")
      };
    }
    arr.push(obj);
  });
  return arr;
}

function makeCanvasSortable(canvas) {
  Sortable.create(canvas, {
    group: {
      name: "form",
      pull: true,
      put: true
    },
    animation: 150,
    handle: undefined,
    ghostClass: "sortable-ghost",
    onAdd: function (evt) {
      const type = evt.item.dataset.type;
      if (type) {
        const newField = buildFieldElement(createFieldData(type));
        evt.item.replaceWith(newField);
        bindField(newField);
      } else {
        bindField(evt.item,canvas);
      }
    }
  });
}

function createFieldData(type) {
  const base = {
    id: uid(),
    label: `${type[0].toUpperCase() + type.slice(1)} Field`,
    name: type + "_" + uid().slice(0, 5),
    type: type,
    width: "1/1",
    required: false,
    defaultValue: ""
  };
  if (type === "relation") {
    base.targetTable = "";
    base.foreignKey = "";
    base.relationType = "one-to-one";
    base.options = JSON.stringify([]); // start empty for relational select
    // new relational-specific props
    base.sourceTable = "";
    base.labelField = "";
    base.valueField = "";
    base.allowSearch = "false";
  }
  if (type === "select" || type === "radio") {
    base.options = JSON.stringify([ "Option 1", "Option 2" ]);
  }
  if (type === "group") {
    base.expanded = true;
    base.isRepeatable = false;
    base.collection = ""; // collection target
  }
  if (type === "calculated") {
    base.formula = "";
    base.dependencies = ""; // comma separated names
    base.readonly = true;
  }
  if (type === "autofill") {
    base.sourceField = "";
    base.autofillMode = "copy-label"; // copy-label | copy-value | map
    base.mapRules = JSON.stringify([]); // [[fromValue, toText], ...]
    base.readonly = true;
  }
  return base;
}

function buildFieldElement(data) {
  const el = document.createElement("div");
  el.className = "field";
  Object.entries(data).forEach(([ k, v ]) => el.dataset[k] = Array.isArray(v) ? JSON.stringify(v) : v);
  const header = document.createElement("div");
  header.className = "field-header-formbuilder";
  const title = document.createElement("div");
  title.className = "field-title-formbuilder";
  title.textContent = data.label;
  const badge = document.createElement("span");
  badge.className = "field-badge-formbuilder";
  badge.textContent = data.type;
  header.append(title, badge);
  el.appendChild(header);
  if (data.type === "group") {
    const children = document.createElement("div");
    children.className = "field-children-formbuilder";
    children.textContent = "Drop fields here";
    el.appendChild(children);
    makeCanvasSortable(children);
  }
  return el;
}

function bindField(el) {
  el.onclick = e => {
    if (!el.isConnected) return;
    if (!el.classList.contains("field")) return;
  };
  el.addEventListener("click", e => {
    e.stopPropagation();
    selectField(el);
  });
}

// ===== Canvas interactions =====
function selectField(el,canvas) {
  $$(".field", canvas).forEach(n => n.classList.remove("selected"));
  selectedEl = el;
  if (el) {
    el.classList.add("selected");
    renderProps(el,canvas);
  } else {
    $("#propsBody").innerHTML = "Pilih field di canvas untuk mengedit.";
  }
}

function optionsOfFields(predicate,canvas) {
  const names = [];
  $$(".field", canvas).forEach(el => {
    const d = el.dataset;
    if (predicate(d)) names.push({
      name: d.name,
      label: d.label,
      type: d.type
    });
  });
  return names;
}

function renderProps(el,canvas) {
  const d = el.dataset;
  const isChoice = d.type === "select" || d.type === "radio";
  const isRel = d.type === "relation";
  const isCalc = d.type === "calculated";
  const isAuto = d.type === "autofill";
  const relationFieldOptions = optionsOfFields(dd => dd.type === "relation" || dd.type === "select",canvas);
  const isGroup = d.type === "group"; 
  $("#propsBody").innerHTML = `
    <div class="props-section">
      <div class="row-fomrbuilder">
        <div class="form-group-formbuilder">
          <label>Label</label>
          <input id="pLabel" type="text" value="${d.label || ""}">
        </div>
        <div class="form-group-formbuilder">
          <label>Field Name</label>
          <input id="pName" type="text" value="${d.name || ""}">
        </div>
      </div>
      <div class="row-fomrbuilder">
        <div class="form-group-formbuilder">
          <label>Type</label>
          <select id="pType">
            ${[ "text", "number", "date", "email", "password", "textarea", "select", "radio", "checkbox", "switch", "file", "relation", "group", "calculated", "autofill", "nested" ].map(t => `<option value="${t}" ${d.type === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </div>
        <div class="form-group-formbuilder">
          <label>Display Width</label>
          <select id="pWidth">
            <option value="1/1" ${d.width === "1/1" ? "selected" : ""}>1/1 (Full)</option>
            <option value="1/2" ${d.width === "1/2" ? "selected" : ""}>1/2 (Half)</option>
          </select>
        </div>
      </div>
      <div class="row-fomrbuilder">
        <div class="form-group-formbuilder">
          <label>Required</label>
          <select id="pRequired">
            <option value="false" ${d.required !== "true" ? "selected" : ""}>No</option>
            <option value="true" ${d.required === "true" ? "selected" : ""}>Yes</option>
          </select>
        </div>
        <div class="form-group-formbuilder">
          <label>Default Value</label>
          <input id="pDefault" type="text" value="${d.defaultValue || ""}">
        </div>
      </div>
    </div>

    ${isChoice ? `
    <div class="props-section">
      <h3>Options</h3>
      <div class="form-group-formbuilder">
        <label>List (pisahkan dengan koma)</label>
        <input id="pOptions" type="text" value="${JSON.parse(d.options || "[]").join(", ")}">
      </div>
    </div>` : ""}

    ${isRel ? `
    <div class="props-section">
      <h3>Relation</h3>
      <div class="form-group-formbuilder"><label>Source Table</label><input id="pSourceTable" type="text" value="${d.sourceTable || ""}"></div>
      <div class="form-group-formbuilder"><label>Label Field</label><input id="pLabelField" type="text" value="${d.labelField || ""}"></div>
      <div class="form-group-formbuilder"><label>Value Field</label><input id="pValueField" type="text" value="${d.valueField || ""}"></div>
      <div class="form-group-formbuilder"><label>Allow Search</label>
        <select id="pAllowSearch">
          <option value="false" ${d.allowSearch !== "true" ? "selected" : ""}>No</option>
          <option value="true" ${d.allowSearch === "true" ? "selected" : ""}>Yes</option>
        </select>
      </div>
      <div class="form-group-formbuilder"><label>Preview Options (opsional, koma)</label><input id="pRelOptions" type="text" value="${JSON.parse(d.options || "[]").join(", ")}"></div>
    </div>` : ""}

    ${isCalc ? `
    <div class="props-section">
      <h3>Calculated</h3>
      <div class="form-group-formbuilder"><label>Formula</label><input id="pFormula" type="text" placeholder="contoh: quantity * price" value="${d.formula || ""}"></div>
      <div class="form-group-formbuilder"><label>Dependencies (nama field, koma)</label><input id="pDeps" type="text" placeholder="quantity, price" value="${d.dependencies || ""}"></div>
      <small class="muted">Gunakan nama <em>Field Name</em> dari field lain sebagai variabel.</small>
    </div>` : ""}

    ${isAuto ? `
    <div class="props-section">
      <h3>Autofill</h3>
      <div class="form-group-formbuilder"><label>Source Relation/Select Field</label>
        <select id="pSourceField">
          <option value="">-- pilih --</option>
          ${relationFieldOptions.map(o => `<option value="${o.name}" ${d.sourceField === o.name ? "selected" : ""}>${o.label} (${o.name})</option>`).join("")}
        </select>
      </div>
      <div class="form-group-formbuilder"><label>Mode</label>
        <select id="pAutoMode">
          <option value="copy-label" ${d.autofillMode === "copy-label" ? "selected" : ""}>Copy label option</option>
          <option value="copy-value" ${d.autofillMode === "copy-value" ? "selected" : ""}>Copy value</option>
          <option value="map" ${d.autofillMode === "map" ? "selected" : ""}>Mapping rules</option>
        </select>
      </div>
      <div class="form-group-formbuilder"><label>Mapping Rules (satu per baris, format: nilai =&gt; hasil)</label>
        <textarea id="pMapRules" row-fomrbuilders="4">${JSON.parse(d.mapRules || "[]").map(([ a, b ]) => `${a} => ${b}`).join("")}</textarea>
      </div>
      <small class="muted">Contoh rules: <code>VIP =&gt; Pelanggan Prioritas</code></small>
    </div>` : ""}

    ${isGroup ? `
    <div class="props-section">
      <h3>Group Settings</h3>
      <div class="form-group-formbuilder">
        <label>Collection Target</label>
        <input id="pCollection" type="text" value="${d.collection || ""}">
      </div>
      <div class="form-group-formbuilder">
        <label>Allow add/delete row-fomrbuilders?</label>
        <select id="pIsRepeatable">
          <option value="false" ${d.isRepeatable !== "true" ? "selected" : ""}>No</option>
          <option value="true" ${d.isRepeatable === "true" ? "selected" : ""}>Yes</option>
        </select>
      </div>
    </div>` : ""}

    <div class="row-fomrbuilder">
      <button id="pDuplicate" class="btn-fomrbuilder ghost">Duplicate</button>
      <button id="pDelete" class="btn-fomrbuilder danger">Delete</button>
    </div>
  `;
  // Bind change handlers
  $("#pLabel").oninput = e => {
    d.label = e.target.value;
    $(".field-title-formbuilder", el).textContent = d.label;
  };
  $("#pName").oninput = e => d.name = e.target.value;
  $("#pType").onchange = e => {
    d.type = e.target.value;
    if (d.type === "group") {
      if (!$(".field-children-formbuilder", el)) {
        const c = document.createElement("div");
        c.className = "field-children-formbuilder";
        c.textContent = "Drop fields here";
        el.appendChild(c);
        makeCanvasSortable(c);
      }
    } else {
      const c = $(".field-children-formbuilder", el);
      if (c) c.remove();
    }
    $(".field-badge-formbuilder", el).textContent = d.type;
    renderProps(el,canvas);
  };
  $("#pWidth").onchange = e => d.width = e.target.value;
  $("#pRequired").onchange = e => d.required = e.target.value;
  $("#pDefault").oninput = e => d.defaultValue = e.target.value;
  if (isGroup) {
    $("#pCollection").oninput = e => d.collection = e.target.value;
    $("#pIsRepeatable").onchange = e => {
      d.isRepeatable = e.target.value;
      // Panggil renderProps lagi untuk memperbarui tampilan jika ada perubahan lainnya
      renderProps(el,canvas);
    };
  }
  if (isChoice) {
    $("#pOptions").oninput = e => d.options = JSON.stringify(e.target.value.split(",").map(s => s.trim()).filter(Boolean));
  }
  if (isRel) {
    $("#pSourceTable").oninput = e => d.sourceTable = e.target.value;
    $("#pLabelField").oninput = e => d.labelField = e.target.value;
    $("#pValueField").oninput = e => d.valueField = e.target.value;
    $("#pAllowSearch").onchange = e => d.allowSearch = e.target.value;
    $("#pRelOptions").oninput = e => d.options = JSON.stringify(e.target.value.split(",").map(s => s.trim()).filter(Boolean));
  }
  if (isCalc) {
    $("#pFormula").oninput = e => d.formula = e.target.value;
    $("#pDeps").oninput = e => d.dependencies = e.target.value;
  }
  if (isAuto) {
    $("#pSourceField").onchange = e => d.sourceField = e.target.value;
    $("#pAutoMode").onchange = e => d.autofillMode = e.target.value;
    $("#pMapRules").oninput = e => {
      const lines = e.target.value.split("+").map(l => l.trim()).filter(Boolean);
      const pairs = [];
      lines.forEach(line => {
        const m = line.split("=>");
        if (m.length >= 2) {
          pairs.push([ m[0].trim(), m.slice(1).join("=>").trim() ]);
        }
      });
      d.mapRules = JSON.stringify(pairs);
    };
  }
  $("#pDelete").onclick = () => {
    el.remove();
    selectField(null);
  };
  $("#pDuplicate").onclick = () => {
    const cloneData = Object.assign({}, Object.fromEntries(Object.entries(d).map(([ k, v ]) => [ k, v ])));
    cloneData.id = uid();
    const newEl = buildFieldElement(cloneData);
    el.after(newEl);
    bindField(newEl);
  };
}      
      
export function renderFormBuilderSettingsPageV2(container) {
  let currentPage = 1
  let currentLimit = 10
  let currentSearch = ''

  const renderFormList = (forms, totalCount, totalPages) => {
    container.innerHTML = `
        <div class="settings-group">
            <h4>Daftar Konfigurasi Formulir</h4>
            <div id="formListContent">
                <div class="table-controls">
                    <div class="search-box">
                        <input type="text" id="formSearchInput" placeholder="Cari Formulir..." value="${currentSearch}">
                        <button id="searchButton" class="btn-fomrbuilder btn-fomrbuilder-primary"><i class="fa-solid fa-search"></i></button>
                        <button id="clearSearchButton" class="btn-fomrbuilder btn-fomrbuilder-icon"><i class="fa-solid fa-times"></i></button>
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
                        <button id="prevPageBtn" class="btn-fomrbuilder btn-fomrbuilder-secondary pagination-btn-fomrbuilder" data-page="prev" disabled="">Previous</button>
                        <span id="pageInfo"></span>
                        <button id="nextPageBtn" class="btn-fomrbuilder btn-fomrbuilder-secondary pagination-btn-fomrbuilder" data-page="next" disabled="">Next</button>
                    </div>
                </div>
            </div>
        </div>
        `

    const formListItems = container.querySelector('#formListItems')
    const formPagination = container.querySelector('#formPagination')
    const paginationTotal = container.querySelector('#paginationTotal')
    const pageInfo = container.querySelector('#pageInfo')
    const prevPageBtn = container.querySelector('#prevPageBtn')
    const nextPageBtn = container.querySelector('#nextPageBtn')
    const addFormBtn = container.querySelector('#addFormBtn')
    const formSearchInput = container.querySelector('#formSearchInput')
    const searchButton = container.querySelector('#searchButton')
    const clearSearchButton = container.querySelector('#clearSearchButton')

    if (forms.length === 0) {
      formListItems.innerHTML = `<p class="text-center-subtle">Belum ada formulir yang dibuat.</p>`
      formPagination.style.display = 'none'
    } else {
      formListItems.innerHTML = forms
        .map(
          (form) => `
                <li data-name="${form.slug}" data-display-name="${form.name}">
                    <span><strong>${form.name}</strong> <br> <small><em>Nama Internal: ${form.slug || form._id}</em></small></span>
                    <div class="item-actions">
                        <button class="btn-fomrbuilder btn-fomrbuilder-icon btn-fomrbuilder-edit-form" data-form-id="${form._id}" aria-label="Edit Formulir"><i class="fa-solid fa-edit"></i></button>
                        <button class="btn-fomrbuilder btn-fomrbuilder-icon btn-fomrbuilder-delete-form" data-form-id="${form._id}" data-display-name="${form.name}" aria-label="Hapus Formulir"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </li>
            `
        )
        .join('')

      formPagination.style.display = 'flex'
      paginationTotal.textContent = `Total: ${totalCount} formulir`
      pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`
      prevPageBtn.disabled = currentPage <= 1
      nextPageBtn.disabled = currentPage >= totalPages
    }

    addFormBtn?.addEventListener('click', () => renderFormGenerator(null, container))
    searchButton?.addEventListener('click', () => {
      currentSearch = formSearchInput.value
      currentPage = 1
      fetchForms()
    })
    clearSearchButton?.addEventListener('click', () => {
      formSearchInput.value = ''
      currentSearch = ''
      currentPage = 1
      fetchForms()
    })
    prevPageBtn?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--
        fetchForms()
      }
    })
    nextPageBtn?.addEventListener('click', () => {
      currentPage++
      fetchForms()
    })

    container.querySelectorAll('.btn-fomrbuilder-edit-form').forEach((button) => {
      button?.addEventListener('click', (e) => {
        const formId = e.currentTarget.dataset.formId
        fetchFormById(formId)
      })
    })

    container.querySelectorAll('.btn-fomrbuilder-delete-form').forEach((button) => {
      button?.addEventListener('click', async (e) => {
        const formId = e.currentTarget.dataset.formId
        const formName = e.currentTarget.dataset.displayName
        if (confirm(`Apakah Anda yakin ingin menghapus formulir '${formName}' ini?`)) {
          showLoadingOverlay()
          try {
            const response = await fetch(
              `${BASE_API_URL}/configuration/formbuilder/delete/${formId}`,
              {
                method: 'DELETE',
              }
            )
            const result = await response.json()
            if (result.status) {
              showNotification(`Formulir '${formName}' berhasil dihapus.`)
              fetchForms()
            } else {
              alert(`Gagal menghapus formulir: ${result.message}`)
            }
          } catch (error) {
            console.error('Error deleting form:', error)
            alert('Terjadi kesalahan saat menghapus formulir.')
          } finally {
            hideLoadingOverlay()
          }
        }
      })
    })
  }

  const fetchForms = async () => {
    showLoadingOverlay()
    try {
      const url = `${BASE_API_URL}/configuration/formbuilder/list?page=${currentPage}&limit=${currentLimit}&search=${currentSearch}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status && data.data) {
        renderFormList(data.data.documents, data.data.totalCount, data.data.totalPages)
      } else {
        renderFormList([], 0, 0)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
      renderFormList([], 0, 0)
    } finally {
      hideLoadingOverlay()
    }
  }

  fetchForms()
}
