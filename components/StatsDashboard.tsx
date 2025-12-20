
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
  autoCount: number;
  isPremium: boolean;
  lastActive: string;
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
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('API connection failed');
      const data = await res.json();
      setStats(data);
      setError(null);
      
      if (selectedUser) {
        const updated = data.users.find((u: UserData) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (e) {
      setError("Waiting for server response...");
      console.warn("API unreachable - ensure server.js is running with valid tokens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); 
    return () => clearInterval(interval);
  }, [selectedUser]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-400">
       <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
       <p className="text-[10px] font-black uppercase tracking-[0.3em]">Connecting to Neural Network...</p>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Stealth Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <i className="fas fa-bolt text-6xl text-white"></i>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 text-2xl border border-rose-500/30">
              <i className="fas fa-satellite-dish"></i>
            </div>
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-4 border-gray-900 animate-pulse ${error ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Live Intercept Dashboard</h2>
            <div className="flex flex-wrap gap-4 mt-1">
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
                <i className="fas fa-shield-virus"></i> Stealth Mode: ACTIVE
              </span>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
                <i className="fas fa-robot"></i> Auto-Pilot Engine: READY
              </span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex gap-10 px-10 border-l border-gray-800 relative z-10">
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Global Traffic</p>
            <p className="text-2xl font-black text-white font-mono">{stats?.totalMessages || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Live Nodes</p>
            <p className="text-2xl font-black text-white font-mono">{stats?.totalUsers || 0}</p>
          </div>
        </div>
      </div>

      {/* Target Table */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden min-h-[400px]">
        <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Active Surveillance Feed</h3>
          {!error && stats?.users.length && stats.users.length > 0 ? (
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
               <span className="text-[10px] font-black text-green-600">LIVE TRAFFIC</span>
            </div>
          ) : (
            <span className="text-[10px] font-black text-gray-400 uppercase">Searching for signals...</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">
                <th className="px-10 py-5">Node Identity</th>
                <th className="px-10 py-5">Active Persona</th>
                <th className="px-10 py-5">Auto-Engagement</th>
                <th className="px-10 py-5">Total Intercepts</th>
                <th className="px-10 py-5 text-right">Intercept</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(!stats || stats.users.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <i className="fas fa-terminal text-5xl text-gray-400"></i>
                      <div>
                        <p className="text-xs font-black text-gray-800 uppercase tracking-[0.3em]">No Active Nodes Detected</p>
                        <p className="text-[10px] text-gray-500 mt-2 font-medium">Connect your Telegram bot and start a chat to see live data here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                stats.users.map((user) => (
                  <tr key={user.id} className="hover:bg-rose-50/30 transition-all cursor-pointer group" onClick={() => setSelectedUser(user)}>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-md group-hover:bg-rose-600 transition-colors">
                          {user.userName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800">{user.userName}</p>
                          <p className="text-[9px] text-gray-400 font-mono">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase">{user.role}</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-[120px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${(user.autoCount / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-black text-blue-600">{user.autoCount}/10</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-sm font-black text-gray-700">{user.messageCount}</span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button className="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 group-hover:bg-rose-100 group-hover:text-rose-600 transition-all flex items-center justify-center">
                        <i className="fas fa-user-secret"></i>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-[90vh] bg-[#0a0a0a] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 border border-white/5">
            {/* Dark Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-600/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-500 text-xl font-black">
                  {selectedUser.userName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-widest uppercase italic font-mono">NODE_{selectedUser.userName.toUpperCase()}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> ENCRYPTED INTERCEPT
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 font-mono">
              {selectedUser.chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-700 italic">
                  <p className="text-[10px] uppercase tracking-widest">Awaiting first packet...</p>
                </div>
              ) : (
                selectedUser.chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] px-6 py-4 rounded-3xl text-[13px] leading-relaxed border ${
                      msg.role === 'user' 
                      ? 'bg-blue-600/5 text-blue-300 border-blue-500/20 rounded-tr-none' 
                      : msg.content.startsWith('[AUTO]') 
                        ? 'bg-purple-600/10 text-purple-300 border-purple-500/30 rounded-tl-none italic'
                        : 'bg-rose-600/5 text-rose-300 border-rose-500/20 rounded-tl-none'
                    }`}>
                      {msg.content.startsWith('[AUTO]') && <span className="block text-[8px] font-black text-purple-500 mb-1 tracking-widest uppercase underline">[AUTONOMOUS_PING]</span>}
                      {msg.content.replace('[AUTO] ', '')}
                    </div>
                    <span className="text-[8px] text-gray-700 mt-2">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '...'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-black border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                 <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Affinity Index</p>
                 <p className="text-xl font-black text-rose-500 font-mono">{selectedUser.intimacy}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                 <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Packet Count</p>
                 <p className="text-xl font-black text-gray-300 font-mono">{selectedUser.messageCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDashboard;
