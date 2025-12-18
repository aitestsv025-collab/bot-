
import React from 'react';
import { BotConfig, ApiProvider } from '../types';

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
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider italic mb-2">1. Telegram Token</label>
          <input
            type="text"
            name="telegramToken"
            value={config.telegramToken}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-[11px] font-mono"
            placeholder="12345678:ABC..."
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider italic mb-2">2. Choose Brain</label>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => onConfigChange({...config, apiProvider: 'Groq'})}
              className={`py-2 rounded-xl text-[10px] font-bold transition-all ${config.apiProvider === 'Groq' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}
            >
              Groq (Free & Fast 🔥)
            </button>
            <button 
              onClick={() => onConfigChange({...config, apiProvider: 'HuggingFace'})}
              className={`py-2 rounded-xl text-[10px] font-bold transition-all ${config.apiProvider === 'HuggingFace' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}
            >
              Hugging Face (Free)
            </button>
            <button 
              onClick={() => onConfigChange({...config, apiProvider: 'xAI'})}
              className={`py-2 rounded-xl text-[10px] font-bold transition-all ${config.apiProvider === 'xAI' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}
            >
              xAI Grok (Paid/Trial)
            </button>
          </div>
        </div>

        {config.apiProvider === 'HuggingFace' && (
          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
            <label className="block text-[10px] font-bold text-sky-600 uppercase tracking-wider italic mb-2">HF Read Token</label>
            <input type="password" name="hfToken" value={config.hfToken} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-[11px]" placeholder="hf_xxxxxxxx" />
          </div>
        )}
        
        {config.apiProvider === 'Groq' && (
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider italic mb-1">Groq API Key</label>
            <a href="https://console.groq.com/keys" target="_blank" className="text-[8px] text-indigo-400 underline mb-2 block">Get free key here</a>
            <input type="password" name="groqKey" value={config.groqKey} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-[11px]" placeholder="gsk_xxxxxxxx" />
          </div>
        )}

        {config.apiProvider === 'xAI' && (
          <div className="p-4 bg-gray-100 rounded-2xl border border-gray-300">
            <label className="block text-[10px] font-bold text-gray-800 uppercase tracking-wider italic mb-1">xAI (Grok) API Key</label>
            <a href="https://console.x.ai" target="_blank" className="text-[8px] text-gray-500 underline mb-2 block">Click "Console" in your screenshot</a>
            <input type="password" name="xAiKey" value={config.xAiKey} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-[11px]" placeholder="xai-xxxxxxx" />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 italic">3. Identity</label>
          <input type="text" name="name" value={config.name} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="GF Name" />
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <button onClick={onReset} className="w-full py-2 bg-white border border-rose-200 text-rose-500 rounded-xl font-bold text-[10px] hover:bg-rose-50">CLEAR PREVIEW</button>
      </div>
    </div>
  );
};

export default Sidebar;
