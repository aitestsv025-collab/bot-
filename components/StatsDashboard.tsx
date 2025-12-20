
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

const MOCK_STATS: StatsData = {
  totalUsers: 3,
  totalMessages: 142,
  uptime: 1240,
  users: [
    {
      id: 5829102,
      userName: "Aryan_007",
      role: "Girlfriend",
      intimacy: 14,
      messageCount: 56,
      autoCount: 4,
      isPremium: true,
      lastActive: new Date().toISOString(),
      chatHistory: [
        { role: 'model', content: '[AUTO] Good morning! Nashta kiya aapne? 🍳', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { role: 'user', content: 'Haan abhi kiya, tumne?', timestamp: new Date(Date.now() - 3500000).toISOString() }
      ]
    }
  ]
};

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setStats(data);
      setIsUsingMockData(false);
      if (selectedUser) {
        const updated = data.users.find((u: UserData) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (e) {
      setStats(MOCK_STATS);
      setIsUsingMockData(true);
      if (selectedUser) {
        const updated = MOCK_STATS.users.find((u: UserData) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
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
       <p className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Neural Link...</p>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Stealth Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <i className="fas fa-microchip text-6xl text-white"></i>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 text-2xl border border-rose-500/30">
              <i className="fas fa-brain"></i>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-gray-900 animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">AI Autonomy Monitor</h2>
            <div className="flex flex-wrap gap-4 mt-1">
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
                <i className="fas fa-clock"></i> Scheduled Tasks: ACTIVE
              </span>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
                <i className="fas fa-robot"></i> Engagement Engine: RUNNING
              </span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex gap-10 px-10 border-l border-gray-800 relative z-10">
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Global Pings</p>
            <p className="text-2xl font-black text-white font-mono">{stats?.users.reduce((acc, u) => acc + (u.autoCount || 0), 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Nodes</p>
            <p className="text-2xl font-black text-white font-mono">{stats?.totalUsers || 0}</p>
          </div>
        </div>
      </div>

      {/* Target Table */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Node Surveillance Feed</h3>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
             <span className="text-[10px] font-black text-rose-500">LIVE INTERCEPT</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">
                <th className="px-10 py-5">Subject</th>
                <th className="px-10 py-5">Persona</th>
                <th className="px-10 py-5">Auto-Engagement</th>
                <th className="px-10 py-5">Traffic</th>
                <th className="px-10 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.users.map((user) => (
                <tr key={user.id} className="hover:bg-rose-50/30 transition-all cursor-pointer group" onClick={() => setSelectedUser(user)}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-md group-hover:bg-rose-600 transition-colors">
                        {user.userName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800">{user.userName}</p>
                        <p className="text-[9px] text-gray-400 font-mono">NODE_ID: {user.id}</p>
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
                          className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                          style={{ width: `${(user.autoCount / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-black text-blue-600">{user.autoCount}/10</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-sm font-black text-gray-700">{user.messageCount}</span>
                    <span className="text-[10px] text-gray-300 ml-1">PKTS</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button className="text-gray-300 group-hover:text-rose-500 transition-colors">
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intercept Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-[90vh] bg-[#0a0a0a] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 border border-white/5">
            {/* Dark Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-600/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-500 text-xl font-black">
                  {selectedUser.userName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-widest uppercase italic">Node Intercept: {selectedUser.userName}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> SECURE LINK
                    </span>
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      <i className="fas fa-robot"></i> AUTO-PILOT: {selectedUser.autoCount}/10
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-500">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 font-mono">
              {selectedUser.chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-6 py-4 rounded-3xl text-xs leading-relaxed border ${
                    msg.role === 'user' 
                    ? 'bg-blue-600/5 text-blue-300 border-blue-500/20 rounded-tr-none' 
                    : msg.content.startsWith('[AUTO]') 
                      ? 'bg-purple-600/10 text-purple-300 border-purple-500/30 rounded-tl-none italic'
                      : 'bg-rose-600/5 text-rose-300 border-rose-500/20 rounded-tl-none'
                  }`}>
                    {msg.content.startsWith('[AUTO]') && <span className="block text-[8px] font-black text-purple-500 mb-1 tracking-widest uppercase underline">[AUTO_ENGAGEMENT_MODULE]</span>}
                    {msg.content.replace('[AUTO] ', '')}
                  </div>
                  <span className="text-[8px] text-gray-700 mt-2">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '...'}
                  </span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-black border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                 <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Affinity Level</p>
                 <p className="text-xl font-black text-rose-500 font-mono">{selectedUser.intimacy}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                 <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Node Packets</p>
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
