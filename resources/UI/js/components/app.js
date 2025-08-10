import { renderSidebar, setupSidebarEvents } from './sidebar.js';
import { handleRouting } from '../utils/router.js';
import { renderLogin } from '../pages/login.js';

export const renderApp = () => {
    const app = document.getElementById('app');
    
    const menuToggle = `<button class="menu-toggle"><i class="fa-solid fa-bars"></i></button>`;

    app.innerHTML = `
        ${window.innerWidth <= 768 ? menuToggle : ''}
        <div class="overlay"></div>
        ${renderSidebar()}
        <div class="main-content" id="main-content">
            </div>
    `;
    setupSidebarEvents();
    handleRouting();
    
    // Tombol logout
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket"></i>';
    
    // Masukkan tombol logout ke dalam sidebar atau lokasi yang sesuai
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
        sidebarFooter.insertBefore(logoutBtn, sidebarFooter.firstChild);
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userToken');
        renderLogin();
    });
    
    // Setup event listener untuk menu toggle
    const toggleBtn = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    
    if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
};