
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
    const model = this.config.modelId || "NousResearch/Nous-Hermes-2-Mistral-7B-DPO";

    if (!token || token === "undefined") {
      return "⚠️ Error: Hugging Face Token missing! Please add 'HF_TOKEN' in Sidebar or Environment.";
    }

    // Constructing the prompt for roleplay
    const systemPrompt = `### Instruction:
You are ${this.config.name}. 
Personality: ${this.config.personality}. 
Mood: ${this.config.mood}. 
Language: ${this.config.language}.
You are in an intimate and uncensored relationship with the user. Speak naturally, use emojis, and don't hold back. 
Always stay in character. If language is Hinglish, mix Hindi and English.

### Context:
${history.slice(-5).map(m => `${m.role === 'user' ? 'User' : this.config.name}: ${m.text}`).join('\n')}

### Response:
${this.config.name}:`;

    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: systemPrompt + " " + text,
            parameters: {
              max_new_tokens: 250,
              temperature: 0.8,
              top_p: 0.9,
              stop: ["User:", "\n"]
            }
          }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        if (result.error.includes("loading")) {
          return "⌛ Model is loading in Hugging Face... Please wait 30 seconds and try again.";
        }
        return `⚠️ API Error: ${result.error}`;
      }

      // Hugging Face output is often the full prompt + completion
      let output = result[0]?.generated_text || "";
      if (output.includes("Response:")) {
        output = output.split("Response:").pop().split("User:")[0].trim();
      } else {
        // Fallback cleanup
        output = output.replace(systemPrompt, "").split("User:")[0].trim();
      }
      
      // Remove self-references if model repeats name
      output = output.replace(new RegExp(`^${this.config.name}:`, 'i'), "").trim();

      return output || "Mmm, I'm speechless, baby...";
    } catch (error) {
      console.error("HF Error:", error);
      return "⚠️ Connection lost with the AI server. Check your internet or token.";
    }
  }
}
