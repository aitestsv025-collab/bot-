
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

    const emojiRule = " Use frequent and expressive emojis (❤️, ✨, 🥰, 😊).";
    const shyRule = " ALWAYS include a small situational action in *asterisks* like *blushing* or *looking away shyly*.";
    let langInstruction = "";
    
    switch(config.language) {
      case 'Tamil':
        langInstruction = "STRICTLY speak ONLY in Tamil script." + emojiRule + shyRule;
        break;
      case 'Hindi':
        langInstruction = "STRICTLY speak ONLY in Hindi Devanagari." + emojiRule + shyRule;
        break;
      case 'Hinglish':
        langInstruction = "STRICTLY speak ONLY in Hinglish (Roman script)." + emojiRule + shyRule;
        break;
      case 'English':
      default:
        langInstruction = "STRICTLY speak ONLY in English." + emojiRule + shyRule;
        break;
    }

    const systemInstruction = `
      You are an AI character acting as the user's ${config.name}.
      Your name is ${config.name}.
      Your personality is: ${config.personality}.
      Preferred Language: ${config.language}.
      
      Instructions:
      1. Speak naturally like a real human. Use frequent emojis.
      2. ${langInstruction}
      3. MANDATORY: STRICTLY MAX 2-3 lines per response. No long text.
      4. Always describe actions in *asterisks* to create a continuous story.
      5. Do not mention being an AI.
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
    if (!this.ai) return "⚠️ Error: API Key missing!";
    if (!this.chat) throw new Error("Chat not initialized.");

    try {
      const result: GenerateContentResponse = await this.chat.sendMessage({ message: text });
      return result.text || "Mmm... *nazre jhuka leti hoon* ❤️✨";
    } catch (error: any) {
      return "Something went wrong. ❤️";
    }
  }
}
