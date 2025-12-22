
import React, { useEffect, useState } from 'react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface UserData {
  id: number;
  userName: string;
  role: string;
  intimacy: number;
  messageCount: number;
  chatHistory: ChatMessage[];
}

interface StatsData {
  totalUsers: number;
  totalMessages: number;
  users: UserData[];
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        if (selectedUser) {
          const updated = data.users.find((u: UserData) => u.id === selectedUser.id);
          if (updated) setSelectedUser(updated);
        }
      }
    } catch (e) {
      console.warn("Retrying connection...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Scanning Telegram Nodes...</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="bg-gradient-to-br from-gray-900 via-rose-950 to-black p-8 rounded-[2rem] shadow-2xl relative overflow-hidden border border-rose-500/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/40 text-rose-500 text-3xl">
              <i className="fas fa-heart-pulse animate-pulse"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white fancy-font italic">SoulMate Intercept v2.5</h2>
              <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.4em] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Live Link: SECURED
              </p>
            </div>
          </div>
          
          <div className="flex gap-10 px-10 border-l border-rose-500/20">
            <div className="text-center">
              <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">Total Packets</p>
              <p className="text-2xl font-black text-white">{stats?.totalMessages || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">Active Souls</p>
              <p className="text-2xl font-black text-white">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Nodes List */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-xl border border-rose-100">
        <div className="p-6 border-b border-rose-50 bg-rose-50/30">
          <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-radar"></i> Active Surveillance Nodes
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                <th className="px-8 py-5">Node</th>
                <th className="px-8 py-5">Persona</th>
                <th className="px-8 py-5">Intimacy Stage</th>
                <th className="px-8 py-5">Intercepts</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {(!stats || stats.users.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center opacity-40 italic text-sm text-rose-300">
                    Awaiting incoming signals... Start a chat on Telegram.
                  </td>
                </tr>
              ) : (
                stats.users.map((user) => (
                  <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-rose-50/50 cursor-pointer group transition-all">
                    <td className="px-8 py-5 flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                        {user.userName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{user.userName}</p>
                        <p className="text-[9px] text-gray-400 font-mono">ID: {user.id}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-rose-100 text-[10px] font-black text-rose-600 rounded-full uppercase tracking-tighter">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                          <div className={`h-full transition-all duration-1000 ${user.intimacy > 70 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-rose-400'}`} style={{ width: `${user.intimacy}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-gray-500">{user.intimacy}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold text-gray-700">{user.messageCount}</td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-rose-300 group-hover:text-rose-600 transition-colors">
                        <i className="fas fa-eye text-xl"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intercept Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-[85vh] bg-[#0c0c0c] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/5">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-600/20 rounded-2xl flex items-center justify-center text-rose-500 text-xl font-black">
                  {selectedUser.userName[0]}
                </div>
                <div>
                  <h3 className="text-white font-black tracking-widest uppercase italic font-mono">NODE_{selectedUser.userName.toUpperCase()}</h3>
                  <p className="text-[9px] text-green-500 font-black flex items-center gap-1 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Raw Socket Data
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-10 h-10 rounded-full bg-white/5 text-gray-500 hover:text-white transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 font-mono text-sm">
              {selectedUser.chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3 rounded-2xl border ${
                    msg.role === 'user' 
                    ? 'bg-blue-600/5 text-blue-300 border-blue-500/20 rounded-tr-none' 
                    : 'bg-rose-600/5 text-rose-300 border-rose-500/20 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-black border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                 <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Intimacy Affinity</p>
                 <p className={`text-xl font-black font-mono ${selectedUser.intimacy > 70 ? 'text-red-500' : 'text-rose-500'}`}>{selectedUser.intimacy}%</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                 <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Status</p>
                 <p className="text-xl font-black text-gray-300 font-mono italic uppercase tracking-tighter">
                   {selectedUser.intimacy < 45 ? 'Defensive' : (selectedUser.intimacy < 70 ? 'Flirty' : 'MAAN GAYI')}
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDashboard;
