import fs from "node:fs";
import path from "node:path";

import type { ListData, LiveItem, LiveResponse, MarketPriceMap, MarketPriceResponse } from "../interfaces/common.js";

export const DATA_DIR = path.resolve(process.cwd(), "data");

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

    if (!fs.existsSync(filePath)) {
        throw new Error("items.json not found. Please run updateJsonFiles first.");
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const data: ListData = JSON.parse(raw);
    return data;
}

export async function fetchLastPricesOFItems(dir?: string): Promise<LiveResponse> {
    const filePath = path.join(dir || DATA_DIR, "live.json");
    if (!fs.existsSync(filePath)) {
        throw new Error("live.json not found. Please run updateJsonFiles first.");
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const data: LiveResponse = JSON.parse(raw);
    return data;
}

export async function fetchProductPriceByProductNameFromJSON(
    name: string,
    market?: string,
    dir?: string
): Promise<MarketPriceResponse> {
    const itemList = (await fetchLastPricesOFItems(dir)).data;

    const safeName = name.replace(/[^\w-]/g, "_").toLowerCase();

    let itemDetails = itemList[safeName];

    if (!itemDetails) {
        const regex = new RegExp(name.trim(), "i");
        const found = Object.values(itemList).find((entry: LiveItem) =>
            regex.test(entry.name)
        );
        if (found) {
            itemDetails = found;
        }
    }

    if (!itemDetails) return { data: {}, date: null };

    const { data: markets, lastUpdated, name: itemName } = itemDetails;

    const results: MarketPriceMap = {};

    for (const [marketName, marketData] of Object.entries(markets)) {
        if (
            market &&
            marketName.trim().toLowerCase() !== market.trim().toLowerCase()
        ) {
            continue;
        }

        results[marketName] = {
            KERALA: marketData.KERALA,
            OUT_OF_STATE: marketData.OUT_OF_STATE
        };
    }

    return { data: results, date: lastUpdated, name: itemName };
}