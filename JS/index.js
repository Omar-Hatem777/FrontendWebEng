// Complete Token Refresh Implementation - Updated for HTTP

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
            <div style="font-size: 18px;"></div>
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

function getAccessToken() {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
}

// ============================================
// TOKEN VALIDATION
// ============================================

function isTokenExpired(token) {
    if (!token) {
        console.log('[TOKEN CHECK] No token found');
        return true;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiration = payload.exp * 1000;
        const now = Date.now();
        const bufferMs = 30000; // 30 seconds buffer

        const timeUntilExpiry = Math.round((expiration - now) / 1000);
        const isExpired = expiration < (now + bufferMs);

        console.log('[TOKEN CHECK]', {
            expiresAt: new Date(expiration).toISOString(),
            currentTime: new Date(now).toISOString(),
            secondsUntilExpiry: timeUntilExpiry,
            isExpired: isExpired,
            buffer: '30s'
        });

        return isExpired;
    } catch (error) {
        console.error('[TOKEN CHECK] Error decoding token:', error);
        return true;
    }
}

function checkTokenStatus() {
    const token = getAccessToken();

    if (!token) {
        console.log('[STATUS] No token found');
        return { valid: false, reason: 'No token' };
    }

    if (isTokenExpired(token)) {
        console.log('[STATUS] Token is expired');
        return { valid: false, reason: 'Expired' };
    }

    console.log('[STATUS] Token is still valid');
    return { valid: true, reason: 'Valid' };
}

// ============================================
// TOKEN REFRESH
// ============================================
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
        
        showTokenRefreshNotification(newToken); // Show token refresh notification
        
        // Update the UI with the new token
        updateUserDataDisplay();
        
        // Restart the countdown timer with the new token
        restartTokenCountdown();
        
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
// DEBUG FUNCTIONS
// ============================================

function debugToken() {
    const token = getAccessToken();
    console.log('=== TOKEN DEBUG ===');
    console.log('Raw token:', token);

    if (!token) {
        console.log('No token found in localStorage');
        return;
    }

    try {
        const parts = token.split('.');
        console.log('Token parts count:', parts.length);

        if (parts.length === 3) {
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));

            console.log('Header:', header);
            console.log('Payload:', payload);

            if (payload.exp) {
                const expiration = payload.exp * 1000;
                const now = Date.now();
                const timeUntilExpiry = Math.round((expiration - now) / 1000);

                console.log('Expiration timestamp:', payload.exp);
                console.log('Expiration date:', new Date(expiration).toISOString());
                console.log('Current date:', new Date(now).toISOString());
                console.log('Time until expiry:', timeUntilExpiry, 'seconds');
                console.log('Is expired:', timeUntilExpiry <= 0);
            } else {
                console.log('No expiration time found in token payload');
            }
        } else {
            console.log('Invalid JWT format');
        }
    } catch (error) {
        console.error('Error parsing token:', error);
    }

    console.log('=== END DEBUG ===');
}

function debugCookies() {
    console.log('=== COOKIE DEBUG ===');
    console.log('All cookies:', document.cookie);

    if (document.cookie) {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            console.log(`Cookie: ${name} = ${value ? value.substring(0, 20) + '...' : 'empty'}`);
        });
    } else {
        console.log('No cookies found');
    }

    console.log('Current protocol:', window.location.protocol);
    console.log('Current host:', window.location.host);
    console.log('Is localhost:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    console.log('=== END COOKIE DEBUG ===');
}

function checkRefreshTokenCookie() {
    console.log('=== CHECKING REFRESH TOKEN COOKIE ===');

    const cookies = document.cookie.split(';');
    let refreshTokenFound = false;

    cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name.toLowerCase().includes('refresh') || name === 'refreshToken') {
            console.log(`Found refresh token cookie: ${name} = ${value ? value.substring(0, 20) + '...' : 'empty'}`);
            refreshTokenFound = true;
        }
    });

    if (!refreshTokenFound) {
        console.log('âŒ No refresh token cookie found!');
        console.log('Backend should set: Set-Cookie: refreshToken=value; HttpOnly; Secure=false; SameSite=Lax');
    } else {
        console.log(' Refresh token cookie found');
    }

    console.log('=== END CHECK ===');
}

