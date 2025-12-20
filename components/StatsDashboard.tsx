
import React, { useEffect, useState } from 'react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
}

interface UserData {
  id: number;
  userName: string;
  role: string;
  intimacy: number;
  messageCount: number;
  isPremium: boolean;
  lastActive: string;
  firstSeen: string;
  chatHistory: ChatMessage[];
}

interface StatsData {
  totalUsers: number;
  totalMessages: number;
  uptime: number;
  users: UserData[];
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
      if (selectedUser) {
        const updated = data.users.find((u: UserData) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (e) {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Faster updates for "Live" feel
    return () => clearInterval(interval);
  }, [selectedUser]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-gray-900 border-t-rose-500 rounded-full animate-spin"></div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Establishing Secure Link...</p>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Stealth Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-6 rounded-[2rem] shadow-2xl border border-gray-800">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 text-2xl border border-rose-500/20">
              <i className="fas fa-user-secret"></i>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-gray-900 animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Stealth Monitor <span className="text-rose-500 text-sm ml-2 opacity-50 font-mono">v2.0</span></h2>
            <div className="flex gap-4 mt-1">
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
                <i className="fas fa-shield-alt"></i> Invisible Mode: Active
              </span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                <i className="fas fa-broadcast-tower"></i> Live Feed: Synchronized
              </span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex gap-8 px-10 border-l border-gray-800">
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Global Traffic</p>
            <p className="text-xl font-black text-white">{stats?.totalMessages || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Nodes</p>
            <p className="text-xl font-black text-white">{stats?.totalUsers || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Target List</h3>
            <span className="text-[10px] bg-rose-100 text-rose-600 px-3 py-1 rounded-full font-black">PRIVATE ACCESS ONLY</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="px-8 py-5">Node Identity</th>
                  <th className="px-8 py-5">Active Persona</th>
                  <th className="px-8 py-5">Psychology Index</th>
                  <th className="px-8 py-5">Traffic</th>
                  <th className="px-8 py-5">Subscription</th>
                  <th className="px-8 py-5 text-right">Intercept</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-rose-50/30 transition-all cursor-pointer group" onClick={() => setSelectedUser(user)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-lg group-hover:bg-rose-600 transition-colors">
                          {user.userName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800">{user.userName}</p>
                          <p className="text-[9px] text-gray-400 font-mono">HEX: #{user.id.toString(16)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-gray-500 italic">Talking to {user.role}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-1000" 
                            style={{ width: `${Math.min(user.intimacy * 5, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-black text-rose-600">{user.intimacy}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-gray-700">{user.messageCount} msg</span>
                    </td>
                    <td className="px-8 py-6">
                      {user.isPremium ? (
                        <span className="px-2 py-0.5 bg-yellow-400 text-black text-[8px] font-black rounded uppercase">Premium Node</span>
                      ) : (
                        <span className="text-[8px] text-gray-300 font-black uppercase">Standard Node</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="w-8 h-8 rounded-lg border border-gray-200 text-gray-400 group-hover:text-rose-600 group-hover:border-rose-200 transition-all">
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Intercept Modal (Chat History) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-[85vh] bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-500 border border-white/20">
            {/* Dark Header */}
            <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-rose-900/20">
                  {selectedUser.userName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight italic">INTERCEPTED FEED: {selectedUser.userName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Status: Secret Monitoring</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-10 h-10 bg-white/5 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#0a0a0a] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {selectedUser.chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 italic">
                  <i className="fas fa-terminal text-4xl mb-4 opacity-10"></i>
                  <p className="font-mono text-xs uppercase tracking-widest">No traffic detected on this node...</p>
                </div>
              ) : (
                selectedUser.chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                       <span className={`text-[8px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-400' : 'text-rose-500'}`}>
                         {msg.role === 'user' ? `[NODE_${selectedUser.userName.toUpperCase()}]` : '[SYSTEM_REPLY]'}
                       </span>
                    </div>
                    <div className={`max-w-[85%] px-6 py-4 rounded-3xl shadow-2xl font-mono text-sm leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-blue-600/10 text-blue-100 border border-blue-500/30 rounded-tr-none' 
                      : 'bg-rose-600/10 text-rose-100 border border-rose-500/30 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.timestamp && (
                       <span className="text-[8px] text-gray-600 mt-2 font-mono tracking-tighter">
                         TIMESTAMP: {new Date(msg.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                       </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Analytics Footer */}
            <div className="p-8 bg-gray-50 border-t border-gray-200 grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center shadow-sm">
                 <p className="text-[8px] text-gray-400 font-black uppercase mb-1">Psychology</p>
                 <p className="text-lg font-black text-rose-600">{selectedUser.intimacy}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center shadow-sm">
                 <p className="text-[8px] text-gray-400 font-black uppercase mb-1">Packets</p>
                 <p className="text-lg font-black text-gray-800">{selectedUser.messageCount}</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-2xl text-center shadow-xl">
                 <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Stealth</p>
                 <p className="text-lg font-black text-green-500">100%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDashboard;
