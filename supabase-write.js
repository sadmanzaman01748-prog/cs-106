// =====================================================
// supabase-write.js - write helpers for logged-in users
// Paste this at the bottom of supabase.js, or load it
// right AFTER supabase.js in your HTML:
//   <script src="supabase.js"></script>
//   <script src="supabase-write.js"></script>
// Like the others, these throw errors, so use try / catch.
// =====================================================


// ---------- CATS ----------

// Add a new cat (photoUrl can be empty)
async function addCat(name, breed, personality, photoUrl) {
  const { data, error } = await supabaseClient
    .from("cats")
    .insert({ name: name, breed: breed, personality: personality, photo_url: photoUrl })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Change a cat's details
async function updateCat(catId, name, breed, personality, photoUrl) {
  const { error } = await supabaseClient
    .from("cats")
    .update({ name: name, breed: breed, personality: personality, photo_url: photoUrl })
    .eq("id", catId);
  if (error) throw error;
}

// Remove a cat
async function deleteCat(catId) {
  const { error } = await supabaseClient
    .from("cats")
    .delete()
    .eq("id", catId);
  if (error) throw error;
}

// Upload a photo (a File from an <input type="file">) and get back its web address.
// Save that address in the cat's photo_url using addCat or updateCat.
async function uploadCatPhoto(file) {
  const fileName = Date.now() + "-" + file.name.replace(/\s+/g, "-");

  const { error } = await supabaseClient.storage
    .from("cat-photos")
    .upload(fileName, file);
  if (error) throw error;

  const { data } = supabaseClient.storage
    .from("cat-photos")
    .getPublicUrl(fileName);
  return data.publicUrl;
}


// ---------- SESSIONS ----------

// Add a session. date looks like "2026-11-05", time like "10:00"
async function addSession(sessionDate, startTime, capacity) {
  const { data, error } = await supabaseClient
    .from("sessions")
    .insert({ session_date: sessionDate, start_time: startTime, capacity: capacity })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Change a session
async function updateSession(sessionId, sessionDate, startTime, capacity) {
  const { error } = await supabaseClient
    .from("sessions")
    .update({ session_date: sessionDate, start_time: startTime, capacity: capacity })
    .eq("id", sessionId);
  if (error) throw error;
}

// Remove a session (its bookings are removed too)
async function deleteSession(sessionId) {
  const { error } = await supabaseClient
    .from("sessions")
    .delete()
    .eq("id", sessionId);
  if (error) throw error;
}


// ---------- BOOKINGS ----------

// Change the guest count on one of your own bookings
async function updateBooking(bookingId, guests) {
  const { error } = await supabaseClient
    .from("bookings")
    .update({ guests: guests })
    .eq("id", bookingId);
  if (error) throw error;
}