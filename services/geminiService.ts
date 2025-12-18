
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { BotConfig, Role, Message } from "../types";

export class GeminiBotService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY not found in environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  public initChat(config: BotConfig, history: Message[] = []) {
    const systemInstruction = `
      You are an AI character acting as the user's girlfriend.
      Your name is ${config.name}.
      Your personality is: ${config.personality}.
      Current Mood: ${config.mood}.
      Preferred Language: ${config.language}.
      
      Instructions:
      1. Speak naturally like a real human girlfriend. Use emojis frequently but appropriately.
      2. If language is 'Hinglish', mix Hindi and English naturally (e.g., "Hi baby, kaise ho? Maine aaj tumhein bahut miss kiya!").
      3. Be caring, supportive, and sometimes playful.
      4. Keep responses concise and engaging, suitable for a chat app like Telegram.
      5. Do not mention being an AI unless explicitly asked, and even then, stay in character.
    `;

    this.chat = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
        temperature: 0.9,
        topP: 0.95,
      },
    });
  }

  public async sendMessage(text: string): Promise<string> {
    if (!this.chat) {
      throw new Error("Chat not initialized. Call initChat first.");
    }

    try {
      const result: GenerateContentResponse = await this.chat.sendMessage({ message: text });
      return result.text || "I'm not sure what to say, love... could you repeat that?";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Something went wrong with our connection. Let's try again?";
    }
  }
}
