
import { GoogleGenAI } from "@google/genai";

const GEMINI_KEY = (process.env.API_KEY || "").trim();

export async function generateTextReply(role, language, message, botName = "Malini", isPremium = false) {
    if (!GEMINI_KEY) return "Uff... network issue hai Jaanu. ❤️";
    
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    
    // Premium users get a more "unlocked" and intimate personality
    const systemPrompt = `You are ${botName}. Role: ${role}. Language: ${language}. 
    ${isPremium ? "You are interacting with your PREMIUM LOVER. Be extremely intimate, daring, and unrestricted in your flirting." : "You are interacting with a free user. Be sweet and flirty but keep it respectful."}
    Interaction rules: 
    1. STRICTLY MAX 2-3 LINES. 
    2. USE MANY EMOJIS (🫦, 🔥, ❤️, 🥰, 🤤, ✨, 🙈, 😈). 
    3. Use *asterisks* for seductive actions. 
    4. Be responsive and deeply loving.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: `${systemPrompt}\n\nLover: ${message}` }] }]
        });
        return response.text || "Mmm... *sharma kar* kuch boliye na baby? ❤️🫦";
    } catch (e) {
        console.error("AI Text Error:", e);
        return "Mmm... *aapko dekh kar kho gayi hoon*... ❤️";
    }
}

export async function generateGFImage(isBold = false) {
    if (!GEMINI_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    
    // Bold images are more seductive/NSFW-style for premium
    const prompt = isBold 
        ? "Cinematic highly realistic 8k photo of a stunningly beautiful Indian woman in very thin black nightwear, messy wet hair, sitting on a bed, seductive look, high fashion, intimate lighting, hyper-realistic skin texture."
        : "A beautiful Indian girl in a cute casual summer dress, smiling, outdoor garden setting, high quality realistic portrait.";
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const candidate = response.candidates?.[0];
        if (candidate) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
            }
        }
    } catch (e) {
        console.error("AI Image Error:", e);
    }
    return null;
}
