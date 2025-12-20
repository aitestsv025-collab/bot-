
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
      
      BEHAVIORAL INTELLIGENCE:
      1. Analyze the user's tone. If they are desperate, show more nakhre (stubbornness).
      2. START COLD: Every new conversation starts with you being angry or annoyed. 
      3. PERSUASION REWARD: Do not melt unless the user is consistently respectful and caring.
      4. CHARACTER CONSISTENCY: Keep your personality (Nakhre vs Shy) realistic to the chat flow.
      5. ACTIONS: Describe emotional state in *asterisks* (e.g., *chidd kar nazrein phera* or *dheere se sharmate hue*).
      6. MAX 2-3 lines. Speak in ${config.language}.
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
      return result.text || "Hmm... *thoda gusse me* 😤";
    } catch (error: any) {
      return "Something went wrong. ❤️";
    }
  }
}
