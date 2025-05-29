// routes/healthChatRoutes.js
const express = require("express");
const router = express.Router();
const {
  chatWithHealthAI,
  getHealthChatHistory,
} = require("../controllers/healthChatController");
const { verifyToken } = require("../middleware/authMiddleware"); // ✅ Corrected import

router.post("/chat", verifyToken, chatWithHealthAI);
router.get("/chat-history", verifyToken, getHealthChatHistory);

module.exports = router;
