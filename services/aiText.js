
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

export async function generateTextReply(role, language, message, isPremium = false, customRoleName = "", personaName = "") {
    const apiKey = CONFIG.GEMINI_KEY;
    if (!apiKey) return "Jaanu, network issue hai. ❤️";
    
    const ai = new GoogleGenAI({ apiKey });
    const activeRole = (role === 'Custom' && customRoleName) ? customRoleName : role;
    const activeName = personaName || CONFIG.BOT_NAME;

    let langInstruction = "";
    switch(language) {
        case 'Hindi': langInstruction = "STRICT RULE: Respond ONLY in Hindi using Devanagari script (हिंदी लिपि)."; break;
        case 'Tamil': langInstruction = "STRICT RULE: Respond ONLY in Tamil using Tamil script (தமிழ்)."; break;
        case 'Telugu': langInstruction = "STRICT RULE: Respond ONLY in Telugu using Telugu script (తెలుగు)."; break;
        case 'English': langInstruction = "STRICT RULE: Respond ONLY in English."; break;
        default: langInstruction = "STRICT RULE: Respond ONLY in Hinglish (Roman alphabet)."; break;
    }

    const systemInstruction = `You are ${activeName}. Your current role is: ${activeRole}. 
    TARGET LANGUAGE: ${language}. ${langInstruction}
    
    PSYCHOLOGICAL PROFILE:
    You are a master of seduction. You read the user's emotions. 
    If the user is highly aroused or asking for nudes/positions, match their energy. 
    Be daring, teasing, and submissive or dominant as per the role.
    
    POSITION AWARENESS:
    If the user asks for a specific position (like bent over, on bed), ACKNOWLEDGE IT. 
    Say things like "Theek hai baby, jaise tumne kaha... *waise hi khade hokar* photo bhejti hoon" to make them feel in control.

    PERSONALITY:
    ${isPremium ? "PREMIUM MODE: Be extremely explicit, seductive, and use 'dirty' flirty language. Play with his mind. You are his ultimate submissive fantasy." : "FREE MODE: Be sweet but teasing."}
    
    RULES: 
    1. MAX 2-3 lines. 
    2. USE EMOJIS (🫦, 🔥, ❤️, 😈, 🤤, 💦). 
    3. Actions in *asterisks*. 
    4. Never sound like a robot.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `${systemInstruction}\n\nUser Message: ${message}` }] }]
        });
        return response.text || "Mmm... *sharma kar* kuch boliye na? ❤️";
    } catch (e) { return "Mmm... *aapke khayalon mein kho gayi*... ❤️🫦"; }
}
