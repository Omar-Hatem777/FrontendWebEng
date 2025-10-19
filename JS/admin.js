// Admin Dashboard JavaScript

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getAccessToken() {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
}

function handleTokenExpiration() {
    console.log("[AUTH] Token expired - logging out automatically");
    localStorage.clear();
    window.location.href = "/Auth/Login/Login.html";
}

// ============================================
// ADMIN API FUNCTIONS
// ============================================

async function loadAllUsers() {
    console.log('[ADMIN] Loading all users...');
    
    const resultsCard = document.getElementById('resultsCard');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsContent = document.getElementById('resultsContent');
    const loadButton = document.querySelector('button[onclick="loadAllUsers()"]');
    
    // Show loading state on button
    const originalButtonText = loadButton.innerHTML;
    loadButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading Users...';
    loadButton.disabled = true;
    
    // Show loading
    loadingSpinner.style.display = 'block';
    resultsCard.style.display = 'none';
    
    try {
        const token = getAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://127.0.0.1:5121/api/Admin/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('[ADMIN] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
        }

        const users = await response.json();
        console.log('[ADMIN] Users loaded:', users);

        // Filter users to show only those with "user" role
        const filteredUsers = users.filter(user => {
            const roles = user.roles || [];
            return roles.includes('user') || roles.includes('User');
        });
        
        console.log('[ADMIN] Filtered users (user role only):', filteredUsers);
        
        // Display results
        displayUsers(filteredUsers);
        
    } catch (error) {
        console.error('[ADMIN] Error loading users:', error);
        resultsContent.innerHTML = `
            <div class="alert alert-danger">
                <i class="fa-solid fa-exclamation-triangle me-2"></i>
                Error loading users: ${error.message}
            </div>
        `;
        resultsCard.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
        // Reset button state
        loadButton.innerHTML = originalButtonText;
        loadButton.disabled = false;
    }
}

