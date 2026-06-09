import express from "express";
import { initDb } from "./db.js";
import memosRouter from "./routes/memos.js";
import 'dsmhs-screener'

import path from "path";
import { fileURLToPath } from "url";


const app = express();
const PORT = process.env.PORT || 3030;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.static(path.join(__dirname, "../public")));

app.use(express.json());
app.use("/memos", memosRouter);
app.get("/", (req, res) => {
  res.send("Memo Board API");
});

app.get("/health", (req, res) => {
  res.json({ success: true, data: { ok: true } });
});

initDb((err) => {
  if (err) {
    console.error("Failed to initialize DB", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
  });
});

