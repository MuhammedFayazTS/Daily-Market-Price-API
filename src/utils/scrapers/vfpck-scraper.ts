import axios from "axios";
import * as cheerio from "cheerio";

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
  const url = `${BASE_URL}/market_price.asp`;
  return fetchTableList(url, 1);
}

export async function fetchListedItems(): Promise<ListData> {
  const url = `${BASE_URL}/market_price.asp`;
  return fetchTableList(url, 2);
}
