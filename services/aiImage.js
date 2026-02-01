
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

// Aapke diye hue NSFW links
const CATEGORIES = {
    STANDING: ["https://ibb.co/SDJ02zVn", "https://ibb.co/6ccNJsrR", "https://ibb.co/bgKjw6ZV"],
    BED: ["https://ibb.co/9mBzn1Hd", "https://ibb.co/39qw35kN", "https://ibb.co/xnNxwNJ"],
    BENT: ["https://ibb.co/L3m5DJ3", "https://ibb.co/1YC28kRM", "https://ibb.co/1JYsxRg1"],
    SITTING: ["https://ibb.co/nN6L0tVN", "https://ibb.co/4gCDQsTY", "https://ibb.co/nN85DDc3"]
};

export async function generateGFImage(isBold = false, isPremium = false, role = 'Girlfriend', userText = "", customAge = null) {
    // Agar BOLD photo mangi hai toh links use karo
    if (isBold) {
        const pool = [...CATEGORIES.STANDING, ...CATEGORIES.BED, ...CATEGORIES.BENT, ...CATEGORIES.SITTING];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // Normal photo ke liye Gemini use karo
    if (!CONFIG.GEMINI_KEY) return null;
    
    const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_KEY });
    let age = customAge || (['Aunty', 'Stepmom'].includes(role) ? 35 : 20);
    
    // Normal flirty prompt for Gemini
    const prompt = `Highly realistic cinematic portrait of a stunningly beautiful ${age} year old Indian woman, wearing stylish casual clothes, smiling playfully at the camera, outdoor soft lighting, 8k resolution, high detail skin texture.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { 
                imageConfig: { aspectRatio: "9:16" }
            }
        });

        const candidate = response.candidates?.[0];
        if (candidate) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return Buffer.from(part.inlineData.data, 'base64');
                }
            }
        }
    } catch (e) {
        console.error("Gemini Normal Image Error:", e);
    }

    // Fallback links agar Gemini normal photo bhi block kar de
    return CATEGORIES.STANDING[Math.floor(Math.random() * CATEGORIES.STANDING.length)];
}
