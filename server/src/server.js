const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const roomsRouter = require("./routes/rooms");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/rooms", roomsRouter);

// Test route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "RoomCraft server is running"
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`RoomCraft server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);

    process.exit(1);
  }
}

startServer();