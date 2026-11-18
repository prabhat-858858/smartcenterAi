
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import monitoringRoutes from "./routes/monitoringRoutes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

app.use("/api/monitoring", monitoringRoutes);

app.get("/", (req, res) => {
  res.send("SmartCentre AI Backend Running");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    httpServer.listen(process.env.PORT || 8000, () => {
      console.log("Server running on port 8000");
    });
  })
  .catch(console.error);
