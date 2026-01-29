
import React, { useEffect, useState } from 'react';

interface UserData {
  id: number;
  userName: string;
  isPremium: boolean;
  language: string;
  role: string;
}

interface StatsData {
  totalUsers: number;
  totalRevenue: number;
  totalMessagesProcessed: number;
  privatePhotosSent: number;
  config: { welcomeImageUrl: string; botName: string };
  users: UserData[];
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [botName, setBotName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          if (!imageUrl && data.config) setImageUrl(data.config.welcomeImageUrl);
          if (!botName && data.config) setBotName(data.config.botName);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };
    fetchStats();
    const timer = setInterval(fetchStats, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ welcomeImageUrl: imageUrl, botName })
      });
      if (res.ok) {
        alert("Bot Config Updated! Naya image ab bot par dikhega. 🫦");
      }
    } catch (e) {
      alert("Error updating config");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-8 bg-[#fffafa] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-2xl">
        <div>
          <h2 className="font-black italic text-rose-400 text-2xl tracking-tight fancy-font">SoulMate Live Monitor</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time Bot Performance</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
          <span className="text-xs font-black uppercase text-gray-300">System Online</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-rose-50 transition-all hover:shadow-md">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Total Earnings</p>
          <p className="text-4xl font-black text-gray-900">₹{stats?.totalRevenue || 0}</p>
          <div className="mt-4 h-1 w-12 bg-rose-500 rounded-full"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-rose-50 transition-all hover:shadow-md">
          <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-2">Active Lovers</p>
          <p className="text-4xl font-black text-gray-900">{stats?.totalUsers || 0}</p>
          <div className="mt-4 h-1 w-12 bg-blue-500 rounded-full"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-rose-50 transition-all hover:shadow-md">
          <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-2">Photos Sent</p>
          <p className="text-4xl font-black text-gray-900">{stats?.privatePhotosSent || 0}</p>
          <div className="mt-4 h-1 w-12 bg-orange-500 rounded-full"></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-rose-50 transition-all hover:shadow-md">
          <p className="text-[10px] text-purple-500 font-black uppercase tracking-widest mb-2">AI Chats</p>
          <p className="text-4xl font-black text-gray-900">{stats?.totalMessagesProcessed || 0}</p>
          <div className="mt-4 h-1 w-12 bg-purple-500 rounded-full"></div>
        </div>
      </div>

      {/* Image link update section */}
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-rose-50">
        <h3 className="font-black text-xl mb-6 text-gray-800 flex items-center gap-3">
          <i className="fas fa-magic text-rose-500"></i> Bot Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Welcome Image URL</label>
            <input 
              type="text" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter Image URL (Direct Link)"
              className="w-full bg-rose-50/20 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-rose-400 border border-rose-50 font-bold text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Bot Display Name</label>
            <input 
              type="text" 
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="e.g. Malini"
              className="w-full bg-rose-50/20 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-rose-400 border border-rose-50 font-bold text-sm"
            />
          </div>
        </div>
        <button 
          onClick={handleSaveConfig} 
          disabled={isSaving}
          className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'UPDATING...' : 'SAVE CONFIGURATION'}
        </button>
      </div>

      {/* User Table Section */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-rose-50 overflow-hidden">
        <div className="p-10 border-b border-rose-50 flex items-center justify-between">
          <h3 className="font-black text-xl text-gray-800">Real-time Activity Feed</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-rose-50/20 text-[10px] font-black uppercase text-gray-400">
              <tr>
                <th className="px-10 py-6">Lovers Name</th>
                <th className="px-10 py-6">Language</th>
                <th className="px-10 py-6">Role</th>
                <th className="px-10 py-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {stats?.users && stats.users.length > 0 ? (
                stats.users.map(u => (
                  <tr key={u.id} className="hover:bg-rose-50/10 transition-colors">
                    <td className="px-10 py-6 font-black text-gray-800">{u.userName}</td>
                    <td className="px-10 py-6">
                      <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">
                        {u.language || 'Hinglish'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span className="bg-rose-50 text-rose-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">
                        {u.role || 'Romantic'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm ${
                        u.isPremium 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {u.isPremium ? 'Premium User' : 'Free Trial'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-gray-400 italic font-medium">
                    Waiting for lovers to connect...
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
