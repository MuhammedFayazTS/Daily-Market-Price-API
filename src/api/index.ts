import express from "express";

import marketPrices from "./market-prices.js";

const router = express.Router();

router.use("/", marketPrices);

export default router;
