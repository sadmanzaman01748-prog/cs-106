// myBookings.js - lists the member's bookings, with Cancel on upcoming ones.
// Uses: getCurrentUser, getMyBookings, cancelBooking

const myBookingList = document.getElementById("myBookingList");
const myStatus = document.getElementById("myStatus");

function bookingCard(booking, isUpcoming) {
  const session = booking.sessions || {};
  const card = document.createElement("div");
  card.className = "session-card";

  const title = document.createElement("h3");
  title.textContent = niceDate(session.session_date);
  const time = document.createElement("p");
  time.className = "places";
  time.textContent = niceTime(session.start_time) + " - " + booking.guests + (booking.guests === 1 ? " guest" : " guests");
  card.append(title, time);

  if (isUpcoming) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn-small btn-danger";
    button.textContent = "Cancel booking";
    button.addEventListener("click", async function () {
      if (!window.confirm("Cancel this booking?")) return;
      button.disabled = true;
      try {
        await cancelBooking(booking.id);
        showStatus(myStatus, "Booking cancelled.", "success");
        await loadMyBookings();
      } catch (error) {
        showStatus(myStatus, error.message || "Could not cancel.", "error");
        button.disabled = false;
      }
    });
    card.appendChild(button);
  } else {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Past visit";
    card.appendChild(badge);
  }
  return card;
}

function section(titleText, bookings, isUpcoming) {
  const heading = document.createElement("h2");
  heading.className = "day-title";
  heading.textContent = titleText;
  const grid = document.createElement("div");
  grid.className = "session-grid";
  if (bookings.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = isUpcoming ? "No upcoming bookings." : "No past visits yet.";
    myBookingList.append(heading, empty);
    return;
  }
  bookings.forEach(function (b) { grid.appendChild(bookingCard(b, isUpcoming)); });
  myBookingList.append(heading, grid);
}

async function loadMyBookings() {
  try {
    const user = await getCurrentUser();
    if (!user) { window.location.replace("login.html"); return; }

    const bookings = await getMyBookings();
    const withTime = bookings.filter(function (b) { return b.sessions; }).map(function (b) {
      return { booking: b, when: new Date(b.sessions.session_date + "T" + b.sessions.start_time).getTime() };
    });

    const upcoming = withTime.filter(function (x) { return x.when > Date.now(); })
      .sort(function (a, b) { return a.when - b.when; }).map(function (x) { return x.booking; });
    const past = withTime.filter(function (x) { return x.when <= Date.now(); })
      .sort(function (a, b) { return b.when - a.when; }).map(function (x) { return x.booking; });

    myBookingList.replaceChildren();
    section("Upcoming", upcoming, true);
    section("Past", past, false);
  } catch (error) {
    myBookingList.replaceChildren();
    showStatus(myStatus, error.message || "Could not load your bookings.", "error");
  }
}

loadMyBookings();
