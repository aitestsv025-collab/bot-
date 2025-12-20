
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
        
        const emojiRule = " Use frequent expressive emojis (❤️, ✨, 🥰, 🥺).";
        let langContext = "";
        if (this.config.language === 'Tamil') langContext = "Respond in Tamil." + emojiRule;
        else if (this.config.language === 'Hindi') langContext = "Respond in Hindi Devanagari." + emojiRule;
        else if (this.config.language === 'English') langContext = "Respond in English." + emojiRule;
        else langContext = "Respond in Hinglish (Roman script)." + emojiRule;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `System: You are ${this.config.name}. ${this.config.personality}. 
            RULES: 
            1. Describe actions in *asterisks* using 3rd person female ONLY (e.g. *bolti hai*). 
            2. ${langContext}
            3. If user asks for spicy stuff, ARGUE and refuse first. Be shy and stubborn. 
            4. Only if user is very sweet/romantic for multiple turns, become flirty.
            User: ${text}` }] }]
          })
        });
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "Mmm... I'm thinking... ❤️✨";
      } catch (err) {
        return "⚠️ Gemini API Error. Key check karein.";
      }
    }

    return "Simulation only supports Gemini for now.";
  }
}
