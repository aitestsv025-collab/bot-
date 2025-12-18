
import { BotConfig, Message } from "../types";

export class AiChatService {
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  public updateConfig(config: BotConfig) {
    this.config = config;
  }

  public async sendMessage(text: string, history: Message[]): Promise<string> {
    const provider = this.config.apiProvider;
    let token = "";

    if (provider === 'Gemini') {
      token = this.config.geminiKey || "";
      if (!token) return "⚠️ Gemini Key missing! Sidebar mein daalein.";
      
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${token}`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `System: Act as ${this.config.name} (${this.config.personality}). Mood: ${this.config.mood}. Use Hinglish. User: ${text}` }] }]
          })
        });
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Mmm... I'm speechless... ❤️";
      } catch (err) {
        return "⚠️ Gemini API Error. Key check karein.";
      }
    }

    // Fallback for others (Groq/xAI)
    return "Simulation only supports Gemini for now. Please deploy to test other providers.";
  }
}
