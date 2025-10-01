import fs from "node:fs";
import path from "node:path";

// eslint-disable-next-line node/file-extension-in-import
import { BASE_URL, fetchTableList } from "../src/utils/scraper";

const DATA_DIR = path.join(__dirname, "/../data");

// JSON FILES HANDLING
async function fetchItemsAndMarketsList() {
  try {
    const url = `${BASE_URL}/market_price.asp`;
    const marketData = await fetchTableList(url, 1);
    const itemData = await fetchTableList(url, 2);

    const dir = DATA_DIR;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dir, "markets.json"),
      JSON.stringify(marketData, null, 2),
      "utf-8",
    );

    fs.writeFileSync(
      path.join(dir, "items.json"),
      JSON.stringify(itemData, null, 2),
      "utf-8",
    );

    // eslint-disable-next-line no-console
    console.log("JSON files updated successfully!");
  }
  catch (error) {
    console.error("Error updating JSON files:", error);
  }
}

// Run immediately (hook this into a cron job using github actions)
fetchItemsAndMarketsList();
