
import React, { useEffect, useState } from 'react';

interface StatsData {
  totalUsers: number;
  totalRevenue: number;
  totalMessagesProcessed: number;
  privatePhotosSent: number;
  chatHistory: any[];
  isCashfreeApproved: boolean;
  lastPaymentError: string | null;
  lastRawError: any;
  mode: string;
  envStatus: {
    telegram: boolean;
    gemini: boolean;
    cf_id: string;
    cf_secret: string;
  };
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 5000);
    return () => clearInterval(timer);
  }, []);

  const manualVerify = async () => {
    setVerifying(true);
    await fetch('/api/admin/verify-cashfree');
    await fetchStats();
    setVerifying(false);
  };

  const maskKey = (key: string | undefined) => {
    if (!key || key === "missing") return "❌ MISSING";
    return `${key.substring(0, 4)}••••${key.substring(key.length - 4)}`;
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#020617] min-h-screen text-slate-200">
      
      {/* 1. SYSTEM VITALS & KEYS CHECK */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 p-8 rounded-[3rem] shadow-xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                    <i className="fas fa-shield-heart"></i>
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">System Vitals (Environment Keys)</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Telegram Bot</span>
                    <span className={stats?.envStatus?.telegram ? "text-emerald-400 font-bold text-xs" : "text-rose-500 font-bold text-xs"}>
                        {stats?.envStatus?.telegram ? "✅ DETECTED" : "❌ MISSING"}
                    </span>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Gemini AI</span>
                    <span className={stats?.envStatus?.gemini ? "text-emerald-400 font-bold text-xs" : "text-rose-500 font-bold text-xs"}>
                        {stats?.envStatus?.gemini ? "✅ DETECTED" : "❌ MISSING"}
                    </span>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Cashfree App ID</span>
                    <span className="font-mono text-[10px] text-slate-300">{maskKey(stats?.envStatus?.cf_id)}</span>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Cashfree Secret</span>
                    <span className="font-mono text-[10px] text-slate-300">{maskKey(stats?.envStatus?.cf_secret)}</span>
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-900 p-8 rounded-[3rem] shadow-xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-200/60 tracking-widest mb-1">Bot Mode</p>
                <h2 className="text-3xl font-black text-white">{stats?.mode || 'PROD'}</h2>
              </div>
              <div className="text-[10px] text-indigo-100/60 font-medium leading-relaxed">
                {stats?.mode === 'PROD' 
                  ? "Bot is using Real Payments API. Keys must be Production keys." 
                  : "Bot is in Test Mode. Use Sandbox keys only."}
              </div>
          </div>
      </div>

      {/* 2. REVENUE & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-rose-600 to-rose-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <i className="fas fa-coins text-[120px] -rotate-12"></i>
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-rose-200/60 mb-2">Total Earnings (Real)</h2>
            <p className="text-7xl font-black text-white tracking-tighter">₹{stats?.totalRevenue || 0}</p>
            <p className="text-sm font-bold text-rose-100/70 mt-4 italic flex items-center gap-2">
                <i className="fas fa-bolt text-yellow-400"></i> Soulmate AI is Printing Money!
            </p>
        </div>

        <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-slate-700 transition-all cursor-default">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Lovers</p>
                    <p className="text-3xl font-black text-white group-hover:scale-110 transition-transform origin-left">{stats?.totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                    <i className="fas fa-users"></i>
                </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-slate-700 transition-all cursor-default">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Media Sent</p>
                    <p className="text-3xl font-black text-white group-hover:scale-110 transition-transform origin-left">{stats?.privatePhotosSent || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 shadow-inner">
                    <i className="fas fa-fire"></i>
                </div>
            </div>
        </div>
      </div>

      {/* 3. CASHFREE DEBUGGER (Advanced) */}
      <div className="bg-slate-950/50 border border-slate-800 p-10 rounded-[3.5rem] space-y-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                   <i className="fas fa-bug text-xl"></i>
                 </div>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-white">Cashfree Diagnostic Tool</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Troubleshoot activation issues</p>
                 </div>
               </div>
               <button 
                 onClick={manualVerify}
                 disabled={verifying}
                 className="bg-white hover:bg-slate-200 text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg"
               >
                 {verifying ? (
                   <><i className="fas fa-spinner animate-spin"></i> Checking...</>
                 ) : (
                   <><i className="fas fa-plug-circle-check"></i> Test Connection</>
                 )}
               </button>
           </div>
           
           {(stats?.lastPaymentError || !stats?.isCashfreeApproved) ? (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="lg:col-span-1 bg-rose-500/5 border border-rose-500/20 p-6 rounded-[2rem]">
                  <p className="text-[10px] font-black text-rose-500 uppercase mb-3 tracking-widest">Failure Reason</p>
                  <p className="text-lg font-black text-white leading-tight mb-4">{stats?.lastPaymentError || "Connection Refused"}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-rose-200/40 text-[10px] font-bold">
                        <i className="fas fa-check-circle"></i> Check API Keys again
                    </div>
                    <div className="flex items-center gap-2 text-rose-200/40 text-[10px] font-bold">
                        <i className="fas fa-check-circle"></i> IP Whitelisting (Cashfree Dashboard)
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-black/60 p-6 rounded-[2rem] border border-slate-800 overflow-hidden relative">
                   <div className="absolute top-4 right-6 text-[10px] font-mono text-slate-700">RAW_JSON_FEED</div>
                   <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Full API Debug Log</p>
                   <pre className="text-[10px] font-mono text-emerald-400/80 overflow-x-auto whitespace-pre-wrap max-h-[150px] scrollbar-hide">
                     {stats?.lastRawError ? JSON.stringify(stats?.lastRawError, null, 2) : "No raw data available. Click 'Test Connection' to generate a log."}
                   </pre>
                </div>
             </div>
           ) : (
             <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem] flex items-center gap-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
                    <i className="fas fa-check"></i>
                </div>
                <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Payment System Healthy</h4>
                    <p className="text-xs text-slate-500 font-medium">Cashfree is accepting requests and generating links. Everything looks perfect, Jaanu! 🫦</p>
                </div>
             </div>
           )}
      </div>

      {/* 4. CONVERSATION FEED */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl">
        <div className="px-10 py-8 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center backdrop-blur-md">
            <div>
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Live Conversation Stream</h3>
                <p className="text-[10px] text-slate-600 font-bold mt-1">REAL-TIME MONITORING ENABLED</p>
            </div>
            <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            </div>
        </div>
        <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/40 text-slate-600 text-[9px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-md">
                    <tr>
                        <th className="px-10 py-5">Time</th>
                        <th className="px-10 py-5">Lover</th>
                        <th className="px-10 py-5">Message</th>
                        <th className="px-10 py-5">Bot Reaction</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                    {stats?.chatHistory && stats.chatHistory.length > 0 ? (
                        stats.chatHistory.map((chat, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-10 py-6 text-[10px] font-mono text-slate-500">{chat.time}</td>
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/40"></div>
                                        <span className="text-xs font-black text-white">{chat.userName}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-sm text-slate-400 max-w-xs truncate group-hover:whitespace-normal transition-all">
                                    {chat.userMsg}
                                </td>
                                <td className="px-10 py-6 text-sm text-slate-400">
                                    {chat.botReply.startsWith('[SENT_IMAGE]') ? (
                                        <span className="text-[9px] font-black bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/20 inline-flex items-center gap-2 tracking-widest uppercase">
                                            <i className="fas fa-camera"></i> Media Sent
                                        </span>
                                    ) : (
                                        <span className="italic font-medium opacity-80 leading-relaxed text-slate-300">
                                            "{chat.botReply}"
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-10 py-32 text-center text-slate-600 italic text-sm">
                                <div className="flex flex-col items-center gap-4">
                                    <i className="fas fa-heart text-4xl opacity-10"></i>
                                    Waiting for first interaction... ❤️
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
