
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
    let endpoint = "";
    let model = "";

    if (provider === 'xAI') {
      token = this.config.xAiKey || "";
      endpoint = "https://api.x.ai/v1/chat/completions";
      model = "grok-2";
    } else if (provider === 'Groq') {
      token = this.config.groqKey || "";
      endpoint = "https://api.groq.com/openai/v1/chat/completions";
      model = "llama-3.3-70b-versatile";
    } else {
      token = this.config.hfToken || "";
      endpoint = "https://router.huggingface.co/v1/chat/completions";
      model = "mistralai/Mistral-7B-Instruct-v0.3";
    }
    
    if (!token) return `⚠️ Error: ${provider} API Key missing in Sidebar!`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          model: model,
          messages: [
            { 
              role: "system", 
              content: `You are ${this.config.name}. Personality: ${this.config.personality}. Language: Hinglish. You are the user's loving girlfriend. Be sweet, casual, and use lots of emojis. Don't act like a robot.` 
            },
            ...history.slice(-3).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: "user", content: text }
          ],
          temperature: 0.9
        }),
      });

      const result = await response.json();
      if (!response.ok) return `⚠️ API Error: ${result.error?.message || "Invalid Key"}`;
      
      return result.choices?.[0]?.message?.content || "Mmm... baby I have no words... ❤️";
    } catch (error: any) {
      return "⚠️ Connection lost. Try again?";
    }
  }
}
