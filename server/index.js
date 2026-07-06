const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Parse incoming JSON requests

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "StockWise API is running" });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
