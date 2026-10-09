document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("map").setView([15.5007, 32.5599], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const weatherForm = document.getElementById("weather-form");
    const locationInput = document.getElementById("location");
    const searchResult = document.getElementById("search-result");

    weatherForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const location = locationInput.value.trim();

        if (!location) {
            searchResult.textContent = "Please enter a city or location.";
            return;
        }

        searchResult.textContent = "Searching for location...";

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(location)}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Unable to search for this location.");
            }

            const data = await response.json();

            if (data.length === 0) {
                searchResult.textContent =
                    "Location not found. Please try another city.";
                return;
            }

            const latitude = Number(data[0].lat);
            const longitude = Number(data[0].lon);
            const displayName = data[0].display_name;

            const apiKey = "6fd044a951d8bdae75592a5c231a252e"; 

const weatherUrl =
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

const weatherResponse = await fetch(weatherUrl);

if (!weatherResponse.ok) {
    throw new Error("Unable to retrieve weather data.");
}

const weatherData = await weatherResponse.json();

console.log("Weather data:", weatherData);

            searchResult.textContent =
                `Location: ${displayName} | Latitude: ${latitude} | Longitude: ${longitude}`;

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);

        } catch (error) {
            console.error("Geocoding error:", error);

            searchResult.textContent =
                "Something went wrong while searching. Please try again.";
        }
    });
});