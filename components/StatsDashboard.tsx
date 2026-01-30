
import React, { useEffect, useState } from 'react';

interface UserData {
  id: number;
  userName: string;
  isPremium: boolean;
}

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface StatsData {
  totalUsers: number;
  totalRevenue: number;
  totalMessagesProcessed: number;
  privatePhotosSent: number;
  isCashfreeApproved: boolean;
  lastRawError: any;
  mode: string;
  logs: LogEntry[];
  users: UserData[];
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) setStats(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchStats();
    const timer = setInterval(fetchStats, 3000);
    return () => clearInterval(timer);
  }, []);

  const verifyCashfree = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/admin/verify-cashfree');
      const data = await res.json();
      if (data.active) {
        alert("🎉 BADHAYI HO! Cashfree activate ho gaya hai!");
      } else {
        alert("Abhi bhi inactive hai baby. Error: " + data.error);
      }
    } catch (e) { alert("Check failed!"); }
    setChecking(false);
  };

  const getLogColor = (type: string) => {
    switch(type) {
        case 'success': return 'text-green-400';
        case 'error': return 'text-red-400';
        case 'warning': return 'text-yellow-400';
        default: return 'text-blue-400';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-950 min-h-screen text-slate-200">
      {/* GLOWING HEADER */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent opacity-50"></div>
        <div className="relative z-10">
          <h2 className="font-black italic text-rose-500 text-3xl fancy-font tracking-tight">SoulMate Command Center</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span> Live System Monitoring
          </p>
        </div>
        <div className="relative z-10 flex gap-4 mt-4 md:mt-0">
            <button 
                onClick={verifyCashfree}
                disabled={checking}
                className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${checking ? 'bg-slate-800 text-slate-500' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 active:scale-95'}`}
            >
                <i className={`fas ${checking ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i> 
                {checking ? 'Checking...' : 'Verify Cashfree'}
            </button>
            <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                MODE: <span className="text-rose-400">{stats?.mode || 'PROD'}</span>
            </div>
        </div>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', val: `₹${stats?.totalRevenue || 0}`, icon: 'fa-indian-rupee-sign', color: 'rose' },
          { label: 'Lovers', val: stats?.totalUsers || 0, icon: 'fa-users', color: 'blue' },
          { label: 'Moments', val: stats?.privatePhotosSent || 0, icon: 'fa-camera', color: 'orange' },
          { label: 'Messages', val: stats?.totalMessagesProcessed || 0, icon: 'fa-comment-dots', color: 'purple' }
        ].map((card, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] transition-all hover:border-rose-500/50">
            <div className="flex justify-between items-start mb-4">
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{card.label}</p>
               <i className={`fas ${card.icon} text-${card.color}-500/50`}></i>
            </div>
            <p className="text-3xl font-black text-white">{card.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LOG TERMINAL */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex flex-col h-[500px]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Live Logs</h3>
                <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-slate-500 font-mono">STDOUT</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                {stats?.logs && stats.logs.length > 0 ? (
                    stats.logs.map((log, i) => (
                        <div key={i} className="flex gap-3 border-l border-slate-800 pl-3">
                            <span className="text-slate-600 shrink-0">[{log.time}]</span>
                            <span className={getLogColor(log.type)}>{log.message}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-700 italic">Waiting for activity...</p>
                )}
            </div>
        </div>

        {/* FEED & ERRORS */}
        <div className="lg:col-span-2 space-y-6">
            {/* CASHFREE ALERT */}
            {stats && !stats.isCashfreeApproved && (
                <div className="bg-red-500/10 border-2 border-red-500/20 p-6 rounded-[2.5rem] flex items-center gap-6 animate-pulse">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl shrink-0 shadow-lg shadow-red-500/20">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div>
                        <h4 className="font-black text-red-400 text-lg uppercase tracking-tight">Wait for Support Approval</h4>
                        <p className="text-red-300/70 text-xs">Cashfree support ne aapka ticket le liya hai. Unhe 12-24 ghante lagte hain feature enable karne mein. Tab tak "Verify" button se check karte rahein.</p>
                    </div>
                </div>
            )}

            {/* USER LIST */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Recent Lovers</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-500">
                            <tr>
                                <th className="px-8 py-4">Name</th>
                                <th className="px-8 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {stats?.users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-8 py-5 text-sm font-bold">{u.userName}</td>
                                    <td className="px-8 py-5">
                                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase ${u.isPremium ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {u.isPremium ? 'Premium' : 'Free'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
