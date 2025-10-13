let loginEmail = document.getElementById('email');
let loginPassword = document.getElementById('password');

async function login(event) {
    event.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

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
            // ✅ Successful login
            console.log("✅ Login successful for:", data.displayName);
            alert(`Welcome back, ${data.displayName}!`);

            // Save token and user info locally
            //localStorage.setItem("token", data.token);
            localStorage.setItem("userEmail", data.email);
            localStorage.setItem("displayName", data.displayName);

            loginEmail.value = "";
            loginPassword.value = "";
            // Redirect to dashboard or home
            window.location.href = "/index.html";
        } else {
            // ❌ Backend didn’t return a token (login failed)
            alert("Invalid email or password.");
        }

    } catch (error) {
        console.error("Error connecting to API:", error);
        alert("Server error. Please try again later.");
    }
}
