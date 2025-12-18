
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatUI from './components/ChatUI';
import { Message, BotConfig, DEFAULT_CONFIG, Role } from './types';
import { GeminiBotService } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const botServiceRef = useRef<GeminiBotService | null>(null);

  // Initialize bot service on mount
  useEffect(() => {
    try {
      botServiceRef.current = new GeminiBotService();
      botServiceRef.current.initChat(config);
    } catch (e) {
      console.error("Initialization error", e);
    }
  }, []);

  // Sync personality changes to the engine
  const handleConfigChange = (newConfig: BotConfig) => {
    setConfig(newConfig);
    if (botServiceRef.current) {
       botServiceRef.current.initChat(newConfig);
    }
  };

  const handleReset = () => {
    setMessages([]);
    if (botServiceRef.current) {
      botServiceRef.current.initChat(config);
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    if (botServiceRef.current) {
      const responseText = await botServiceRef.current.sendMessage(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.BOT,
        text: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    }
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-rose-50">
      {/* Sidebar for Config */}
      <Sidebar 
        config={config} 
        onConfigChange={handleConfigChange} 
        onReset={handleReset} 
      />

      {/* Main Chat Area */}
      <main className="flex-1 p-4 lg:p-10 flex flex-col items-center justify-center overflow-hidden">
        <div className="w-full max-w-4xl h-full flex flex-col">
          <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-200 uppercase tracking-tighter">
                Gemini 3 Pro Active
              </span>
              {config.telegramToken && (
                <span className="bg-sky-100 text-sky-600 px-3 py-1 rounded-full text-xs font-bold border border-sky-200 uppercase tracking-tighter flex items-center gap-1">
                  <i className="fa-brands fa-telegram"></i> Bot Linked
                </span>
              )}
            </div>
            <div className="text-xs text-rose-400 font-medium">
              Simulation Mode
            </div>
          </div>
          
          <ChatUI 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isTyping={isTyping} 
            botName={config.name}
          />

          <div className="mt-4 text-[11px] text-gray-400 text-center leading-relaxed italic">
            "Testing the personality before deploying to Telegram. All chat history is local to your browser session."
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
