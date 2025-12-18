
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatUI from './components/ChatUI';
import { Message, BotConfig, DEFAULT_CONFIG, Role } from './types';
import { GeminiBotService } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const botServiceRef = useRef<GeminiBotService | null>(null);

  useEffect(() => {
    try {
      botServiceRef.current = new GeminiBotService();
      botServiceRef.current.initChat(config);
    } catch (e) {
      console.error("Initialization error", e);
    }
  }, []);

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
    <div className="flex flex-col lg:flex-row h-screen bg-[#fffafa]">
      <Sidebar 
        config={config} 
        onConfigChange={handleConfigChange} 
        onReset={handleReset} 
      />

      <main className="flex-1 p-4 lg:p-8 flex flex-col overflow-hidden">
        {/* Status Bar */}
        <div className="max-w-4xl w-full mx-auto mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-white border border-rose-100 rounded-full flex items-center gap-2 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[11px] font-bold text-gray-600 uppercase">Simulator Live</span>
            </div>
            
            {config.telegramToken ? (
              <div className="px-3 py-1.5 bg-sky-500 text-white rounded-full flex items-center gap-2 shadow-md">
                <i className="fa-brands fa-telegram text-xs"></i>
                <span className="text-[11px] font-bold uppercase">Bot Linked</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-full flex items-center gap-2">
                <i className="fa-brands fa-telegram text-xs opacity-50"></i>
                <span className="text-[11px] font-bold uppercase">No Telegram Token</span>
              </div>
            )}
          </div>
          
          <div className="hidden sm:block">
             <p className="text-[11px] text-rose-400 font-bold tracking-widest uppercase">
               Personality: <span className="text-gray-600">{config.mood}</span>
             </p>
          </div>
        </div>

        {/* Chat Component */}
        <div className="flex-1 max-w-4xl w-full mx-auto overflow-hidden">
          <ChatUI 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isTyping={isTyping} 
            botName={config.name}
          />
        </div>

        {/* Footer Info */}
        <div className="max-w-4xl w-full mx-auto mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
           <div className="flex items-center gap-2 text-rose-300">
             <i className="fas fa-shield-heart"></i>
             <span className="text-[11px] font-medium tracking-wide">End-to-End Simulation Mode</span>
           </div>
           <button 
             onClick={() => window.open('https://render.com/docs/environment-variables', '_blank')}
             className="text-[11px] text-sky-500 hover:text-sky-600 font-bold underline transition-colors"
           >
             View Deployment Instructions for Telegram
           </button>
        </div>
      </main>
    </div>
  );
};

export default App;
