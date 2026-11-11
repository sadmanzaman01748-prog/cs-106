// auth-nav.js - fills the account dropdown depending on who is logged in.
// Load AFTER supabase.js and supabase-write.js on any page with the navbar.
// Also gives small helpers used by the booking and admin pages.

function niceDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-NZ", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

function niceTime(timeString) {
  if (!timeString) return "";
  const parts = timeString.split(":");
  const date = new Date();
  date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
  return date.toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" });
}

// true if the session starts more than a minute from now
function isUpcomingSession(session) {
  return new Date(session.session_date + "T" + session.start_time).getTime() > Date.now() + 60 * 1000;
}

// Show a message in an element. type: "error" or "success"
function showStatus(element, text, type) {
  element.textContent = text || "";
  element.className = "status-message" + (text ? " " + (type || "error") : "");
}

(async function setupNav() {
  const oldButton = document.getElementById("accountBtn");
  const menu = document.getElementById("accountMenu");
  if (!oldButton || !menu) return;

  // Some pages also load main.js, which adds its own open/close click to this
  // button. Two clicks handlers would open and close the menu at once, so we
  // swap in a fresh copy of the button and make ours the only one that runs.
  const button = oldButton.cloneNode(true);
  oldButton.replaceWith(button);
  menu.classList.remove("hide");

  button.addEventListener("click", function (event) {
    event.stopImmediatePropagation();
    const open = menu.classList.toggle("show");
    button.setAttribute("aria-expanded", open);
  });
  document.addEventListener("click", function (event) {
    if (!button.contains(event.target) && !menu.contains(event.target)) {
      menu.classList.remove("show");
      button.setAttribute("aria-expanded", "false");
    }
  });

  function addLink(href, iconClass, text, onClick) {
    const a = document.createElement("a");
    a.href = href;
    const icon = document.createElement("i");
    icon.className = iconClass;
    a.append(icon, " " + text);
    if (onClick) a.addEventListener("click", onClick);
    menu.appendChild(a);
  }

  let user = null;
  try { user = await getCurrentUser(); } catch (e) { user = null; }

  menu.replaceChildren();
  if (!user) {
    addLink("login.html", "fa-solid fa-right-to-bracket", "Login");
    addLink("signUp.html", "fa-solid fa-user-plus", "Sign Up");
    return;
  }

  addLink("customerDashboard.html", "fa-solid fa-house-user", "Dashboard");
  addLink("profile.html", "fa-regular fa-user", "Profile");
  addLink("myBookings.html", "fa-regular fa-calendar-check", "My Bookings");

  try {
    if (typeof isAdmin === "function" && (await isAdmin())) {
      addLink("admin.html", "fa-solid fa-screwdriver-wrench", "Admin");
    }
  } catch (e) { /* not an admin, ignore */ }

  addLink("#", "fa-solid fa-right-from-bracket", "Logout", async function (event) {
    event.preventDefault();
    try {
      await logOut();
      window.location.replace("login.html");
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  });
})();