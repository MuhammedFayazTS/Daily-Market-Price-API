import axios from "axios";
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = path.resolve(process.cwd(), "data");

type CommonList = {
  title: string;
  id: string;
};

type PriceInfo = {
  wp: string;
  rp: string;
};

type MarketPrice = {
  KERALA: PriceInfo;
  OUT_OF_STATE: PriceInfo;
  lastUpdated: string | Date | null;
};

export type MarketPriceMap = Record<string, MarketPrice>;
export type MarketPriceResponse = { data: MarketPriceMap; date: string | Date | null };

export type ListData = {
  data: CommonList[];
  date: string | Date | null;
};

export const BASE_URL = "https://www.vfpck.org";

export async function fetchTableList(url: string, tableIndex: number): Promise<ListData> {
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

export async function fetchMarketList(dir?: string): Promise<ListData> {
  const filePath = path.join(dir || DATA_DIR, "markets.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("markets.json not found. Please run updateJsonFiles first.");
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data: ListData = JSON.parse(raw);
  return data;
}

export async function fetchListedItems(dir?: string): Promise<ListData> {
  const filePath = path.join(dir || DATA_DIR, "items.json");

  console.log("filePath: ", filePath)
  if (!fs.existsSync(filePath)) {
    throw new Error("items.json not found. Please run updateJsonFiles first.");
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data: ListData = JSON.parse(raw);
  return data;
}

export async function fetchLastPricesOFItems(dir?: string): Promise<ListData> {
  const filePath = path.join(dir || DATA_DIR, "live.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("live.json not found. Please run updateJsonFiles first.");
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data: ListData = JSON.parse(raw);
  return data;
}

export async function fetchProductPriceByProductName(name: string, market?: string, dir?: string): Promise<MarketPriceResponse> {
  const list = (await fetchListedItems(dir)).data;

  const item = list.find(i => i.title.trim().toLowerCase() === name.trim().toLowerCase());
  if (!item)
    return { data: {}, date: null };

  const id = item.id.trim();
  if (!id)
    return { data: {}, date: null };
  const itemList = (await fetchLastPricesOFItems(dir)).data;

  const product = Object.entries(itemList).find(
    ([productName]) => productName.trim().toLowerCase() === name.trim().toLowerCase()
  );

  if (!product) return { data: {}, date: null };

  const [, markets] = product;

  const results: MarketPriceMap = {};
  let lastDate: string | Date | null = null;

  for (const [marketName, marketData] of Object.entries(markets as unknown as Record<string, MarketPrice>)) {
    if (market && marketName.trim().toLowerCase() !== market.trim().toLowerCase()) {
      continue; // skip non-matching market
    }
    results[marketName] = marketData;
    lastDate = marketData.lastUpdated;
  }

  return { data: results, date: lastDate };
}

export async function fetchProductPriceByLocation(market: string, itemNameForFilter?: string): Promise<MarketPriceResponse> {
  const list = (await fetchMarketList()).data;

  const item = list.find(i => i.title.trim().toLowerCase() === market.trim().toLowerCase());
  if (!item)
    return { data: {}, date: null };

  const id = item.id.trim();
  if (!id)
    return { data: {}, date: null };
  const itemNameFilter = itemNameForFilter?.trim()?.toLowerCase();

  const url = `${BASE_URL}/mwiseprice.asp?ID=${id}`;
  const { data } = await axios.get<string>(url);
  const $ = cheerio.load(data);

  const date = fetchDateValue(data);

  const table = $("table").eq(1);
  const results: MarketPriceMap = {};

  // Skip the first 2 header rows
  table.find("tr").slice(2).each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length < 5)
      return;

    const itemName = $(tds[0]).text().trim();
    if (itemNameFilter && itemName.toLowerCase() !== itemNameFilter)
      return; // skip non-matching items

    results[itemName] = {
      KERALA: { wp: $(tds[1]).text().trim(), rp: $(tds[2]).text().trim() },
      OUT_OF_STATE: { wp: $(tds[3]).text().trim(), rp: $(tds[4]).text().trim() },
      lastUpdated: date,
    };
  });

  return { data: results, date };
}
