export function loadUsersPage(container) {
  const users = [
    { id: 'user1', name: 'Admin User', email: 'admin@example.com', role: 'Administrator' },
    { id: 'user2', name: 'Jane Doe', email: 'jane@example.com', role: 'Editor' },
    { id: 'user3', name: 'John Smith', email: 'john@example.com', role: 'Author' },
  ]

  container.innerHTML = `
        <div class="card">
            <h2>Manajemen Users</h2>
            <div class="settings-group">
                <h4>Daftar Pengguna</h4>
                <ul class="settings-list-items">
                    ${users
                      .map(
                        (user) => `
                        <li data-id="${user.id}">
                            <span>${user.name} (${user.role})</span>
                            <div class="item-actions">
                                <button class="btn btn-icon btn-edit" data-id="${user.id}" aria-label="Edit User"><i class="fa-solid fa-edit"></i></button>
                                <button class="btn btn-icon btn-delete" data-id="${user.id}" aria-label="Hapus User"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </li>
                    `
                      )
                      .join('')}
                </ul>
                <button class="btn btn-primary btn-add-new-item" style="margin-top: 20px;" data-item-type="user">
                    <i class="fa-solid fa-plus" style="margin-right: 8px;"></i> Tambah User Baru
                </button>
            </div>
        </div>
    `

  const sidePanel = document.getElementById('sidePanel')
  const sidePanelOverlay = document.getElementById('sidePanelOverlay')
  const sidePanelTitle = document.getElementById('sidePanelTitle')
  const sidePanelContent = document.getElementById('sidePanelContent')
  const closeSidePanelBtn = document.getElementById('closeSidePanelBtn')

  const openSidePanel = (title, formHtml) => {
    sidePanelTitle.textContent = title
    sidePanelContent.innerHTML = formHtml
    sidePanel.classList.add('show')
    sidePanelOverlay.classList.add('show')
    attachPanelFormListeners()
  }

  const closeSidePanel = () => {
    sidePanel.classList.remove('show')
    sidePanelOverlay.classList.remove('show')
    sidePanelContent.innerHTML = ''
  }

  closeSidePanelBtn.onclick = closeSidePanel
  sidePanelOverlay.onclick = closeSidePanel

  const attachPanelFormListeners = () => {
    const panelForm = sidePanelContent.querySelector('form')
    if (panelForm) {
      panelForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const itemName = panelForm.querySelector('input[type="text"]').value
        console.log(`Menyimpan ${itemName} untuk User.`)
        alert(`User "${itemName}" berhasil disimpan! (Ini adalah mock)`)
        closeSidePanel()
      })

      const cancelButton = sidePanelContent.querySelector('.btn-cancel-form')
      if (cancelButton) {
        cancelButton.addEventListener('click', closeSidePanel)
      }
    }
  }

  container.querySelector('.btn-add-new-item').addEventListener('click', () => {
    openSidePanel(
      'Tambah User Baru',
      `
            <form id="addUserForm">
                <div class="form-group">
                    <label for="userName">Nama Pengguna</label>
                    <input type="text" id="userName" placeholder="Nama Lengkap Pengguna" required>
                </div>
                <div class="form-group">
                    <label for="userEmail">Email</label>
                    <input type="email" id="userEmail" placeholder="Email Pengguna" required>
                </div>
                <div class="form-group">
                    <label for="userPassword">Password</label>
                    <input type="password" id="userPassword" placeholder="Kata Sandi Pengguna" required>
                </div>
                <div class="form-group">
                    <label for="userRole">Role</label>
                    <select id="userRole">
                        <option value="administrator">Administrator</option>
                        <option value="editor">Editor</option>
                        <option value="author">Author</option>
                        <option value="subscriber">Subscriber</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Simpan User</button>
                    <button type="button" class="btn btn-secondary btn-cancel-form">Batal</button>
                </div>
            </form>
        `
    )
  })

  container.querySelectorAll('.btn-edit').forEach((button) => {
    button.addEventListener('click', (e) => {
      const userId = e.currentTarget.dataset.id
      const userToEdit = users.find((u) => u.id === userId)
      if (userToEdit) {
        openSidePanel(
          'Edit User',
          `
                    <form id="editUserForm">
                        <input type="hidden" id="userId" value="${userToEdit.id}">
                        <div class="form-group">
                            <label for="userName">Nama Pengguna</label>
                            <input type="text" id="userName" value="${userToEdit.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="userEmail">Email</label>
                            <input type="email" id="userEmail" value="${userToEdit.email}" required>
                        </div>
                        <div class="form-group">
                            <label for="userRole">Role</label>
                            <select id="userRole">
                                <option value="administrator" ${userToEdit.role.toLowerCase() === 'administrator' ? 'selected' : ''}>Administrator</option>
                                <option value="editor" ${userToEdit.role.toLowerCase() === 'editor' ? 'selected' : ''}>Editor</option>
                                <option value="author" ${userToEdit.role.toLowerCase() === 'author' ? 'selected' : ''}>Author</option>
                                <option value="subscriber" ${userToEdit.role.toLowerCase() === 'subscriber' ? 'selected' : ''}>Subscriber</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Update User</button>
                            <button type="button" class="btn btn-secondary btn-cancel-form">Batal</button>
                        </div>
                    </form>
                `
        )
      }
    })
  })

  container.querySelectorAll('.btn-delete').forEach((button) => {
    button.addEventListener('click', (e) => {
      const userId = e.currentTarget.dataset.id
      if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
        alert(`User dengan ID: ${userId} berhasil dihapus! (Ini adalah mock)`)
      }
    })
  })
}
