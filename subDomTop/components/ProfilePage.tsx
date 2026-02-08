
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Globe, ArrowLeft, ShieldCheck, Terminal, Sparkles, Activity, CheckCircle, Cpu, Zap } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const ProfilePage: React.FC<Props> = ({ onBack }) => {
  const [data, setData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const params = new URLSearchParams(window.location.search);
      const site = params.get('site');
      
      if (site) {
        try {
          const docRef = doc(db, "subdomains", site);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const subData = docSnap.data();
            setData(subData);
            
            const userRef = doc(db, "users", subData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setUserData(userSnap.data());
            }
          }
        } catch (e) {
          console.error("DNS Resolution Error:", e);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-10 text-red-500">
        <Terminal size={40} />
      </div>
      <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter italic">UNRESOLVED NODE</h1>
      <p className="text-slate-400 font-bold mb-10 max-w-sm">This subdomain is not currently registered on the TnxBD edge network.</p>
      <button onClick={onBack} className="px-10 py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-slate-200">Return to Portal</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* Abstract Aura Background */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-400/10 blur-[120px] rounded-full opacity-60"></div>
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-blue-400/5 blur-[120px] rounded-full opacity-60"></div>
      
      <div className="max-w-2xl w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[4rem] p-12 lg:p-20 text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.03)] relative">
          
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center mb-10 shadow-2xl relative group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <Cpu size={80} className="text-slate-900 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
               <div className="absolute bottom-4 right-4 bg-emerald-500 p-2.5 rounded-2xl shadow-xl">
                 <CheckCircle size={20} className="text-white" />
               </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-4 text-slate-900">
              {userData?.displayName || data.name}
            </h1>

            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] uppercase mb-12 shadow-xl shadow-slate-200">
               <Zap size={14} className="fill-emerald-400 text-emerald-400" />
               <span>{data.name}.tnxbd.top</span>
            </div>

            <p className="text-2xl text-slate-500 font-medium leading-relaxed max-w-md mx-auto mb-16 italic">
              "{userData?.bio || 'Initializing digital identity node...'}"
            </p>

            <div className="w-full grid grid-cols-2 gap-6">
              <ProfileStat icon={<ShieldCheck size={20} />} label="Security" val="Edge SSL Active" color="emerald" />
              <ProfileStat icon={<Activity size={20} />} label="Connectivity" val="Global Edge CDN" color="blue" />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-12 opacity-30 hover:opacity-100 transition-opacity">
           <button onClick={onBack} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-emerald-500 transition-all group">
             <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Portal Entry
           </button>
           <div className="flex items-center gap-3 font-black text-3xl tracking-tighter italic text-slate-900 grayscale hover:grayscale-0 transition-all">
              <Sparkles className="text-emerald-500" />
              TnxBD INFRA
           </div>
        </div>
      </div>
    </div>
  );
};

const ProfileStat = ({ icon, label, val, color }: any) => {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-50',
    blue: 'text-blue-500 bg-blue-50'
  };
  
  return (
    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-left group hover:bg-white hover:border-slate-200 transition-all cursor-default">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${colors[color]}`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-xs font-bold text-slate-900">{val}</p>
    </div>
  );
};

export default ProfilePage;
