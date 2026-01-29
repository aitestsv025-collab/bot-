
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
  cashfreeConfigured: boolean;
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
        body: JSON.stringify({ 
            secretGalleryUrl: newGalleryUrl
        })
      });
      if (res.ok) {
        alert("Bot Settings Updated! Secret gallery is now live for premium users.");
      }
    } catch (e) {
      alert("Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-8 bg-[#fffafa] min-h-screen pb-20">
      {/* Status Bar */}
      <div className="bg-gray-900 text-white px-6 py-3 rounded-full text-[11px] font-bold uppercase flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
           <span className={`w-2 h-2 rounded-full animate-pulse ${stats?.cashfreeConfigured ? 'bg-green-400' : 'bg-red-500'}`}></span>
           {stats?.cashfreeConfigured ? 'Cashfree API: Production Active' : 'Cashfree API: Configuration Missing'}
        </div>
        <div className="text-rose-400">Malini AI Core Operating Normal</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100 flex flex-col justify-center">
          <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-1">Total Revenue</p>
          <span className="text-3xl font-black text-gray-900">₹{stats?.totalRevenue || 0}</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100 flex flex-col justify-center">
          <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-1">AI Photos Request</p>
          <span className="text-3xl font-black text-gray-900">{stats?.privatePhotosSent || 0}</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100 flex flex-col justify-center">
          <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">Gallery Access</p>
          <span className="text-3xl font-black text-gray-900">{stats?.galleryAccessCount || 0}</span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100 flex flex-col justify-center">
          <p className="text-[10px] text-purple-500 font-black uppercase tracking-widest mb-1">Total Users</p>
          <span className="text-3xl font-black text-gray-900">{stats?.totalUsers || 0}</span>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-rose-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-rose-200">
                    <i className="fas fa-magic text-2xl"></i>
                </div>
                <div>
                    <h3 className="text-3xl font-black text-gray-900 fancy-font italic">SoulMate Studio</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Global Personality & API Control</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Production Mode Engaged</span>
            </div>
        </div>

        <div className="space-y-10">
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Secret Private Gallery URL</label>
                    <span className="text-[10px] text-rose-400 italic font-medium">Shared strictly with Premium lovers</span>
                </div>
                <input 
                    type="text" 
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="https://telegra.ph/my-private-photos-xyz"
                    className="w-full bg-gray-50 border border-gray-100 px-8 py-5 rounded-[1.5rem] text-sm font-semibold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 outline-none transition-all placeholder:text-gray-300"
                />
            </div>

            <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100/50 flex items-start gap-4">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500 mt-1">
                    <i className="fas fa-bolt"></i>
                </div>
                <div className="space-y-1">
                    <h4 className="font-bold text-gray-800 text-sm">Strict Resource Optimization</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Gemini ab sirf tabhi photo generate karega jab user specifically "photo", "pic" ya "shakal" jaise words bolega. Isse aapka API usage bachega.</p>
                </div>
            </div>

            <button 
                onClick={handleUpdateConfig}
                disabled={isSaving}
                className="w-full bg-gray-900 text-white py-6 rounded-[1.5rem] font-black text-lg tracking-widest shadow-2xl hover:bg-black hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {isSaving ? 'UPDATING SYSTEM...' : 'SAVE & DEPLOY SETTINGS'}
            </button>
        </div>
      </div>

      {/* Real-time Users */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-rose-100 overflow-hidden">
        <div className="px-10 py-8 border-b border-rose-50 flex items-center justify-between bg-gradient-to-r from-rose-50/20 to-transparent">
            <h3 className="font-black text-xl text-gray-800 tracking-tight">Recent Activity Log</h3>
            <span className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase">Live Updates</span>
        </div>
        <div className="overflow-x-auto px-6 pb-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-6">User Identity</th>
                <th className="px-6 py-6">Membership</th>
                <th className="px-6 py-6">Valid For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50/50">
              {stats?.users.map(user => (
                <tr key={user.id} className="hover:bg-rose-50/10 transition-colors group">
                  <td className="px-6 py-5 font-bold text-gray-700 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-rose-100 group-hover:text-rose-500 transition-all">
                        <i className="fas fa-user-circle text-lg"></i>
                    </div>
                    {user.userName}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${user.isPremium ? 'bg-rose-500 text-white shadow-rose-100' : 'bg-gray-100 text-gray-400'}`}>
                      {user.isPremium ? user.planName : 'Free User'}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-black text-sm text-gray-400">
                    {user.isPremium ? `${user.timeLeft} Days` : 'Expired'}
                  </td>
                </tr>
              ))}
              {(!stats?.users || stats.users.length === 0) && (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">Listening for new incoming lovers...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
