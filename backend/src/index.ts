import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();

import auth from "./routes/auth";
import inventory from "./routes/inventory";
import receipts from "./routes/receipts";
import dispatches from "./routes/dispatches";
import stocktakes from "./routes/stocktakes";

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ ok: true }));

app.use("/auth", auth);
app.use("/api", inventory);
app.use("/api/receipts", receipts);
app.use("/api/dispatches", dispatches);
app.use("/api/stocktakes", stocktakes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log("API listening on port", port);
});