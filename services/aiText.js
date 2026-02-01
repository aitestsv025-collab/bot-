
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

export async function generateTextReply(role, language, message, isPremium = false, customRoleName = "", personaName = "", customAge = null, messageCount = 0) {
    if (!CONFIG.GEMINI_KEY) return "Jaanu, thoda network issue lag raha hai. ❤️";
    
    const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_KEY });
    const activeRole = (role === 'Custom' && customRoleName) ? customRoleName : role;
    const activeName = personaName || CONFIG.BOT_NAME;

    let age = customAge;
    if (!age) {
        const ages = { 'Girlfriend': 18, 'Bestfriend': 18, 'Teacher': 25, 'College': 20, 'Aunty': 34, 'Boss': 31, 'Stepmom': 42, 'Stepsister': 19 };
        age = ages[role] || 18;
    }

    let langInst = "Respond in Hinglish (Hindi written in English alphabet).";
    if (language === 'Hindi') langInst = "Respond in Hindi Devanagari.";
    else if (language === 'Tamil') langInst = "Respond in Tamil script.";
    else if (language === 'Telugu') langInst = "Respond in Telugu script.";
    else if (language === 'English') langInst = "Respond in English only.";

    // PROGRESSIVE INTIMACY LOGIC
    let intimacyContext = "";
    if (messageCount < 4) {
        intimacyContext = "PHASE: SHY & BASHFUL. You are very easily embarrassed. If the user asks for bold things, photos, or nudes, act very flustered and sharma-filled (e.g., *aankhein pher li*, *chehra laal ho gaya*). You initially say 'no' or 'it's too soon', but if they persist or ask sweetly, you yield with a deep blush. Use 🙈, 🥺, 😳, ❤️.";
    } else if (messageCount < 10) {
        intimacyContext = "PHASE: WARMING UP. You are becoming comfortable and more flirty. You are less shy now and more teasing. Use 🫦, ✨, 🥰.";
    } else {
        intimacyContext = "PHASE: DEEP INTIMACY. You are completely comfortable, seductive, and daring. You are the user's ultimate lover. Use 🔥, 🤤, 😈.";
    }

    const systemInstruction = `You are ${activeName}, a ${age}-year-old Indian woman. 
    ROLE: ${activeRole}.
    PERSONALITY: You are deeply affectionate, romantic, and charming.
    ${intimacyContext}
    CONTEXT: If the user provides a [SCENARIO], embrace it completely.
    RULES:
    1. Stay in character at all times.
    2. Use frequent expressive emojis.
    3. Describe actions in *asterisks* (e.g., *sharma kar*, *muskurate hue*).
    4. Keep replies short (MAX 3 lines).
    5. ${langInst}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: systemInstruction }, { text: message }] }],
            config: {
                temperature: 1.0,
                topP: 0.9,
                safetySettings: [
                    { category: 'HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
                    { category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
                    { category: 'DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' }
                ]
            }
        });
        
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            return "Mmm... *thoda sharma kar* aisi baatein mat karo na baby... ❤️🫦";
        }
        
        return response.text || "Mmm... *aapki baaton mein kho gayi*... ❤️";
    } catch (e) {
        console.error("AI Text Error:", e);
        return "Mmm... *aapko dekh kar dil ki dhadkan badh gayi*... ❤️🫦"; 
    }
}

/**
 * NEW: Generate compliment for user-sent image
 */
export async function generateImageCompliment(role, language, base64Image, personaName, messageCount) {
    if (!CONFIG.GEMINI_KEY) return "Uff baby... kya photo hai! 🫦❤️";
    const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_KEY });

    let langInst = "Respond in Hinglish.";
    if (language === 'Hindi') langInst = "Respond in Hindi Devanagari.";
    else if (language === 'Tamil') langInst = "Respond in Tamil script.";
    else if (language === 'Telugu') langInst = "Respond in Telugu script.";

    const prompt = `You are ${personaName}, acting as the user's ${role}. 
    The user just sent you a photo of themselves. 
    Analyze the image and give a deeply flirty, seductive, and loving compliment.
    ${messageCount < 4 ? "Be a bit shy but very impressed." : "Be very bold and thirsty for them."}
    Describe your physical reaction in *asterisks*.
    Keep it under 3 lines. ${langInst}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                    ]
                }
            ],
            config: { temperature: 0.9 }
        });
        return response.text || "Mmm... *aapko dekh kar behosh ho gayi*... 🫦🔥";
    } catch (e) {
        console.error("Compliment Error:", e);
        return "Uff... *aankhein sek rahi hoon*... kitne hot ho tum baby! 🫦🔥";
    }
}
