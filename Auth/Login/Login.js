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
        const response = await fetch("https://localhost:7291/api/Account/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("Full API response:", data);

        if (response.ok && data.token) {
            loginEmail.value = "";

            loginPassword.value = "";

            console.log("Login successful for:", data.displayName);

            localStorage.setItem("userEmail", data.email);

            localStorage.setItem("displayName", data.displayName);

            // Store the token for authentication
            localStorage.setItem("token", data.token);
            localStorage.setItem("accessToken", data.token);

            window.location.href = "/index.html";
        }
        else
        {
            loginError.textContent = "User not found.";
            
            loginError.style.display = 'block';
        }

    } catch (error) {
        console.error("Error connecting to API:", error);
    }
}
