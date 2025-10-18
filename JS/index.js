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
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 18px;">ðŸ”„</div>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Token Refreshed</div>
                <div style="font-size: 12px; opacity: 0.9;">
                    New token ending in: <code style="background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 3px;">${last5Chars}</code>
                </div>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
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
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);

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

    try {
        console.log('[REFRESH] Endpoint: http://localhost:7291/api/Account/refresh');
        console.log('[REFRESH] Current cookies:', document.cookie);

        const response = await fetch('http://localhost:7291/api/Account/refresh', {
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
            console.error('[REFRESH] Failed with status:', response.status);
            console.error('[REFRESH] Error response:', errorText);
            throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();
        console.log('[REFRESH] Response text:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[REFRESH] Failed to parse JSON:', parseError);
            console.error('[REFRESH] Raw response:', responseText);
            throw new Error('Invalid JSON response from refresh endpoint');
        }

        console.log('[REFRESH] Response data:', data);

        const newToken = data.token || data.accessToken || data.access_token;
        if (!newToken) {
            console.error('[REFRESH] No token found in response:', data);
            throw new Error('No token in refresh response');
        }

        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('token', newToken);

        showTokenRefreshNotification(newToken);

        console.log('[REFRESH] âœ… Success! Token updated, ending in:', newToken.slice(-5));
        return newToken;
    } catch (error) {
        console.error('[REFRESH] âŒ Error:', error.message);
        console.error('[REFRESH] Error details:', {
            message: error.message,
            stack: error.stack
        });
        handleTokenExpiration();
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
        console.log('âœ… Refresh token cookie found');
    }

    console.log('=== END CHECK ===');
}

async function testRefreshEndpoint() {
    console.log('=== TESTING REFRESH ENDPOINT ===');

    console.log('Document cookies:', document.cookie);

    try {
        const response = await fetch('http://localhost:7291/api/Account/refresh', {
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
// EXPOSE DEBUG FUNCTIONS
// ============================================

window.debugToken = debugToken;
window.debugCookies = debugCookies;
window.checkRefreshTokenCookie = checkRefreshTokenCookie;
window.testRefreshEndpoint = testRefreshEndpoint;
window.testTokenExpiration = testTokenExpiration;
window.testRefreshNotification = testRefreshNotification;

// ============================================
// MAIN APPLICATION LOGIC
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
    console.log('[APP] Page loaded - initializing...');

    const displayName = localStorage.getItem("displayName");
    const email = localStorage.getItem("userEmail");

    if (!displayName || !email) {
        console.log("[APP] Missing user data - redirecting to login");
        window.location.href = "/Auth/Login/Login.html";
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
// LOGOUT FUNCTION
// ============================================

async function logout() {
    console.log('[LOGOUT] Starting logout...');

    try {
        const token = getAccessToken();

        const headers = {
            "Content-Type": "application/json"
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("http://localhost:7291/api/Account/logout", {
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

        window.location.href = "/Auth/Login/Login.html";

    } catch (error) {
        console.error("[LOGOUT] Error:", error);
        localStorage.clear();
        window.location.href = "/Auth/Login/Login.html";
    }
}