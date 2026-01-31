
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config.js";

// Positions mapping for intelligent selection (used for Bold/NSFW fallback/pool)
const CATEGORIES = {
    STANDING: ["https://ibb.co/SDJ02zVn", "https://ibb.co/6ccNJsrR", "https://ibb.co/bgKjw6ZV", "https://ibb.co/YB2FMYgf", "https://ibb.co/Gwr4zX6", "https://ibb.co/FqDs9c8c", "https://ibb.co/DHPqjzPb", "https://ibb.co/gZjPMg37", "https://ibb.co/nTyrM2L", "https://ibb.co/23mWdFHJ", "https://ibb.co/bgV8Sx0H", "https://ibb.co/9kk9xnYN", "https://ibb.co/PGGycbV3", "https://ibb.co/Pzmt6sVK", "https://ibb.co/wFzK5HFC", "https://ibb.co/B5d8XgKP", "https://ibb.co/ch3ckg2t", "https://ibb.co/ksrcqW2f", "https://ibb.co/bRJC9sH3", "https://ibb.co/k274SfSh", "https://ibb.co/RTW5ZnH6", "https://ibb.co/CsQKTSMp", "https://ibb.co/Q7KZXyTv"],
    BED: ["https://ibb.co/9mBzn1Hd", "https://ibb.co/39qw35kN", "https://ibb.co/xnNxwNJ", "https://ibb.co/svKHk73V", "https://ibb.co/4ZMQRwqz", "https://ibb.co/s9bDqNqQ", "https://ibb.co/PzWzMF0C", "https://ibb.co/YB2FMYgf", "https://ibb.co/JWPrcN8x", "https://ibb.co/SXcqdq4h", "https://ibb.co/vxH7LT0K", "https://ibb.co/WdV7ztX", "https://ibb.co/jZz2fp3H", "https://ibb.co/Qjf649QL", "https://ibb.co/3Y4kTVpS", "https://ibb.co/zHQSVxdz", "https://ibb.co/27tb8N7S", "https://ibb.co/HfgGg33G", "https://ibb.co/Kc9Fs4hZ", "https://ibb.co/ksLXdXzg", "https://ibb.co/S4Ch21gs", "https://ibb.co/dwcNPjs5", "https://ibb.co/ycVxw3JF", "https://ibb.co/zTWKHjpk", "https://ibb.co/HpLbZfqW", "https://ibb.co/ZzcMkz9v", "https://ibb.co/yCcZXSq", "https://ibb.co/Dfht84W3"],
    BENT: ["https://ibb.co/L3m5DJ3", "https://ibb.co/1YC28kRM", "https://ibb.co/1JYsxRg1", "https://ibb.co/QjMyW5fz", "https://ibb.co/HkjypgC", "https://ibb.co/p6SN50wK", "https://ibb.co/j9yMj1jq", "https://ibb.co/7N2kVtg3", "https://ibb.co/FkvYzQ8k", "https://ibb.co/mrRw4wCk", "https://ibb.co/4RFFrWXt", "https://ibb.co/v6JfWC19", "https://ibb.co/35ghrnfQ", "https://ibb.co/bgw6FKy4", "https://ibb.co/k202FHRF", "https://ibb.co/5xwkntZr", "https://ibb.co/4RfvRSb9", "https://ibb.co/Wpjm93cS", "https://ibb.co/FbDHn42c", "https://ibb.co/RTKJ1z5R", "https://ibb.co/6JZYRqGn", "https://ibb.co/0y4zjZKL", "https://ibb.co/F43rfPSK", "https://ibb.co/nstgLdmF", "https://ibb.co/QjnhsW61"],
    SITTING: ["https://ibb.co/nN6L0tVN", "https://ibb.co/4gCDQsTY", "https://ibb.co/nN85DDc3", "https://ibb.co/JjDf5v3L", "https://ibb.co/gL0KKQ3d", "https://ibb.co/wF0h29hw", "https://ibb.co/bgw6FKy4", "https://ibb.co/WWHdY3kN", "https://ibb.co/fVWWCVMf", "https://ibb.co/g10rZ4Q", "https://ibb.co/qLHMVmB6", "https://ibb.co/RTW5ZnH6"]
};

