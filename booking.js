// booking.js - the "Book a Visit" page.
// Uses: getCurrentUser, getSessions, getMyBookings, createBooking (supabase.js)

const sessionList = document.getElementById("sessionList");
const bookingStatus = document.getElementById("bookingStatus");

let currentUser = null;
let bookedKeys = new Set(); // "date|time" of sessions this member already booked

function sessionKey(session) {
  return session.session_date + "|" + session.start_time;
}

function makeCard(session) {
  const card = document.createElement("div");
  card.className = "session-card";

  const title = document.createElement("h3");
  title.textContent = niceTime(session.start_time);
  card.appendChild(title);

  const spots = Number(session.spotsLeft);
  const places = document.createElement("p");
  places.className = "places" + (spots > 0 && spots <= 3 ? " low" : "");
  places.textContent = spots <= 0 ? "Fully booked" : spots + (spots === 1 ? " place left" : " places left");
  card.appendChild(places);

  if (bookedKeys.has(sessionKey(session))) {
    const badge = document.createElement("span");
    badge.className = "badge booked";
    badge.textContent = "You're booked";
    card.appendChild(badge);
    return card;
  }

  if (spots <= 0) return card;

  if (!currentUser) {
    const link = document.createElement("a");
    link.href = "login.html";
    link.className = "btn-main";
    link.textContent = "Log in to book";
    card.appendChild(link);
    return card;
  }

  const row = document.createElement("div");
  row.className = "booking-row";

  const select = document.createElement("select");
  select.setAttribute("aria-label", "Number of guests");
  const maxGuests = Math.min(6, spots);
  for (let i = 1; i <= maxGuests; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i + (i === 1 ? " guest" : " guests");
    select.appendChild(option);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn-main";
  button.textContent = "Book";
  button.addEventListener("click", async function () {
    button.disabled = true;
    button.textContent = "Booking...";
    showStatus(bookingStatus, "");
    try {
      await createBooking(session.id, Number(select.value));
      showStatus(bookingStatus, "Booked! See you on " + niceDate(session.session_date) + " at " + niceTime(session.start_time) + ".", "success");
      await loadSessions();
    } catch (error) {
      showStatus(bookingStatus, error.message || "Could not book this session.", "error");
      button.disabled = false;
      button.textContent = "Book";
      await loadSessions(true); // refresh places left, keep the message
    }
  });

  row.append(select, button);
  card.appendChild(row);
  return card;
}

function render(sessions) {
  sessionList.replaceChildren();
  if (sessions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No upcoming sessions right now. Please check back soon!";
    sessionList.appendChild(empty);
    return;
  }

  let currentDate = null;
  let grid = null;
  sessions.forEach(function (session) {
    if (session.session_date !== currentDate) {
      currentDate = session.session_date;
      const heading = document.createElement("h2");
      heading.className = "day-title";
      heading.textContent = niceDate(currentDate);
      grid = document.createElement("div");
      grid.className = "session-grid";
      sessionList.append(heading, grid);
    }
    grid.appendChild(makeCard(session));
  });
}

async function loadSessions(keepMessage) {
  try {
    if (!keepMessage) { /* message already set by caller */ }
    currentUser = await getCurrentUser();

    bookedKeys = new Set();
    if (currentUser) {
      const mine = await getMyBookings();
      mine.forEach(function (b) {
        if (b.sessions) bookedKeys.add(b.sessions.session_date + "|" + b.sessions.start_time);
      });
    }

    const all = await getSessions();
    render(all.filter(isUpcomingSession));
  } catch (error) {
    sessionList.replaceChildren();
    showStatus(bookingStatus, error.message || "Could not load sessions.", "error");
  }
}

loadSessions();
