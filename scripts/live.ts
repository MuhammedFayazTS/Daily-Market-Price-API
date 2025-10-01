import fs from "node:fs";
import path from "node:path";

// eslint-disable-next-line node/file-extension-in-import
import type { ListData, LiveItem, MarketPriceResponse } from "../src/interfaces/common";

// eslint-disable-next-line node/file-extension-in-import
import { fetchListedItems } from "../src/utils/data-fetcher";
// eslint-disable-next-line node/file-extension-in-import
import { fetchProductPriceByProductName } from "../src/utils/scraper";

const DATA_DIR = path.join(__dirname, "/../data");
const HISTORIC_DIR = path.join(DATA_DIR, "/historic_data");
const LIVE_JSON = path.join(DATA_DIR, "/live.json");

export async function fetchDailyPrices(): Promise<void> {
  try {
    console.log("Processing Daily prices json...");

    const itemsList: ListData = await fetchListedItems(DATA_DIR);

    let existingLiveData: { date?: string } = {};
    if (fs.existsSync(LIVE_JSON)) {
      try {
        const raw = fs.readFileSync(LIVE_JSON, "utf-8");
        existingLiveData = JSON.parse(raw);
      } catch (err) {
        console.warn("Failed to parse existing live.json, will update anyway:", err);
      }
    }

    const firstItem = itemsList.data[0];
    if (!firstItem) {
      console.warn("No items found to fetch prices.");
      return;
    }

    const { date: firstDate } = await fetchProductPriceByProductName(firstItem.title.trim(), undefined, DATA_DIR);

    if (existingLiveData.date && existingLiveData.date === firstDate) {
      console.log("Data is already up-to-date. Skipping live.json and historic_data update.");
      return;
    }

    const liveData: Record<string, LiveItem> = {};
    const date: string | null | Date = firstDate || null;

    for (const item of itemsList.data) {
      const name = item.title.trim();
      if (!name) continue;

      try {
        const { data, date: lastUpdated }: MarketPriceResponse = await fetchProductPriceByProductName(name, undefined, DATA_DIR);
        const safeName = name.replace(/[^\w-]/g, "_").toLowerCase();

        liveData[safeName] = {
          name,
          data,
          lastUpdated
        };

        generateHistoricData(name, data, lastUpdated);
      } catch (err) {
        console.error(`Failed to fetch price for "${name}":`, err);
      }
    }

    const dir = path.dirname(LIVE_JSON);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const newLiveData = { data: liveData, date };

    fs.writeFileSync(LIVE_JSON, JSON.stringify(newLiveData, null, 2), "utf-8");

    console.log("Daily prices updated successfully!");
  } catch (err) {
    console.error("Error fetching daily prices:", err);
  }
}

function generateHistoricData(item: string, data: any, date: string | null | Date) {
  if (!fs.existsSync(HISTORIC_DIR)) {
    fs.mkdirSync(HISTORIC_DIR, { recursive: true });
  }

  const safeName = item.replace(/[^\w-]/g, "_").toLowerCase();
  const filePath = path.join(HISTORIC_DIR, `${safeName}.json`);

  const formattedDate =
    typeof date === "string" ? date : date?.toISOString().split("T")[0] ?? null;

  if (!formattedDate) {
    console.warn(`No valid date provided for historic data of ${item}`);
    return;
  }

  const prices = Object.entries(data).map(([place, placeData]: [string, any]) => ({
    place,
    KERALA: placeData.KERALA,
    OUT_OF_STATE: placeData.OUT_OF_STATE
  }));

  const newEntry = {
    date: formattedDate,
    prices
  };

  let fileData: {
    id: string;
    name: string;
    data: Array<{ date: string; prices: typeof prices }>;
  } = {
    id: safeName,
    name: item,
    data: []
  };

  if (fs.existsSync(filePath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (existingData?.data && Array.isArray(existingData.data)) {
        fileData = existingData;
      }
    } catch (err) {
      console.error(`Failed to parse existing historic file for ${item}`, err);
    }
  }

  const dateExists = fileData.data.some(entry => entry.date === formattedDate);
  if (!dateExists) {
    fileData.data.push(newEntry);
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf-8");
    console.log(`Historic data updated for ${item}`);
  } else {
    console.log(`Historic data for ${item} on ${formattedDate} already exists. Skipping.`);
  }
}

fetchDailyPrices();
