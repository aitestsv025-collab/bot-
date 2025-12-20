
import React, { useState } from 'react';
import StatsDashboard from './components/StatsDashboard';
import { BotConfig, DEFAULT_CONFIG } from './types';

const App: React.FC = () => {
  const [showDeployModal, setShowDeployModal] = useState(false);
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
          <button 
            onClick={() => setShowDeployModal(true)}
            className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <i className="fas fa-rocket text-rose-400"></i> DEPLOYMENT STATUS
          </button>
        </div>
      </nav>

      {/* Main Content - Full Width Dashboard */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <StatsDashboard />
        </div>
      </main>

      {showDeployModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 bg-gradient-to-r from-rose-600 to-rose-500 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold italic fancy-font">Cloud Deployment</h3>
                <p className="text-[10px] opacity-80 uppercase tracking-widest mt-1">Server Runtime Management</p>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="flex gap-5 items-start">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                  <i className="fas fa-info-circle text-xl"></i>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg mb-1">Bot is running externally</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Aapka bot abhi Telegram par live hai. Is dashboard ka kaam sirf data monitor karna aur analytics dikhana hai. Settings update karne ke liye apne server (Render/Heroku) ke Environment Variables check karein.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Current Environment</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                    <p className="text-[9px] font-bold text-rose-500 uppercase mb-1">Status</p>
                    <p className="text-sm font-black text-gray-800">24/7 ONLINE</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                    <p className="text-[9px] font-bold text-rose-500 uppercase mb-1">Provider</p>
                    <p className="text-sm font-black text-gray-800">RENDER.COM</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button 
                onClick={() => setShowDeployModal(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
              >
                CLOSE
              </button>
              <button 
                onClick={() => window.open('https://render.com', '_blank')}
                className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                OPEN SERVER PANEL <i className="fas fa-external-link-alt text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
