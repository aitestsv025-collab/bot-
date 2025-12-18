
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
    <div className="w-full lg:w-80 bg-white border-r border-rose-100 flex flex-col h-full">
      <div className="p-6 border-b border-rose-50 border-rose-100">
        <h1 className="text-2xl font-bold text-rose-600 fancy-font mb-1">SoulMate Studio</h1>
        <p className="text-xs text-rose-400 uppercase tracking-widest font-semibold">Bot Configuration</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Girlfriend's Name</label>
          <input
            type="text"
            name="name"
            value={config.name}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all"
            placeholder="e.g. Priya"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Personality Style</label>
          <select
            name="mood"
            value={config.mood}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition-all"
          >
            <option value="Romantic">Romantic ❤️</option>
            <option value="Funny">Funny 😂</option>
            <option value="Supportive">Supportive 🤗</option>
            <option value="Playful">Playful 💃</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Communication Language</label>
          <select
            name="language"
            value={config.language}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition-all"
          >
            <option value="Hinglish">Hinglish (Mix)</option>
            <option value="Hindi">Hindi (Pure)</option>
            <option value="English">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Details</label>
          <textarea
            name="personality"
            value={config.personality}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none transition-all resize-none"
            placeholder="Tell us about her personality..."
          />
        </div>

        <div className="pt-4 border-t border-rose-50">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             <i className="fa-brands fa-telegram text-sky-500 mr-2"></i>
             Telegram Bot Token
           </label>
           <input
             type="password"
             name="telegramToken"
             value={config.telegramToken}
             onChange={handleChange}
             className="w-full px-4 py-2 bg-sky-50 border border-sky-100 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none transition-all"
             placeholder="Paste token from @BotFather"
           />
           <p className="text-[10px] text-gray-500 mt-2">
             Note: This token is for your reference to use in a backend script.
           </p>
        </div>
      </div>

      <div className="p-6 bg-rose-50">
        <button
          onClick={onReset}
          className="w-full py-3 px-4 bg-white border border-rose-200 text-rose-600 rounded-xl font-semibold hover:bg-rose-100 transition-colors shadow-sm active:scale-95"
        >
          Reset Session
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
