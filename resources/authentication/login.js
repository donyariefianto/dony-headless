// public/js/login.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form')
  const usernameInput = document.getElementById('username')
  const passwordInput = document.getElementById('password')
  const loginErrorMessage = document.getElementById('login-error-message')

  function checkAndRedirectIfLoggedIn() {
    const token = localStorage.getItem('token')
    if (token) {
      window.location.href = '/'
    }
  }

  checkAndRedirectIfLoggedIn()

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault()

      const username = usernameInput.value
      const password = passwordInput.value

      loginErrorMessage.style.display = 'none'
      loginErrorMessage.textContent = ''

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        })

        const data = await response.json()
        if (response.ok) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('username', data.username)
          localStorage.setItem('userRole', data.role)
          window.location.href = '/manages'
        } else {
          loginErrorMessage.textContent =
            data.message || 'Login gagal. Cek username dan password Anda.'
          loginErrorMessage.style.display = 'block'
        }
      } catch (error) {
        console.error('Error during login:', error)
        loginErrorMessage.textContent = 'Terjadi kesalahan jaringan atau server. Silakan coba lagi.'
        loginErrorMessage.style.display = 'block'
      }
    })
  }
})