async function testRefreshEndpoint() {
    console.log('=== TESTING REFRESH ENDPOINT ===');

    console.log('Document cookies:', document.cookie);

    try {
        const response = await fetch('http://127.0.0.1:7291/api/Account/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('Parsed response:', data);
                console.log('Token found:', data.token || data.accessToken || data.access_token);
            } catch (e) {
                console.log('Response is not JSON');
            }
        } else {
            console.log('Request failed');
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
    console.log('=== END TEST ===');
}

function testTokenExpiration() {
    console.log('=== TESTING TOKEN EXPIRATION ===');
    const tokenStatus = checkTokenStatus();

    if (!tokenStatus.valid) {
        if (tokenStatus.reason === 'Expired') {
            console.log('Token is expired - testing refresh...');
            refreshAccessToken().then(refreshedToken => {
                if (!refreshedToken) {
                    console.log('Refresh failed - testing logout...');
                    handleTokenExpiration();
                } else {
                    console.log('Refresh successful!');
                }
            });
        } else {
            console.log('No token found - testing logout...');
            handleTokenExpiration();
        }
    } else {
        console.log('Token is still valid - no action needed');
    }

    console.log('=== END TEST ===');
}

function testRefreshNotification() {
    console.log('Testing refresh notification...');
    const currentToken = getAccessToken();
    if (currentToken) {
        showTokenRefreshNotification(currentToken);
    } else {
        console.log('No token found to test with');
    }
}

// ============================================
// ACCESS CONTROL TEST FUNCTIONS
// ============================================

function testAdminAccess() {
    console.log('[TEST] Regular user attempting to access admin features...');
    
    // Try to access admin page directly
    console.log('[TEST] Attempting to access admin.html...');
    
    // Check if user has admin role
    const rolesString = localStorage.getItem("roles") || "[]";
    let roles = [];
    
    try {
        roles = JSON.parse(rolesString);
    } catch (error) {
        console.error('[TEST] Error parsing roles:', error);
    }

    const isAdmin = roles.includes('Admin') || roles.includes('admin');
    
    if (isAdmin) {
        console.log('[TEST] User is actually an admin - redirecting to admin page');
        window.location.href = "/admin.html";
    } else {
        console.log('[TEST] User is not an admin - showing access denied message');
        alert("Access Denied!\n\nYou are not authorized to access admin features.\nOnly administrators can access the admin dashboard.");
        
        // Try to simulate what would happen if they tried to access admin features
        console.log('[TEST] Simulating admin API call...');
        simulateAdminAPICall();
    }
}

async function simulateAdminAPICall() {
    console.log('[TEST] Simulating admin API call...');
    
    try {
        const token = await getValidToken();
        if (!token) {
            console.log('[TEST] No valid token - would be redirected to login');
            return;
        }

        // Try to call admin API
        const response = await fetch('http://127.0.0.1:5121/api/Admin/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('[TEST] Admin API response status:', response.status);

        if (response.status === 403) {
            console.log('[TEST] ✅ Server correctly returned 403 Forbidden');
            alert("Server Response: 403 Forbidden\n\nThe server correctly denied access to admin features because you don't have admin privileges.");
        } else if (response.status === 401) {
            console.log('[TEST] Server returned 401 Unauthorized');
            alert("Server Response: 401 Unauthorized\n\nYour token may be invalid or expired.");
        } else if (response.ok) {
            console.log('[TEST] ⚠️ Server allowed access - this might be a security issue');
            alert("Server Response: 200 OK\n\n⚠️ WARNING: The server allowed access to admin features even though you're not an admin. This could be a security issue!");
        } else {
            console.log('[TEST] Server returned unexpected status:', response.status);
            const errorText = await response.text();
            alert(`Server Response: ${response.status}\n\n${errorText}`);
        }

    } catch (error) {
        console.error('[TEST] Error calling admin API:', error);
        alert(`Error calling admin API: ${error.message}`);
    }
}

// ============================================
// EXPOSE DEBUG FUNCTIONS
// ============================================

window.debugToken = debugToken;
window.debugCookies = debugCookies;
window.checkRefreshTokenCookie = checkRefreshTokenCookie;
window.testRefreshEndpoint = testRefreshEndpoint;
window.testTokenExpiration = testTokenExpiration;
window.testRefreshNotification = testRefreshNotification;
window.testAdminAccess = testAdminAccess;

// ============================================
// MAIN APPLICATION LOGIC
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
    console.log('[APP] Page loaded - initializing...');

    const displayName = localStorage.getItem("displayName");
    const email = localStorage.getItem("userEmail");
    const rolesString = localStorage.getItem("roles") || "[]";

    if (!displayName || !email) {
        console.log("[APP] Missing user data - redirecting to login");
        window.location.href = "/Auth/Login/Login.html";
        return;
    }

    // Check if user is admin and redirect to admin dashboard
    let roles = [];
    try {
        roles = JSON.parse(rolesString);
    } catch (error) {
        console.error('[APP] Error parsing roles:', error);
    }

    if (roles.includes('Admin') || roles.includes('admin')) {
        console.log("[APP] Admin user detected - redirecting to admin dashboard");
        window.location.href = "/admin.html";
        return;
    }

    const token = await getValidToken();
    if (!token) {
        console.log("[APP] Could not get valid token - logging out");
        handleTokenExpiration();
        return;
    }

    console.log('[APP] âœ… User authenticated');

    const welcomeEl = document.getElementById("welcome");
    const emailEl = document.getElementById("userEmail");

    if (welcomeEl) welcomeEl.textContent = `Welcome, ${displayName}!`;
    if (emailEl) emailEl.textContent = email;

    // Update user data display
    updateUserDataDisplay();
    
    // Start token countdown timer
    startTokenCountdown();

    // Periodic token check every 20 seconds
    const checkInterval = 20 * 1000;
    console.log(`[APP] Starting periodic token check every ${checkInterval / 1000} seconds`);

    setInterval(async () => {
        console.log('[APP] Periodic token check...');
        const tokenStatus = checkTokenStatus();

        if (!tokenStatus.valid) {
            if (tokenStatus.reason === 'Expired') {
                console.log("[APP] Token expired in periodic check - refreshing");
                const refreshedToken = await refreshAccessToken();
                if (!refreshedToken) {
                    console.log("[APP] Refresh failed - logging out");
                    handleTokenExpiration();
                }
            } else {
                console.log("[APP] No token in periodic check - logging out");
                handleTokenExpiration();
            }
        } else {
            console.log("[APP] Token still valid");
        }
    }, checkInterval);

    // Check when user returns to tab
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            console.log('[APP] User returned to tab - checking token');
            const tokenStatus = checkTokenStatus();

            if (!tokenStatus.valid) {
                if (tokenStatus.reason === 'Expired') {
                    console.log("[APP] Token expired when user returned - refreshing");
                    const refreshedToken = await refreshAccessToken();
                    if (!refreshedToken) {
                        console.log("[APP] Refresh failed - logging out");
                        handleTokenExpiration();
                    }
                } else {
                    console.log("[APP] No token when user returned - logging out");
                    handleTokenExpiration();
                }
            }
        }
    });
});

