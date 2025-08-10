import { renderApp } from '../components/app.js';
import { loadTheme } from '../components/theme.js';

export const renderLogin = () => {
    const app = document.getElementById('app');
    
    // Muat tema di sini juga, untuk memastikan halaman login memiliki tema yang benar
    loadTheme();
    
    app.innerHTML = `
        <div class="login-container">
            <div class="login-form-card">
                <h2>Selamat Datang</h2>
                <form id="login-form">
                    <input type="text" id="username" placeholder="Username" required>
                    <input type="password" id="password" placeholder="Password" required>
                    <button type="submit" id="login-button">Login</button>
                    <p id="error-message" style="color: red; display: none; margin-top: 15px;"></p>
                </form>
            </div>
        </div>
    `;

    const form = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...'; /* Ikon loading */
        errorMessage.style.display = 'none';

        const username = e.target.username.value;
        const password = e.target.password.value;
        
        try {
            const response = await fetch('https://dummyjson.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    password: password,
                })
            });

            if (!response.ok) {
                // const errorData = await response.json();
                // throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userToken', data.token);
            
            renderApp();
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            console.error('Login error:', error);
        } finally {
            loginButton.disabled = false;
            loginButton.innerHTML = 'Login';
        }
    });
};