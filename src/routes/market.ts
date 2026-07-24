import express from "express";

const router = express.Router();

const HEADERS = {
  "X-APP-ID": "growwWeb",
  "x-platform": "web",
};

const urls = {
  nifty:
    "https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_indices_ohlc/NIFTY",
  sensex:
    "https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/BSE/segment/CASH/latest_indices_ohlc/1",
  bankNifty:
    "https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_indices_ohlc/BANKNIFTY",
  indiaVix:
    "https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_indices_ohlc/INDIAVIX",
};

let marketCache = {
  nifty: 0,
  sensex: 0,
  bankNifty: 0,
  indiaVix: 0,
  updatedAt: 0,
};

async function updateMarketCache() {
  try {
    const [nifty, sensex, bankNifty, indiaVix] = await Promise.all(
      Object.values(urls).map(async (url) => {
        const response = await fetch(url, { headers: HEADERS });
        const data = await response.json();
        return data.value;
      })
    );

    marketCache = {
      nifty,
      sensex,
      bankNifty,
      indiaVix,
      updatedAt: Date.now(),
    };

    console.log("Market cache updated");
  } catch (error) {
    console.error("Market cache update failed:", error);
  }
}

// Initial fetch
updateMarketCache();

// Refresh every second
setInterval(updateMarketCache, 1000);

router.get("/market/indices", (_req, res) => {
  res.json(marketCache);
});

export default router;