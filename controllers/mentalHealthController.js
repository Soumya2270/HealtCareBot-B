// controllers/mentalHealthController.js
const MentalResource = require("../models/MentalResource");
const MentalChat = require("../models/MentalChat");
const { chatWithAI } = require("../services/aiService"); // Ensure this path is correct

// Get all mental health resources
exports.getResources = async (req, res) => {
  try {
    const resources = await MentalResource.find();
    res.json(resources);
  } catch (err) {
    console.error("Error fetching resources:", err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
};

// AI mental health chat
exports.chatWithMentalAI = async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    // Get user's existing chat history
    let chat = await MentalChat.findOne({ userId });

    if (!chat) {
      chat = new MentalChat({ userId, messages: [] });
    }

    const conversation = [...chat.messages, { role: "user", content: message }];

    // Call your AI service with conversation history
    const aiReply = await chatWithAI(conversation);

    // Append new messages to chat
    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "bot", content: aiReply });

    await chat.save();

    res.json({ reply: aiReply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "AI chat failed. Please try again." });
  }
};

// Get past mental health chats
exports.getMentalChats = async (req, res) => {
  // Assuming you have access to req.user._id from your auth middleware
  const userId = req.user ? req.user._id : null;

  try {
    const chats = await MentalChat.findOne({ userId: userId });
    res.json(chats || { messages: [] });
  } catch (err) {
    console.error("Could not fetch chat history:", err);
    res.status(500).json({ error: "Could not fetch chat history" });
  }
};
