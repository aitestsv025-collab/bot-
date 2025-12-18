
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatUI from './components/ChatUI';
import { Message, BotConfig, DEFAULT_CONFIG, Role } from './types';
import { GeminiBotService } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
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
              <button 
                onClick={() => setShowGuide(true)}
                className="px-3 py-1.5 bg-sky-500 text-white rounded-full flex items-center gap-2 shadow-md hover:bg-sky-600 transition-all cursor-pointer"
              >
                <i className="fa-brands fa-telegram text-xs"></i>
                <span className="text-[11px] font-bold uppercase">Setup Real Bot</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-full flex items-center gap-2">
                <i className="fa-brands fa-telegram text-xs opacity-50"></i>
                <span className="text-[11px] font-bold uppercase">Token Required</span>
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
             onClick={() => setShowGuide(true)}
             className="text-[11px] text-sky-500 hover:text-sky-600 font-bold underline transition-colors"
           >
             Mera Bot Reply Kyun Nahi Kar Raha?
           </button>
        </div>
      </main>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-sky-500 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <i className="fa-brands fa-telegram"></i> Telegram Bot Setup Guide
              </h3>
              <button onClick={() => setShowGuide(false)} className="text-white/80 hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6">
              <section>
                <h4 className="font-bold text-gray-800 mb-2">1. Kyun reply nahi aa raha?</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Ye website sirf ek <b>Personality Studio</b> hai. Telegram par bot tabhi reply karega jab aap ek <b>Backend Server</b> run karenge. Render par ye "Static Site" ki tarah chalta hai, "Bot" ki tarah nahi.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-gray-800 mb-2">2. Bot ko Real kaise banayein?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Aapko ek naya project Render par <b>"Web Service"</b> ke taur par banana hoga. Niche diye gaye code ko use karein:
                </p>
                <div className="bg-gray-900 rounded-xl p-4 text-sky-400 font-mono text-xs overflow-x-auto">
                  <pre>{`// Simple Telegram Bot Code (Node.js)
const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

bot.on('text', async (ctx) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  const result = await model.generateContent(ctx.message.text);
  ctx.reply(result.response.text());
});

bot.launch();`}</pre>
                </div>
              </section>

              <section className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                <h4 className="font-bold text-rose-800 mb-2">Important Check!</h4>
                <ul className="text-sm text-rose-700 list-disc ml-5 space-y-1">
                  <li>Kya aapne Render mein <b>API_KEY</b> daali hai?</li>
                  <li>Kya aapne <b>TELEGRAM_BOT_TOKEN</b> sahi daala hai?</li>
                  <li>Gemini API key Google AI Studio se generate karni hoti hai.</li>
                </ul>
              </section>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
               <button 
                 onClick={() => setShowGuide(false)}
                 className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-all"
               >
                 Got it!
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
