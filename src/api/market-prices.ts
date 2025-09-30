import express from "express";

import type MessageResponse from "../interfaces/message-response.js";
import type { ListData } from "../utils/scrapers/vfpck-scraper.js";

import { fetchListedItems, fetchMarketList } from "../utils/scrapers/vfpck-scraper.js";

const router = express.Router();

type ListApiResponse = MessageResponse & ListData;

router.get<object, ListApiResponse>("/veg/markets", async (req, res) => {
  const markets = await fetchMarketList();
  res.json({ ...markets, message: "Markets listed successfully" });
});

router.get<object, ListApiResponse>("/veg/items", async (req, res) => {
  const items = await fetchListedItems();
  res.json({ ...items, message: "Vegetables and Fruits listed successfully" });
});

export default router;
