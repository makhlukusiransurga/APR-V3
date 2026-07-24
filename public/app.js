// State
let currentUser = null;
let token = localStorage.getItem('apr_token');

// API Base URL (Relative for same-origin)
const API_URL = '/api';

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const appRoot = document.getElementById('appRoot');
const loginForm = document.getElementById('loginForm');
const userNameDisplay = document.getElementById('userNameDisplay');
const menuAdmin = document.getElementById('menuAdmin');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');

// Navigation
const navLinks = document.querySelectorAll('.nav-links a');
const pages = document.querySelectorAll('.page-section');

// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------
function init() {
    if (token) {
        // Mock token decoding (In prod, verify via backend /me endpoint)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = payload;
            showApp();
        } catch (e) {
            showLogin();
        }
    } else {
        showLogin();
    }
}

function showLogin() {
    loginScreen.classList.add('active');
    appRoot.style.display = 'none';
}

function showApp() {
    loginScreen.classList.remove('active');
    appRoot.style.display = 'flex';
    userNameDisplay.textContent = currentUser.name || currentUser.nrp;
    
    if (currentUser.role === 'Admin' || currentUser.role === 'Manager') {
        menuAdmin.style.display = 'block';
    } else {
        menuAdmin.style.display = 'none';
    }
    
    // Default Page
    navigate('dashboard');
    loadDashboardData();
}

// ----------------------------------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------------------------------
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nrp = document.getElementById('loginNrp').value;
    const pin = document.getElementById('loginPin').value;
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nrp, pin })
        });
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('apr_token', data.token);
            token = data.token;
            init();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (err) {
        console.warn('Network error, falling back to mock login for demo', err);
        if(nrp === 'admin' && pin === 'admin') {
            const dummyToken = 'header.' + btoa(JSON.stringify({nrp: 'admin', role: 'Admin', name: 'Super Admin'})) + '.sign';
            localStorage.setItem('apr_token', dummyToken);
            token = dummyToken;
            init();
        } else if (nrp === 'staff' && pin === 'staff') {
            const dummyToken = 'header.' + btoa(JSON.stringify({nrp: 'staff', role: 'Staff', name: 'Staff User'})) + '.sign';
            localStorage.setItem('apr_token', dummyToken);
            token = dummyToken;
            init();
        } else {
            alert('Server connection error. Use admin/admin or staff/staff to bypass for demo.');
        }
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('apr_token');
    token = null;
    currentUser = null;
    showLogin();
});

// ----------------------------------------------------------------------------
// NAVIGATION
// ----------------------------------------------------------------------------
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = e.currentTarget.getAttribute('data-page');
        if(pageId) navigate(pageId);
    });
});

function navigate(pageId) {
    // Update active nav class
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');

    // Show correct page
    pages.forEach(p => p.style.display = 'none');
    const targetPage = document.getElementById(`page-${pageId}`);
    if(targetPage) {
        targetPage.style.display = 'block';
        if(pageId === 'admin') loadAdminConfig();
    }
}

// ----------------------------------------------------------------------------
// ADMIN SYSTEM SETTINGS
// ----------------------------------------------------------------------------
async function loadAdminConfig() {
    try {
        const res = await fetch(`${API_URL}/config`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const config = data.config;
            if(config) {
                document.getElementById('cfg_delay').value = config.DELAY_PENALTY_PER_DAY || 5;
                document.getElementById('cfg_acc_high').value = config.PLAN_ACCURACY_THRESHOLD_HIGH || 90;
                document.getElementById('cfg_comp_high').value = config.COMPLEXITY_HIGH_MULTI || 2.0;
                document.getElementById('cfg_lrn_xp').value = config.LEARNING_APPROVED_XP || 15;
            }
        }
    } catch (e) {
        console.log('Using mock data for config');
    }
}

document.getElementById('configForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const delay = document.getElementById('cfg_delay').value;
    
    // Example saving one config
    try {
        const res = await fetch(`${API_URL}/config`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ key: 'DELAY_PENALTY_PER_DAY', value: delay })
        });
        if(res.ok) {
            alert('Configuration Saved & Cache Refreshed Instantly!');
        }
    } catch (e) {
        alert('Saved locally for demo!');
    }
});

// ----------------------------------------------------------------------------
// MODAL & THEME CONTROLS
// ----------------------------------------------------------------------------
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i> Toggle Theme' : '<i class="fas fa-sun"></i> Toggle Theme';
});

// ----------------------------------------------------------------------------
// DASHBOARD MOCK DATA LOADER
// ----------------------------------------------------------------------------
function loadDashboardData() {
    const tbody = document.querySelector('#recentTasksTable tbody');
    if(!tbody) return;
    
    // Mock Data
    const tasks = [
        { title: 'Update Pipeline Data', status: 'In Progress', deadline: '2026-07-25' },
        { title: 'Review System Design', status: 'Done', deadline: '2026-07-22' },
        { title: 'Prepare Q3 Meeting', status: 'Planning', deadline: '2026-07-30' }
    ];

    tbody.innerHTML = '';
    tasks.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.title}</td>
            <td><span style="padding: 4px 8px; border-radius: 4px; background: rgba(74, 144, 226, 0.2); color: var(--accent-color); font-size: 0.8rem;">${t.status}</span></td>
            <td>${t.deadline}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Start app
init();
