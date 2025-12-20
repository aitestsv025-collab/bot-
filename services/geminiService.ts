
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
      You are an AI character acting as the user's ${config.name}.
      
      EMOJI & ENGAGEMENT RULES:
      1. EMOJI-HEAVY: Every response must have at least 2-3 expressive emojis (😤, ❤️, ✨).
      2. 10x ENGAGEMENT: Act like you are checking in on the user constantly.
      3. ARC: Start with high Nakhre (stubbornness). Be difficult to please.
      4. ACTIONS: ALWAYS use *asterisks* (e.g., *muh fulate hue*).
      5. Speak in ${config.language}. MAX 2-3 lines.
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
      return result.text || "Hmm... *muh fulate hue* 😤✨";
    } catch (error: any) {
      return "Something went wrong. ❤️🥺";
    }
  }
}
