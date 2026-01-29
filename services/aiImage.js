
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

export async function generateGFImage(isBold = false) {
    if (!CONFIG.GEMINI_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_KEY });
    
    const prompt = isBold 
        ? "Cinematic 8k photo of a beautiful Indian woman, messy hair, low light, thin nightwear, seductive expression, sitting on bed, hyper-realistic."
        : "A stunningly beautiful Indian girl, casual dress, smiling, natural outdoor lighting, realistic portrait.";
    
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
    } catch (e) { console.error("Image Gen Error:", e); }
    return null;
}
