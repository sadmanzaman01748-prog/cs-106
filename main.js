
// ACCOUNT DROPDOWN

// Get the account button and dropdown menu
const accountBtn = document.getElementById("accountBtn");
const accountMenu = document.getElementById("accountMenu");

// When the account button is clicked
accountBtn.addEventListener("click", function () {

    // Show or hide the dropdown menu
    accountMenu.classList.toggle("show");

    // Check whether the dropdown is open
    const isOpen = accountMenu.classList.contains("show");

    // Update accessibility information
    accountBtn.setAttribute("aria-expanded", isOpen);
});


// Close dropdown when clicking outside
document.addEventListener("click", function (event) {

    if (!accountBtn.contains(event.target) &&
        !accountMenu.contains(event.target)) {

        accountMenu.classList.remove("show");
        accountBtn.setAttribute("aria-expanded", "false");
    }
});


// SEARCH FUNCTIONALITY

// Get search input and search button
const searchInput = document.querySelector(".search-box input");
const searchBtn = document.querySelector(".search-box button");

// Function to perform search
function performSearch() {

    const searchValue = searchInput.value.trim().toLowerCase();

    // Check if the search box is empty
    if (searchValue === "") {
        alert("Please enter something to search!");
        return;
    }

    // Website pages
    const pages = [
        { name: "home", url: "index.html" },
        { name: "about", url: "about.html" },
        { name: "about us", url: "about.html" },
        { name: "cats", url: "cats.html" },
        { name: "our cats", url: "cats.html" },
        { name: "menu", url: "menu.html" },
        { name: "contact", url: "contact.html" },
        { name: "booking", url: "booking.html" },
        { name: "book a visit", url: "booking.html" }
    ];

    // Find matching page
    const result = pages.find(function(page) {
        return page.name === searchValue;
    });

    // Open matching page
    if (result) {
        window.location.href = result.url;
    } else {
        alert("Sorry! No matching page found.");
    }
}

// Search button click
searchBtn.addEventListener("click", performSearch);

// Search when Enter key is pressed
searchInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        performSearch();
    }

});
//Initialise Splide Carousel
    document.addEventListener("DOMContentLoaded", function () {

        var splide = new Splide("#heroCarousel", {
            type: "loop",
            autoplay: true,
            interval: 5000,
            pauseOnHover: true,
            pauseOnFocus: true,
            resetProgress: false,
            arrows: true,
            pagination: true
        });

        splide.mount();

    });


