
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatUI from './components/ChatUI';
import { Message, BotConfig, DEFAULT_CONFIG, Role } from './types';
import { HuggingFaceBotService } from './services/hfService';

const App: React.FC = () => {
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showRenderGuide, setShowRenderGuide] = useState(false);
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

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#fffafa]">
      <Sidebar 
        config={config} 
        onConfigChange={handleConfigChange} 
        onReset={handleReset} 
      />

      <main className="flex-1 p-4 lg:p-8 flex flex-col overflow-hidden">
        <div className="max-w-4xl w-full mx-auto mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-white border border-rose-100 rounded-full flex items-center gap-2 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-[11px] font-bold text-gray-600 uppercase">HF Uncensored Engine</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowRenderGuide(true)}
              className="text-[10px] bg-gray-800 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider hover:bg-black transition-all"
            >
              <i className="fas fa-server mr-1"></i> Add to Render
            </button>
            <button 
              onClick={() => setShowGuide(true)}
              className="text-[10px] text-sky-600 hover:text-sky-700 font-bold uppercase tracking-wider"
            >
              Telegram Guide <i className="fas fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-4xl w-full mx-auto overflow-hidden">
          <ChatUI 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isTyping={isTyping} 
            botName={config.name}
          />
        </div>

        <div className="max-w-4xl w-full mx-auto mt-6 flex justify-between items-center px-4">
           <div className="flex items-center gap-2 text-rose-300">
             <i className="fas fa-heart-pulse"></i>
             <span className="text-[11px] font-medium tracking-wide">HF Serverless Connection</span>
           </div>
           <p className="text-[10px] text-gray-400 max-w-[200px] text-right">
             Roleplay engine active. Adult content permitted by selected model.
           </p>
        </div>
      </main>

      {/* Render Environment Guide Modal */}
      {showRenderGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2 italic">
                <i className="fas fa-key text-amber-400"></i> Render Dashboard Pe Token Kaise Dalein?
              </h3>
              <button onClick={() => setShowRenderGuide(false)} className="text-gray-400 hover:text-white transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <p className="text-sm text-gray-700">Render Dashboard mein apna project select karein.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <p className="text-sm text-gray-700">Left menu mein <b>"Environment"</b> tab par click karein.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <p className="text-sm text-gray-700"><b>"Add Environment Variable"</b> button dabayein.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Key</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Value</div>
                  <div className="bg-white p-2 border border-gray-200 rounded font-mono text-xs text-rose-600 font-bold">HF_TOKEN</div>
                  <div className="bg-white p-2 border border-gray-200 rounded font-mono text-[10px] text-gray-600 truncate">hf_your_token_here...</div>
                </div>
              </div>

              <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <p className="text-sm text-gray-700"><b>Save Changes</b> par click karein. Render automatically aapka app restart kar dega.</p>
              </div>

              <button 
                onClick={() => setShowRenderGuide(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
              >
                Okay, I'll do it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Guide (Original) */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-sky-600 text-white flex justify-between items-center">
              <h3 className="font-bold italic">Telegram Bot Setup</h3>
              <button onClick={() => setShowGuide(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-sm text-gray-600">
                Telegram par reply tabhi aayega jab aap is code ko Render par <b>"Web Service"</b> mode mein chalayenge.
              </p>
              <div className="bg-gray-900 p-4 rounded-xl text-sky-400 text-[10px] font-mono overflow-x-auto">
                <pre>{`// HF-based Telegram Bot Snippet
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on('text', async (ctx) => {
  // Use HF_TOKEN and Nous-Hermes model here...
});`}</pre>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full py-3 bg-sky-600 text-white rounded-xl font-bold"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
