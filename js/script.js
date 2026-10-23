document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("map").setView([15.5007, 32.5599], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const weatherForm = document.getElementById("weather-form");
    const locationInput = document.getElementById("location");
    const searchResult = document.getElementById("search-result");
    const weatherResult = document.getElementById("weather-result");
    const loadingSpinner = document.getElementById("loading-spinner");
    const alertBox = document.getElementById("alert-box");
    const addFavoriteButton = document.getElementById("add-favorite");
const favoritesList = document.getElementById("favorites-list");

const FAVORITES_KEY = "weatherMapFavorites";
let currentCityName = null;
    let currentMarker = null;
    let currentWeatherContext = "";
    function showAlert(message) {
        alertBox.textContent = message;
        alertBox.hidden = false;
    }

    function hideAlert() {
        alertBox.textContent = "";
        alertBox.hidden = true;
    }

    function setLoading(isLoading) {
        loadingSpinner.hidden = !isLoading;
    }

    function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function renderFavorites() {
    const favorites = getFavorites();

    favoritesList.replaceChildren();

    if (favorites.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No favorite cities yet.";
        favoritesList.appendChild(message);
        return;
    }

    favorites.forEach((favorite) => {
        const item = document.createElement("div");

        const cityButton = document.createElement("button");
        cityButton.type = "button";
        cityButton.textContent = favorite.name;

        cityButton.addEventListener("click", () => {
            locationInput.value = favorite.query;
            weatherForm.requestSubmit();
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            const updatedFavorites = getFavorites().filter(
                (city) =>
                    city.name.toLowerCase() !==
                    favorite.name.toLowerCase()
            );

            localStorage.setItem(
                FAVORITES_KEY,
                JSON.stringify(updatedFavorites)
            );

            renderFavorites();
        });

        item.append(cityButton, removeButton);
        favoritesList.appendChild(item);
    });
}

addFavoriteButton.addEventListener("click", () => {
    if (!currentCityName) {
        searchResult.textContent =
            "Please search for a city before adding it to favorites.";
        return;
    }

    const favorites = getFavorites();

    const alreadyExists = favorites.some(
        (city) =>
            city.name.toLowerCase() ===
            currentCityName.toLowerCase()
    );

    if (alreadyExists) {
        searchResult.textContent =
            `${currentCityName} is already in your favorites.`;
        return;
    }

    favorites.push({
        name: currentCityName,
        query: currentCityName
    });

    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(favorites)
    );

    renderFavorites();

    searchResult.textContent =
        `${currentCityName} added to favorites.`;
});

renderFavorites();

    weatherForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        currentCityName = null;
        hideAlert();

        const location = locationInput.value.trim();

        if (!location) {
            showAlert("Please enter a city or location.");
            return;
        }

        searchResult.textContent = "";
                setLoading(true);

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(location)}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Unable to search for this location.");
            }

            const data = await response.json();

            if (data.length === 0) {
                showAlert("Location not found. Please try another city.");
                return;
            }

            const latitude = Number(data[0].lat);
            const longitude = Number(data[0].lon);
            
            const displayName = data[0].display_name;

const weatherUrl =
    `https://weathermap-api.rahigmuhialdeen.workers.dev/weather?lat=${latitude}&lon=${longitude}`;

const weatherResponse = await fetch(weatherUrl);

if (!weatherResponse.ok) {
    if (weatherResponse.status === 404) {
        throw new Error("Weather data was not found for this location.");
    }

    throw new Error(
        "The weather service is unavailable right now. Please try again later."
    );
}

const weatherData = await weatherResponse.json();

const temperature = weatherData.main.temp;
const humidity = weatherData.main.humidity;
const windSpeed = weatherData.wind.speed;
const clouds = weatherData.clouds.all;
const description = weatherData.weather[0].description;
const icon = weatherData.weather[0].icon;
const cityName = weatherData.name;
currentCityName = cityName;
currentWeatherContext =
    `City: ${cityName}. Temperature: ${temperature} °C. ` +
    `Condition: ${description}. Humidity: ${humidity}%. ` +
    `Wind speed: ${windSpeed} m/s. Cloudiness: ${clouds}%.`;

weatherResult.innerHTML = `
    <h2>Weather in ${cityName}</h2>

    <img
        src="https://openweathermap.org/img/wn/${icon}@2x.png"
        alt="${description}"
    >

    <p><strong>Temperature:</strong> ${temperature} °C</p>
    <p><strong>Weather Status:</strong> ${description}</p>
    <p><strong>Humidity:</strong> ${humidity}%</p>
    <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
    <p><strong>Cloudiness:</strong> ${clouds}%</p>
`;

const popupContent = `
    <div class="weather-popup">
        <h3>${cityName}</h3>

        <img
            src="https://openweathermap.org/img/wn/${icon}@2x.png"
            alt="${description}"
        >

        <p><strong>Temperature:</strong> ${temperature} °C</p>
        <p><strong>Weather Status:</strong> ${description}</p>
        <p><strong>Humidity:</strong> ${humidity}%</p>
        <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
        <p><strong>Cloudiness:</strong> ${clouds}%</p>

        <button type="button" id="share-weather">
            Share Weather
        </button>
    </div>
`;

const shareText =
    `Weather in ${cityName}: ${temperature} °C, ` +
    `${description}, Humidity: ${humidity}%, ` +
    `Wind: ${windSpeed} m/s, Clouds: ${clouds}%. ` ;

map.flyTo([latitude, longitude], 10, { duration: 1.5 });

if (currentMarker !== null) {
    map.removeLayer(currentMarker);
}

currentMarker = L.marker([latitude, longitude]).addTo(map);

currentMarker.bindPopup(popupContent);

currentMarker.on("popupopen", (e) => {
    const shareButton = e.popup.getElement().querySelector("#share-weather");
    if (!shareButton) return;

    shareButton.addEventListener("click", async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Weather in ${cityName}`,
                    text: shareText
                });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareText);
                alert("Weather information copied to clipboard!");
            } else {
                alert("Sharing is not supported in this browser.");
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Unable to share weather:", error);
                alert("Unable to share weather information.");
            }
        }
    });
});

currentMarker.openPopup();

            searchResult.textContent =
                `Location: ${displayName} | Latitude: ${latitude} | Longitude: ${longitude}`;

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);

        } catch (error) {
            console.error("Search error:", error);

            if (error instanceof TypeError) {
                showAlert(
                    "Network error. Please check your connection and try again."
                );
            } else {
                showAlert(
                    error.message ||
                    "Something went wrong while searching. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    });
    // ===== AI Chatbot =====
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");
    const chatSend = document.getElementById("chat-send");
    const CHAT_URL =
        "https://weathermap-api.rahigmuhialdeen.workers.dev/chat";

    function addChatMessage(text, type) {
        const bubble = document.createElement("div");
        bubble.className = `chat-message ${type}`;
        bubble.textContent = text;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubble;
    }

    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const question = chatInput.value.trim();
        if (!question) return;

        addChatMessage(question, "user");
        chatInput.value = "";
        chatSend.disabled = true;

        const loading = addChatMessage("Thinking...", "bot loading");

        try {
            const response = await fetch(CHAT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: question,
                    weatherContext: currentWeatherContext
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Request failed");
            }

            loading.className = "chat-message bot";
            loading.textContent = data.answer;
        } catch (error) {
            console.error("Chat error:", error);
            loading.className = "chat-message bot error";
            loading.textContent =
                "The AI assistant is busy or unavailable. Please wait a minute and try again.";
        } finally {
            chatSend.disabled = false;
            chatInput.focus();
        }
    });
});