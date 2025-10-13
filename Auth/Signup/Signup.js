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

    const body = {
        displayName: userName,
        userName: userName,
        email: email,
        phoneNumber : phoneNumber,
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
            // ✅ Successful login
            console.log("✅ Login successful for:", data.displayName);
            alert(`Welcome, ${data.displayName}!`);

            // Save token and user info locally

            // localStorage.setItem("token", data.token);
            localStorage.setItem("userEmail", data.email);
            localStorage.setItem("userName", data.userName);
            localStorage.setItem("phoneNumber", data.phoneNumber);
            localStorage.setItem("displayName", data.displayName);

            SignupEmail.value = "";
            SignupPassword.value = "";
            SignupUserName.value = "";
            SignupPhoneNumber.value = "";

            // Redirect to dashboard or home
            window.location.href = "/index.html";
        } else {
            // ❌ Backend didn’t return a token (login failed)
            alert("Invalid Data.");
        }

    } catch (error) {
        console.error("Error connecting to API:", error);
        alert("Server error. Please try again later.");
    }
}
