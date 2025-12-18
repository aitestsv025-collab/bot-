
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

  const isHfValid = config.hfToken && config.hfToken.startsWith('hf_');
  const isTgValid = config.telegramToken && config.telegramToken.includes(':');

  return (
    <div className="w-full lg:w-80 bg-white border-r border-rose-100 flex flex-col h-full shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-rose-100 bg-gradient-to-br from-rose-600 to-rose-700">
        <h1 className="text-2xl font-bold text-white fancy-font mb-1 italic">SoulMate HF Studio</h1>
        <p className="text-[10px] text-rose-100 uppercase tracking-[0.2em] font-bold">Bot Designer v2.0</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Step 1: Telegram Connection */}
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider italic">Step 1: Telegram Bot</label>
            {isTgValid ? <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full">READY</span> : <span className="text-[8px] bg-gray-300 text-white px-2 py-0.5 rounded-full">EMPTY</span>}
          </div>
          <input
            type="text"
            name="telegramToken"
            value={config.telegramToken}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-[11px] font-mono"
            placeholder="123456789:ABCDEF..."
          />
          <p className="text-[8px] text-blue-400 mt-1 italic">BotFather se mila hua token yaha dalein.</p>
        </div>

        {/* Step 2: HF Connection */}
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[10px] font-bold text-sky-600 uppercase tracking-wider italic">Step 2: AI Brain (HF)</label>
            {isHfValid ? <span className="text-[8px] bg-green-500 text-white px-2 py-0.5 rounded-full">CONNECTED</span> : <span className="text-[8px] bg-amber-400 text-white px-2 py-0.5 rounded-full">MISSING</span>}
          </div>
          <input
            type="password"
            name="hfToken"
            value={config.hfToken}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-[11px] font-mono"
            placeholder="hf_xxxxxxxxxxxxxx"
          />
        </div>

        {/* Step 3: Character */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 italic">Step 3: Identity</label>
          <div className="space-y-3">
            <input
              type="text"
              name="name"
              value={config.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              placeholder="GF Name"
            />
            <select
              name="mood"
              value={config.mood}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            >
              <option value="Romantic">Romantic ❤️</option>
              <option value="Naughty">Naughty 🔥</option>
              <option value="Playful">Playful 💃</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 italic">Personality</label>
          <textarea
            name="personality"
            value={config.personality}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none"
            placeholder="Be bold and loving..."
          />
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <button
          onClick={onReset}
          className="w-full py-2 bg-white border border-rose-200 text-rose-500 rounded-xl font-bold text-[10px] hover:bg-rose-50"
        >
          CLEAR PREVIEW CHAT
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
