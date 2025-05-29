// services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in .env file.");
  throw new Error("Gemini API Key is missing.");
}

console.log(
  "Gemini API Key loaded (first 5 chars):",
  GEMINI_API_KEY.substring(0, 5) + "..."
);

const genAIInstance = new GoogleGenerativeAI(GEMINI_API_KEY);
let model = null;

async function initializeGeminiModel() {
  const preferredModelId = "gemini-1.5-flash";

  try {
    console.log(
      `\n--- Initializing Gemini with model: ${preferredModelId} ---`
    );
    model = genAIInstance.getGenerativeModel({ model: preferredModelId });
    console.log("✅ Gemini model initialized successfully.");
  } catch (error) {
    console.error(
      "❌ Error initializing Gemini model:",
      error.message || error
    );
    throw error;
  }
}

// Initialize on startup
initializeGeminiModel();

// Shared safety settings
const SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
];

const BASE_PREFACE = `You are Curebay, a helpful and empathetic healthcare bot. Your primary goal is to provide general, accurate, and easy-to-understand health information.

**Important Disclaimer:** You are an AI and cannot provide medical advice, diagnosis, or treatment. Users must consult a qualified healthcare professional for any medical concerns.`;

const mentalHealthPromptAddition = `
If the user mentions mental health issues, stress, depression, or trauma:

1. Be deeply empathetic.
2. Encourage the user to contact a mental health professional.
3. Clearly mention: "Please contact a mental health professional in our Curebay hospital immediately for support."
4. Keep your response to 5 sentences max.
`;

const chatSupportPromptAddition = `
When users ask about common symptoms such as fever, cough, cold, headache, or pain:

1. Recommend basic remedies (e.g., rest, hydration) if applicable.
2. Suggest an appropriate over-the-counter medicine by name, including its composition and a typical adult dosage (e.g., "Paracetamol 500mg - 1 tablet every 6 hours after food").
3. Responses must mention actual medicine names with their compositions.
4. Always end with: "If the issue persists, please consult a doctor at Curebay hospital."
5. Keep your answer informative but concise (no more than 5 sentences).
`;

// 🧠 AI Chat Handler
exports.chatWithAI = async (
  chatHistoryFromController,
  chatType = "chat-support"
) => {
  if (!model) {
    console.error("❌ Gemini model is not initialized.");
    throw new Error("AI service not ready. Please check server logs.");
  }

  try {
    const formattedHistory = chatHistoryFromController.map((msg) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const currentUserMessagePart = formattedHistory.pop();
    const currentUserMessageContent = currentUserMessagePart.parts[0].text;

    const chat = model.startChat({
      history: formattedHistory,
      safetySettings: SAFETY_SETTINGS,
    });

    let contextPrompt = BASE_PREFACE;
    if (chatType === "mental-health") {
      contextPrompt += mentalHealthPromptAddition;
    } else {
      contextPrompt += chatSupportPromptAddition;
    }

    const fullPrompt = `${contextPrompt}

Start each conversation with a friendly greeting like:
"Hello! I'm Curebay, your virtual health assistant."

User: ${currentUserMessageContent}
`;

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini AI responded:", text.substring(0, 100) + "...");
    return text;
  } catch (error) {
    console.error(
      "Gemini AI Service Error:",
      error.response?.data || error.message || error
    );
    throw new Error("Failed to get response from AI. Check server logs.");
  }
};
