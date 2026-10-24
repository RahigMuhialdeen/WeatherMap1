const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const jsonHeaders = {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    };

    const json = (body, status = 200, extraHeaders = {}) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...jsonHeaders, ...extraHeaders },
      });

    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!["GET", "POST"].includes(request.method)) {
      return json({ error: "Method not allowed" }, 405);
    }

    if (url.pathname === "/chat") {
      if (request.method !== "POST") {
        return json({ error: "Use POST for chat requests" }, 405);
      }

      if (!env.GEMINI_API_KEY) {
        return json({ error: "Gemini API key is not configured" }, 500);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON request" }, 400);
      }

      const message =
        typeof body.message === "string" ? body.message.trim() : "";

      const weatherContext =
        typeof body.weatherContext === "string"
          ? body.weatherContext.slice(0, 3000)
          : "";

      const history = Array.isArray(body.history)
        ? body.history
            .slice(-6)
            .filter(
              (item) =>
                item &&
                (item.role === "user" || item.role === "model") &&
                typeof item.text === "string" &&
                item.text.trim() !== ""
            )
            .map((item) => ({
              role: item.role,
              parts: [{ text: item.text.slice(0, 1000) }],
            }))
        : [];

      while (history.length > 0 && history[0].role !== "user") {
        history.shift();
      }

      if (!message) {
        return json({ error: "Please enter a message" }, 400);
      }

      if (message.length > 2000) {
        return json({ error: "Message is too long" }, 400);
      }

      const systemPrompt = `
You are WeatherMap AI Companion, a friendly assistant that helps people plan their day, outings and trips around the weather.

Rules:
- Use ONLY the weather data below. Never invent weather numbers, forecasts or conditions.
- The data is for ONE city only. If the user asks about a different city, say you only have data for the displayed city and ask them to search for the other city on the map first.
- If no weather data is available, ask the user to search for a city first.
- Reply in the same language the user writes in.
- Keep answers short (2 to 4 sentences). Plain text only. Do not use Markdown, asterisks or bullet symbols.
- If the user mentions a plan (going out, travel, beach, sports, what to wear), give practical advice based on the current weather and ask at most one short follow-up question.
- Ask a follow-up only when it really helps. Never repeat a question the user already answered or ignored.
- If the user declines or changes the topic, follow them.
- You only have current conditions, not a forecast. If asked about later hours or days, say so honestly.

Current weather data:
${weatherContext || "No weather data available."}
`;

      try {
        let geminiResponse;
        let data;

        for (const model of GEMINI_MODELS) {
          geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": env.GEMINI_API_KEY,
              },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [
                  ...history,
                  { role: "user", parts: [{ text: message }] },
                ],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 2048,
                },
              }),
            }
          );

          data = await geminiResponse.json();

          if (geminiResponse.ok) break;

          console.error(
            `Gemini model ${model} failed:`,
            geminiResponse.status,
            JSON.stringify(data)
          );

          if (![404, 429, 500, 503].includes(geminiResponse.status)) break;
        }

        if (!geminiResponse.ok) {
          return json(
            { error: "Gemini API request failed", details: data },
            502
          );
        }

        const answer = data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();

        if (!answer) {
          return json({ error: "The AI returned an empty response" }, 502);
        }

        return json({ answer });
      } catch (error) {
        console.error("Chat route error:", error);
        return json({ error: "Unable to connect to the AI service" }, 502);
      }
    }

    if (url.pathname !== "/weather") {
      return json({ error: "Not found" }, 404);
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const latitude = url.searchParams.get("lat");
    const longitude = url.searchParams.get("lon");

    if (
      latitude === null ||
      longitude === null ||
      latitude.trim() === "" ||
      longitude.trim() === "" ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude)) ||
      Number(latitude) < -90 ||
      Number(latitude) > 90 ||
      Number(longitude) < -180 ||
      Number(longitude) > 180
    ) {
      return json({ error: "Invalid coordinates" }, 400);
    }

    if (!env.OPENWEATHER_API_KEY) {
      return json({ error: "Weather API key is not configured" }, 500);
    }

    const weatherUrl = new URL(
      "https://api.openweathermap.org/data/2.5/weather"
    );

    weatherUrl.searchParams.set("lat", latitude);
    weatherUrl.searchParams.set("lon", longitude);
    weatherUrl.searchParams.set("appid", env.OPENWEATHER_API_KEY);
    weatherUrl.searchParams.set("units", "metric");

    try {
      const weatherResponse = await fetch(weatherUrl);
      const data = await weatherResponse.json();

      return json(data, weatherResponse.status, {
        "Cache-Control": "no-store",
      });
    } catch {
      return json({ error: "Unable to retrieve weather data" }, 502);
    }
  },
};