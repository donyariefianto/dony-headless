import { toggleTheme } from './theme.js';
import { handleRouting } from '../utils/router.js';

export const renderSidebar = () => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    const moonIcon = '<i class="fa-solid fa-moon"></i>';
    const sunIcon = '<i class="fa-solid fa-sun"></i>';
    
    return `
        <aside class="sidebar">
            <h2 class="sidebar-header">Dashboard App</h2>
            <ul class="nav-links">
                <li><a href="#dashboard" class="nav-link"><i class="fa-solid fa-gauge icon"></i><span>Dashboard</span></a></li>
                <li><a href="#data-entries" class="nav-link"><i class="fa-solid fa-database icon"></i><span>Data Entries</span></a></li>
            </ul>
            <div class="sidebar-footer">
                <button class="toggle-btn" title="Toggle Sidebar"><i class="fa-solid fa-angles-left"></i></button>
                <button class="theme-toggle" title="Toggle Dark Mode">${isDarkMode ? sunIcon : moonIcon}</button>
            </div>
        </aside>
    `;
};

export const setupSidebarEvents = () => {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = sidebar.querySelector('.toggle-btn');
    const themeBtn = sidebar.querySelector('.theme-toggle');
    const overlay = document.querySelector('.overlay');

    // Toggle Sidebar (khusus untuk desktop)
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // Logika ini hanya akan dijalankan jika lebar layar lebih dari 768px
            if (window.innerWidth > 768) {
                sidebar.classList.toggle('collapsed');
                document.body.classList.toggle('sidebar-collapsed');
            }
        });
    }

    // Toggle Theme (logika tetap sama)
    themeBtn.addEventListener('click', () => {
        toggleTheme();
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeBtn.innerHTML = isDarkMode ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    });

    // Handle routing
    sidebar.addEventListener('click', (e) => {
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
            e.preventDefault();
            const hash = navLink.getAttribute('href');
            window.history.pushState({}, '', hash);
            handleRouting();
            
            // Highlight active link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            navLink.classList.add('active');
            
            // Tutup sidebar setelah navigasi di mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                if (overlay) {
                    overlay.classList.remove('active');
                }
            }
        }
    });

    // Highlight active link on initial load
    const currentHash = window.location.hash || '#dashboard';
    const activeLink = sidebar.querySelector(`.nav-links a[href="${currentHash}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
};