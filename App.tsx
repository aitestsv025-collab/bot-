
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatUI from './components/ChatUI';
import { Message, BotConfig, DEFAULT_CONFIG, Role } from './types';
import { HuggingFaceBotService } from './services/hfService';

const App: React.FC = () => {
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const hfServiceRef = useRef<HuggingFaceBotService | null>(null);

  useEffect(() => {
    hfServiceRef.current = new HuggingFaceBotService(config);
  }, []);

  const handleConfigChange = (newConfig: BotConfig) => {
    setConfig(newConfig);
    if (hfServiceRef.current) {
       hfServiceRef.current.updateConfig(newConfig);
    }
  };

  const handleReset = () => {
    setMessages([]);
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

    if (hfServiceRef.current) {
      const responseText = await hfServiceRef.current.sendMessage(text, [...messages, userMsg]);
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

  const envVars = [
    { key: "TELEGRAM_TOKEN", value: config.telegramToken || "Aapka Bot Token" },
    { key: "HF_TOKEN", value: config.hfToken || "Aapka HF Token" },
    { key: "BOT_NAME", value: config.name },
    { key: "PERSONALITY", value: config.personality }
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#fffafa]">
      <Sidebar 
        config={config} 
        onConfigChange={handleConfigChange} 
        onReset={handleReset} 
      />

      <main className="flex-1 p-4 lg:p-8 flex flex-col overflow-hidden">
        <div className="max-w-4xl w-full mx-auto mb-6 flex items-center justify-between">
          <div className="flex flex-col">
             <h2 className="text-xl font-bold text-gray-800 italic fancy-font">SoulMate Studio</h2>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Bot Status: {config.telegramToken ? 'Ready' : 'Configure'}</p>
          </div>
          
          <button 
            onClick={() => setShowDeployModal(true)}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg"
          >
            <i className="fas fa-tools text-rose-400"></i> FIX RENDER ERRORS
          </button>
        </div>

        <div className="flex-1 max-w-4xl w-full mx-auto overflow-hidden">
          <ChatUI 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isTyping={isTyping} 
            botName={config.name}
          />
        </div>

        <div className="max-w-4xl w-full mx-auto mt-4 px-4 py-3 bg-white border border-rose-100 rounded-2xl flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Simulator is running locally</p>
           </div>
           <p className="text-[10px] text-rose-400 font-medium italic">Make sure to deploy on Render for Telegram live</p>
        </div>
      </main>

      {showDeployModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold italic fancy-font">Render Settings Fix</h3>
                <p className="text-xs opacity-80 mt-1">Aapke errors ko theek karne ke liye ye check karein:</p>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100 space-y-4">
                <h4 className="font-bold text-rose-700 text-sm flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle"></i> FIX MODULE NOT FOUND ERROR:
                </h4>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Aapka error isliye aa raha hai kyunki Render <b>src/server.js</b> dhund raha hai. Use badal kar <b>server.js</b> karein:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono bg-white p-3 rounded-xl border border-rose-200">
                    <span className="text-gray-400">Root Directory:</span>
                    <span className="text-rose-600 font-bold italic">(Khali chhod dein / Blank)</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono bg-white p-3 rounded-xl border border-rose-200">
                    <span className="text-gray-400">Start Command:</span>
                    <span className="text-rose-600 font-bold">node server.js</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {envVars.map(ev => (
                  <div key={ev.key} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                    <p className="text-[8px] font-bold text-gray-400 uppercase">{ev.key}</p>
                    <p className="text-[10px] font-mono text-gray-800 truncate">{ev.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                 <h4 className="font-bold text-blue-800 text-xs mb-2">Final Step:</h4>
                 <p className="text-[10px] text-gray-600">
                   Ye changes karne ke baad Render dashboard mein <b>"Manual Deploy" > "Clear Cache and Deploy"</b> par click karein.
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
