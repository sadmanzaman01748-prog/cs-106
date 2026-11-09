
// PROFILE PAGE

// Get HTML elements
const profileForm = document.getElementById("profileForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");

const displayName = document.getElementById("displayName");
const profileAvatar = document.getElementById("profileAvatar");
const profileMessage = document.getElementById("profileMessage");

const editBtn = document.getElementById("editBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");
const profileButtons = document.getElementById("profileButtons");

const accountBtn = document.getElementById("accountBtn");
const accountMenu = document.getElementById("accountMenu");
const logoutBtn = document.getElementById("logoutBtn");

let originalProfile = null;


// SHOW MESSAGE

function showMessage(message, type = "error") {
    profileMessage.textContent = message;
    profileMessage.className = `profile-message ${type}`;
}


// ENABLE OR DISABLE EDITING

function setEditing(editing) {
    fullNameInput.disabled = !editing;
    phoneInput.disabled = !editing;

    profileButtons.hidden = !editing;
    editBtn.hidden = editing;
}


// DISPLAY PROFILE

function displayProfile(profile) {
    originalProfile = {
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || ""
    };

    fullNameInput.value = originalProfile.full_name;
    emailInput.value = originalProfile.email;
    phoneInput.value = originalProfile.phone;

    displayName.textContent =
        originalProfile.full_name || "Member";

    const initials = originalProfile.full_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() || "")
        .join("");

    profileAvatar.textContent = initials || "?";
}


// LOAD PROFILE FROM SUPABASE

async function loadProfile() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            window.location.replace("login.html");
            return;
        }

        const profile = await getMyProfile();

        displayProfile({
            full_name:
                profile?.full_name ||
                user.user_metadata?.full_name ||
                "",
            email: user.email || "",
            phone:
                profile?.phone ||
                user.user_metadata?.phone ||
                ""
        });

        editBtn.disabled = false;

    } catch (error) {
        showMessage(error.message);
    }
}


// EDIT PROFILE

editBtn.addEventListener("click", () => {
    showMessage("", "success");
    setEditing(true);
    fullNameInput.focus();
});


// CANCEL EDITING

cancelBtn.addEventListener("click", () => {
    if (originalProfile) {
        displayProfile(originalProfile);
    }

    setEditing(false);
    showMessage("", "success");
});


// SAVE PROFILE CHANGES

profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!fullName) {
        showMessage("Please enter your full name.");
        return;
    }

    saveBtn.disabled = true;
    showMessage("", "success");

    try {
        // Backend expects two arguments
        await updateMyProfile(fullName, phone);

        // Reload updated profile
        const updatedProfile = await getMyProfile();
        const user = await getCurrentUser();

        displayProfile({
            full_name: updatedProfile?.full_name || fullName,
            email: user?.email || "",
            phone: updatedProfile?.phone ?? phone
        });

        setEditing(false);

        showMessage(
            "Profile updated successfully!",
            "success"
        );

    } catch (error) {
        showMessage(error.message);
    } finally {
        saveBtn.disabled = false;
    }
});



// START PROFILE PAGE

loadProfile();