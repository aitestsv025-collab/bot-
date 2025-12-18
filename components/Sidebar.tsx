
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
    <div className="w-full lg:w-80 bg-white border-r border-rose-100 flex flex-col h-full shadow-2xl">
      <div className="p-6 border-b border-rose-100 bg-gradient-to-br from-rose-500 to-rose-600">
        <h1 className="text-2xl font-bold text-white fancy-font mb-1 italic">SoulMate Studio</h1>
        <p className="text-[10px] text-rose-100 uppercase tracking-[0.2em] font-bold">AI Companion Engine</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Basic Info</label>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Bot Name</label>
              <input
                type="text"
                name="name"
                value={config.name}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition-all"
                placeholder="e.g. Priya"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vibe & Language</label>
          <div className="grid grid-cols-1 gap-4">
            <select
              name="mood"
              value={config.mood}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
            >
              <option value="Romantic">Romantic ❤️</option>
              <option value="Funny">Funny 😂</option>
              <option value="Supportive">Supportive 🤗</option>
              <option value="Playful">Playful 💃</option>
            </select>
            <select
              name="language"
              value={config.language}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none"
            >
              <option value="Hinglish">Hinglish (Mix)</option>
              <option value="Hindi">Hindi (Pure)</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Personality Prompt</label>
          <textarea
            name="personality"
            value={config.personality}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none resize-none text-sm"
            placeholder="Describe how she should behave..."
          />
        </div>

        <div className="pt-6 border-t border-gray-100">
           <label className="block text-xs font-bold text-sky-500 uppercase tracking-wider mb-3">
             <i className="fa-brands fa-telegram mr-2"></i>
             Telegram Integration
           </label>
           <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
             <label className="text-[11px] font-bold text-sky-700 block mb-2">BOT TOKEN</label>
             <input
               type="password"
               name="telegramToken"
               value={config.telegramToken}
               onChange={handleChange}
               className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-sm font-mono"
               placeholder="123456:ABC-DEF..."
             />
             <div className="mt-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${config.telegramToken ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-[10px] text-sky-800 font-medium">
                  {config.telegramToken ? 'Ready to Deploy' : 'Token Required'}
                </span>
             </div>
           </div>
           <p className="text-[10px] text-gray-400 mt-3 italic leading-relaxed">
             Deploy karne ke baad Render dashboard mein 'TELEGRAM_BOT_TOKEN' variable bhi add karein.
           </p>
        </div>
      </div>

      <div className="p-6 bg-gray-50">
        <button
          onClick={onReset}
          className="w-full py-3 px-4 bg-white border border-rose-200 text-rose-500 rounded-xl font-bold hover:bg-rose-50 transition-all shadow-sm active:scale-95 text-sm"
        >
          Clear Chat History
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
