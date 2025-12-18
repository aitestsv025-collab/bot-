
import { BotConfig, Message } from "../types";

export class HuggingFaceBotService {
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  public updateConfig(config: BotConfig) {
    this.config = config;
  }

  public async sendMessage(text: string, history: Message[]): Promise<string> {
    const token = this.config.hfToken || process.env.HF_TOKEN;
    const model = this.config.modelId || "mistralai/Mistral-7B-Instruct-v0.3";

    if (!token || token === "undefined") {
      return "⚠️ Error: HF_TOKEN missing! Simulation tab check karein.";
    }

    try {
      // Using the NEW Router endpoint for the simulator too
      const response = await fetch(
        `https://router.huggingface.co/v1/chat/completions`,
        {
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
                content: `You are ${this.config.name}. Personality: ${this.config.personality}. Mood: ${this.config.mood}. You are the user's girlfriend. Language: ${this.config.language}. Stay in character.` 
              },
              ...history.slice(-5).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.text
              })),
              { role: "user", content: text }
            ],
            max_tokens: 250,
            temperature: 0.8
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        return `⚠️ API Error: ${result.error?.message || "Unknown error"}`;
      }

      return result.choices[0]?.message?.content || "Mmm... I'm speechless, baby...";
    } catch (error: any) {
      console.error("HF Error:", error);
      return "⚠️ Connection lost. Ek baar phir try karo?";
    }
  }
}
