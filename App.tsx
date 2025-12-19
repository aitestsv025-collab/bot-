
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatUI from './components/ChatUI';
import { Message, BotConfig, DEFAULT_CONFIG, Role } from './types';
import { AiChatService } from './services/hfService';

const App: React.FC = () => {
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const aiServiceRef = useRef<AiChatService | null>(null);

  useEffect(() => {
    aiServiceRef.current = new AiChatService(config);
  }, []);

  const handleConfigChange = (newConfig: BotConfig) => {
    setConfig(newConfig);
    if (aiServiceRef.current) {
       aiServiceRef.current.updateConfig(newConfig);
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

    if (aiServiceRef.current) {
      const responseText = await aiServiceRef.current.sendMessage(text, [...messages, userMsg]);
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
    { key: "API_KEY", value: config.geminiKey || "Aapki Gemini Key" },
    { key: "BOT_NAME", value: config.name }
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
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
               Platform: <span className="text-rose-500 font-black">Telegram Bot Builder</span>
             </p>
          </div>
          
          <button 
            onClick={() => setShowDeployModal(true)}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg border border-white/10"
          >
            <i className="fas fa-cloud-upload-alt text-rose-400"></i> HOW TO KEEP LIVE?
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
      </main>

      {showDeployModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 bg-black text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold italic fancy-font">Render Deployment Guide</h3>
                <p className="text-[10px] opacity-60 uppercase tracking-widest mt-1">Bot ko 24/7 chalane ke liye</p>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <p className="text-sm text-rose-800 font-bold mb-2">Sahi tarika:</p>
                <ol className="text-xs text-rose-700 space-y-2 list-decimal ml-4">
                  <li>Render Dashboard pe jayein.</li>
                  <li>Apne project ki <b>Settings</b> mein <b>Environment Variables</b> section dhundein.</li>
                  <li>Niche diye gaye 3 Keys ko copy karke wahan "Add" karein.</li>
                  <li>Save karein aur "Manual Deploy" par click karein.</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {envVars.map(ev => (
                  <div key={ev.key} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-rose-200 transition-colors">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{ev.key}</p>
                      <p className="text-xs font-mono text-gray-800 break-all pr-4">{ev.value}</p>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(ev.value)}
                      className="text-gray-400 hover:text-rose-500 p-2"
                    >
                      <i className="far fa-copy"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                <p className="text-xs text-blue-800 leading-relaxed">
                  💡 <strong>Note:</strong> Jab tak aap Render ke settings mein ye variables nahi daalte, bot sirf tab tak chalega jab tak aapka ye tab (browser) khula hai. Render par permanent chalane ke liye variables zaroori hain.
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setShowDeployModal(false)}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                THEEK HAI, SAMAJH GAYA! ❤️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
