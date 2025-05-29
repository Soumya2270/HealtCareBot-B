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
const mentalHealthRoutes = require("./routes/mentalHealthRoutes"); // ✅ Imported
const healthChatRoutes = require("./routes/healthChatRoutes"); // ✅ Imported
const { chatWithAI } = require("./services/aiService"); // ✅ Gemini AI service

dotenv.config();

const app = express();

// ✅ Enable CORS
const allowedOrigins = [
  "http://localhost:5173", // local development
  "https://health-care-bot-f.vercel.app/", // your deployed frontend
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // if using cookies or Authorization headers
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

// ✅ Route handlers
app.use("/auth", authRoutes);
app.use("/api/mental-health", mentalHealthRoutes); // Mental health routes
app.use("/api/health", healthChatRoutes); // General health routes

// ✅ Optional direct AI endpoints (used in frontend Axios POST requests)
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

// ✅ Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
