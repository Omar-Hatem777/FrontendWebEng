// Admin Dashboard JavaScript

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getAccessToken() {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
}

function showTokenRefreshNotification(newToken) {
    const last5Chars = newToken ? newToken.slice(-5) : 'N/A';

    const notification = document.createElement('div');
    notification.id = 'token-refresh-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 320px;
        animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 18px;">🔑</div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">Token Refreshed</div>
                <div style="font-size: 12px; opacity: 0.9;">
                    New token ending in: <code style="background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 3px;">${last5Chars}</code>
                </div>
            </div>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: rgba(255,255,255,0.7);
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">
                ×
            </button>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { 
                transform: translateX(100%) scale(0.8); 
                opacity: 0; 
            }
            to { 
                transform: translateX(0) scale(1); 
                opacity: 1; 
            }
        }
        @keyframes slideOutRight {
            from { 
                transform: translateX(0) scale(1); 
                opacity: 1; 
            }
            to { 
                transform: translateX(100%) scale(0.8); 
                opacity: 0; 
            }
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-3px); }
            60% { transform: translateY(-2px); }
        }
    `;
    document.head.appendChild(style);

    const existingNotification = document.getElementById('token-refresh-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);

    console.log(`[NOTIFY] Token refresh notification shown. Ending in: ${last5Chars}`);
}

function handleTokenExpiration() {
    console.log("[AUTH] Token expired - logging out automatically");
    localStorage.clear();
    window.location.href = "/Auth/Login/Login.html";
}

// ============================================
// TOKEN REFRESH FUNCTIONS
// ============================================

function isTokenExpired(token) {
    if (!token) return true;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    } catch (error) {
        console.error('[AUTH] Error parsing token:', error);
        return true;
    }
}

async function refreshAccessToken() {
    console.log('[REFRESH] Starting token refresh...');
    console.log('[REFRESH] Current cookies:', document.cookie);

    const cookies = document.cookie.split(';');
    const refreshTokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('refreshToken=')
    );
    
    if (!refreshTokenCookie) {
        console.error('[REFRESH] ❌ No refresh token cookie found!');
        console.log('[REFRESH] Available cookies:', cookies);
        alert('No refresh token found. Please login again.');
        handleTokenExpiration();
        return null;
    }

    console.log('[REFRESH] ✅ Refresh token cookie exists');

    try {
        console.log('[REFRESH] Sending request to: http://127.0.0.1:5121/api/Account/refresh');
        
        const response = await fetch('http://127.0.0.1:5121/api/Account/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('[REFRESH] Response status:', response.status);
        console.log('[REFRESH] Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[REFRESH] ❌ Failed with status:', response.status);
            console.error('[REFRESH] Error response:', errorText);
            
            // Try to parse as JSON
            try {
                const errorJson = JSON.parse(errorText);
                alert(`Token refresh failed: ${errorJson.message || errorText}`);
            } catch {
                alert(`Token refresh failed: ${response.status} - ${errorText}`);
            }
            
            throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[REFRESH] ✅ Response data:', data);
        
        const newToken = data.token || data.accessToken;
        
        if (!newToken) {
            console.error('[REFRESH] ❌ No token in response:', data);
            throw new Error('No token in refresh response');
        }

        console.log('[REFRESH] ✅ New token received (last 10 chars):', newToken.slice(-10));
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('token', newToken);
        
        showTokenRefreshNotification(newToken);
        
        return newToken;
    } catch (error) {
        console.error('[REFRESH] ❌ Error:', error);
        setTimeout(() => handleTokenExpiration(), 2000);
        return null;
    }
}

async function getValidToken() {
    const token = getAccessToken();

    if (!token) {
        console.log('[AUTH] No token found');
        handleTokenExpiration();
        return null;
    }

    if (isTokenExpired(token)) {
        console.log('[AUTH] Token expired - attempting refresh');
        const newToken = await refreshAccessToken();
        if (!newToken) {
            console.log('[AUTH] Refresh failed - logging out');
            return null;
        }
        return newToken;
    }

    console.log('[AUTH] Token is valid');
    return token;
}

// ============================================
// ACCESS CONTROL FUNCTIONS
// ============================================

function checkAdminAccess() {
    const rolesString = localStorage.getItem("roles") || "[]";
    let roles = [];
    
    try {
        roles = JSON.parse(rolesString);
    } catch (error) {
        console.error('[ADMIN] Error parsing roles:', error);
        return false;
    }

    const isAdmin = roles.includes('Admin') || roles.includes('admin');
    
    if (!isAdmin) {
        console.log("[ADMIN] Access denied - user is not an admin");
        alert("Access denied. You must be an administrator to perform this action.");
        window.location.href = "/index.html";
        return false;
    }
    
    return true;
}

// ============================================
// ADMIN API FUNCTIONS
// ============================================

async function loadAllUsers() {
    console.log('[ADMIN] Loading all users...');
    
    // Check admin access before proceeding
    if (!checkAdminAccess()) {
        return;
    }
    
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
        const token = await getValidToken();
        if (!token) {
            throw new Error('No valid authentication token found');
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

// ============================================
// MODAL FUNCTIONS
// ============================================

function openUserLookupModal() {
    console.log('[ADMIN] Opening user lookup modal...');
    
    // Clear any previous input and errors
    const modalInput = document.getElementById('modalUserIdInput');
    const modalError = document.getElementById('modalUserIdError');
    
    modalInput.value = '';
    modalError.style.display = 'none';
    modalInput.classList.remove('is-invalid');
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('userLookupModal'));
    modal.show();
}

async function getUserByIdFromModal() {
    console.log('[ADMIN] Getting user by ID from modal...');
    
    // Check admin access before proceeding
    if (!checkAdminAccess()) {
        return;
    }
    
    const modalInput = document.getElementById('modalUserIdInput');
    const modalError = document.getElementById('modalUserIdError');
    const searchButton = document.querySelector('button[onclick="getUserByIdFromModal()"]');
    const userId = modalInput.value.trim();
    
    // Clear previous error
    modalError.style.display = 'none';
    modalInput.classList.remove('is-invalid');
    
    if (!userId) {
        modalError.style.display = 'block';
        modalError.textContent = 'Please enter a User ID.';
        modalInput.classList.add('is-invalid');
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
        const token = await getValidToken();
        if (!token) {
            throw new Error('No valid authentication token found');
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
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('userLookupModal'));
        modal.hide();
        
    } catch (error) {
        console.error('[ADMIN] Error loading user:', error);
        resultsContent.innerHTML = `
            <div class="alert alert-danger">
                <i class="fa-solid fa-exclamation-triangle me-2"></i>
                Error loading user: ${error.message}
            </div>
        `;
        resultsCard.style.display = 'block';
        
        // Close the modal even on error
        const modal = bootstrap.Modal.getInstance(document.getElementById('userLookupModal'));
        modal.hide();
        
    } finally {
        loadingSpinner.style.display = 'none';
        // Reset button state
        searchButton.innerHTML = originalButtonText;
        searchButton.disabled = false;
    }
}

// Legacy function for backward compatibility (if needed)
async function getUserById() {
    console.log('[ADMIN] Legacy getUserById called - redirecting to modal');
    openUserLookupModal();
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

    // Get valid token (with refresh if needed)
    const token = await getValidToken();
    if (!token) {
        console.log("[ADMIN] Could not get valid token - logging out");
        handleTokenExpiration();
        return;
    }

    // Update welcome message
    const welcomeEl = document.getElementById("adminWelcome");
    const emailEl = document.getElementById("adminEmail");

    if (welcomeEl) welcomeEl.textContent = `Welcome, ${displayName}!`;
    if (emailEl) emailEl.textContent = email;

    console.log('[ADMIN] ✅ Admin authenticated');

    // Start periodic token checking every 30 seconds
    const checkInterval = 30 * 1000;
    console.log(`[ADMIN] Starting periodic token check every ${checkInterval / 1000} seconds`);

    setInterval(async () => {
        console.log('[ADMIN] Periodic token check...');
        const token = await getValidToken();
        if (!token) {
            console.log("[ADMIN] Token invalid in periodic check - logging out");
            handleTokenExpiration();
        } else {
            console.log("[ADMIN] Token still valid");
        }
    }, checkInterval);

    // Check when user returns to tab
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            console.log('[ADMIN] User returned to tab - checking token');
            const token = await getValidToken();
            if (!token) {
                console.log("[ADMIN] Token invalid on tab focus - logging out");
                handleTokenExpiration();
            }
        }
    });
});
