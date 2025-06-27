// controllers/healthChatController.js
const HealthChat = require("../models/HealthChat");
const { chatWithAI } = require("../services/aiService");

// POST /api/health/chat
exports.chatWithHealthAI = async (req, res) => {
  const { message } = req.body;
  const userId = req.user ? req.user._id : null;

  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    let userChat = await HealthChat.findOne({ userId });
    const existingMessages = userChat ? userChat.messages : [];

    const fullConversation = [
      ...existingMessages,
      { role: "user", content: message },
    ];

    const aiResponse = await chatWithAI(fullConversation, "general");

    const updatedChat = await HealthChat.findOneAndUpdate(
      { userId },
      {
        $push: {
          messages: [
            { role: "user", content: message },
            { role: "bot", content: aiResponse },
          ],
        },
      },
      { new: true, upsert: true }
    );

    res.json({ reply: aiResponse });
  } catch (err) {
    console.error("Health AI chat error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
};

// GET /api/health/chat-history
exports.getHealthChatHistory = async (req, res) => {
  const userId = req.user ? req.user._id : null;

  try {
    const chat = await HealthChat.findOne({ userId });
    res.json(chat || { messages: [] });
  } catch (err) {
    console.error("Fetch health chat error:", err);
    res.status(500).json({ error: "Failed to fetch health chat history" });
  }
};
