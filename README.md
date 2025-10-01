# Kerala Vegetable Market Price API

This repository provides **live and historical vegetable market prices** for various markets across Kerala, India.
The data is scraped from the [VFPCK (Vegetable and Fruit Promotion Council Keralam)](https://www.vfpck.org) website and stored in structured JSON files.

- 🔗 **Live Data File**: `data/live.json`
- 🔗 **Markets & Items**: `data/markets.json`, `data/items.json`
- 🔗 **Historic Data**: `data/historic_data/<item_name>.json`

---

## 📌 Overview

* Provides **wholesale (wp)** and **retail (rp)** prices for vegetables across Kerala markets.
* Data stored in JSON format (`live.json`, `items.json`, `markets.json`).
* Includes an **Express.js API server** to serve prices by item and market.
* Designed to be extendable for dashboards, apps, and research.
* Maintains **historic price data** for each item in `data/historic_data/`.

---

## ✨ Features

* 🔄 **Automatic daily scraping** from VFPCK.
* 📂 **JSON structured data** for easy consumption.
* 🌐 **API endpoints** for markets, items, and specific product prices.
* 🕒 Includes **last updated date** for each product.
* 📈 Maintains **historical price records** for analytics and tracking trends.

---

## 📊 Data Structure

### **Live Data (live.json)**

The `live.json` now stores each item under a normalized key (lowercase with underscores), along with its original name, market-wise prices, and last updated date.

```json
{
  "data": {
    "amaranthus_green": {
      "name": "Amaranthus Green",
      "data": {
        "ALUVA": {
          "KERALA": { "wp": "30", "rp": "40" },
          "OUT_OF_STATE": { "wp": "0", "rp": "0" }
        },
        "CHALAI": {
          "KERALA": { "wp": "40", "rp": "45" },
          "OUT_OF_STATE": { "wp": "0", "rp": "0" }
        }
      },
      "lastUpdated": "September 29, 2025"
    }
  },
  "date": "September 29, 2025"
}
```

### Explanation of Terms

* **data** → Root container of all vegetables/fruits.
* **Key** → Normalized item name (lowercase, underscores).
* **name** → Original product name.
* **Market Name** → Example: `"ALUVA"`, `"CHALAI"`.
* **KERALA / OUT_OF_STATE** → Source of produce.

  * **wp** → Wholesale Price (₹ per kg).
  * **rp** → Retail Price (₹ per kg).
* **lastUpdated** → Last updated date from VFPCK.
* **Historic Data** → Stored per item in `data/historic_data/<item_name>.json`.

---

## ⚙️ API

Base Path: `/api`

### **1. List Markets**

```
GET /veg/markets
```

Response:

```json
{
  "data": [
    { "title": "Aluva", "id": "123" },
    { "title": "Chalai", "id": "456" }
  ],
  "date": "September 29, 2025",
  "message": "Markets listed successfully"
}
```

---

### **2. List Items (Vegetables & Fruits)**

```
GET /veg/items
```

Response:

```json
{
  "data": [
    { "title": "Amaranthus Green", "id": "101" },
    { "title": "Ash Gourd", "id": "102" }
  ],
  "date": "September 29, 2025",
  "message": "Vegetables and Fruits listed successfully"
}
```

---

### **3. Get Prices of a Specific Item**

```
GET /items/:name?place=<marketName>
```

Example:

```
GET /items/Amaranthus Green?place=ALUVA
```

Response:

```json
{
  "data": {
    "ALUVA": {
      "KERALA": { "wp": "30", "rp": "40" },
      "OUT_OF_STATE": { "wp": "0", "rp": "0" }
    }
  },
  "date": "September 29, 2025",
  "name": "Amaranthus Green",
  "message": "Item details fetched successfully"
}
```

*Notes:*

* `place` is optional; if omitted, prices for all markets are returned.
* `name` field in the response always returns the original product name.

---

## 🔄 Workflow

1. Scraper fetches **market and item lists** from VFPCK website.

2. Data is saved into:

   * `items.json` → List of vegetables & fruits.
   * `markets.json` → List of Kerala markets.
   * `live.json` → Daily updated prices.
   * `historic_data/<item>.json` → Daily historical prices for each item.

3. API serves the data via **Express.js routes**.

---

## 📂 Project Structure

```
data/
 ├── items.json             # List of all items
 ├── markets.json           # List of Kerala markets
 ├── live.json              # Latest prices
 └── historic_data/         # Historical price data for each item
src/
 ├── routes/                # Express API routes
 ├── utils/scraper.js       # Scraper logic
 ├── utils/data-fetcher.js  # Local JSON data fetcher
 ├── index.ts               # Server entrypoint
scripts/
 └── live.ts                # Daily price update and historic generation
```

---

## 🤝 Contributing

* Fork the repo & create feature branches.
* Improve scrapers, add new data sources, or optimize API responses.
* Open PRs with detailed descriptions.

---

## 📜 License

MIT License

---

## ⚠️ Disclaimer

This project scrapes data from **[VFPCK](https://www.vfpck.org)**.
The data is provided **as-is** and may contain parsing errors. For official and verified information, refer to the original source.

