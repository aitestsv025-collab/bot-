
import React, { useEffect, useState } from 'react';

interface User {
    id: number;
    userName: string;
    isPremium: boolean;
    msgCount: number;
}

interface StatsData {
  totalUsers: number;
  totalRevenue: number;
  chatHistory: any[];
  isCashfreeApproved: boolean;
  lastPaymentError: string | null;
  lastRawError: any;
  users: User[];
  envStatus: {
    cf_id: string;
  };
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [approving, setApproving] = useState<number | null>(null);

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

  const handleApprove = async (userId: number) => {
    if (!confirm(`Kya aap User ${userId} ko Premium banana chahte hain?`)) return;
    setApproving(userId);
    try {
      const res = await fetch('/api/admin/make-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) fetchStats();
    } catch (e) { console.error(e); }
    setApproving(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#020617] min-h-screen text-slate-200">
      
      {/* CASHFREE ALERT */}
      <div className="bg-amber-500/10 border-2 border-amber-500 p-8 rounded-[3rem] space-y-3">
          <div className="flex items-center gap-4 text-amber-500">
              <i className="fas fa-clock text-4xl"></i>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Account Status: Partially Active</h2>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
              Bhai, Cashfree ne abhi link creation block kiya hua hai. User ko **UPI ID** dikh raha hai. Jab user aapko Telegram pe screenshot bheje, toh niche list mein se use **"Approve"** kar dena.
          </p>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-200/60 mb-2">Total Users Tracked</h2>
            <p className="text-7xl font-black text-white tracking-tighter">{stats?.totalUsers || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[3rem] flex flex-col justify-center text-center">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Manual Approval Mode</p>
            <span className="text-emerald-500 font-black text-xl">ACTIVE ✅</span>
        </div>
      </div>

      {/* USER MANAGEMENT (THE KEY PART) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl">
        <div className="px-10 py-8 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Manage Lovers & Approvals</h3>
            <i className="fas fa-user-shield text-slate-700"></i>
        </div>
        <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/40 text-slate-600 text-[9px] font-black uppercase tracking-widest sticky top-0">
                    <tr>
                        <th className="px-10 py-5">User</th>
                        <th className="px-10 py-5">Msgs</th>
                        <th className="px-10 py-5">Status</th>
                        <th className="px-10 py-5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                    {stats?.users && stats.users.length > 0 ? (
                        stats.users.map((user) => (
                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-10 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-white">{user.userName}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">{user.id}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-xs text-slate-400">{user.msgCount}</td>
                                <td className="px-10 py-6">
                                    {user.isPremium ? (
                                        <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">Premium</span>
                                    ) : (
                                        <span className="text-[9px] font-black bg-slate-500/10 text-slate-500 px-3 py-1 rounded-full border border-slate-500/20 uppercase">Free</span>
                                    )}
                                </td>
                                <td className="px-10 py-6 text-right">
                                    {!user.isPremium && (
                                        <button 
                                            onClick={() => handleApprove(user.id)}
                                            disabled={approving === user.id}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            {approving === user.id ? "APPROVING..." : "APPROVE PREMIUM"}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={4} className="px-10 py-20 text-center text-slate-600 italic">No users found yet...</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
