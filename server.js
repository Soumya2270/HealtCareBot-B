// server.js
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
require("./config/passport");
const dotenv = require("dotenv");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const mentalHealthRoutes = require("./routes/mentalHealthRoutes");
const healthChatRoutes = require("./routes/healthChatRoutes");
const { chatWithAI } = require("./services/aiService");

dotenv.config();

const app = express();

// CORS setting
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ✅ Connect to MongoDB
connectDB();

// ✅ Express Middleware
app.use(express.json());
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//  Routes
app.use("/auth", authRoutes);
app.use("/api/mental-health", mentalHealthRoutes);
app.use("/api/health", healthChatRoutes);

app.post("/api/mental-health/chat", async (req, res) => {
  const { message, history } = req.body;
  history.push({ role: "user", content: message });

  try {
    const reply = await chatWithAI(history, "mental-health");
    res.json({ reply });
  } catch (err) {
    console.error("❌ Mental Health AI Error:", err);
    res.status(500).json({ error: "AI error" });
  }
});

app.post("/api/health/chat", async (req, res) => {
  const { message, history } = req.body;
  history.push({ role: "user", content: message });

  try {
    const reply = await chatWithAI(history, "chat-support");
    res.json({ reply });
  } catch (err) {
    console.error("❌ Health Chat AI Error:", err);
    res.status(500).json({ error: "AI error" });
  }
});

// home route
app.get("/", (req, res) => {
  res.send("API is running...");
});

//  Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
