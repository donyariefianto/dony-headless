import { loadDashboardPage } from './pages/dashboard.js'
import { loadSettingsPage } from './pages/settings.js'

export const router = {
  '#/dashboard': {
    load: loadDashboardPage,
  },
  '#/posts': {
    load: (container) => {
      container.innerHTML =
        '<div class="card"><h2>Posts Management</h2><p>Manage your blog posts here.</p></div>'
    },
  },
  '#/pages': {
    load: (container) => {
      container.innerHTML =
        '<div class="card"><h2>Page Editor</h2><p>Edit your website pages.</p></div>'
    },
  },
  '#/media': {
    load: (container) => {
      container.innerHTML =
        '<div class="card"><h2>Media Library</h2><p>Upload and manage your media files.</p></div>'
    },
  },
  '#/users': {
    load: (container) => {
      container.innerHTML =
        '<div class="card"><h2>User Management</h2><p>Manage user accounts and roles.</p></div>'
    },
  },
  '#/settings': {
    load: loadSettingsPage,
  },
  // Add a 404 route
  '/404': {
    load: (container) => {
      container.innerHTML =
        '<div class="card"><h2>404 - Page Not Found</h2><p>The page you are looking for does not exist.</p></div>'
    },
  },
}