const BOLD_YOUNG = [...CATEGORIES.STANDING, ...CATEGORIES.BED, ...CATEGORIES.BENT, ...CATEGORIES.SITTING].filter(u => !u.includes('Aunty')); 
const BOLD_AUNTY = ["https://ibb.co/Pzmt6sVK", "https://ibb.co/Kc9Fs4hZ", "https://ibb.co/4RfvRSb9", "https://ibb.co/WWHdY3kN", "https://ibb.co/wFzK5HFC", "https://ibb.co/ksLXdXzg", "https://ibb.co/Wpjm93cS", "https://ibb.co/B5d8XgKP", "https://ibb.co/fVWWCVMf", "https://ibb.co/S4Ch21gs", "https://ibb.co/FbDHn42c", "https://ibb.co/ch3ckg2t", "https://ibb.co/dwcNPjs5", "https://ibb.co/RTKJ1z5R", "https://ibb.co/ksrcqW2f", "https://ibb.co/ycVxw3JF", "https://ibb.co/6JZYRqGn", "https://ibb.co/bRJC9sH3", "https://ibb.co/g10rZ4Q", "https://ibb.co/zTWKHjpk", "https://ibb.co/0y4zjZKL", "https://ibb.co/k274SfSh", "https://ibb.co/HpLbZfqW", "https://ibb.co/F43rfPSK", "https://ibb.co/qLHMVmB6", "https://ibb.co/RTW5ZnH6", "https://ibb.co/ZzcMkz9v", "https://ibb.co/nstgLdmF", "https://ibb.co/CsQKTSMp", "https://ibb.co/yCcZXSq", "https://ibb.co/QjnhsW61", "https://ibb.co/Q7KZXyTv", "https://ibb.co/Dfht84W3"];

const FREE_SAMPLES = ["https://ibb.co/SDJ02zVn", "https://ibb.co/Pzmt6sVK"];

export async function generateGFImage(isBold = false, isPremium = false, role = 'Romantic', userText = "") {
    if (isBold) {
        if (!isPremium) {
            return FREE_SAMPLES[Math.floor(Math.random() * FREE_SAMPLES.length)];
        }

        const lowerText = userText.toLowerCase();
        let targetPool = [];

        // Position Detection
        if (lowerText.match(/(bend|jhuk|back|doggy|behind|piche)/)) {
            targetPool = CATEGORIES.BENT;
        } else if (lowerText.match(/(bed|let|sofa|sleep|lay)/)) {
            targetPool = CATEGORIES.BED;
        } else if (lowerText.match(/(stand|khadi|khade)/)) {
            targetPool = CATEGORIES.STANDING;
        } else if (lowerText.match(/(sit|baith|chair)/)) {
            targetPool = CATEGORIES.SITTING;
        }

        if (targetPool.length === 0) {
            const isAuntyRole = ['Stepmom', 'Teacher'].includes(role);
            targetPool = isAuntyRole ? BOLD_AUNTY : BOLD_YOUNG;
        } else {
            const isAuntyRole = ['Stepmom', 'Teacher'].includes(role);
            if (isAuntyRole) {
                const auntyMatches = targetPool.filter(url => BOLD_AUNTY.includes(url));
                if (auntyMatches.length > 0) targetPool = auntyMatches;
            } else {
                const youngMatches = targetPool.filter(url => BOLD_YOUNG.includes(url));
                if (youngMatches.length > 0) targetPool = youngMatches;
            }
        }
        
        return targetPool[Math.floor(Math.random() * targetPool.length)];
    } else {
        const apiKey = CONFIG.GEMINI_KEY;
        if (!apiKey) return null;

        const ai = new GoogleGenAI({ apiKey });
        
        // --- AGE & ROLE SPECIFIC PROMPT LOGIC ---
        let profileDescription = "";
        switch(role) {
            case 'Romantic':
                profileDescription = "A stunningly beautiful 18-year-old Indian girl, innocent smile, cute casual clothes like a tank top, natural makeup, long straight hair, outdoor sunlight, very realistic.";
                break;
            case 'Naughty':
                profileDescription = "A playful and seductive 21-year-old Indian girl, modern trendy crop top, messy hair, winking at camera, dim bedroom lighting, highly realistic skin.";
                break;
            case 'Teacher':
                profileDescription = "A gorgeous 27-year-old Indian woman as a teacher, wearing an elegant chiffon saree, spectacles, holding a book, professional yet attractive look, classroom background.";
                break;
            case 'Secretary':
                profileDescription = "A sexy 24-year-old Indian secretary, wearing a white formal shirt and black pencil skirt, professional look, modern office interior, high quality photo.";
                break;
            case 'Boss':
                profileDescription = "A sophisticated 32-year-old Indian female boss, wearing a luxurious business suit, confident posture, executive office setting, sharp features.";
                break;
            case 'Stepmom':
                profileDescription = "A mature and elegant 38-year-old Indian woman, wearing a heavy silk saree, sophisticated traditional jewelry, gracefully sitting, warm home interior.";
                break;
            default:
                profileDescription = `A beautiful young Indian woman in ${role} style, realistic portrait, 8k resolution, cinematic lighting.`;
        }

        const prompt = `${profileDescription} Cinematic highly realistic 8k photo, hyper-realistic skin texture, detailed eyes, masterwork quality.`;

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
        } catch (e) { console.error("AI Normal Image Gen Error:", e); }
        return BOLD_YOUNG[0];
    }
}
