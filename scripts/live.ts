import fs from "node:fs";
import path from "node:path";

// eslint-disable-next-line node/file-extension-in-import
import type { ListData, MarketPriceMap, MarketPriceResponse } from "../src/utils/scraper";

// eslint-disable-next-line node/file-extension-in-import
import { fetchListedItems, fetchProductPriceByProductName } from "../src/utils/scraper";

const DATA_DIR = path.join(__dirname, "/../data");
const HISTORIC_DIR = path.join(DATA_DIR, "/historic_data");
const LIVE_JSON = path.join(DATA_DIR, "/live.json");

export async function fetchDailyPrices(): Promise<void> {
  try {
    console.log("Processing Daily prices json...");
    const itemsList: ListData = await fetchListedItems(DATA_DIR);
    const liveData: Record<string, MarketPriceMap> = {};
    let date;

    // Fetch prices for each item sequentially
    for (const item of itemsList.data) {
      const name = item.title.trim();
      if (!name)
        continue;

      try {
        const { data, date: lastUpdated }: MarketPriceResponse = await fetchProductPriceByProductName(name, undefined, DATA_DIR);
        date = lastUpdated;
        // const safeName = name.replace(/[^a-z0-9_-]/gi, "_"); // safe file name
        liveData[name] = data;
        generateHistoricData(name, data, lastUpdated)
      }
      catch (err) {
        console.error(`Failed to fetch price for "${name}":`, err);
      }
    }

    // Ensure the directory exists
    const dir = path.dirname(LIVE_JSON);
    if (!fs.existsSync(dir))
      fs.mkdirSync(dir, { recursive: true });

    const data = { data: liveData, date };

    // Write to live.json
    fs.writeFileSync(LIVE_JSON, JSON.stringify(data, null, 2), "utf-8");

    console.log("Daily prices updated successfully!");
  }
  catch (err) {
    console.error("Error fetching daily prices:", err);
  }
}

function generateHistoricData(item: string, data: any, date: string | null | Date) {
  if (!fs.existsSync(HISTORIC_DIR)) {
    fs.mkdirSync(HISTORIC_DIR, { recursive: true });
  }

  const safeName = item.replace(/[^\w-]/g, "_").toLowerCase();
  const filePath = path.join(HISTORIC_DIR, `${safeName}.json`);

  // normalize date
  const formattedDate =
    typeof date === "string" ? date : date?.toISOString().split("T")[0] ?? null;

  // Transform data into the new structure
  const prices: any[] = Object.entries(data).map(([place, placeData]: [string, any]) => ({
    place,
    KERALA: placeData.KERALA,
    OUT_OF_STATE: placeData.OUT_OF_STATE
  }));

  const newEntry = {
    date: formattedDate,
    prices
  };

  let fileData: any = {
    id: safeName,
    name: item,
    data: []
  };

  if (fs.existsSync(filePath)) {
    try {
      fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.error(`Failed to parse existing historic file for ${item}`, err);
    }
  }

  fileData.data.push(newEntry);

  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf-8");
}

fetchDailyPrices();
