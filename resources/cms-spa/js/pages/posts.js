export function loadPostsPage(container) {
  const posts = [
    {
      id: 'post1',
      title: 'Cara Membuat Website dengan HTML & CSS',
      date: '2023-04-15',
      status: 'Published',
    },
    { id: 'post2', title: 'SEO Dasar untuk Pemula', date: '2023-04-20', status: 'Draft' },
    {
      id: 'post3',
      title: '10 Framework JavaScript Terbaik Tahun Ini',
      date: '2023-05-01',
      status: 'Published',
    },
  ]

  container.innerHTML = `
        <div class="card">
            <h2>Manajemen Posts</h2>
            <div class="settings-group">
                <h4>Daftar Posts</h4>
                <ul class="settings-list-items">
                    ${posts
                      .map(
                        (post) => `
                        <li data-id="${post.id}">
                            <span>${post.title} <span class="status-badge status-${post.status.toLowerCase()}">${post.status}</span></span>
                            <div class="item-actions">
                                <button class="btn btn-icon btn-edit" data-id="${post.id}" aria-label="Edit Post"><i class="fa-solid fa-edit"></i></button>
                                <button class="btn btn-icon btn-delete" data-id="${post.id}" aria-label="Hapus Post"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </li>
                    `
                      )
                      .join('')}
                </ul>
                <button class="btn btn-primary btn-add-new-item" style="margin-top: 20px;" data-item-type="post">
                    <i class="fa-solid fa-plus" style="margin-right: 8px;"></i> Tambah Post Baru
                </button>
            </div>
        </div>
    `

  // Ambil referensi ke panel samping
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
    attachPanelFormListeners() // Pasang listener untuk form di panel
  }

  const closeSidePanel = () => {
    sidePanel.classList.remove('show')
    sidePanelOverlay.classList.remove('show')
    sidePanelContent.innerHTML = ''
  }

  closeSidePanelBtn.onclick = closeSidePanel // Pastikan event listener ditimpa atau tidak duplikat
  sidePanelOverlay.onclick = closeSidePanel

  const attachPanelFormListeners = () => {
    const panelForm = sidePanelContent.querySelector('form')
    if (panelForm) {
      panelForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const itemName = panelForm.querySelector('input[type="text"]').value
        console.log(`Menyimpan ${itemName} untuk Post.`)
        alert(`Post "${itemName}" berhasil disimpan! (Ini adalah mock)`)
        closeSidePanel()
        // Realistically, you'd re-render the list here
      })

      const cancelButton = sidePanelContent.querySelector('.btn-cancel-form')
      if (cancelButton) {
        cancelButton.addEventListener('click', closeSidePanel)
      }
    }
  }

  container.querySelector('.btn-add-new-item').addEventListener('click', () => {
    openSidePanel(
      'Tambah Post Baru',
      `
            <form id="addPostForm">
                <div class="form-group">
                    <label for="postTitle">Judul Post</label>
                    <input type="text" id="postTitle" placeholder="Masukkan judul post" required>
                </div>
                <div class="form-group">
                    <label for="postContent">Konten Post</label>
                    <textarea id="postContent" rows="10" placeholder="Tuliskan konten post di sini"></textarea>
                </div>
                <div class="form-group">
                    <label for="postStatus">Status</label>
                    <select id="postStatus">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Simpan Post</button>
                    <button type="button" class="btn btn-secondary btn-cancel-form">Batal</button>
                </div>
            </form>
        `
    )
  })

  container.querySelectorAll('.btn-edit').forEach((button) => {
    button.addEventListener('click', (e) => {
      const postId = e.currentTarget.dataset.id
      const postToEdit = posts.find((p) => p.id === postId)
      if (postToEdit) {
        openSidePanel(
          'Edit Post',
          `
                    <form id="editPostForm">
                        <input type="hidden" id="postId" value="${postToEdit.id}">
                        <div class="form-group">
                            <label for="postTitle">Judul Post</label>
                            <input type="text" id="postTitle" value="${postToEdit.title}" required>
                        </div>
                        <div class="form-group">
                            <label for="postContent">Konten Post</label>
                            <textarea id="postContent" rows="10">${postToEdit.content || 'Konten mock...'}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="postStatus">Status</label>
                            <select id="postStatus">
                                <option value="draft" ${postToEdit.status.toLowerCase() === 'draft' ? 'selected' : ''}>Draft</option>
                                <option value="published" ${postToEdit.status.toLowerCase() === 'published' ? 'selected' : ''}>Published</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Update Post</button>
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
      const postId = e.currentTarget.dataset.id
      if (confirm('Apakah Anda yakin ingin menghapus post ini?')) {
        // Logika hapus post (mock)
        alert(`Post dengan ID: ${postId} berhasil dihapus! (Ini adalah mock)`)
        // Realistically, you'd remove from array and re-render list
        // posts = posts.filter(p => p.id !== postId);
        // loadPostsPage(container); // Re-render the page
      }
    })
  })
}
