document.addEventListener("DOMContentLoaded", () => {
    const displayName = localStorage.getItem("displayName");
    const email = localStorage.getItem("userEmail");

    const welcomeEl = document.getElementById("welcome");
    const emailEl = document.getElementById("userEmail");

    if (displayName && email) {
        welcomeEl.textContent = `Welcome, ${displayName}!`;
        emailEl.textContent = email;
    } else {
        // If user not logged in, redirect to login
        window.location.href = "/Auth/Login/Login.html";
    }
});

function logout() {
    localStorage.clear();
    window.location.href = "/Auth/Login/Login.html";
}
