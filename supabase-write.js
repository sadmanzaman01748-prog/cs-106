

// ---------- CATS ----------

// Add a cat you rescued (photoUrl can be empty). The owner is set automatically.
async function addCat(name, breed, personality, photoUrl) {
  const { data, error } = await supabaseClient
    .from("cats")
    .insert({ name: name, breed: breed, personality: personality, photo_url: photoUrl })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Change one of your own cats (admins can change any cat)
async function updateCat(catId, name, breed, personality, photoUrl) {
  const { data, error } = await supabaseClient
    .from("cats")
    .update({ name: name, breed: breed, personality: personality, photo_url: photoUrl })
    .eq("id", catId)
    .select();
  if (error) throw error;
  // the database silently skips cats that aren't yours, so check something changed
  if (data.length === 0) throw new Error("You can only edit your own cats.");
}

// Remove one of your own cats (admins can remove any cat)
async function deleteCat(catId) {
  const { data, error } = await supabaseClient
    .from("cats")
    .delete()
    .eq("id", catId)
    .select();
  if (error) throw error;
  if (data.length === 0) throw new Error("You can only delete your own cats.");
}

// Get only the cats the logged-in user added
async function getMyCats() {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to log in first.");

  const { data, error } = await supabaseClient
    .from("cats")
    .select("*")
    .eq("owner_id", user.id)
    .order("name");
  if (error) throw error;
  return data;
}

// Search cats by text (name or personality) and/or an exact breed.
// Leave either one empty to skip it.
async function searchCats(text, breed) {
  let query = supabaseClient.from("cats").select("*").order("name");

  if (text) {
    // remove characters that could break the search filter
    const cleanText = text.replace(/[,()%*]/g, " ").trim();
    if (cleanText) {
      query = query.or("name.ilike.%" + cleanText + "%,personality.ilike.%" + cleanText + "%");
    }
  }
  if (breed) {
    query = query.eq("breed", breed);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// A sorted list of every breed, for a filter dropdown
async function getBreeds() {
  const { data, error } = await supabaseClient.from("cats").select("breed");
  if (error) throw error;

  const breeds = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].breed && !breeds.includes(data[i].breed)) {
      breeds.push(data[i].breed);
    }
  }
  return breeds.sort();
}

// Upload a photo (a File from an <input type="file">) and get back its web address.
// It goes into the logged-in user's own folder. Save the address in the cat's
// photo_url using addCat or updateCat. JPG, PNG or WebP, 2 MB max.
async function uploadCatPhoto(file) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to log in first.");

  const fileName = user.id + "/" + Date.now() + "-" + file.name.replace(/\s+/g, "-");

  const { error } = await supabaseClient.storage
    .from("cat-photos")
    .upload(fileName, file);
  if (error) throw error;

  const { data } = supabaseClient.storage
    .from("cat-photos")
    .getPublicUrl(fileName);
  return data.publicUrl;
}


// ---------- ADMIN CHECK ----------

// true if the logged-in user is an admin (use it to show or hide the staff page)
async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data ? data.role === "admin" : false;
}


// ---------- SESSIONS (admins only) ----------

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
  const { data, error } = await supabaseClient
    .from("sessions")
    .update({ session_date: sessionDate, start_time: startTime, capacity: capacity })
    .eq("id", sessionId)
    .select();
  if (error) throw error;
  if (data.length === 0) throw new Error("Only admins can change sessions.");
}

// Remove a session (not allowed if it has bookings)
async function deleteSession(sessionId) {
  const { data, error } = await supabaseClient
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .select();
  if (error) throw error;
  if (data.length === 0) throw new Error("Only admins can delete sessions.");
}


// ---------- BOOKINGS ----------

// Change the guest count on one of your own bookings
async function updateBooking(bookingId, guests) {
  const { data, error } = await supabaseClient
    .from("bookings")
    .update({ guests: guests })
    .eq("id", bookingId)
    .select();
  if (error) throw error;
  if (data.length === 0) throw new Error("That booking was not found, or it is not yours.");
}