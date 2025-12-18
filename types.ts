
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

export interface BotConfig {
  name: string;
  personality: string;
  telegramToken: string;
  hfToken: string;
  modelId: string;
  mood: 'Romantic' | 'Funny' | 'Supportive' | 'Playful' | 'Naughty';
  language: 'Hindi' | 'English' | 'Hinglish';
}

export const DEFAULT_CONFIG: BotConfig = {
  name: "Priya",
  personality: "Very open-minded, loving, and likes to have deep and intimate conversations. No filters.",
  telegramToken: "",
  hfToken: "",
  modelId: "NousResearch/Nous-Hermes-2-Mistral-7B-DPO",
  mood: "Romantic",
  language: "Hinglish"
};
