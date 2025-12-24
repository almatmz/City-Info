let map;
let marker;
let currentCity = "";

const countryToCurrency = {
  US: "USD",
  GB: "GBP",
  UK: "GBP",
  EU: "EUR",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  KZ: "KZT",
  RU: "RUB",
  CN: "CNY",
  JP: "JPY",
  IN: "INR",
  CA: "CAD",
  AU: "AUD",
  BR: "BRL",
  KR: "KRW",
  TR: "TRY",
};

function initMap() {
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);
}

document.getElementById("searchBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value;
  if (city) {
    currentCity = city;
    fetchDashboardData(city);
  }
});

async function fetchDashboardData(city) {
  try {
    const weatherRes = await fetch(`/api/weather?city=${city}`);
    const weatherData = await weatherRes.json();

    if (weatherData.error) {
      alert(weatherData.error);
      return;
    }

    updateWeatherUI(weatherData);
    updateMapUI(weatherData.coordinates);

    autoSelectCurrency(weatherData.country);

    fetchNews(city);
  } catch (error) {
    console.error("Dashboard Error:", error);
  }
}

function updateWeatherUI(data) {
  document.getElementById("temp").innerText = `${Math.round(data.temp)}°C`;
  document.getElementById("description").innerText = data.description;

  document.getElementById("feelsLike").innerText = `${Math.round(
    data.feels_like
  )}°C`;
  document.getElementById("humidity").innerText = `${data.humidity}%`;
  document.getElementById("wind").innerText = `${data.wind_speed} m/s`;
  document.getElementById("pressure").innerText = `${data.pressure} hPa`;
  document.getElementById("countryCode").innerText = data.country || "--";

  const rainVol = data.rain_volume || 0;
  document.getElementById("rain").innerText = `${rainVol} mm`;

  document.getElementById(
    "coordsText"
  ).innerText = `${data.coordinates.lat.toFixed(
    1
  )}, ${data.coordinates.lon.toFixed(1)}`;

  const iconImg = document.getElementById("weatherIcon");
  if (data.icon) {
    iconImg.src = `http://openweathermap.org/img/wn/${data.icon}@2x.png`;
    iconImg.style.display = "block";
  }
}

function updateMapUI(coords) {
  const { lat, lon } = coords;
  map.setView([lat, lon], 12);

  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon])
    .addTo(map)
    .bindPopup(`<b>${currentCity}</b><br>Lat: ${lat}, Lon: ${lon}`)
    .openPopup();

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

function autoSelectCurrency(countryCode) {
  if (!countryCode) return;

  const currencyCode = countryToCurrency[countryCode];
  const toSelect = document.getElementById("toCurrency");

  if (currencyCode) {
    const option = toSelect.querySelector(`option[value="${currencyCode}"]`);

    if (option) {
      toSelect.value = currencyCode;
      toSelect.style.borderColor = "#10b981";
      setTimeout(() => (toSelect.style.borderColor = "#e5e7eb"), 1000);
    } else {
      toSelect.value = "USD";
    }
  }
}

async function fetchNews(query) {
  const newsGrid = document.getElementById("newsGrid");
  newsGrid.innerHTML = '<div class="empty-state">Loading news...</div>';

  try {
    const res = await fetch(`/api/news?q=${query}`);
    const articles = await res.json();

    newsGrid.innerHTML = "";

    if (!articles || articles.length === 0) {
      newsGrid.innerHTML =
        '<div class="empty-state">No news found for this city.</div>';
      return;
    }

    articles.forEach((article) => {
      const imgUrl =
        article.urlToImage ||
        "https://via.placeholder.com/400x200?text=No+Image";

      const card = document.createElement("div");
      card.className = "news-item";
      card.innerHTML = `
                <img src="${imgUrl}" class="news-image" alt="News">
                <div class="news-content">
                    <h4><a href="${article.url}" target="_blank">${
        article.title
      }</a></h4>
                    <span class="news-date">${new Date(
                      article.publishedAt
                    ).toLocaleDateString()}</span>
                </div>
            `;
      newsGrid.appendChild(card);
    });
  } catch (error) {
    newsGrid.innerHTML = '<div class="empty-state">Failed to load news.</div>';
  }
}

document.getElementById("convertBtn").addEventListener("click", async () => {
  const amount = document.getElementById("amount").value;
  const from = document.getElementById("fromCurrency").value;
  const to = document.getElementById("toCurrency").value;
  const resultBox = document.getElementById("conversionResult");

  resultBox.innerText = "...";

  try {
    const res = await fetch(`/api/currency?base=${from}`);
    const data = await res.json();

    const rate = data.conversion_rates[to];
    const total = (amount * rate).toFixed(2);

    resultBox.innerHTML = `${total} ${to}`;
  } catch (error) {
    resultBox.innerText = "Error";
  }
});

window.onload = initMap;
