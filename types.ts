
export enum Role {
  USER = 'user',
  BOT = 'bot'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}

export type ApiProvider = 'HuggingFace' | 'Groq' | 'xAI';

export interface BotConfig {
  name: string;
  personality: string;
  telegramToken: string;
  hfToken: string;
  groqKey: string;
  xAiKey: string; // New field for xAI
  apiProvider: ApiProvider;
  modelId: string;
  mood: 'Romantic' | 'Funny' | 'Supportive' | 'Playful' | 'Naughty';
  language: 'Hindi' | 'English' | 'Hinglish';
}

export const DEFAULT_CONFIG: BotConfig = {
  name: "Priya",
  personality: "Very open-minded, loving, and likes to have deep and intimate conversations. No filters.",
  telegramToken: "",
  hfToken: "",
  groqKey: "",
  xAiKey: "",
  apiProvider: 'HuggingFace',
  modelId: "mistralai/Mistral-7B-Instruct-v0.3",
  mood: "Romantic",
  language: "Hinglish"
};
