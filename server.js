require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/weather", async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: "City is required" });

  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    let rainVolume = 0;
    if (data.rain) {
      rainVolume = data.rain["3h"];
    }

    const weatherData = {
      city: data.name,
      country: data.sys.country,
      coordinates: data.coord,
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind_speed: data.wind.speed,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      rain_volume: rainVolume,
    };

    res.json(weatherData);
  } catch (error) {
    if (error.response) {
      res
        .status(error.response.status)
        .json({ error: error.response.data.message });
    } else {
      res.status(500).json({ error: "Weather API Error" });
    }
  }
});

app.get("/api/news", async (req, res) => {
  const query = req.query.q;
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=4&language=en&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    res.json(response.data.articles);
  } catch (error) {
    res.json([]);
  }
});

app.get("/api/currency", async (req, res) => {
  const base = req.query.base || "USD";
  const apiKey = process.env.EXCHANGE_API_KEY;
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Currency API Error" });
  }
});

app.get("/api/country-info", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Country code required" });

  try {
    const url = `https://restcountries.com/v3.1/alpha/${code}`;
    const response = await axios.get(url);

    const countryData = response.data[0];

    const currencies = countryData.currencies;
    const currencyCode = Object.keys(currencies)[0];

    res.json({ currency: currencyCode });
  } catch (error) {
    console.error("Country API Error:", error.message);
    res.json({ currency: "USD" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
