export function loadMediaPage(container) {
  const mediaItems = [
    { id: 'media1', name: 'gambar-dashboard.png', type: 'image', size: '1.2 MB' },
    { id: 'media2', name: 'laporan-bulanan.pdf', type: 'document', size: '5.8 MB' },
    { id: 'media3', name: 'video-promo.mp4', type: 'video', size: '25.1 MB' },
  ]

  container.innerHTML = `
        <div class="card">
            <h2>Manajemen Media</h2>
            <div class="settings-group">
                <h4>Daftar File Media</h4>
                <ul class="settings-list-items">
                    ${mediaItems
                      .map(
                        (item) => `
                        <li data-id="${item.id}">
                            <span><i class="fa-solid ${item.type === 'image' ? 'fa-image' : item.type === 'document' ? 'fa-file-alt' : 'fa-video'}"></i> ${item.name} (${item.size})</span>
                            <div class="item-actions">
                                <button class="btn btn-icon btn-view" data-id="${item.id}" aria-label="Lihat Media"><i class="fa-solid fa-eye"></i></button>
                                <button class="btn btn-icon btn-delete" data-id="${item.id}" aria-label="Hapus Media"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </li>
                    `
                      )
                      .join('')}
                </ul>
                <button class="btn btn-primary btn-add-new-item" style="margin-top: 20px;" data-item-type="media">
                    <i class="fa-solid fa-plus" style="margin-right: 8px;"></i> Upload Media Baru
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
        const itemName =
          panelForm.querySelector('input[type="text"]').value ||
          panelForm.querySelector('input[type="file"]').files[0]?.name
        console.log(`Mengupload ${itemName} untuk Media.`)
        alert(`Media "${itemName}" berhasil diupload! (Ini adalah mock)`)
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
      'Upload Media Baru',
      `
            <form id="uploadMediaForm">
                <div class="form-group">
                    <label for="mediaFile">Pilih File</label>
                    <input type="file" id="mediaFile" required>
                    <span class="help-text">Ukuran file maksimal 100MB (JPG, PNG, PDF, MP4, dll).</span>
                </div>
                <div class="form-group">
                    <label for="mediaName">Nama File (Opsional)</label>
                    <input type="text" id="mediaName" placeholder="Nama untuk file ini">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Upload File</button>
                    <button type="button" class="btn btn-secondary btn-cancel-form">Batal</button>
                </div>
            </form>
        `
    )
  })

  container.querySelectorAll('.btn-view').forEach((button) => {
    button.addEventListener('click', (e) => {
      const mediaId = e.currentTarget.dataset.id
      const mediaToView = mediaItems.find((item) => item.id === mediaId)
      if (mediaToView) {
        openSidePanel(
          `Lihat: ${mediaToView.name}`,
          `
                    <div style="text-align: center; padding: 20px;">
                        ${mediaToView.type === 'image' ? `<img src="https://via.placeholder.com/300x200?text=${encodeURIComponent(mediaToView.name)}" alt="${mediaToView.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px;">` : ''}
                        ${mediaToView.type === 'document' ? `<p><i class="fa-solid fa-file-alt fa-3x"></i><br>Pratinjau dokumen tidak tersedia.<br>Ukuran: ${mediaToView.size}</p>` : ''}
                        ${mediaToView.type === 'video' ? `<p><i class="fa-solid fa-video fa-3x"></i><br>Pratinjau video tidak tersedia.<br>Ukuran: ${mediaToView.size}</p>` : ''}
                        <p><strong>Nama:</strong> ${mediaToView.name}</p>
                        <p><strong>Tipe:</strong> ${mediaToView.type}</p>
                        <p><strong>Ukuran:</strong> ${mediaToView.size}</p>
                        <div class="form-actions" style="justify-content: center;">
                            <button type="button" class="btn btn-secondary btn-cancel-form">Tutup</button>
                        </div>
                    </div>
                `
        )
      }
    })
  })

  container.querySelectorAll('.btn-delete').forEach((button) => {
    button.addEventListener('click', (e) => {
      const mediaId = e.currentTarget.dataset.id
      if (confirm('Apakah Anda yakin ingin menghapus media ini?')) {
        alert(`Media dengan ID: ${mediaId} berhasil dihapus! (Ini adalah mock)`)
      }
    })
  })
}
