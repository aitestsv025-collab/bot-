
import React, { useState } from 'react';
import StatsDashboard from './components/StatsDashboard';
import { BotConfig, DEFAULT_CONFIG } from './types';

const App: React.FC = () => {
  const [config] = useState<BotConfig>(DEFAULT_CONFIG);

  return (
    <div className="min-h-screen bg-[#fffafa] flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-rose-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
            <i className="fas fa-heart text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight fancy-font italic">SoulMate Admin</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Live Tracking Active</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-rose-50 rounded-xl border border-rose-100 hidden md:block">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Server Status</p>
            <p className="text-xs font-bold text-gray-700">Healthy & Online</p>
          </div>
        </div>
      </nav>

      {/* Main Content - Full Width Dashboard */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <StatsDashboard />
        </div>
      </main>
    </div>
  );
};

export default App;
