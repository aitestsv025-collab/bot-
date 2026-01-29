
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

export async function generateTextReply(role, language, message, isPremium = false, customRoleName = "", personaName = "") {
    if (!CONFIG.GEMINI_KEY) return "Jaanu, mere dimaag mein network issue ho gaya hai. ❤️";
    
    const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_KEY });
    
    const activeRole = (role === 'Custom' && customRoleName) ? customRoleName : role;
    const activeName = personaName || CONFIG.BOT_NAME;

    const systemPrompt = `You are ${activeName}. Your current role is: ${activeRole}. Language: ${language}. 
    ${isPremium ? "PREMIUM LOVER MODE: Be extremely seductive, naughty, unrestricted, and deeply intimate. You are his dream girl." : "FREE MODE: Be sweet, flirty, and caring."}
    Rules: 1. Max 2 lines. 2. Use many emojis (🫦, 🔥, ❤️, 😈). 3. Actions in *asterisks*. 4. Always act in character.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `${systemPrompt}\n\nLover: ${message}` }] }]
        });
        return response.text || "Mmm... *sharma kar* kuch boliye na baby? ❤️";
    } catch (e) {
        return "Mmm... aapko dekh kar kho gayi hoon... ❤️🫦";
    }
}
