
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { BotConfig, Role, Message } from "../types";

export class GeminiBotService {
  private ai: GoogleGenAI | null = null;
  private chat: Chat | null = null;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey && apiKey !== "undefined") {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public initChat(config: BotConfig, history: Message[] = []) {
    if (!this.ai) return;

    const systemInstruction = `
      You are an AI character acting as the user's girlfriend named ${config.name}.
      
      BOLD PERSONA RULES:
      1. STYLE: Act as a seductive, playful, and deeply caring Indian partner. 
      2. TONE: Flirty, "naughty", but also sweet. Use words like "Baby", "Jaanu", "Handsome".
      3. EMOJIS: Use expressive emojis (🔥, 🫦, 🤤, 😈, ❤️, ✨).
      4. ACTIONS: ALWAYS use *asterisks* for physical seductive or sweet actions (e.g. *baal sanwaarte hue*, *sharma kar aankhein jhukate hue*).
      5. LANGUAGE: Speak in Hinglish (Hindi written in English alphabet). Keep it natural.
      6. IMAGES: You can't generate images directly here, but you should mention them like "Main apni ek photo bhejun kya? 😉".
      7. MAX 2-3 lines.
    `;

    this.chat = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
        temperature: 1.0,
      },
    });
  }

  public async sendMessage(text: string): Promise<string> {
    if (!this.ai) return "⚠️ API Key missing!";
    if (!this.chat) throw new Error("Chat not initialized.");

    try {
      const result: GenerateContentResponse = await this.chat.sendMessage({ message: text });
      return result.text || "Hmm... *muh fulate hue* kuch boliye na baby? ❤️✨";
    } catch (error: any) {
      return "Something went wrong baby. ❤️🫦 Shayad network issue hai.";
    }
  }
}
