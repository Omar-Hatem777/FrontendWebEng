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

async function login(event) {
    event.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    const loginError = document.getElementById('loginError');
    loginError.style.display = 'none';
    loginError.textContent = '';

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

            // Delay redirect to see logs
            setTimeout(() => {
                window.location.href = "/index.html";
            }, 500);
        }
        else {
            loginError.textContent = "User not found.";
            loginError.style.display = 'block';
        }

    } catch (error) {
        console.error("[LOGIN] Error connecting to API:", error);
        loginError.textContent = "Error connecting to server.";
        loginError.style.display = 'block';
    }
}
