
import React, { useEffect, useState } from 'react';

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
  privatePhotosSent: number;
  users: UserData[];
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-rose-100 flex flex-col items-center justify-center">
          <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-2">Earnings</p>
          <p className="text-4xl font-black text-gray-900">₹{stats?.totalRevenue || 0}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-rose-100 flex flex-col items-center justify-center">
          <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-2">Photos Unlocked</p>
          <p className="text-4xl font-black text-gray-900">{stats?.privatePhotosSent || 0}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-rose-100 flex flex-col items-center justify-center">
          <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-2">Live Connections</p>
          <p className="text-4xl font-black text-gray-900">{stats?.totalUsers || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-rose-100 overflow-hidden">
        <div className="p-8 border-b border-rose-50 flex justify-between items-center bg-rose-50/20">
            <h3 className="font-bold text-gray-800 italic fancy-font text-2xl">Client Relationship Manager</h3>
            <span className="px-4 py-1.5 bg-green-100 text-green-600 text-[10px] font-bold rounded-full animate-pulse">LIVE SYNC</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-6">Identity</th>
                <th className="px-8 py-6">Current Plan</th>
                <th className="px-8 py-6">Validity Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {stats?.users.map(user => (
                <tr key={user.id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold">
                            {user.userName[0]}
                        </div>
                        <span className="font-bold text-gray-700">{user.userName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-2 text-[10px] font-black rounded-xl uppercase tracking-wider ${user.isPremium ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-gray-100 text-gray-400'}`}>
                      {user.isPremium ? `💎 ${user.planName}` : 'Standard'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {user.isPremium ? (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                            <span className="text-sm font-bold text-gray-600">{user.timeLeft} Days Left</span>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-300 italic">Expired / Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
