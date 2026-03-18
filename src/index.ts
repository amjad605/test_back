import mongoose from "mongoose";
import "dotenv/config";
import express from "express";
import { globalErrorHandler } from "./utils/GlobalErrorHandler";
import appRouter from "./appRouter";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://gbg-crm.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length", "Content-Disposition"],
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/", appRouter);
app.use(globalErrorHandler);

app.all("*", (req, res) => {
  res.status(404).json({
    status: "error",
    data: {
      message: "Endpoint Not found",
    },
  });
});

mongoose.connect(process.env.DB_URL || "").then(() => {
  console.log("Connected to database");
});

app.listen(4000, () => {
  console.log("Listening on port 4000");
});
