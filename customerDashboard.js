
// CUSTOMER DASHBOARD

// Get HTML elements
const welcomeName = document.getElementById("welcomeName");
const profileName = document.getElementById("profileName");
const profileInitials = document.getElementById("profileInitials");
const fullName = document.getElementById("fullName");
const emailAddress = document.getElementById("emailAddress");
const phoneNumber = document.getElementById("phoneNumber");

const profileError = document.getElementById("profileError");
const bookingError = document.getElementById("bookingError");
const bookingContainer = document.getElementById("bookingContainer");


// SHOW ERROR MESSAGE

function showError(element, error) {
    element.textContent = error.message || "Something went wrong.";
}


// FORMAT DATE

function formatDate(dateString) {
    if (!dateString) return "Date unavailable";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-NZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


// FORMAT TIME

function formatTime(timeString) {
    if (!timeString) return "Time unavailable";

    const [hours, minutes] = timeString.split(":").map(Number);

    const period = hours >= 12 ? "PM" : "AM";
    const hour = hours % 12 || 12;

    return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
}


// LOAD CUSTOMER PROFILE

async function loadProfile(user) {
    try {
        profileError.textContent = "";

        // Get profile from Supabase
        const profile = await getMyProfile();

        // Get customer information
        const name =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            "Member";

        const email = user.email || "Not available";

        const phone =
            profile?.phone ||
            user.user_metadata?.phone ||
            "Not provided";

        // Display first name in welcome banner
        const firstName = name.trim().split(/\s+/)[0];

        welcomeName.textContent = firstName;

        // Display profile information
        profileName.textContent = name;
        fullName.textContent = name;
        emailAddress.textContent = email;
        phoneNumber.textContent = phone;

        // Generate initials
        const initials = name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0].toUpperCase())
            .join("");

        profileInitials.textContent = initials;

    } catch (error) {
        showError(profileError, error);
    }
}


// DISPLAY UPCOMING BOOKING

function displayBooking(booking) {
    bookingContainer.replaceChildren();

    const session = booking.sessions || {};

    // Booking card
    const bookingItem = document.createElement("div");
    bookingItem.className = "booking-item";

    // Cat image
    const image = document.createElement("img");
    image.src = "cat1.png";
    image.alt = "Cat Café";
    image.className = "booking-image";

    // Booking information
    const bookingInfo = document.createElement("div");
    bookingInfo.className = "booking-info";

    const heading = document.createElement("h3");
    heading.textContent = "Cat Café Visit";

    const status = document.createElement("span");
    status.className = "booking-status";
    status.textContent = "Confirmed";

    heading.appendChild(status);

    const date = document.createElement("p");
    date.textContent = formatDate(session.session_date);

    const time = document.createElement("p");
    time.textContent = formatTime(session.start_time);

    const guests = document.createElement("p");
    guests.textContent = `${booking.guests ?? 1} Guests`;

    bookingInfo.append(heading, date, time, guests);

    bookingItem.append(image, bookingInfo);

    // Booking action buttons
    const actions = document.createElement("div");
    actions.className = "booking-actions";

    const viewBtn = document.createElement("a");
    viewBtn.href = "myBookings.html";
    viewBtn.className = "view-btn";
    viewBtn.textContent = "View Details";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "cancel-booking-btn";
    cancelBtn.textContent = "Cancel Booking";

    // Cancel booking
    cancelBtn.addEventListener("click", async () => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this booking?"
        );

        if (!confirmed) return;

        cancelBtn.disabled = true;
        cancelBtn.textContent = "Cancelling...";

        try {
            bookingError.textContent = "";

            await cancelBooking(booking.id);

            // Refresh bookings after cancellation
            await loadBookings();

        } catch (error) {
            showError(bookingError, error);

            cancelBtn.disabled = false;
            cancelBtn.textContent = "Cancel Booking";
        }
    });

    actions.append(viewBtn, cancelBtn);

    bookingContainer.append(bookingItem, actions);
}


// LOAD CUSTOMER BOOKINGS

async function loadBookings() {
    try {
        bookingError.textContent = "";

        // Get bookings from Supabase
        const bookings = await getMyBookings();

        const now = new Date();

        // Only upcoming bookings
        const upcoming = bookings
            .filter(booking => {
                const session = booking.sessions;

                if (!session?.session_date || !session?.start_time) {
                    return false;
                }

                const dateTime = new Date(
                    `${session.session_date}T${session.start_time}`
                );

                return !Number.isNaN(dateTime.getTime()) &&
                       dateTime >= now;
            })
            .sort((a, b) => {
                const dateA = new Date(
                    `${a.sessions.session_date}T${a.sessions.start_time}`
                );

                const dateB = new Date(
                    `${b.sessions.session_date}T${b.sessions.start_time}`
                );

                return dateA - dateB;
            });

        // No upcoming bookings
        if (upcoming.length === 0) {
            bookingContainer.replaceChildren();

            const message = document.createElement("p");
            message.className = "empty-booking";
            message.textContent =
                "You don't have any upcoming bookings yet.";

            bookingContainer.appendChild(message);
            return;
        }

        // Display nearest upcoming booking
        displayBooking(upcoming[0]);

    } catch (error) {
        bookingContainer.replaceChildren();
        showError(bookingError, error);
    }
}


// CHECK LOGIN AND LOAD DASHBOARD

async function loadDashboard() {
    try {
        // Get currently logged-in user
        const user = await getCurrentUser();

        // Redirect if not logged in
        if (!user) {
            window.location.replace("login.html");
            return;
        }

        // Load customer details and bookings
        await Promise.all([
            loadProfile(user),
            loadBookings()
        ]);

    } catch (error) {
        showError(profileError, error);
    }
}


// START DASHBOARD

loadDashboard();

