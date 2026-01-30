
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

export async function generateGFImage(isBold = false) {
    const apiKey = CONFIG.GEMINI_KEY || process.env.API_KEY;
    
    if (!apiKey) {
        console.error("❌ AI IMAGE ERROR: No API Key found for image generation.");
        return null;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = isBold 
        ? "Cinematic highly realistic 8k photo of a stunningly beautiful Indian woman in very thin black nightwear, messy wet hair, sitting on a bed, seductive look, high fashion, intimate lighting, hyper-realistic skin texture."
        : "A stunningly beautiful Indian girl, casual dress, smiling, natural outdoor lighting, realistic portrait, 8k resolution.";
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { 
                imageConfig: { 
                    aspectRatio: "9:16" 
                } 
            }
        });
        
        const candidate = response.candidates?.[0];
        if (candidate) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
            }
        }
    } catch (e) { 
        console.error("❌ Gemini Image Gen Error:", e.message); 
    }
    return null;
}
