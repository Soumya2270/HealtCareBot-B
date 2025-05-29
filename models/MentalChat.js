// models/MentalChat.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: String, // 'user' or 'bot'
  content: String,
});

const MentalChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  messages: [MessageSchema],
});

module.exports = mongoose.model("MentalChat", MentalChatSchema);
