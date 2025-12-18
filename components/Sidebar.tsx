
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

  const isTokenValid = config.hfToken && config.hfToken.startsWith('hf_');

  return (
    <div className="w-full lg:w-80 bg-white border-r border-rose-100 flex flex-col h-full shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-rose-100 bg-gradient-to-br from-rose-600 to-rose-700">
        <h1 className="text-2xl font-bold text-white fancy-font mb-1 italic">SoulMate HF Studio</h1>
        <p className="text-[10px] text-rose-100 uppercase tracking-[0.2em] font-bold">Uncensored Engine</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-bold text-sky-600 uppercase tracking-wider">Hugging Face Token</label>
            {isTokenValid ? (
              <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse">CONNECTED</span>
            ) : (
              <span className="text-[9px] bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">DISCONNECTED</span>
            )}
          </div>
          <input
            type="password"
            name="hfToken"
            value={config.hfToken}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 bg-white border ${isTokenValid ? 'border-green-300' : 'border-sky-200'} rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-xs font-mono shadow-sm`}
            placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
          />
          <div className="mt-3 bg-white/50 p-2 rounded-lg border border-sky-50">
             <p className="text-[9px] text-sky-700 leading-relaxed font-medium">
               1. <a href="https://huggingface.co/settings/tokens" target="_blank" className="underline font-bold text-sky-800">Yaha Click Karein</a><br/>
               2. 'New Token' banayein (Role: READ)<br/>
               3. Usko yaha paste karein.
             </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Character Identity</label>
          <div className="space-y-4">
            <input
              type="text"
              name="name"
              value={config.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none text-sm font-medium"
              placeholder="GF Name"
            />
            <select
              name="mood"
              value={config.mood}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none text-sm"
            >
              <option value="Romantic">Romantic ❤️</option>
              <option value="Naughty">Naughty 🔥</option>
              <option value="Playful">Playful 💃</option>
              <option value="Supportive">Supportive 🤗</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">AI Engine Model</label>
          <select
            name="modelId"
            value={config.modelId}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none text-[11px]"
          >
            <option value="NousResearch/Nous-Hermes-2-Mistral-7B-DPO">Nous Hermes 2 (Standard)</option>
            <option value="Gryphe/MythoMax-L2-13b">MythoMax 13b (Roleplay Special)</option>
            <option value="migtissera/Tess-M-v1.4">Tess-M (Intelligent & Uncensored)</option>
          </select>
          <p className="text-[9px] text-gray-400 mt-1">GGUF models website pe nahi chalenge, ye online wale hain.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Personality Instructions</label>
          <textarea
            name="personality"
            value={config.personality}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 outline-none resize-none text-sm"
            placeholder="E.g. Be bold, intimate, and loving..."
          />
        </div>
      </div>

      <div className="p-6 bg-gray-50 flex flex-col gap-2 border-t border-gray-100">
        <button
          onClick={onReset}
          className="w-full py-2 bg-white border border-rose-200 text-rose-500 rounded-xl font-bold hover:bg-rose-50 text-xs transition-all shadow-sm"
        >
          Clear Chat
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
