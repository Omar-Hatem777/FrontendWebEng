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


async function signup(event) {
    event.preventDefault();

    const email = SignupEmail.value.trim();
    const password = SignupPassword.value.trim();
    const userName = SignupUserName.value.trim();
    const phoneNumber = SignupPhoneNumber.value.trim();

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
    if (hasError) return;

    const body = {
        displayName: userName,
        userName: userName,
        email: email,
        phoneNumber: phoneNumber,
        password: password
    };

    try {
        const response = await fetch("https://localhost:7291/api/Account/register", {
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
            localStorage.setItem("phoneNumber", data.phoneNumber);
            localStorage.setItem("displayName", data.displayName);

            SignupEmail.value = "";
            SignupPassword.value = "";
            SignupUserName.value = "";
            SignupPhoneNumber.value = "";
            window.location.href = "/index.html";
        } else {
            passwordError.style.display = 'block';
            passwordError.textContent = data.message || "Signup failed. Please check your information.";
        }

    } catch (error) {
        console.error("Error connecting to API:", error);
    }
}
