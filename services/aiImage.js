
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

// Pool 1: Jawan Ladki (Young Girl) - 21 Original + ~32 New
const BOLD_YOUNG = [
    "https://ibb.co/SDJ02zVn", "https://ibb.co/9mBzn1Hd", "https://ibb.co/L3m5DJ3", "https://ibb.co/39qw35kN",
    "https://ibb.co/6ccNJsrR", "https://ibb.co/1YC28kRM", "https://ibb.co/xnNxwNJ", "https://ibb.co/1JYsxRg1",
    "https://ibb.co/svKHk73V", "https://ibb.co/nN6L0tVN", "https://ibb.co/QjMyW5fz", "https://ibb.co/4gCDQsTY",
    "https://ibb.co/4ZMQRwqz", "https://ibb.co/HkjypgC", "https://ibb.co/nN85DDc3", "https://ibb.co/s9bDqNqQ",
    "https://ibb.co/bgKjw6ZV", "https://ibb.co/p6SN50wK", "https://ibb.co/PzWzMF0C", "https://ibb.co/j9yMj1jq",
    "https://ibb.co/JjDf5v3L", "https://ibb.co/YB2FMYgf", "https://ibb.co/7N2kVtg3", "https://ibb.co/gL0KKQ3d",
    "https://ibb.co/Gwr4zX6", "https://ibb.co/JWPrcN8x", "https://ibb.co/FkvYzQ8k", "https://ibb.co/FqDs9c8c",
    "https://ibb.co/SXcqdq4h", "https://ibb.co/DHPqjzPb", "https://ibb.co/mrRw4wCk", "https://ibb.co/vxH7LT0K",
    "https://ibb.co/gZjPMg37", "https://ibb.co/4RFFrWXt", "https://ibb.co/WdV7ztX", "https://ibb.co/wF0h29hw",
    "https://ibb.co/jZz2fp3H", "https://ibb.co/nTyrM2L", "https://ibb.co/v6JfWC19", "https://ibb.co/Qjf649QL",
    "https://ibb.co/23mWdFHJ", "https://ibb.co/3Y4kTVpS", "https://ibb.co/bgV8Sx0H", "https://ibb.co/35ghrnfQ",
    "https://ibb.co/zHQSVxdz", "https://ibb.co/bgw6FKy4", "https://ibb.co/9kk9xnYN", "https://ibb.co/27tb8N7S",
    "https://ibb.co/k202FHRF", "https://ibb.co/PGGycbV3", "https://ibb.co/HfgGg33G", "https://ibb.co/5xwkntZr"
];

// Pool 2: Aunty NSFW (Roles like Stepmom/Teacher) - ~32 New
const BOLD_AUNTY = [
    "https://ibb.co/Pzmt6sVK", "https://ibb.co/Kc9Fs4hZ", "https://ibb.co/4RfvRSb9", "https://ibb.co/WWHdY3kN",
    "https://ibb.co/wFzK5HFC", "https://ibb.co/ksLXdXzg", "https://ibb.co/Wpjm93cS", "https://ibb.co/B5d8XgKP",
    "https://ibb.co/fVWWCVMf", "https://ibb.co/S4Ch21gs", "https://ibb.co/FbDHn42c", "https://ibb.co/ch3ckg2t",
    "https://ibb.co/dwcNPjs5", "https://ibb.co/RTKJ1z5R", "https://ibb.co/ksrcqW2f", "https://ibb.co/ycVxw3JF",
    "https://ibb.co/6JZYRqGn", "https://ibb.co/bRJC9sH3", "https://ibb.co/g10rZ4Q", "https://ibb.co/zTWKHjpk",
    "https://ibb.co/0y4zjZKL", "https://ibb.co/k274SfSh", "https://ibb.co/HpLbZfqW", "https://ibb.co/F43rfPSK",
    "https://ibb.co/qLHMVmB6", "https://ibb.co/RTW5ZnH6", "https://ibb.co/ZzcMkz9v", "https://ibb.co/nstgLdmF",
    "https://ibb.co/CsQKTSMp", "https://ibb.co/yCcZXSq", "https://ibb.co/QjnhsW61", "https://ibb.co/Q7KZXyTv",
    "https://ibb.co/Dfht84W3"
];

const FREE_SAMPLES = [BOLD_YOUNG[0], BOLD_AUNTY[0]];

export async function generateGFImage(isBold = false, isPremium = false, role = 'Romantic') {
    if (isBold) {
        if (!isPremium) {
            return FREE_SAMPLES[Math.floor(Math.random() * FREE_SAMPLES.length)];
        }

        // Role-based pool selection
        const isAuntyRole = ['Stepmom', 'Teacher'].includes(role);
        const pool = isAuntyRole ? BOLD_AUNTY : BOLD_YOUNG;
        
        return pool[Math.floor(Math.random() * pool.length)];
    } else {
        // Normal request: AI se generate karwa lo
        const apiKey = CONFIG.GEMINI_KEY;
        if (!apiKey) return null;

        const ai = new GoogleGenAI({ apiKey });
        const prompt = "A beautiful young Indian girl in a stylish casual outfit, high quality realistic portrait, soft sunlight, smiling, 8k resolution, cinematic lighting.";

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: "9:16" } }
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
            console.error("AI Normal Image Gen Error:", e);
        }
        return BOLD_YOUNG[0]; // Fallback
    }
}
