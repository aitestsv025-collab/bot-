
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
    { key: "TELEGRAM_TOKEN", value: config.telegramToken || "Required" },
    { key: "API_PROVIDER", value: config.apiProvider },
    { key: config.apiProvider === 'xAI' ? "XAI_KEY" : (config.apiProvider === 'Groq' ? "GROQ_KEY" : "HF_TOKEN"), value: config.apiProvider === 'xAI' ? config.xAiKey : (config.apiProvider === 'Groq' ? config.groqKey : config.hfToken) },
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
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
               Simulator Brain: <span className={config.apiProvider === 'xAI' ? 'text-black' : (config.apiProvider === 'Groq' ? 'text-indigo-500' : 'text-rose-500')}>{config.apiProvider}</span>
             </p>
          </div>
          
          <button 
            onClick={() => setShowDeployModal(true)}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg"
          >
            <i className="fas fa-rocket text-rose-400"></i> DEPLOY ON RENDER
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
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Simulator is Active</p>
           </div>
           <p className="text-[10px] text-rose-400 font-medium italic">Make sure to select '{config.apiProvider}' brain above.</p>
        </div>
      </main>

      {showDeployModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 bg-gradient-to-r from-indigo-600 to-rose-700 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold italic fancy-font">Final Deployment</h3>
                <p className="text-xs opacity-80 mt-1">Render Dashboard par ye Settings karein:</p>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {envVars.map(ev => (
                  <div key={ev.key} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                    <p className="text-[8px] font-bold text-gray-400 uppercase">{ev.key}</p>
                    <p className="text-[10px] font-mono text-gray-800 truncate">{ev.value || "MISSING!"}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-[11px] text-blue-700 leading-relaxed">
                <p className="font-bold mb-1">⚠️ Important Step:</p>
                <p>Render par jaakar <strong>Environment Variables</strong> mein <code>API_PROVIDER</code> ko <code>xAI</code> set karein aur <code>XAI_KEY</code> mein apni key daalein. Tabhi aapka Telegram bot Grok use karega.</p>
              </div>

              <button 
                onClick={() => setShowDeployModal(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg"
              >
                GOT IT! DONE ❤️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
