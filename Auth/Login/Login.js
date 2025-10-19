window.addEventListener('DOMContentLoaded', function () {
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}); // Clear input fields on page load


document.getElementById('togglePassword').addEventListener('click', function () { 
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    const isPasswordVisible = passwordInput.type === 'password';
    passwordInput.type = isPasswordVisible ? 'text' : 'password';
    eyeIcon.className = isPasswordVisible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';

}); // Toggle password visibility


let loginEmail = document.getElementById('email');
let loginPassword = document.getElementById('password');

// Loading state function
function showLoadingState(message = "Loading...") {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
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
        <h4>${message}</h4>
        <p class="text-muted">Please wait...</p>
    `;
    
    document.body.appendChild(loadingOverlay);
}

function hideLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

async function login(event) {
    event.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    const loginError = document.getElementById('loginError');
    const loginButton = document.querySelector('button[type="submit"]');
    
    // Clear previous errors
    loginError.style.display = 'none';
    loginError.textContent = '';
    
    // Show loading state on button
    const originalButtonText = loginButton.innerHTML;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Signing in...';
    loginButton.disabled = true;

    const body = {
        email: email,
        password: password
    };

    try {
        console.log("[LOGIN] Sending request to backend...");
        
        const response = await fetch("http://127.0.0.1:5121/api/Account/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",  // At top level
            body: JSON.stringify(body)
        });

        // ⭐ CHECK RESPONSE HEADERS
        console.log("[LOGIN] Response status:", response.status);
        console.log("[LOGIN] Response headers:");
        for (let [key, value] of response.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }

        const data = await response.json();
        console.log("[LOGIN] Full API response:", data);

        if (response.ok && data.token) {
            loginEmail.value = "";
            loginPassword.value = "";

            console.log("[LOGIN] ✅ Login successful for:", data.displayName);

            localStorage.setItem("userEmail", data.email);
            localStorage.setItem("userName", data.userName);
            localStorage.setItem("roles", JSON.stringify(data.roles));
            localStorage.setItem("displayName", data.displayName);
            localStorage.setItem("token", data.token);
            localStorage.setItem("accessToken", data.token);

            // ⭐ CRITICAL: Check cookies IMMEDIATELY after successful login
            console.log("=== COOKIE CHECK IMMEDIATELY AFTER LOGIN ===");
            console.log("All cookies:", document.cookie);
            
            // Wait a moment for cookie to be set
            setTimeout(() => {
                console.log("All cookies after 100ms delay:", document.cookie);
                const hasRefreshToken = document.cookie.includes('refreshToken');
                console.log("Has refreshToken cookie:", hasRefreshToken);
                
                if (!hasRefreshToken) {
                    console.error("❌ COOKIE NOT SET - Possible causes:");
                    console.error("1. CORS not allowing credentials");
                    console.error("2. SameSite attribute blocking cookie");
                    console.error("3. Domain mismatch");
                    console.error("4. Browser blocking third-party cookies");
                }
                console.log("=== END CHECK ===");
            }, 100);

            // Check user roles and redirect accordingly
            const roles = data.roles || [];
            console.log("[LOGIN] User roles:", roles);
            
            // Show loading state
            showLoadingState("Redirecting...");
            
            // Delay redirect to see logs
            setTimeout(() => {
                if (roles.includes('Admin') || roles.includes('admin')) {
                    console.log("[LOGIN] Admin user - redirecting to admin dashboard");
                    window.location.href = "/admin.html";
                } else {
                    console.log("[LOGIN] Regular user - redirecting to user page");
                    window.location.href = "/index.html";
                }
            }, 1000);
        }
        else {
            // Reset button state
            loginButton.innerHTML = originalButtonText;
            loginButton.disabled = false;
            
            loginError.textContent = "User not found.";
            loginError.style.display = 'block';
        }

    } catch (error) {
        console.error("[LOGIN] Error connecting to API:", error);
        
        // Reset button state
        loginButton.innerHTML = originalButtonText;
        loginButton.disabled = false;
        
        loginError.textContent = "Error connecting to server.";
        loginError.style.display = 'block';
    }
}
