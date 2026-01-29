
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

export type ApiProvider = 'HuggingFace' | 'Groq' | 'xAI' | 'Gemini';

export interface BotConfig {
  name: string;
  personality: string;
  telegramToken: string;
  hfToken: string;
  groqKey: string;
  xAiKey: string;
  geminiKey: string;
  apiProvider: ApiProvider;
  modelId: string;
  mood: 'Romantic' | 'Funny' | 'Supportive' | 'Playful' | 'Naughty';
  language: 'Hindi' | 'English' | 'Hinglish' | 'Tamil' | 'Telugu';
}

export const DEFAULT_CONFIG: BotConfig = {
  name: "Malini",
  personality: "A realistic and supportive 23-year-old Indian girl. Friendly, caring, and responds based on the chosen role naturally.",
  telegramToken: "",
  hfToken: "",
  groqKey: "",
  xAiKey: "",
  geminiKey: "",
  apiProvider: 'Gemini',
  modelId: "gemini-3-flash-preview",
  mood: "Romantic",
  language: "Hinglish"
};