// ============================================
// LOGOUT LOADING STATE
// ============================================

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

// ============================================
// LOGOUT FUNCTION
// ============================================

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

        const contentType = response.headers.get("content-type");
        let data = null;

        if (contentType && contentType.includes("application/json")) {
            const responseText = await response.text();
            if (responseText.trim()) {
                data = JSON.parse(responseText);
                console.log("[LOGOUT] API response:", data);
            }
        }

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
// USER DATA DISPLAY FUNCTIONS
// ============================================

function updateUserDataDisplay() {
    console.log('[UI] Updating user data display...');
    
    // Get user data from localStorage
    const displayName = localStorage.getItem("displayName") || "N/A";
    const userName = localStorage.getItem("userName") || "N/A";
    const email = localStorage.getItem("userEmail") || "N/A";
    const rolesString = localStorage.getItem("roles") || "[]";
    const token = getAccessToken() || "N/A";
    
    // Parse roles array
    let roles = [];
    try {
        roles = JSON.parse(rolesString);
    } catch (error) {
        console.error('[UI] Error parsing roles:', error);
        roles = [];
    }
    
    // Format roles for display
    const rolesDisplay = roles.length > 0 ? roles.join(", ") : "No roles assigned";
    
    // Debug logging
    console.log('[UI] Retrieved data:', {
        displayName,
        userName,
        email,
        roles,
        rolesDisplay,
        tokenLength: token !== "N/A" ? token.length : 0
    });
    
    // Update display elements
    const displayNameEl = document.getElementById("displayNameValue");
    const emailEl = document.getElementById("emailValue");
    const roleEl = document.getElementById("roleValue");
    const tokenEl = document.getElementById("tokenValue");
    
    if (displayNameEl) displayNameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = email;
    if (roleEl) roleEl.textContent = rolesDisplay;
    
    if (tokenEl && token !== "N/A") {
        // Show last 10 characters of token
        const last10Chars = token.slice(-10);
        tokenEl.textContent = `...${last10Chars}`;
    } else if (tokenEl) {
        tokenEl.textContent = "No token found";
    }
    
    console.log('[UI] User data display updated');
}

