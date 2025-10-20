window.addEventListener('DOMContentLoaded', function () {
    document.getElementById('username').value = '';
    document.getElementById('phone').value = '';
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

let SignupEmail = document.getElementById('email');
let SignupPassword = document.getElementById('password');
let SignupUserName = document.getElementById('username');
let SignupPhoneNumber = document.getElementById('phone');


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

async function signup(event) {
    event.preventDefault();

    const email = SignupEmail.value.trim();
    const password = SignupPassword.value.trim();
    const userName = SignupUserName.value.trim();
    const phoneNumber = SignupPhoneNumber.value.trim();
    
    const signupButton = document.querySelector('button[type="submit"]');
    const userNameError = document.getElementById('UserNameError');
    const emailError = document.getElementById('EmailError');
    const passwordError = document.getElementById('PasswordError');
    const phoneError = document.getElementById('PhoneError');

    [userNameError, emailError, passwordError, phoneError].forEach(err => {
        err.style.display = 'none';
        err.textContent = '';
    });

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    const phoneRegex = /^\d+$/;

    let hasError = false;

    if (!userName) {
        userNameError.style.display = 'block';
        userNameError.textContent = 'Username is required.';
        hasError = true;
    }

    if (!emailRegex.test(email)) {
        emailError.style.display = 'block';
        emailError.textContent = 'Email format must be : user@example.com';
        hasError = true;
    }

    if (!passwordRegex.test(password)) {
        passwordError.style.display = 'block';
        passwordError.textContent = 'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character.';
        hasError = true;
    }

    if (!phoneRegex.test(phoneNumber)) {
        phoneError.style.display = 'block';
        phoneError.textContent = 'Phone number must contain only digits.';
        hasError = true;
    }
    
    // If there are validation errors, don't proceed with signup
    if (hasError) {
        return;
    }

    // Show loading state on button only after validation passes
    const originalButtonText = signupButton.innerHTML;
    signupButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Creating account...';
    signupButton.disabled = true;

    const body = {
        displayName: userName,
        userName: userName,
        email: email,
        phoneNumber: phoneNumber,
        password: password
    };

    try {
        const response = await fetch("http://127.0.0.1:5121/api/Account/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("Full API response:", data);

        if (response.ok && data.token) {
            console.log("Login successful for:", data.displayName);

            localStorage.setItem("userEmail", data.email);
            localStorage.setItem("userName", data.userName);
            localStorage.setItem("roles", JSON.stringify(data.roles));
            localStorage.setItem("displayName", data.displayName);
            localStorage.setItem("token", data.token);
            localStorage.setItem("accessToken", data.token);

            SignupEmail.value = "";
            SignupPassword.value = "";
            SignupUserName.value = "";
            SignupPhoneNumber.value = "";
            
            // Check user roles and redirect accordingly
            const roles = data.roles || [];
            console.log("[SIGNUP] User roles:", roles);
            
            // Show loading state
            showLoadingState("Account created! Redirecting...");
            
            if (roles.includes('Admin') || roles.includes('admin')) {
                console.log("[SIGNUP] Admin user - redirecting to admin dashboard");
                setTimeout(() => window.location.href = "/admin.html", 1000);
            } else {
                console.log("[SIGNUP] Regular user - redirecting to user page");
                setTimeout(() => window.location.href = "/index.html", 1000);
            }
        } else {
            // Reset button state
            signupButton.innerHTML = originalButtonText;
            signupButton.disabled = false;
            
            passwordError.style.display = 'block';
            passwordError.textContent = data.message || "Signup failed. Please check your information.";
        }

    } catch (error) {
        console.error("Error connecting to API:", error);
        
        // Reset button state
        signupButton.innerHTML = originalButtonText;
        signupButton.disabled = false;
    }
}
