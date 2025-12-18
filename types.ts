
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
  mood: 'Romantic' | 'Funny' | 'Supportive' | 'Playful';
  language: 'Hindi' | 'English' | 'Hinglish';
}

export const DEFAULT_CONFIG: BotConfig = {
  name: "Priya",
  personality: "Kind, loving, and always supportive. Loves sharing jokes and talking about life.",
  telegramToken: "",
  mood: "Romantic",
  language: "Hinglish"
};
