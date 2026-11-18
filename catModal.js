// catModal.js - click (or press Enter on) a cat card to see a bigger photo and details.
// Load AFTER catsProfile.js. Reads the cat list that catsProfile.js loaded (allCats).

(function () {
  const grid = document.getElementById("catsGrid");
  if (!grid) return;

  // ---- build the pop-up once ----
  const backdrop = document.createElement("div");
  backdrop.className = "cat-modal-backdrop";
  backdrop.hidden = true;

  const modal = document.createElement("div");
  modal.className = "cat-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "catModalName");

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "cat-modal-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";

  const photo = document.createElement("img");
  photo.className = "cat-modal-photo";

  const info = document.createElement("div");
  info.className = "cat-modal-info";

  const name = document.createElement("h2");
  name.id = "catModalName";
  const breed = document.createElement("p");
  breed.className = "cat-modal-breed";
  const tag = document.createElement("span");
  tag.className = "cat-modal-tag";
  const about = document.createElement("p");
  about.className = "cat-modal-about";
  const rescuer = document.createElement("p");
  rescuer.className = "cat-modal-rescuer";
  const bookLink = document.createElement("a");
  bookLink.className = "cat-modal-book";

  info.append(name, breed, tag, about, rescuer, bookLink);
  modal.append(closeBtn, photo, info);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  let lastCard = null;
  const labels = { playful: "Playful Pal", snuggly: "Lap Snuggler", calm: "Calm Observer" };

  function openCat(catId, card) {
    const list = typeof allCats !== "undefined" ? allCats : [];
    const cat = list.find(function (c) { return String(c.id) === String(catId); });
    if (!cat) return;

    photo.src = cat.photo_url || "default-cat.png";
    photo.alt = cat.name + " the cat";
    photo.onerror = function () { photo.onerror = null; photo.src = "default-cat.png"; };

    name.textContent = cat.name;
    breed.textContent = cat.breed || "";
    tag.textContent = labels[cat.temperament] || "";
    tag.hidden = !labels[cat.temperament];
    about.textContent = cat.personality || "";
    rescuer.textContent = cat.rescuer_name ? "Rescued by " + cat.rescuer_name : "One of our café residents";
    bookLink.href = "booking.html?cat=" + cat.id;
    bookLink.textContent = "Book a visit with " + cat.name + " →";

    lastCard = card;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    backdrop.hidden = true;
    document.body.style.overflow = "";
    if (lastCard) lastCard.focus();
  }

  // ---- open ----
  grid.addEventListener("click", function (event) {
    if (event.target.closest("a, button")) return; // let the "Meet ..." link work as normal
    const card = event.target.closest(".cat-card");
    if (card && card.dataset.catId) openCat(card.dataset.catId, card);
  });
  grid.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".cat-card");
    if (!card || event.target !== card) return;
    event.preventDefault();
    openCat(card.dataset.catId, card);
  });

  // ---- close ----
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", function (event) {
    if (event.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !backdrop.hidden) closeModal();
  });
})();
