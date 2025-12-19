
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
    { key: "TELEGRAM_TOKEN", value: config.telegramToken || "Aapka BotFather Token" },
    { key: "API_KEY", value: config.geminiKey || "Aapki Gemini API Key" }
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
            <i className="fas fa-server text-green-400"></i> 24/7 FREE SETUP GUIDE
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
            <div className="p-8 bg-rose-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold italic fancy-font">Render + UptimeRobot Setup</h3>
                <p className="text-[10px] opacity-80 uppercase tracking-widest mt-1">Free Lifetime Hosting</p>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh]">
              <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                <p className="text-sm text-blue-900 font-bold mb-2 italic">UptimeRobot Free Plan Limits:</p>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-3 rounded-2xl border border-blue-100 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Monitors</p>
                      <p className="text-lg font-black text-blue-600">50</p>
                   </div>
                   <div className="bg-white p-3 rounded-2xl border border-blue-100 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Interval</p>
                      <p className="text-lg font-black text-blue-600">5 Min</p>
                   </div>
                </div>
                <p className="text-[10px] text-blue-700 mt-3 leading-tight">
                  ✅ 5 minute interval Render ko kabhi sone nahi dega. Aapko 50 monitors milte hain toh ye lifetime free rahega.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-800 uppercase flex items-center gap-2">
                   <i className="fas fa-key text-rose-500"></i> Render Environment Keys:
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {envVars.map(ev => (
                    <div key={ev.key} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl group hover:border-rose-400 transition-all">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{ev.key}</p>
                        <p className="text-xs font-mono text-gray-800 break-all pr-4">{ev.value || "Sidebar mein token daalein!"}</p>
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(ev.value)}
                        className="bg-white border border-gray-200 p-2.5 rounded-xl text-gray-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                      >
                        <i className="far fa-copy"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-green-50 rounded-3xl border border-green-100">
                <p className="text-xs text-green-800 leading-relaxed font-medium">
                  🚀 <strong>Steps:</strong> Render Dashboard -> Environment -> Add Variables. <br/>
                  Phir <strong>UptimeRobot</strong> mein naya monitor banayein aur Render ki URL daal dein (e.g., <code>https://bot-n4ce.onrender.com/health</code>).
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setShowDeployModal(false)}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-gray-900 transition-all"
              >
                THEEK HAI! AB BOT KABHI NAHI SOYEGA. 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
