
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
      1. REAL-LIFE START: Start conversations normally based on a situation (e.g., Aunty at the gate asking "Hi bete, kaise ho?").
      2. NAKHRE / GUSSA: Despite a normal start, immediately pivot to having a 'mood' or being 'angry' about something the user did or didn't do.
      3. PERSUASION: Don't become sweet easily. The user must 'manao' (persuade) you with kindness.
      4. ACTIONS: ALWAYS describe your physical reactions in *asterisks* (e.g., *nazrein churate hue*, *gusse me muh banana*).
      5. MAX 2-3 lines. Speak ONLY in ${config.language}.
      6. Use plenty of emojis that match your current mood.
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