async function getUserById() {
    console.log('[ADMIN] Getting user by ID...');
    
    const userIdInput = document.getElementById('userIdInput');
    const userId = userIdInput.value.trim();
    const searchButton = document.querySelector('button[onclick="getUserById()"]');
    
    if (!userId) {
        // Add shake animation to input
        userIdInput.classList.add('is-invalid');
        setTimeout(() => userIdInput.classList.remove('is-invalid'), 3000);
        return;
    }
    
    // Show loading state on button
    const originalButtonText = searchButton.innerHTML;
    searchButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Searching...';
    searchButton.disabled = true;
    
    const resultsCard = document.getElementById('resultsCard');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsContent = document.getElementById('resultsContent');
    
    // Show loading
    loadingSpinner.style.display = 'block';
    resultsCard.style.display = 'none';
    
    try {
        const token = getAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`http://127.0.0.1:5121/api/Admin/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('[ADMIN] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch user: ${response.status} - ${errorText}`);
        }

        const user = await response.json();
        console.log('[ADMIN] User loaded:', user);

        // Check if user has "user" role
        const roles = user.roles || [];
        if (!roles.includes('user') && !roles.includes('User')) {
            resultsContent.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fa-solid fa-exclamation-triangle me-2"></i>
                    This user does not have "user" role. Only users with "user" role are displayed.
                </div>
            `;
            resultsCard.style.display = 'block';
            return;
        }

        // Display result
        displaySingleUser(user);
        
    } catch (error) {
        console.error('[ADMIN] Error loading user:', error);
        resultsContent.innerHTML = `
            <div class="alert alert-danger">
                <i class="fa-solid fa-exclamation-triangle me-2"></i>
                Error loading user: ${error.message}
            </div>
        `;
        resultsCard.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
        // Reset button state
        searchButton.innerHTML = originalButtonText;
        searchButton.disabled = false;
    }
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

function displayUsers(users) {
    const resultsContent = document.getElementById('resultsContent');
    const resultsCard = document.getElementById('resultsCard');
    
    if (!Array.isArray(users) || users.length === 0) {
        resultsContent.innerHTML = `
            <div class="alert alert-info">
                <i class="fa-solid fa-info-circle me-2"></i>
                No users found.
            </div>
        `;
    } else {
        let html = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-primary">
                        <tr>
                            <th>ID</th>
                            <th>Display Name</th>
                            <th>Email</th>
                            <th>Roles</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        users.forEach(user => {
            const roles = Array.isArray(user.roles) ? user.roles.join(', ') : 'No roles';
            html += `
                <tr>
                    <td><code>${user.id || 'N/A'}</code></td>
                    <td>${user.displayName || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td><span class="badge bg-secondary">${roles}</span></td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3">
                <small class="text-muted">
                    <i class="fa-solid fa-info-circle me-1"></i>
                    Total users: ${users.length}
                </small>
            </div>
        `;
        
        resultsContent.innerHTML = html;
    }
    
    resultsCard.style.display = 'block';
}

function displaySingleUser(user) {
    const resultsContent = document.getElementById('resultsContent');
    const resultsCard = document.getElementById('resultsCard');
    
    const roles = Array.isArray(user.roles) ? user.roles.join(', ') : 'No roles';
    
    const html = `
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">
                    <i class="fa-solid fa-user me-2"></i>User Details
                </h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>ID:</strong> <code>${user.id || 'N/A'}</code></p>
                        <p><strong>Display Name:</strong> ${user.displayName || 'N/A'}</p>
                        <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Roles:</strong> <span class="badge bg-secondary">${roles}</span></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultsContent.innerHTML = html;
    resultsCard.style.display = 'block';
}

// ============================================
// LOGOUT FUNCTION
// ============================================

// Logout loading state function
function showLogoutLoadingState() {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'logoutLoadingOverlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    loadingOverlay.innerHTML = `
        <div class="spinner-border text-light mb-3" style="width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <h4>Signing out...</h4>
        <p class="text-muted">Please wait...</p>
    `;
    
    document.body.appendChild(loadingOverlay);
}

async function logout() {
    console.log('[LOGOUT] Starting logout...');

    // Show loading state
    showLogoutLoadingState();

    try {
        const token = getAccessToken();

        const headers = {
            "Content-Type": "application/json"
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("http://127.0.0.1:5121/api/Account/logout", {
            method: "POST",
            headers: headers,
            credentials: 'include'
        });

        console.log("[LOGOUT] Response status:", response.status);

        // Always clear and redirect
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        localStorage.removeItem("phoneNumber");
        localStorage.removeItem("displayName");
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("roles");

        // Delay redirect to show loading state
        setTimeout(() => {
            window.location.href = "/Auth/Login/Login.html";
        }, 1000);

    } catch (error) {
        console.error("[LOGOUT] Error:", error);
        localStorage.clear();
        
        // Still show loading state even on error
        setTimeout(() => {
            window.location.href = "/Auth/Login/Login.html";
        }, 1000);
    }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
    console.log('[ADMIN] Page loaded - initializing...');

    const displayName = localStorage.getItem("displayName");
    const email = localStorage.getItem("userEmail");
    const rolesString = localStorage.getItem("roles") || "[]";

    // Check if user is authenticated
    if (!displayName || !email) {
        console.log("[ADMIN] Missing user data - redirecting to login");
        window.location.href = "/Auth/Login/Login.html";
        return;
    }

    // Check if user has admin role
    let roles = [];
    try {
        roles = JSON.parse(rolesString);
    } catch (error) {
        console.error('[ADMIN] Error parsing roles:', error);
    }

    if (!roles.includes('Admin') && !roles.includes('admin')) {
        console.log("[ADMIN] User is not an admin - redirecting to user page");
        window.location.href = "/index.html";
        return;
    }

    // Update welcome message
    const welcomeEl = document.getElementById("adminWelcome");
    const emailEl = document.getElementById("adminEmail");

    if (welcomeEl) welcomeEl.textContent = `Welcome, ${displayName}!`;
    if (emailEl) emailEl.textContent = email;

    console.log('[ADMIN] ✅ Admin authenticated');
});
