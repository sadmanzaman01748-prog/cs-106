// admin.js - admin page: manage sessions and see all bookings.
// Uses: getCurrentUser, isAdmin, getSessions, addSession, updateSession,
//       deleteSession (supabase-write.js), cancelBooking (supabase.js)
// The database only lets real admins do these things, so even if someone
// opens this page by mistake, nothing happens for them.

const adminStatus = document.getElementById("adminStatus");
const adminContent = document.getElementById("adminContent");
const sessionsTable = document.getElementById("sessionsTable");
const bookingsTable = document.getElementById("bookingsTable");

function cell(row, text) {
  const td = document.createElement("td");
  td.textContent = text;
  row.appendChild(td);
  return td;
}

function makeTable(headings) {
  const table = document.createElement("table");
  table.className = "data";
  const head = document.createElement("tr");
  headings.forEach(function (h) {
    const th = document.createElement("th");
    th.textContent = h;
    head.appendChild(th);
  });
  const thead = document.createElement("thead");
  thead.appendChild(head);
  const tbody = document.createElement("tbody");
  table.append(thead, tbody);
  return { table: table, body: tbody };
}

function emptyMessage(text) {
  const p = document.createElement("p");
  p.className = "empty";
  p.textContent = text;
  return p;
}

// ---------- sessions ----------

function sessionRow(session) {
  const row = document.createElement("tr");
  const booked = session.capacity - session.spotsLeft;

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "table-input";
  dateInput.value = session.session_date;

  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.className = "table-input";
  timeInput.value = session.start_time.slice(0, 5);

  const capacityInput = document.createElement("input");
  capacityInput.type = "number";
  capacityInput.className = "table-input";
  capacityInput.min = Math.max(1, booked);
  capacityInput.max = 50;
  capacityInput.style.width = "70px";
  capacityInput.value = session.capacity;

  [dateInput, timeInput, capacityInput].forEach(function (input) {
    const td = document.createElement("td");
    td.appendChild(input);
    row.appendChild(td);
  });
  cell(row, String(booked));

  const actions = document.createElement("td");
  actions.className = "actions";

  const save = document.createElement("button");
  save.type = "button";
  save.className = "btn-small";
  save.textContent = "Save";
  save.addEventListener("click", async function () {
    save.disabled = true;
    try {
      await updateSession(session.id, dateInput.value, timeInput.value, Number(capacityInput.value));
      showStatus(adminStatus, "Session updated.", "success");
      await loadAll();
    } catch (error) {
      showStatus(adminStatus, error.message || "Could not update.", "error");
      save.disabled = false;
    }
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn-small btn-danger";
  remove.textContent = "Delete";
  remove.addEventListener("click", async function () {
    if (!window.confirm("Delete this session?")) return;
    remove.disabled = true;
    try {
      await deleteSession(session.id);
      showStatus(adminStatus, "Session deleted.", "success");
      await loadAll();
    } catch (error) {
      // a session that has bookings can't be deleted - the database says so
      showStatus(adminStatus, error.message || "Could not delete.", "error");
      remove.disabled = false;
    }
  });

  actions.append(save, remove);
  row.appendChild(actions);
  return row;
}

function renderSessions(sessions) {
  sessionsTable.replaceChildren();
  if (sessions.length === 0) {
    sessionsTable.appendChild(emptyMessage("No sessions yet. Add one above."));
    return;
  }
  const t = makeTable(["Date", "Start time", "Capacity", "Booked", "Actions"]);
  sessions.forEach(function (s) { t.body.appendChild(sessionRow(s)); });
  sessionsTable.appendChild(t.table);
}

// ---------- bookings ----------

async function loadBookingRows() {
  const bookingsResult = await supabaseClient
    .from("bookings")
    .select("id, user_id, session_id, guests, created_at");
  if (bookingsResult.error) throw bookingsResult.error;

  const profilesResult = await supabaseClient
    .from("profiles")
    .select("id, full_name, phone");
  if (profilesResult.error) throw profilesResult.error;

  const sessionsResult = await supabaseClient
    .from("sessions")
    .select("id, session_date, start_time");
  if (sessionsResult.error) throw sessionsResult.error;

  const people = {};
  profilesResult.data.forEach(function (p) { people[p.id] = p; });
  const sessionsById = {};
  sessionsResult.data.forEach(function (s) { sessionsById[s.id] = s; });

  return bookingsResult.data.map(function (b) {
    return { booking: b, person: people[b.user_id] || {}, session: sessionsById[b.session_id] || {} };
  }).sort(function (a, b) {
    return (a.session.session_date + a.session.start_time) < (b.session.session_date + b.session.start_time) ? -1 : 1;
  });
}

function renderBookings(rows) {
  bookingsTable.replaceChildren();
  if (rows.length === 0) {
    bookingsTable.appendChild(emptyMessage("No bookings yet."));
    return;
  }
  const t = makeTable(["Date", "Time", "Name", "Phone", "Guests", "Actions"]);
  rows.forEach(function (r) {
    const tr = document.createElement("tr");
    cell(tr, niceDate(r.session.session_date));
    cell(tr, niceTime(r.session.start_time));
    cell(tr, r.person.full_name || "(no name)");
    cell(tr, r.person.phone || "-");
    cell(tr, String(r.booking.guests));

    const td = document.createElement("td");
    td.className = "actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn-small btn-danger";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", async function () {
      if (!window.confirm("Cancel this booking?")) return;
      cancel.disabled = true;
      try {
        await cancelBooking(r.booking.id);
        showStatus(adminStatus, "Booking cancelled.", "success");
        await loadAll();
      } catch (error) {
        showStatus(adminStatus, error.message || "Could not cancel.", "error");
        cancel.disabled = false;
      }
    });
    td.appendChild(cancel);
    tr.appendChild(td);
    t.body.appendChild(tr);
  });
  bookingsTable.appendChild(t.table);
}

// ---------- page start ----------

async function loadAll() {
  try {
    const sessions = await getSessions();
    renderSessions(sessions);
    renderBookings(await loadBookingRows());
  } catch (error) {
    showStatus(adminStatus, error.message || "Could not load data.", "error");
  }
}

document.getElementById("addSessionForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const button = event.target.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    await addSession(
      document.getElementById("newDate").value,
      document.getElementById("newTime").value,
      Number(document.getElementById("newCapacity").value)
    );
    showStatus(adminStatus, "Session added.", "success");
    event.target.reset();
    document.getElementById("newCapacity").value = 8;
    await loadAll();
  } catch (error) {
    showStatus(adminStatus, error.message || "Could not add the session.", "error");
  } finally {
    button.disabled = false;
  }
});

(async function start() {
  try {
    const user = await getCurrentUser();
    if (!user) { window.location.replace("login.html"); return; }
    if (!(await isAdmin())) {
      showStatus(adminStatus, "This page is for café staff only.", "error");
      return;
    }
    adminContent.hidden = false;
    await loadAll();
  } catch (error) {
    showStatus(adminStatus, error.message || "Something went wrong.", "error");
  }
})();
