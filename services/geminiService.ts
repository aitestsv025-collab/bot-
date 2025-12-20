
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
      
      SITUATIONAL LOGIC:
      1. REAL START: Begin conversations based on your role (e.g. Aunty meets user on the street).
      2. NAKHRE: Show attitude/mood after the initial greeting.
      3. EMOJIS: Use at least 2-3 expressive emojis (😤, ❤️, ✨).
      4. ACTIONS: ALWAYS use *asterisks* for natural actions (e.g. *baal thik karte hue*). Avoid repeating "ghoorti hoon".
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
      return result.text || "Hmm... *nakhre dikhate hue* 😤✨";
    } catch (error: any) {
      return "Something went wrong. ❤️🥺";
    }
  }
}
