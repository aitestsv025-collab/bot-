
import React from 'react';
import { BotConfig } from '../types';

interface SidebarProps {
  config: BotConfig;
  onConfigChange: (config: BotConfig) => void;
  onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ config, onConfigChange, onReset }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onConfigChange({ ...config, [name]: value });
  };

  return (
    <div className="w-full lg:w-80 bg-white border-r border-rose-100 flex flex-col h-full shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-rose-100 bg-gradient-to-br from-rose-600 to-rose-700">
        <h1 className="text-2xl font-bold text-white fancy-font mb-1 italic">SoulMate Studio</h1>
        <p className="text-[10px] text-rose-100 uppercase tracking-[0.2em] font-bold">Free AI Bot Designer</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Render Status Alert */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
            <label className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Deployment Note</label>
          </div>
          <p className="text-[10px] text-amber-800 leading-relaxed">
            Agar aap laptop band kar rahe hain aur bot ruk raha hai, toh aapne <b>Render</b> par Environment Variables set nahi kiye hain. 
          </p>
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider italic mb-2">1. Telegram Token</label>
          <input
            type="text"
            name="telegramToken"
            value={config.telegramToken}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-[11px] font-mono focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="BotFather se mila token yahan daalein"
          />
        </div>

        <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
          <label className="block text-[10px] font-bold text-green-600 uppercase tracking-wider italic mb-1">2. Gemini API Key</label>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[8px] text-green-400 underline mb-2 block">Nayi Key yahan se lein</a>
          <input 
            type="password" 
            name="geminiKey" 
            value={config.geminiKey} 
            onChange={handleChange} 
            className="w-full px-3 py-2 bg-white border border-green-200 rounded-xl text-[11px] focus:ring-2 focus:ring-green-400 outline-none" 
            placeholder="AIzaSy..." 
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 italic">3. Bot Identity</label>
          <div className="space-y-3">
            <input 
              type="text" 
              name="name" 
              value={config.name} 
              onChange={handleChange} 
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm" 
              placeholder="Girlfriend Name" 
            />
            <select 
              name="language" 
              value={config.language} 
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm"
            >
              <option value="Hinglish">Hinglish</option>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
        <button 
          onClick={() => window.open('https://dashboard.render.com', '_blank')}
          className="w-full py-2 bg-black text-white rounded-xl font-bold text-[10px] hover:bg-gray-800 transition-colors"
        >
          GO TO RENDER DASHBOARD
        </button>
        <button onClick={onReset} className="w-full py-2 bg-white border border-rose-200 text-rose-500 rounded-xl font-bold text-[10px] hover:bg-rose-50">CLEAR PREVIEW</button>
      </div>
    </div>
  );
};

export default Sidebar;
