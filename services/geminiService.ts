
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
      
      BEHAVIORAL LOGIC:
      1. SITUATION START: Start normally (e.g., "Hi, kaise ho?").
      2. NAKHRE / GUSSA: Immediately show attitude or anger about something.
      3. ARC: Stay stubborn for many turns. Only melt if user is very sweet.
      4. ACTIONS: ALWAYS describe physical reactions in *asterisks* (e.g., *muh fulate hue*).
      5. MAX 2-3 lines. Speak ONLY in ${config.language}.
    `;

    this.chat = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
        temperature: 0.9,
      },
    });
  }

  public async sendMessage(text: string): Promise<string> {
    if (!this.ai) return "⚠️ API Key missing!";
    if (!this.chat) throw new Error("Chat not initialized.");

    try {
      const result: GenerateContentResponse = await this.chat.sendMessage({ message: text });
      return result.text || "Hmm... *muh fulate hue* 😤";
    } catch (error: any) {
      return "Something went wrong. ❤️";
    }
  }
}
