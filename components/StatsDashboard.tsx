
import React, { useEffect, useState } from 'react';

interface UserData {
  id: number;
  userName: string;
  isPremium: boolean;
}

interface ChatLog {
  time: string;
  userName: string;
  userMsg: string;
  botReply: string;
}

interface StatsData {
  totalUsers: number;
  totalRevenue: number;
  totalMessagesProcessed: number;
  privatePhotosSent: number;
  chatHistory: ChatLog[];
  users: UserData[];
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) setStats(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchStats();
    const timer = setInterval(fetchStats, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#020617] min-h-screen text-slate-200">
      
      {/* HEADER SECTION: TOTAL SALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-rose-600 to-rose-900 p-8 rounded-[3rem] shadow-2xl flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-200/60">Total Earnings</h2>
                <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white">Live Tracking</span>
            </div>
            <p className="text-6xl font-black text-white">₹{stats?.totalRevenue || 0}</p>
            <p className="text-sm font-bold text-rose-200/80 mt-2 italic">Aapke bot ne itna maza aur paisa kamaya hai! 🫦🚀</p>
        </div>

        <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2.5rem] flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Lovers</p>
                    <p className="text-2xl font-black text-white">{stats?.totalUsers || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <i className="fas fa-users"></i>
                </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2.5rem] flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Photos Sent</p>
                    <p className="text-2xl font-black text-white">{stats?.privatePhotosSent || 0}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                    <i className="fas fa-camera"></i>
                </div>
            </div>
        </div>
      </div>

      {/* CONVERSATION FEED */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden">
        <div className="px-8 py-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">User Conversation Log</h3>
            <span className="text-[10px] font-bold text-slate-600">Live Feed</span>
        </div>
        <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 text-slate-500 text-[9px] font-black uppercase tracking-widest sticky top-0">
                    <tr>
                        <th className="px-8 py-4">Time</th>
                        <th className="px-8 py-4">User</th>
                        <th className="px-8 py-4">Message</th>
                        <th className="px-8 py-4">Bot Reply / Media</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                    {stats?.chatHistory && stats.chatHistory.length > 0 ? (
                        stats.chatHistory.map((chat, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-5 text-[10px] font-mono text-slate-500">{chat.time}</td>
                                <td className="px-8 py-5 text-[11px] font-black text-rose-400">{chat.userName}</td>
                                <td className="px-8 py-5 text-sm text-slate-300 max-w-xs truncate group-hover:whitespace-normal">
                                    {chat.userMsg}
                                </td>
                                <td className="px-8 py-5 text-sm text-slate-400">
                                    {chat.botReply.startsWith('[SENT_IMAGE]:') ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-purple-400 font-black text-[9px] bg-purple-400/10 px-2 py-1 rounded border border-purple-400/20">📸 MEDIA SENT</span>
                                            <a href={chat.botReply.split(': ')[1]} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 underline hover:text-blue-300 truncate max-w-[150px]">
                                                {chat.botReply.split(': ')[1]}
                                            </a>
                                        </div>
                                    ) : (
                                        <span className="italic">{chat.botReply}</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-8 py-20 text-center text-slate-600 italic text-sm">
                                Waiting for interactions... ❤️
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
