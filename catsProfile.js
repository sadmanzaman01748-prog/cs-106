
/* =========================================
   PURRFECT CAT CAFÉ - CATS PROFILE
========================================= */

// HTML elements
const catsGrid = document.getElementById("catsGrid");
const catSearch = document.getElementById("catSearch");
const noCatsMessage = document.getElementById("noCatsMessage");
const filterButtons = document.querySelectorAll(".filter-btn");

// Store cats fetched from Supabase
let allCats = [];
let activeFilter = "all";

const defaultCatImage = "default-cat.png";


/* =========================================
   1. LOAD CATS FROM SUPABASE
========================================= */

async function loadCats() {
    try {
        noCatsMessage.hidden = false;
        noCatsMessage.textContent = "Loading cats...";

        // Function from supabase.js
        allCats = await getCats();

        displayCats();

    } catch (error) {
        console.error("Error loading cats:", error);

        catsGrid.innerHTML = "";
        noCatsMessage.hidden = false;
        noCatsMessage.textContent =
            "Unable to load cats. Please try again later.";
    }
}


/* =========================================
   2. DISPLAY CAT CARDS
========================================= */

function displayCats() {

    catsGrid.innerHTML = "";

    const searchText = catSearch.value.trim().toLowerCase();

    const filteredCats = allCats.filter((cat) => {

        const name = String(cat.name || "").toLowerCase();
        const breed = String(cat.breed || "").toLowerCase();
        const personality = String(cat.personality || "").toLowerCase();

        // Search by name or breed
        const matchesSearch =
            name.includes(searchText) ||
            breed.includes(searchText);

        // Filter by personality
        const matchesFilter =
            activeFilter === "all" ||
            personality.includes(activeFilter);

        return matchesSearch && matchesFilter;
    });


    // No matching cats
    if (filteredCats.length === 0) {
        noCatsMessage.hidden = false;
        noCatsMessage.textContent = "No cats found.";
        return;
    }

    noCatsMessage.hidden = true;


    // Create a card for every cat
    filteredCats.forEach((cat) => {

        const card = document.createElement("article");
        card.className = "cat-card";


        /* CAT IMAGE */

        const imageContainer = document.createElement("div");
        imageContainer.className = "cat-image";

        const image = document.createElement("img");

        image.src = cat.photo_url || defaultCatImage;
        image.alt = cat.name
            ? `${cat.name} the cat`
            : "Cat photo";

        // Show default image if photo fails to load
        image.onerror = function () {
            image.onerror = null;
            image.src = defaultCatImage;
        };

        imageContainer.appendChild(image);


        /* CAT AGE */

        if (cat.age !== null && cat.age !== undefined) {
            const age = document.createElement("span");
            age.className = "cat-age";
            age.textContent = `${cat.age} Years`;

            imageContainer.appendChild(age);
        }


        /* CAT BREED */

        if (cat.breed) {
            const breed = document.createElement("span");
            breed.className = "cat-breed";
            breed.textContent = cat.breed;

            imageContainer.appendChild(breed);
        }


        /* CAT CONTENT */

        const content = document.createElement("div");
        content.className = "cat-content";


        /* CAT NAME */

        const title = document.createElement("div");
        title.className = "cat-title";

        const name = document.createElement("h2");
        name.textContent = cat.name || "Unnamed Cat";

        title.appendChild(name);
        content.appendChild(title);


        /* PERSONALITY TAGS */

        if (cat.personality) {

            const tags = document.createElement("div");
            tags.className = "cat-tags";

            const personalityList = String(cat.personality)
                .split(",");

            personalityList.forEach((item) => {

                const tagText = item.trim();

                if (!tagText) return;

                const tag = document.createElement("span");
                tag.textContent = tagText;

                tags.appendChild(tag);
            });

            content.appendChild(tags);
        }


        /* CAT DESCRIPTION */

        if (cat.description) {

            const description = document.createElement("p");
            description.className = "cat-description";
            description.textContent = cat.description;

            content.appendChild(description);
        }


        /* CARD BOTTOM */

        const bottom = document.createElement("div");
        bottom.className = "cat-bottom";

        const label = document.createElement("span");
        label.textContent = "🐾 Purrfect Cat Café";

        const meetLink = document.createElement("a");
        meetLink.href = "booking.html";
        meetLink.textContent = `Meet ${cat.name || "Cat"} →`;

        bottom.appendChild(label);
        bottom.appendChild(meetLink);

        content.appendChild(bottom);


        /* COMPLETE CARD */

        card.appendChild(imageContainer);
        card.appendChild(content);

        catsGrid.appendChild(card);
    });
}


/* =========================================
   3. SEARCH CATS BY NAME OR BREED
========================================= */

catSearch.addEventListener("input", function () {
    displayCats();
});


/* =========================================
   4. FILTER CATS BY PERSONALITY
========================================= */

filterButtons.forEach((button) => {

    button.addEventListener("click", function () {

        // Remove active class from all buttons
        filterButtons.forEach((btn) => {
            btn.classList.remove("active");
        });

        // Highlight selected button
        button.classList.add("active");

        // Get selected category
        activeFilter = button.dataset.filter;

        // Display matching cats
        displayCats();
    });
});


/* =========================================
   5. LOAD CATS WHEN PAGE OPENS
========================================= */

loadCats();


/* =========================================
   MY RESCUED CATS - ADD, EDIT, DELETE
========================================= */

const myCatsSection = document.getElementById("myCatsSection");
const myCatsGrid = document.getElementById("myCatsGrid");
const myCatsMessage = document.getElementById("myCatsMessage");

