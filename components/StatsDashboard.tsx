
import React, { useEffect, useState, useRef } from 'react';

interface UserData {
  id: number;
  userName: string;
  isPremium: boolean;
  planName: string;
  timeLeft: number;
}

interface StatsData {
  totalUsers: number;
  totalRevenue: number;
  totalMessagesProcessed: number;
  privatePhotosSent: number;
  galleryAccessCount: number;
  config: {
    secretGalleryUrl: string;
    botName: string;
  };
  users: UserData[];
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedInitialValue = useRef(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          
          // Only set the input field value if it's the FIRST time we load data
          // This prevents polling from overwriting the user while they are typing
          if (!hasLoadedInitialValue.current) {
            setNewGalleryUrl(data.config.secretGalleryUrl || '');
            hasLoadedInitialValue.current = true;
          }
        }
      } catch (e) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretGalleryUrl: newGalleryUrl })
      });
      if (res.ok) {
        alert("Settings Updated! Bot will now share the new link.");
      } else {
        throw new Error("Failed to update");
      }
    } catch (e) {
      alert("Update failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setNewGalleryUrl('');
  };

  return (
    <div className="p-6 space-y-8 bg-[#fffafa] min-h-screen">
      {/* Real-time Ticker */}
      <div className="bg-gray-900 text-white px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
           SoulMate AI: Engine Version 3.1 Live
        </div>
        <div className="text-rose-400">Secure Payments via Cashfree API</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100">
          <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-1">Total Revenue</p>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-gray-900">₹{stats?.totalRevenue || 0}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100">
          <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-1">AI Photos Sent</p>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-gray-900">{stats?.privatePhotosSent || 0}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100">
          <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">Gallery Unlocks</p>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-gray-900">{stats?.galleryAccessCount || 0}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100">
          <p className="text-[10px] text-purple-500 font-black uppercase tracking-widest mb-1">Total Souls</p>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-gray-900">{stats?.totalUsers || 0}</span>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-rose-100">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
              <i className="fas fa-cog text-xl"></i>
           </div>
           <div>
              <h3 className="font-bold text-2xl italic fancy-font">Bot Configuration</h3>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Manage Secret Links & Persona</p>
           </div>
        </div>

        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Secret Gallery Link (Telegra.ph/ImgBB)</label>
                    <button 
                        onClick={handleClear}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-tighter"
                    >
                        [ Clear Current Link ]
                    </button>
                </div>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={newGalleryUrl}
                        onChange={(e) => setNewGalleryUrl(e.target.value)}
                        placeholder="Paste your link here (e.g. https://telegra.ph/xyz)..."
                        className="flex-1 bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium"
                    />
                    <button 
                        onClick={handleUpdateConfig}
                        disabled={isSaving}
                        className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'SAVE LINK'}
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 italic">This link is shared ONLY with Premium users who ask for your "gallery" or "album".</p>
            </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-rose-100 overflow-hidden">
        <div className="p-8 border-b border-rose-50 bg-gradient-to-r from-rose-50/50 to-white">
            <h3 className="font-bold text-xl text-gray-800">Recent Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-rose-50">
                <th className="px-8 py-6">User</th>
                <th className="px-8 py-6">Plan</th>
                <th className="px-8 py-6">Days Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {(!stats?.users || stats.users.length === 0) ? (
                <tr><td colSpan={3} className="px-8 py-6 text-center text-gray-400">No users found.</td></tr>
              ) : (
                stats.users.map(user => (
                  <tr key={user.id}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-xs">
                          {user.userName ? user.userName[0] : '?'}
                        </div>
                        <span className="font-bold text-gray-800">{user.userName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${user.isPremium ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {user.isPremium ? user.planName : 'Free'}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-sm">{user.timeLeft}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
