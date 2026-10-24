# WeatherMap

WeatherMap is a Single Page Application (SPA) that I developed to show current weather information on an interactive map. I used HTML5, CSS3, and Vanilla JavaScript to build the front end.

**Live Demo:** https://rahigmuhialdeen.github.io/WeatherMap1/

**Student:** Rahig Muhialdeen Ibrahim
**Course:** Advanced Web Technologies  
**University:** Sudan University of Science & Technology

## Features

- Users can search for a city or location and display it on the map.
- The map moves to the selected location and shows a marker.
- The marker popup displays the city name, temperature, weather description, humidity, wind speed, cloudiness, and weather icon.
- A loading spinner appears while the application is fetching data.
- The application displays clear error messages if the location cannot be found or if a network or weather-service error occurs.
- I used the Fetch API with `async/await` and error handling to make requests without reloading the whole page.
- The layout adjusts to different screen sizes.

## Additional Features

- **Share Weather:** I added a button to share the weather information using the Web Share API, with a clipboard fallback when sharing is not supported.
- **Favorites:** I used LocalStorage to save favorite cities so they can be opened again later.
- **WeatherMap AI Companion:** I added an AI assistant that remembers the conversation, asks short follow-up questions about the user's plans (outings, travel, what to wear), and gives advice based on the current weather of the selected city. The request is sent through my Cloudflare Worker to the Google Gemini API.

## APIs and Technologies

| Purpose       | Technology                         |
| ------------- | ---------------------------------- |
| Map           | Leaflet.js and OpenStreetMap       |
| Geocoding     | Nominatim                          |
| Weather data  | OpenWeatherMap Current Weather API |
| AI assistant  | Google Gemini API                  |
| API proxy     | Cloudflare Workers                 |
| Weather icons | OpenWeatherMap icons               |
| Font          | Roboto from Google Fonts           |
| Hosting       | GitHub Pages                       |

## How the Application Works

When a user searches for a location, the application uses Nominatim to find its coordinates. It then requests the current weather using those coordinates and displays the results on the map.

I use Cloudflare Worker as a middle layer between the front end and the external APIs:

```text
Browser -> Cloudflare Worker -> OpenWeatherMap / Google Gemini
```

The Worker provides these routes:

- `GET /weather?lat=..&lon=..` to get the current weather.
- `POST /chat` to send a message to the AI assistant and return its response. If one Gemini model is busy, the Worker automatically tries a backup model.

The application itself is purely client-side. The Worker is only a small serverless proxy that protects the API keys.

## Project Structure

```text
WeatherMap1/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── worker/
│   └── worker.js
└── README.md
```

I separated the HTML, CSS, and JavaScript into different files. I used `addEventListener()` to handle user actions and kept the page styling in the CSS file.

The project follows the course constraints: it uses pure Vanilla JavaScript with no frameworks or jQuery, and there are no inline event handlers or inline styles.

## How to Run the Project

1. Clone the repository:

   ```bash
   git clone https://github.com/rahigmuhialdeen/WeatherMap1.git
   ```

2. Open the project folder in VS Code.
3. Run `index.html` with the Live Server extension.
4. The front end uses the Cloudflare Worker URL configured in `js/script.js`. The weather and AI features work when that Worker is available and configured correctly.

## How I Set Up Cloudflare Worker

I used Cloudflare Worker to connect my front end to the OpenWeatherMap and Google Gemini APIs without placing my secret API keys in the browser code.

To set it up, I followed these steps:

1. I created an account on OpenWeatherMap and obtained an API key for current weather data.
2. I created a Gemini API key through Google AI Studio for the AI assistant.
3. I created a Worker in Cloudflare and added the Worker code in `worker/worker.js`.
4. I saved the API keys in Cloudflare as secrets using these names:
   - `OPENWEATHER_API_KEY`
   - `GEMINI_API_KEY`
5. I deployed the Worker on Cloudflare.
6. I configured the Worker URL in `js/script.js` so the front end could send weather requests and chat messages to the correct endpoints.

The API keys are stored as Cloudflare Secrets rather than being written in the front-end files or committed to GitHub.

## Notes

- The AI assistant depends on the availability and usage limits of the Google Gemini API.
- The AI assistant uses current weather information for the selected city; it does not provide a multi-day forecast, and it is instructed not to invent weather data.
- I use Nominatim for geocoding, so requests should be sent at a reasonable rate.

## Author

Rahig Muhialdeen Ibrahim Ramadan
