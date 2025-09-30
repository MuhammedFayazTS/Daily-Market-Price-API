import axios from "axios";
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(__dirname, "/../../", "data");

type CommonList = {
  title: string;
  id: string;
};

export type ListData = {
  data: CommonList[];
  date: string | Date | null;
};

const BASE_URL = "https://www.vfpck.org";

async function fetchTableList(url: string, tableIndex: number): Promise<ListData> {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const date = fetchDateValue(data);

  const table = $("table").eq(tableIndex);
  const results: CommonList[] = [];

  table.find("tr").each((_, row) => {
    $(row)
      .find("td")
      .each((_, td) => {
        const $a = $(td).find("a");
        const text = $a.text().trim() || $(td).text().trim();
        const href = $a.attr("href");
        const id = href?.split("ID=")?.[1];

        if (!id)
          return; // skip cells without ID

        if (text) {
          results.push({ title: text, id });
        }
      });
  });

  return { data: results, date };
}

function fetchDateValue(data: any): string | null {
  const $ = cheerio.load(data);

  const firstTable = $("table").first();

  const strong = firstTable.find("strong").first();

  if (!strong.length)
    return null;

  const fullText = strong.text().trim();
  const dateValue = fullText.replace(/^Date:\s*/, "").replace(/\s+/g, " ");

  return dateValue || null;
}

export async function fetchMarketList(): Promise<ListData> {
  const filePath = path.join(DATA_DIR, "markets.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("markets.json not found. Please run updateJsonFiles first.");
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data: ListData = JSON.parse(raw);
  return data;
}

export async function fetchListedItems(): Promise<ListData> {
  const filePath = path.join(DATA_DIR, "items.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("items.json not found. Please run updateJsonFiles first.");
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data: ListData = JSON.parse(raw);
  return data;
}

async function updateJsonFiles() {
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
      "utf-8"
    );

    fs.writeFileSync(
      path.join(dir, "items.json"),
      JSON.stringify(itemData, null, 2),
      "utf-8"
    );

    // eslint-disable-next-line no-console
    console.log("JSON files updated successfully!");
  } catch (error) {
    console.error("Error updating JSON files:", error);
  }
}
// Run immediately (hook this into a cron job using github actions)
updateJsonFiles();
