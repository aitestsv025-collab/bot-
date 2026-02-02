
import React, { useEffect, useState } from 'react';

interface StatsData {
  totalUsers: number;
  totalRevenue: number;
  chatHistory: any[];
  isCashfreeApproved: boolean;
  lastPaymentError: string | null;
  lastRawError: any;
  mode: string;
  envStatus: {
    telegram: boolean;
    gemini: boolean;
    cf_id: string;
    cf_secret: string;
  };
}

const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const manualVerify = async () => {
    setVerifying(true);
    await fetch('/api/admin/verify-cashfree');
    await fetchStats();
    setVerifying(false);
  };

  const copyMail = () => {
    const text = `Subject: Urgent: Enable 'Payment Links' API for my account - [${stats?.envStatus?.cf_id}]

Hi Cashfree Team,

My account is fully activated, but I am receiving the following error when calling the Payment Links API:
"PaymentLink_link_creation_failed: link_creation is not enabled or approved."

API Endpoint: https://api.cashfree.com/pg/links
App ID: ${stats?.envStatus?.cf_id}

Please enable the 'Payment Links' feature for my account immediately as it is affecting my live business operations.

Regards,`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#020617] min-h-screen text-slate-200">
      
      {/* ERROR SOLUTION CARD */}
      {stats?.lastPaymentError?.includes('link_creation') && (
        <div className="bg-rose-950/20 border-2 border-rose-500 p-8 rounded-[3rem] space-y-4 animate-pulse">
            <div className="flex items-center gap-4 text-rose-500">
                <i className="fas fa-exclamation-triangle text-4xl"></i>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Issue Found: Feature Disabled</h2>
            </div>
            <p className="text-slate-300 font-medium leading-relaxed">
                Bhai, Cashfree ne aapka Gateway toh activate kar diya hai par **"Payment Links"** API permission OFF hai. 
                Jab tak wo log ise ON nahi karte, bot link nahi bana payega.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
                <button 
                    onClick={copyMail}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
                >
                    <i className="fas fa-copy"></i>
                    {copied ? "SUPPORT MAIL COPIED!" : "COPY SUPPORT MAIL DRAFT"}
                </button>
                <a 
                    href="mailto:care@cashfree.com"
                    className="flex-1 bg-white text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
                >
                    <i className="fas fa-envelope"></i> SEND TO CARE@CASHFREE.COM
                </a>
            </div>
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-rose-600 to-rose-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-rose-200/60 mb-2">Total Earnings</h2>
            <p className="text-7xl font-black text-white tracking-tighter">₹{stats?.totalRevenue || 0}</p>
            <p className="text-sm font-bold text-rose-100/70 mt-4 italic">
                {stats?.lastPaymentError?.includes('link_creation') ? "⚠️ UPI Fallback mode enabled in Bot" : "🚀 Running on Cashfree API"}
            </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[3rem] flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Users</p>
            <p className="text-4xl font-black text-white">{stats?.totalUsers || 0}</p>
        </div>
      </div>

      {/* DIAGNOSTICS */}
      <div className="bg-slate-950/80 border border-slate-800 p-8 rounded-[3.5rem] space-y-6">
           <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">System Logs</h3>
                <button 
                 onClick={manualVerify}
                 disabled={verifying}
                 className="text-[10px] font-black uppercase bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-full transition-all"
               >
                 {verifying ? "Checking..." : "Refresh Status"}
               </button>
           </div>
           
           <div className="bg-black/60 p-6 rounded-3xl border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-[300px]">
             {stats?.lastRawError ? (
               <pre className="whitespace-pre-wrap">{JSON.stringify(stats?.lastRawError, null, 2)}</pre>
             ) : (
               <div className="text-slate-600 italic">No errors logged. Everything seems fine on the surface.</div>
             )}
           </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
