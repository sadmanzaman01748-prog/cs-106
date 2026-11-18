// booking.js - the "Book a Visit" page.
// Uses: getCurrentUser, getSessions, getMyBookings, createBooking, getCats, getTakenCats
// Optional: booking.html?cat=12 pre-selects that cat (the "Meet ..." links on the cats page do this).

const sessionList = document.getElementById("sessionList");
const bookingStatus = document.getElementById("bookingStatus");
const catBanner = document.getElementById("catBanner");

const wantedCatId = new URLSearchParams(window.location.search).get("cat");

let currentUser = null;
let myBookingsByKey = new Map(); // "date|time" -> booking (sessions this member already booked)
let allCats = [];
let takenBySession = new Map();  // session id -> Set of cat ids already chosen

function sessionKey(session) {
  return session.session_date + "|" + session.start_time;
}

function findCat(catId) {
  return allCats.find(function (c) { return String(c.id) === String(catId); }) || null;
}

// Banner at the top when the visitor came from a cat's "Meet" link
function showCatBanner() {
  const cat = findCat(wantedCatId);
  if (!cat) { catBanner.hidden = true; return; }

  catBanner.replaceChildren();
  const img = document.createElement("img");
  img.src = cat.photo_url || "default-cat.png";
  img.alt = cat.name;
  img.onerror = function () { img.onerror = null; img.src = "default-cat.png"; };

  const text = document.createElement("p");
  text.append("Choosing a session to meet ");
  const strong = document.createElement("strong");
  strong.textContent = cat.name;
  text.append(strong, ". Sessions where " + cat.name + " is already taken are marked.");

  const clear = document.createElement("a");
  clear.href = "booking.html";
  clear.textContent = "Show all";

  catBanner.append(img, text, clear);
  catBanner.hidden = false;
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

  const mine = myBookingsByKey.get(sessionKey(session));
  if (mine) {
    const badge = document.createElement("span");
    badge.className = "badge booked";
    badge.textContent = mine.cats ? "You're booked with " + mine.cats.name : "You're booked";
    card.appendChild(badge);
    return card;
  }

  if (spots <= 0) return card;

  const taken = takenBySession.get(session.id) || new Set();
  const wantedCat = findCat(wantedCatId);
  const wantedIsTaken = wantedCat && taken.has(Number(wantedCat.id));

  if (wantedIsTaken) {
    const note = document.createElement("p");
    note.className = "cat-note";
    note.textContent = wantedCat.name + " is already taken for this session.";
    card.appendChild(note);
  }

  if (!currentUser) {
    const link = document.createElement("a");
    link.href = "login.html";
    link.className = "btn-main";
    link.textContent = "Log in to book";
    card.appendChild(link);
    return card;
  }

  // Which cat would you like to meet? (only cats still free in this session)
  const catSelect = document.createElement("select");
  catSelect.className = "cat-select";
  catSelect.setAttribute("aria-label", "Cat you'd like to meet");
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "Any cat (no preference)";
  catSelect.appendChild(none);
  allCats.forEach(function (cat) {
    if (taken.has(Number(cat.id))) return;
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name + " (" + cat.breed + ")";
    catSelect.appendChild(option);
  });
  if (wantedCat && !wantedIsTaken) catSelect.value = String(wantedCat.id);
  card.appendChild(catSelect);

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
    const chosenCat = catSelect.value ? findCat(catSelect.value) : null;
    try {
      await createBooking(session.id, Number(select.value), chosenCat ? Number(chosenCat.id) : null);
      showStatus(bookingStatus,
        "Booked! See you on " + niceDate(session.session_date) + " at " + niceTime(session.start_time) +
        (chosenCat ? " with " + chosenCat.name + "." : "."), "success");
      await loadSessions();
    } catch (error) {
      showStatus(bookingStatus, error.message || "Could not book this session.", "error");
      button.disabled = false;
      button.textContent = "Book";
      await loadSessions(); // refresh places left and taken cats
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

async function loadSessions() {
  try {
    currentUser = await getCurrentUser();

    myBookingsByKey = new Map();
    if (currentUser) {
      const mine = await getMyBookings();
      mine.forEach(function (b) {
        if (b.sessions) myBookingsByKey.set(b.sessions.session_date + "|" + b.sessions.start_time, b);
      });
    }

    const results = await Promise.all([getSessions(), getCats(), getTakenCats()]);
    allCats = results[1];
    takenBySession = new Map();
    results[2].forEach(function (row) {
      if (!takenBySession.has(row.session_id)) takenBySession.set(row.session_id, new Set());
      takenBySession.get(row.session_id).add(Number(row.cat_id));
    });

    showCatBanner();
    render(results[0].filter(isUpcomingSession));
  } catch (error) {
    sessionList.replaceChildren();
    showStatus(bookingStatus, error.message || "Could not load sessions.", "error");
  }
}

loadSessions();
