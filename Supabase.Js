// =====================================================
// supabase.js - Cat Café backend helpers
// Load the Supabase library BEFORE this file in your HTML:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="supabase.js"></script>
//
// Every function below either returns data or throws an error,
// so call them inside try / catch.
// =====================================================

// ---------- CONNECTION ----------
// Find both values in Supabase > Settings > API
const SUPABASE_URL = "https://azaffkwcsgqjolmpxwoh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ll39XbpgDWS8hLW2G0uNNg_ENuskbKi";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ---------- AUTH ----------

// Create a new account (a profile row is made automatically)
async function signUp(email, password, fullName) {
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;
  return data;
}

// Log in with email and password
async function logIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });
  if (error) throw error;
  return data;
}

// Log out the current user
async function logOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

// Returns the logged-in user, or null if nobody is logged in
async function getCurrentUser() {
  const { data } = await supabaseClient.auth.getUser();
  return data.user;
}


// ---------- PROFILE ----------

// Get the logged-in user's profile (full_name, phone)
async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to log in first.");

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data;
}

// Update name and phone for the logged-in user
async function updateMyProfile(fullName, phone) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to log in first.");

  const { error } = await supabaseClient
    .from("profiles")
    .update({ full_name: fullName, phone: phone })
    .eq("id", user.id);
  if (error) throw error;
}


// ---------- CATS ----------

// Get all cats (name, breed, personality, photo_url)
async function getCats() {
  const { data, error } = await supabaseClient
    .from("cats")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}


// ---------- SESSIONS ----------

// Get all sessions, each with a spotsLeft number added
async function getSessions() {
  const { data, error } = await supabaseClient
    .from("sessions")
    .select("*")
    .order("session_date")
    .order("start_time");
  if (error) throw error;

  // Ask the database how many seats are left for each session
  for (let i = 0; i < data.length; i++) {
    const result = await supabaseClient.rpc("spots_left", {
      p_session_id: data[i].id
    });
    data[i].spotsLeft = result.data;
  }
  return data;
}


// ---------- BOOKINGS ----------

// Book a session for a number of guests (1 to 6)
async function createBooking(sessionId, guests) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You need to log in first.");

  // Check there is enough room before booking
  const spots = await supabaseClient.rpc("spots_left", {
    p_session_id: sessionId
  });
  if (spots.data < guests) {
    throw new Error("Sorry, only " + spots.data + " spots left in this session.");
  }

  const { data, error } = await supabaseClient
    .from("bookings")
    .insert({ user_id: user.id, session_id: sessionId, guests: guests })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get the logged-in user's bookings, with the session date and time included
async function getMyBookings() {
  const { data, error } = await supabaseClient
    .from("bookings")
    .select("id, guests, created_at, sessions(session_date, start_time)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Cancel one of the logged-in user's bookings
async function cancelBooking(bookingId) {
  const { error } = await supabaseClient
    .from("bookings")
    .delete()
    .eq("id", bookingId);
  if (error) throw error;
}