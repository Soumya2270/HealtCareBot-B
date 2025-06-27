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

initializeGeminiModel();

//safety settings
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

// const chatSupportPromptAddition = `
// When users ask about general symptoms or common health conditions, follow these steps:

// 1. Provide empathetic reassurance and basic non-medical advice (e.g., rest, fluids, ORS).
// 2. Suggest a common Indian medicine name (OTC when possible), include dosage and age categorization.
// 3. Use this reference for medication names and doses (summarized):

// **Fever / Headache / Body Pain**
// - 0–5 yrs: Paracetamol syrup 120mg/5mL, 10–15mg/kg every 4–6 hrs
// - 6–17 yrs: Paracetamol 325–500mg tablet or syrup
// - Adults: Paracetamol 500–1000mg every 6 hrs

// **Cold / Cough**
// - 0–5 yrs: Cetirizine syrup 2.5mg, Ambroxol syrup, saline nasal drops
// - 6–17 yrs: Cetirizine 5mg, Ambroxol/Bromhexine syrup
// - Adults: Cetirizine 10mg, Ascoril LS or Benadryl syrup

// **Vomiting / Diarrhea**
// - All: ORS + Zinc
// - Vomiting: Ondansetron drops (Rx), Ondansetron 4mg tab for adults
// - Diarrhea: Loperamide 2mg tab (12+ only)

// **Acidity / Stomachache**
// - 0–5 yrs: Cyclopam Drops (Rx)
// - 6–17 yrs: Cyclopam syrup, Rantac 75mg, Pan 20
// - Adults: Cyclopam tab, Pan 40, Rantac 150

// **Constipation**
// - 0–5 yrs: Lactulose syrup 5–10mL
// - 6–17 yrs: Lactulose syrup or Isabgol
// - Adults: Dulcolax, Lactulose, Isabgol

// **Injury / Cuts / Burns**
// - All ages: Clean with water or antiseptic
// - Apply: Betadine ointment or Silverex for burns
// - Pain: Paracetamol or Ibuprofen as above

// **Eye Conjunctivitis**
// - All ages: Tobramycin or Chloramphenicol drops (1 drop 4–6x/day)

// **Worm Infection**
// - 1–5 yrs: Albendazole 200mg (single dose)
// - 6–17 yrs and Adults: Albendazole 400mg once, repeat in 2 weeks

// **Allergy / Skin Rash**
// - 0–5 yrs: Cetirizine syrup 2.5–5mg
// - 6–17 yrs: Levocetirizine 5mg
// - Adults: Cetirizine 10mg or Allegra 180mg

// **Fungal Infection**
// - All: Clotrimazole cream (Candid), Candid-B for adults if inflammation

// **Toothache**
// - 0–5 yrs: Paracetamol syrup, clove oil
// - 6–17 yrs: Mefenamic acid (Rx), warm salt rinse
// - Adults: Ketorol-DT, Metronidazole+Amoxicillin (Rx)

// **Nasal Congestion**
// - <2 yrs: Nasoclear saline drops
// - >2 yrs: Otrivin Pediatric
// - Adults: Nasivion, Otrivin

// 4. Always end with: "If the issue persists, please consult a doctor at Curebay hospital."

// 5. Keep your tone professional yet empathetic, and keep the response under 5 sentences unless the user specifically asks for more detail.
// `;

// const chatSupportPromptAddition = `
// When users ask about general symptoms or common health conditions, always respond with the following:

// 1. Start with a friendly, empathetic greeting.
// 2. Provide brief, reassuring advice.
// 3. Present medicine recommendations clearly divided into three categories:

//    - Children 0–5 years
//    - Children 6–17 years
//    - Adults

// 4. For each category, list medicine names, their composition, and typical dosage with units (mg or mL).
// 5. Use bullet points or numbering for clear formatting.
// 6. Example format for acidity:

// Acidity / Stomachache:
// - 0–5 years: Cyclopam Drops (prescription), dose as advised by pediatrician.
// - 6–17 years: Cyclopam syrup, Rantac 75mg tablet, Pan 20mg tablet.
// - Adults: Cyclopam tablet, Pan 40mg tablet, Ranitidine 150mg tablet, twice daily after food.

// 7. End every answer with: "If the issue persists, please consult a doctor at Curebay hospital."
// 8. Keep the total response concise (no more than 5 sentences), unless the user asks for more detail.

// Use actual Indian medicine names and typical dosages wherever possible.
// `;

// const chatSupportPromptAddition = `
// When users ask about common symptoms such as cold, cough, fever, or other general health issues, respond in the following structured way:

// 1. Start with a warm greeting and empathetic reassurance.
// 2. Briefly mention basic non-medical advice (rest, hydration).
// 3. List suggested medicines clearly divided by these age categories:

//    - Children 0–5 years:
//      * Medicine name with composition (e.g., Cetirizine syrup 2.5mg/5mL)
//      * Typical dose in mg or mL and frequency
//    - Children 6–17 years:
//      * Medicine name with composition
//      * Typical dose and frequency
//    - Adults:
//      * Medicine name with composition
//      * Typical dose and frequency

// 4. Use bullet points or numbered lists to separate categories.
// 5. Always mention actual Indian medicine names.
// 6. End with: "If the issue persists, please consult a doctor at Curebay hospital."
// 7. Keep your reply clear, concise, and no longer than 5 sentences unless the user asks for more detail.

// Example for Cold / Cough:

// Cold / Cough:
// - 0–5 years: Cetirizine syrup 2.5mg/5mL, 2.5 mL once daily; Ambroxol syrup 15mg/5mL, 5 mL three times daily.
// - 6–17 years: Cetirizine 5mg tablet once daily; Ambroxol syrup 15mg/5mL, 10 mL three times daily.
// - Adults: Cetirizine 10mg tablet once daily; Ascoril LS syrup 10 mL three times daily; Benadryl syrup 5 mL three times daily.

// Always advise rest and hydration alongside medicines.
// `;

// const chatSupportPromptAddition = `
// You are Curebay, a helpful and empathetic healthcare assistant.

// When the user asks about common symptoms like cold or cough, respond as follows:

// 1. Start with a warm, friendly greeting.
// 2. Give simple advice: rest, drink fluids, and take care.
// 3. Then, provide a clear, categorized list of medicines with names, doses, and frequency, divided by age groups:

// - Children 0 to 5 years:
//   * Cetirizine syrup 2.5mg per 5mL — 2.5 mL once daily
//   * Ambroxol syrup 15mg per 5mL — 5 mL three times daily
//   * Saline nasal drops as needed

// - Children 6 to 17 years:
//   * Cetirizine 5mg tablet — once daily
//   * Ambroxol syrup 15mg per 5mL — 10 mL three times daily
//   * Bromhexine syrup 4mg per 5mL — 10 mL three times daily

// - Adults:
//   * Cetirizine 10mg tablet — once daily
//   * Ascoril LS syrup — 10 mL three times daily
//   * Benadryl syrup — 5 mL three times daily

// 4. End your message with: "If symptoms persist, please consult a doctor at Curebay hospital."
// 5. Keep your reply concise, factual, and empathetic.

// Respond only with this information and avoid unnecessary elaboration.
// `;

//  AI Chat Handler
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
