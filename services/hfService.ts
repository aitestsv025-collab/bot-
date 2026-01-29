
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
      if (!token) return "⚠️ Gemini Key missing! Dashboard monitor only mode.";
      
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${token}`;
        
        const emojiRule = " Use frequent expressive emojis (❤️, ✨, 🥰, 🥺).";
        let langContext = "";
        
        switch(this.config.language) {
          case 'Tamil': 
            langContext = "Respond in Tamil script." + emojiRule; break;
          case 'Telugu': 
            langContext = "Respond in Telugu script." + emojiRule; break;
          case 'Hindi': 
            langContext = "Respond in Hindi Devanagari." + emojiRule; break;
          case 'Hinglish': 
            langContext = "Respond in Hinglish (Roman script)." + emojiRule; break;
          case 'English':
          default: 
            langContext = "Respond in English." + emojiRule; break;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `System: You are ${this.config.name}. Personality: ${this.config.personality}. 
            RULES: 
            1. Describe actions in *asterisks*. 
            2. ${langContext}
            3. Be sweet and natural.
            User: ${text}` }] }]
          })
        });
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Mmm... I'm thinking... ❤️✨";
      } catch (err) {
        return "⚠️ Gemini API Error. Check your key.";
      }
    }

    return "Simulation only supports Gemini for now.";
  }
}
