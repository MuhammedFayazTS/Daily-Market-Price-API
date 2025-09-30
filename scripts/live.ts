import fs from "node:fs";
import path from "node:path";

// eslint-disable-next-line node/file-extension-in-import
import type { ListData, MarketPriceMap, MarketPriceResponse } from "../src/utils/vfpck-scraper";

// eslint-disable-next-line node/file-extension-in-import
import { fetchListedItems, fetchProductPriceByProductName } from "../src/utils/vfpck-scraper";

const LIVE_JSON = path.join(__dirname, "/../src/data/live.json");

export async function fetchDailyPrices(): Promise<void> {
  try {
    console.log("Processing Daily prices json...");
    const itemsList: ListData = await fetchListedItems();
    const liveData: Record<string, MarketPriceMap> = {};
    let date;

    // Fetch prices for each item sequentially
    for (const item of itemsList.data) {
      const name = item.title.trim();
      if (!name)
        continue;

      try {
        const { data, date:lastUpdated }: MarketPriceResponse = await fetchProductPriceByProductName(name);
        date= lastUpdated
        liveData[name] = data;
      }
      catch (err) {
        console.error(`Failed to fetch price for "${name}":`, err);
      }
    }

    // Ensure the directory exists
    const dir = path.dirname(LIVE_JSON);
    if (!fs.existsSync(dir))
      fs.mkdirSync(dir, { recursive: true });

    const data = {data : liveData, date}

    // Write to live.json
    fs.writeFileSync(LIVE_JSON, JSON.stringify(data, null, 2), "utf-8");

    console.log("Daily prices updated successfully!");
  }
  catch (err) {
    console.error("Error fetching daily prices:", err);
  }
}

fetchDailyPrices();
