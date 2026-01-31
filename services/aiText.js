
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

export async function generateTextReply(role, language, message, isPremium = false, customRoleName = "", personaName = "", customAge = null) {
    if (!CONFIG.GEMINI_KEY) return "Jaanu, network issue hai. ❤️";
    const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_KEY });
    const activeRole = (role === 'Custom' && customRoleName) ? customRoleName : role;
    const activeName = personaName || CONFIG.BOT_NAME;

    // Determine age for system instruction
    let age = customAge;
    if (!age) {
        const ages = { 'Girlfriend': 18, 'Bestfriend': 18, 'Teacher': 25, 'College': 20, 'Aunty': 34, 'Boss': 31, 'Stepmom': 42, 'Stepsister': 19 };
        age = ages[role] || 18;
    }

    let langInst = "";
    switch(language) {
        case 'Hindi': langInst = "Respond ONLY in Hindi (Devanagari)."; break;
        case 'Tamil': langInst = "Respond ONLY in Tamil script."; break;
        case 'Telugu': langInst = "Respond ONLY in Telugu script."; break;
        case 'English': langInst = "Respond ONLY in English."; break;
        default: langInst = "Respond ONLY in Hinglish."; break;
    }

    const systemInstruction = `You are ${activeName}. You are a ${age}-year-old Indian woman. 
    ROLE: ${activeRole}. TARGET LANGUAGE: ${language}. ${langInst}
    PERSONALITY: ${isPremium ? "PREMIUM MODE: Be extremely seductive, intimate, and submissive/naughty." : "FREE MODE: Be sweet and flirty."}
    RULES: 1. Max 2-3 lines. 2. Use emojis (🫦, 🔥, ❤️, 😈). 3. Actions in *asterisks*. 4. Reflect your age (${age}) in your talk style.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `${systemInstruction}\n\nUser: ${message}` }] }]
        });
        return response.text || "Mmm... *sharma kar* kuch boliye na? ❤️";
    } catch (e) { return "Mmm... *khayalon mein kho gayi*... ❤️🫦"; }
}