function startTokenCountdown() {
    console.log('[UI] Starting token countdown timer...');
    
    const countdownEl = document.getElementById("countdownTimer");
    const countdownTextEl = document.getElementById("countdownText");
    
    if (!countdownEl || !countdownTextEl) {
        console.error('[UI] Countdown elements not found');
        return;
    }
    
    function updateCountdown() {
        const token = getAccessToken();
        
        if (!token) {
            countdownTextEl.textContent = "No token available";
            countdownEl.className = "countdown-timer";
            return;
        }
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiration = payload.exp * 1000;
            const now = Date.now();
            const timeUntilExpiry = Math.round((expiration - now) / 1000);
            
            if (timeUntilExpiry <= 0) {
                countdownTextEl.textContent = "Token expired - refreshing...";
                countdownEl.className = "countdown-timer countdown-critical";
                return;
            }
            
            const minutes = Math.floor(timeUntilExpiry / 60);
            const seconds = timeUntilExpiry % 60;
            
            countdownTextEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} until refresh`;
            
            // Change color based on time remaining
            if (timeUntilExpiry <= 30) {
                countdownEl.className = "countdown-timer countdown-critical";
            } else if (timeUntilExpiry <= 120) {
                countdownEl.className = "countdown-timer countdown-warning";
            } else {
                countdownEl.className = "countdown-timer";
            }
            
        } catch (error) {
            console.error('[UI] Error parsing token for countdown:', error);
            countdownTextEl.textContent = "Invalid token";
            countdownEl.className = "countdown-timer countdown-critical";
        }
    }
    
    // Update immediately
    updateCountdown();
    
    // Update every second
    const countdownInterval = setInterval(updateCountdown, 1000);
    
    // Clear interval when page unloads
    window.addEventListener('beforeunload', () => {
        clearInterval(countdownInterval);
    });
    
    // Store interval reference globally so it can be cleared and restarted
    window.tokenCountdownInterval = countdownInterval;
    
    console.log('[UI] Token countdown timer started');
}

function restartTokenCountdown() {
    console.log('[UI] Restarting token countdown timer...');
    
    // Clear existing interval if it exists
    if (window.tokenCountdownInterval) {
        clearInterval(window.tokenCountdownInterval);
    }
    
    // Start new countdown timer
    startTokenCountdown();
}
