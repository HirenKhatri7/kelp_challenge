import express from "express";
import dotenv from "dotenv";
import { parseCsv } from "../services/csvConverter.js";
import { importUsers } from "../services/userService.js";

dotenv.config();
const router = express.Router();

router.post("/import", async (req, res) => {
  try {
    const csvPath = process.env.CSV_PATH;
    const batchSize = parseInt(process.env.BATCH_SIZE || "1000", 10);
    const generator = parseCsv(csvPath);
    await importUsers(generator, batchSize);
    res.json({ message: "Import completed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
