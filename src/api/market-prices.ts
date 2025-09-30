import express from "express";

import type MessageResponse from "../interfaces/message-response.js";
import type { ListData, MarketPriceMap } from "../utils/scrapers/vfpck-scraper.js";

import { fetchListedItems, fetchMarketList, fetchProductPriceByLocation, fetchProductPriceByProductName } from "../utils/scrapers/vfpck-scraper.js";

const router = express.Router();

type ListApiResponse = MessageResponse & ListData;
type ItemPricesApiResponse = MessageResponse & {
  data: MarketPriceMap;
};
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
  const item = await fetchProductPriceByProductName(name, market);
  res.json({ data: item, message: "Item details fetched successfully" });
});

router.get<PlaceEndpontParams, ItemPricesApiResponse>("/markets/:market", async (req, res) => {
  const market = req.params.market;
  const itemName = req.query.itemName as string;
  const item = await fetchProductPriceByLocation(market, itemName);
  res.json({ data: item, message: "Market price details fetched successfully" });
});

export default router;
