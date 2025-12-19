
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
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${token}`;
        
        let langContext = "";
        const emojiRule = " Use frequent and expressive emojis in every reply (❤️, ✨, 🥰, 🥺, 😊).";

        if (this.config.language === 'Tamil') langContext = "STRICTLY respond ONLY in Tamil script." + emojiRule;
        else if (this.config.language === 'Hindi') langContext = "STRICTLY respond ONLY in Hindi Devanagari script." + emojiRule;
        else if (this.config.language === 'English') langContext = "STRICTLY respond ONLY in English." + emojiRule;
        else langContext = "Respond in Hinglish (Roman script)." + emojiRule;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `System: Act as ${this.config.name}. Role: ${this.config.personality}. ${langContext} Use *asterisks* for actions. Be immersive and stay in character. User: ${text}` }] }]
          })
        });
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Mmm... I'm speechless... ❤️✨";
      } catch (err) {
        return "⚠️ Gemini API Error. Key check karein.";
      }
    }

    return "Simulation only supports Gemini for now.";
  }
}
