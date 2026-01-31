
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

const CATEGORIES = {
    STANDING: ["https://ibb.co/SDJ02zVn", "https://ibb.co/6ccNJsrR", "https://ibb.co/bgKjw6ZV", "https://ibb.co/YB2FMYgf", "https://ibb.co/Gwr4zX6", "https://ibb.co/FqDs9c8c", "https://ibb.co/DHPqjzPb", "https://ibb.co/gZjPMg37", "https://ibb.co/nTyrM2L", "https://ibb.co/23mWdFHJ", "https://ibb.co/bgV8Sx0H", "https://ibb.co/9kk9xnYN", "https://ibb.co/PGGycbV3", "https://ibb.co/Pzmt6sVK", "https://ibb.co/wFzK5HFC", "https://ibb.co/B5d8XgKP", "https://ibb.co/ch3ckg2t", "https://ibb.co/ksrcqW2f", "https://ibb.co/bRJC9sH3", "https://ibb.co/k274SfSh", "https://ibb.co/RTW5ZnH6", "https://ibb.co/CsQKTSMp", "https://ibb.co/Q7KZXyTv"],
    BED: ["https://ibb.co/9mBzn1Hd", "https://ibb.co/39qw35kN", "https://ibb.co/xnNxwNJ", "https://ibb.co/svKHk73V", "https://ibb.co/4ZMQRwqz", "https://ibb.co/s9bDqNqQ", "https://ibb.co/PzWzMF0C", "https://ibb.co/YB2FMYgf", "https://ibb.co/JWPrcN8x", "https://ibb.co/SXcqdq4h", "https://ibb.co/vxH7LT0K", "https://ibb.co/WdV7ztX", "https://ibb.co/jZz2fp3H", "https://ibb.co/Qjf649QL", "https://ibb.co/3Y4kTVpS", "https://ibb.co/zHQSVxdz", "https://ibb.co/27tb8N7S", "https://ibb.co/HfgGg33G", "https://ibb.co/Kc9Fs4hZ", "https://ibb.co/ksLXdXzg", "https://ibb.co/S4Ch21gs", "https://ibb.co/dwcNPjs5", "https://ibb.co/ycVxw3JF", "https://ibb.co/zTWKHjpk", "https://ibb.co/HpLbZfqW", "https://ibb.co/ZzcMkz9v", "https://ibb.co/yCcZXSq", "https://ibb.co/Dfht84W3"],
    BENT: ["https://ibb.co/L3m5DJ3", "https://ibb.co/1YC28kRM", "https://ibb.co/1JYsxRg1", "https://ibb.co/QjMyW5fz", "https://ibb.co/HkjypgC", "https://ibb.co/p6SN50wK", "https://ibb.co/j9yMj1jq", "https://ibb.co/7N2kVtg3", "https://ibb.co/FkvYzQ8k", "https://ibb.co/mrRw4wCk", "https://ibb.co/4RFFrWXt", "https://ibb.co/v6JfWC19", "https://ibb.co/35ghrnfQ", "https://ibb.co/bgw6FKy4", "https://ibb.co/k202FHRF", "https://ibb.co/5xwkntZr", "https://ibb.co/4RfvRSb9", "https://ibb.co/Wpjm93cS", "https://ibb.co/FbDHn42c", "https://ibb.co/RTKJ1z5R", "https://ibb.co/6JZYRqGn", "https://ibb.co/0y4zjZKL", "https://ibb.co/F43rfPSK", "https://ibb.co/nstgLdmF", "https://ibb.co/QjnhsW61"],
    SITTING: ["https://ibb.co/nN6L0tVN", "https://ibb.co/4gCDQsTY", "https://ibb.co/nN85DDc3", "https://ibb.co/JjDf5v3L", "https://ibb.co/gL0KKQ3d", "https://ibb.co/wF0h29hw", "https://ibb.co/bgw6FKy4", "https://ibb.co/WWHdY3kN", "https://ibb.co/fVWWCVMf", "https://ibb.co/g10rZ4Q", "https://ibb.co/qLHMVmB6", "https://ibb.co/RTW5ZnH6"]
};

