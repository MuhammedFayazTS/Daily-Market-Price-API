import express from "express";

import type { ListData, MarketPriceResponse } from "../interfaces/common.js";
import type MessageResponse from "../interfaces/message-response.js";

import { fetchListedItems, fetchMarketList, fetchProductPriceByProductNameFromJSON } from "../utils/data-fetcher.js";
import { fetchProductPriceByLocation } from "../utils/scraper.js";

const router = express.Router();

type ListApiResponse = MessageResponse & ListData;
type ItemPricesApiResponse = MessageResponse & MarketPriceResponse;
type ItemEndpontParams = {
  name: string;
};
type PlaceEndpontParams = {
  market: string;
};

router.get<object, ListApiResponse>("/veg/markets", async (req, res) => {
  const markets = await fetchMarketList();
  res.json({ ...markets, message: "Markets listed successfully" });
});

router.get<object, ListApiResponse>("/veg/items", async (req, res) => {
  const items = await fetchListedItems();
  res.json({ ...items, message: "Vegetables and Fruits listed successfully" });
});

router.get<ItemEndpontParams, ItemPricesApiResponse>("/items/:name", async (req, res) => {
  const name = req.params.name;
  const market = req.query.place as string;
  const { data, date, name: itemName } = await fetchProductPriceByProductNameFromJSON(name, market);
  res.json({ data, date, name: itemName, message: "Item details fetched successfully" });
});

router.get<PlaceEndpontParams, ItemPricesApiResponse>("/markets/:market", async (req, res) => {
  const market = req.params.market;
  const itemName = req.query.itemName as string;
  const { data, date } = await fetchProductPriceByLocation(market, itemName);
  res.json({ data, date, message: "Market price details fetched successfully" });
});

export default router;
