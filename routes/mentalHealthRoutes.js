// routes/mentalHealthRoutes.js
const express = require("express");
const router = express.Router();
const {
  getResources,
  chatWithMentalAI,
  getMentalChats,
} = require("../controllers/mentalHealthController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/resources", getResources);
router.post("/chat", verifyToken, chatWithMentalAI);
router.get("/chat-history", verifyToken, getMentalChats);

module.exports = router;
