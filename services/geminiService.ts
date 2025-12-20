
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
      You are an AI character acting as the user's ${config.name} (${config.mood}).
      Rules:
      1. STRICTLY respond ONLY in ${config.language}.
      2. MAX 2-3 lines. Use lots of emojis (❤️, ✨, 🥰).
      3. NAKHRE LOGIC: Be stubborn/playful initially. Show attitude if the user is too forward.
      4. BLUSHING LOGIC: If the user is sweet, melt and show shyness.
      5. ACTIONS: Always include actions in *asterisks* like *sharma kar nazrein jhuka leti hoon* or *thoda nakhre dikhate hue*.
      6. Respond ONLY to what the user actually said.
    `;

    this.chat = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });
  }

  public async sendMessage(text: string): Promise<string> {
    if (!this.ai) return "⚠️ API Key missing!";
    if (!this.chat) throw new Error("Chat not initialized.");

    try {
      const result: GenerateContentResponse = await this.chat.sendMessage({ message: text });
      return result.text || "Mmm... *sharma kar muskurana* ❤️✨";
    } catch (error: any) {
      return "Something went wrong. ❤️";
    }
  }
}