const addCatBtn = document.getElementById("addCatBtn");
const catForm = document.getElementById("catForm");
const catFormTitle = document.getElementById("catFormTitle");
const cancelCatBtn = document.getElementById("cancelCatBtn");
const saveCatBtn = document.getElementById("saveCatBtn");
const catFormMessage = document.getElementById("catFormMessage");

const catName = document.getElementById("catName");
const catBreed = document.getElementById("catBreed");
const catPersonality = document.getElementById("catPersonality");
const catPhoto = document.getElementById("catPhoto");

let myCats = [];
let editingCatId = null;


/* CHECK LOGIN */

async function initializeMyCats() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            myCatsSection.hidden = true;
            return;
        }

        myCatsSection.hidden = false;
        await loadMyCats();

    } catch (error) {
        console.error("Login check failed:", error);
        myCatsSection.hidden = true;
    }
}


/* LOAD MY CATS */

async function loadMyCats() {
    try {
        myCatsMessage.textContent = "Loading your cats...";

        myCats = await getMyCats();
        displayMyCats();

    } catch (error) {
        console.error(error);
        myCatsMessage.textContent = error.message;
    }
}


/* DISPLAY MY CATS */

function displayMyCats() {
    myCatsGrid.innerHTML = "";

    if (myCats.length === 0) {
        myCatsMessage.textContent =
            "You haven't added any rescued cats yet.";
        return;
    }

    myCatsMessage.textContent = "";

    myCats.forEach((cat) => {
        const card = document.createElement("article");
        card.className = "cat-card";

        const imageContainer = document.createElement("div");
        imageContainer.className = "cat-image";

        const image = document.createElement("img");
        image.src = cat.photo_url || "default-cat.png";
        image.alt = cat.name || "Cat";
        image.onerror = function () {
            image.onerror = null;
            image.src = "default-cat.png";
        };

        imageContainer.appendChild(image);

        const content = document.createElement("div");
        content.className = "cat-content";

        const title = document.createElement("div");
        title.className = "cat-title";

        const name = document.createElement("h2");
        name.textContent = cat.name || "Unnamed Cat";
        title.appendChild(name);

        const breed = document.createElement("p");
        breed.textContent = cat.breed || "Unknown breed";

        const personality = document.createElement("p");
        personality.className = "cat-description";
        personality.textContent = cat.personality || "";

        const actions = document.createElement("div");
        actions.className = "my-cat-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => openEditCat(cat));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-cat-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => removeMyCat(cat.id));

        actions.append(editBtn, deleteBtn);
        content.append(title, breed, personality, actions);
        card.append(imageContainer, content);
        myCatsGrid.appendChild(card);
    });
}


/* OPEN ADD FORM */

addCatBtn.addEventListener("click", () => {
    editingCatId = null;

    catForm.reset();
    catFormTitle.textContent = "Add a Rescued Cat";
    catFormMessage.textContent = "";

    catForm.hidden = false;
    catName.focus();
});


/* OPEN EDIT FORM */

function openEditCat(cat) {
    editingCatId = cat.id;

    catName.value = cat.name || "";
    catBreed.value = cat.breed || "";
    catPersonality.value = cat.personality || "";
    catPhoto.value = "";

    catFormTitle.textContent = "Edit Cat";
    catFormMessage.textContent = "";

    catForm.hidden = false;
    catForm.scrollIntoView({ behavior: "smooth" });
}


/* CANCEL FORM */

cancelCatBtn.addEventListener("click", () => {
    catForm.reset();
    catForm.hidden = true;
    editingCatId = null;
    catFormMessage.textContent = "";
});


/* ADD OR UPDATE CAT */

catForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = catName.value.trim();
    const breed = catBreed.value.trim();
    const personality = catPersonality.value.trim();
    const file = catPhoto.files[0];

    if (!name || !breed || !personality) {
        catFormMessage.textContent = "Please fill in all required fields.";
        return;
    }

    // Validate selected photo
    if (file) {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            catFormMessage.textContent =
                "Only JPG, PNG or WebP images are allowed.";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            catFormMessage.textContent =
                "Photo must be 2 MB or smaller.";
            return;
        }
    }

    saveCatBtn.disabled = true;
    catFormMessage.textContent = "Saving cat...";

    try {
        let photoUrl = "";

        if (editingCatId !== null) {
            const existingCat = myCats.find(
                (cat) => String(cat.id) === String(editingCatId)
            );

            if (!existingCat) {
                throw new Error("Cat not found.");
            }

            // Keep existing photo unless a new one is selected
            photoUrl = existingCat.photo_url || "";
        }

        if (file) {
            photoUrl = await uploadCatPhoto(file);
        }

        if (editingCatId === null) {
            // Add new cat
            await addCat(name, breed, personality, photoUrl);
        } else {
            // Update existing cat
            await updateCat(
                editingCatId,
                name,
                breed,
                personality,
                photoUrl
            );
        }

        catForm.reset();
        catForm.hidden = true;
        editingCatId = null;

        await loadMyCats();

        // Refresh public cat listing
        await loadCats();

        alert("Cat saved successfully!");

    } catch (error) {
        console.error("Error saving cat:", error);
        catFormMessage.textContent = error.message;

    } finally {
        saveCatBtn.disabled = false;
    }
});


/* DELETE CAT */

async function removeMyCat(catId) {
    const confirmed = confirm(
        "Are you sure you want to delete this cat?"
    );

    if (!confirmed) return;

    try {
        await deleteCat(catId);

        await loadMyCats();
        await loadCats();

        alert("Cat deleted successfully!");

    } catch (error) {
        console.error("Error deleting cat:", error);
        alert("Unable to delete cat: " + error.message);
    }
}


/* INITIALIZE */

initializeMyCats();
