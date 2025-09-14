import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import auth from "./routes/auth";
import inventory from "./routes/inventory";
import receipts from "./routes/receipts";
import dispatches from "./routes/dispatches";
import stocktakes from "./routes/stocktakes";
import users from "./routes/users";
import messages from "./routes/messages";

dotenv.config();

const app = express();
const server = http.createServer(app);  
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(express.json());
app.use(morgan("dev"));

// static uploads
const uploadDir = path.resolve(process.cwd(), "uploads/items");
fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/", (_req, res) => res.json({ ok: true }));

// routes
app.use("/auth", auth);
app.use("/api", inventory);
app.use("/api/receipts", receipts);
app.use("/api/dispatches", dispatches);
app.use("/api/stocktakes", stocktakes);
app.use("/api/users", users);
app.use("/api/messages", messages);

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  console.log("🚀 API listening on port", port);
});
