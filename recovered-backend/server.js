import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import healthRoutes from "./routes/healthRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://3.209.17.214:5173",
    ],
    credentials: true,
  })
);

// =========================
// API Routes
// =========================

// Health API
app.use("/api", healthRoutes);

// Contact API
app.use("/api/contact", contactRoutes);

// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✨ Server running smoothly on port ${PORT}`);
});
