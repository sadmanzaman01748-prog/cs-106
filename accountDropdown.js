const accountBtn = document.getElementById("accountBtn");
const accountMenu = document.getElementById("accountMenu");
const logoutBtn = document.getElementById("logoutBtn");

// Open and close dropdown
accountBtn.addEventListener("click", function () {
    accountMenu.classList.toggle("hide");
});

// Close when clicking outside
document.addEventListener("click", function (event) {
    if (!accountBtn.contains(event.target) &&
        !accountMenu.contains(event.target)) {
        accountMenu.classList.add("hide");
    }
});

// Logout
logoutBtn.addEventListener("click", async function (event) {
    event.preventDefault();

    try {
        await logOut();
        window.location.replace("login.html");
    } catch (error) {
        alert("Logout failed: " + error.message);
    }
});