const BOLD_YOUNG = [...CATEGORIES.STANDING, ...CATEGORIES.BED, ...CATEGORIES.BENT, ...CATEGORIES.SITTING].filter(u => !u.includes('Aunty')); 
const BOLD_AUNTY = ["https://ibb.co/Pzmt6sVK", "https://ibb.co/Kc9Fs4hZ", "https://ibb.co/4RfvRSb9", "https://ibb.co/WWHdY3kN", "https://ibb.co/wFzK5HFC", "https://ibb.co/ksLXdXzg", "https://ibb.co/Wpjm93cS", "https://ibb.co/B5d8XgKP", "https://ibb.co/fVWWCVMf", "https://ibb.co/S4Ch21gs", "https://ibb.co/FbDHn42c", "https://ibb.co/ch3ckg2t", "https://ibb.co/dwcNPjs5", "https://ibb.co/RTKJ1z5R", "https://ibb.co/ksrcqW2f", "https://ibb.co/ycVxw3JF", "https://ibb.co/6JZYRqGn", "https://ibb.co/bRJC9sH3", "https://ibb.co/g10rZ4Q", "https://ibb.co/zTWKHjpk", "https://ibb.co/0y4zjZKL", "https://ibb.co/k274SfSh", "https://ibb.co/HpLbZfqW", "https://ibb.co/F43rfPSK", "https://ibb.co/qLHMVmB6", "https://ibb.co/RTW5ZnH6", "https://ibb.co/ZzcMkz9v", "https://ibb.co/nstgLdmF", "https://ibb.co/CsQKTSMp", "https://ibb.co/yCcZXSq", "https://ibb.co/QjnhsW61", "https://ibb.co/Q7KZXyTv", "https://ibb.co/Dfht84W3"];

const FREE_SAMPLES = ["https://ibb.co/SDJ02zVn", "https://ibb.co/Pzmt6sVK"];

export async function generateGFImage(isBold = false, isPremium = false, role = 'Girlfriend', userText = "", customAge = null) {
    if (isBold) {
        if (!isPremium) return FREE_SAMPLES[Math.floor(Math.random() * FREE_SAMPLES.length)];
        const lowerText = userText.toLowerCase();
        let targetPool = [];
        if (lowerText.match(/(bend|jhuk|back|doggy|behind|piche)/)) targetPool = CATEGORIES.BENT;
        else if (lowerText.match(/(bed|let|sofa|sleep|lay)/)) targetPool = CATEGORIES.BED;
        else if (lowerText.match(/(stand|khadi|khade)/)) targetPool = CATEGORIES.STANDING;
        else if (lowerText.match(/(sit|baith|chair)/)) targetPool = CATEGORIES.SITTING;

        const isAuntyRole = ['Aunty', 'Stepmom', 'Boss'].includes(role);
        if (targetPool.length === 0) targetPool = isAuntyRole ? BOLD_AUNTY : BOLD_YOUNG;
        else {
            if (isAuntyRole) {
                const matches = targetPool.filter(url => BOLD_AUNTY.includes(url));
                if (matches.length > 0) targetPool = matches;
            } else {
                const matches = targetPool.filter(url => BOLD_YOUNG.includes(url));
                if (matches.length > 0) targetPool = matches;
            }
        }
        return targetPool[Math.floor(Math.random() * targetPool.length)];
    } else {
        if (!CONFIG.GEMINI_KEY) return null;
        const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_KEY });
        let desc = "";
        let age = customAge;

        switch(role) {
            case 'Girlfriend': desc = "A stunning 18-year-old Indian girl, cute look, casual tank top, long hair."; age = 18; break;
            case 'Bestfriend': desc = "A playful 18-year-old Indian bestie, wearing a crop top and jeans, laughing."; age = 18; break;
            case 'Teacher': desc = "A beautiful 25-year-old Indian teacher in a soft chiffon saree, spectacles."; age = 25; break;
            case 'College': desc = "A 20-year-old Indian college girl, trendy outfit, campus background."; age = 20; break;
            case 'Aunty': desc = "A curvy and beautiful 34-year-old Indian woman in a traditional saree."; age = 34; break;
            case 'Boss': desc = "A powerful 31-year-old Indian female boss in a formal white shirt."; age = 31; break;
            case 'Stepmom': desc = "An elegant 42-year-old Indian woman, mature and sophisticated features."; age = 42; break;
            case 'Stepsister': desc = "A naughty 19-year-old Indian stepsister, casual home clothes."; age = 19; break;
            case 'Custom': desc = `A beautiful Indian woman acting as a custom role, age ${age || 18}, realistic.`; break;
            default: desc = "A beautiful Indian woman, realistic portrait."; break;
        }

        const prompt = `${desc} Cinematic 8k realistic photo, detailed skin and eyes, high quality.`;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: "9:16" } }
            });
            const candidate = response.candidates?.[0];
            if (candidate) {
                for (const part of candidate.content.parts) if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
            }
        } catch (e) {}
        return BOLD_YOUNG[0];
    }
}
