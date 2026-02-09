
import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
// Added Server icon to imports
import { Globe, ArrowRight, Shield, Cpu, Zap, Search, CheckCircle2, XCircle, Loader2, Server } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  onStart: () => void;
}

const LandingPage: React.FC<Props> = ({ onStart }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<'available' | 'taken' | null>(null);

  const checkAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = searchQuery.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!handle) return;

    setIsChecking(true);
    setAvailability(null);
    try {
      const docRef = doc(db, "subdomains", handle);
      const docSnap = await getDoc(docRef);
      setAvailability(docSnap.exists() ? 'taken' : 'available');
    } catch (error) {
      toast.error("Network error. Try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Globe className="text-white w-5 h-5" strokeWidth={3} />
            </div>
            <span className="text-2xl font-black tracking-tighter">TnxBD</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onStart} className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-slate-100">
              Launch Console
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-44 pb-32 text-center px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-10 border border-emerald-100 animate-fade">
            <Zap size={14} className="fill-emerald-500" />
            <span>Wildcard DNS & Edge Routing Platform</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8 text-slate-900">
            Build your brand <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">on the Edge.</span>
          </h1>
          
          <p className="text-xl text-slate-500 font-medium leading-relaxed mb-16 max-w-2xl mx-auto">
            Professional subdomains on <span className="text-slate-900 font-bold underline decoration-emerald-500/30">tnxbd.top</span>. Instant deployment, global CDN, and automatic SSL.
          </p>

          {/* Availability Search Bar */}
          <div className="max-w-xl mx-auto mb-20 relative">
            <form onSubmit={checkAvailability} className="relative group">
              <div className="flex items-center bg-white border border-slate-200 rounded-[2rem] p-2 shadow-2xl shadow-slate-200 focus-within:border-emerald-500 transition-all">
                <div className="pl-6 text-slate-400 font-bold">
                  <Search size={20} />
                </div>
                <input 
                  type="text"
                  placeholder="search-your-domain"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-4 bg-transparent outline-none font-bold text-lg text-slate-900"
                />
                <div className="pr-4 text-slate-400 font-black text-sm">.tnxbd.top</div>
                <button 
                  type="submit"
                  disabled={isChecking}
                  className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black hover:bg-emerald-600 transition-all flex items-center gap-2"
                >
                  {isChecking ? <Loader2 className="animate-spin" size={20} /> : "Search"}
                </button>
              </div>
            </form>

            {/* Results Overlay */}
            {availability && (
              <div className={`mt-6 p-4 rounded-2xl border flex items-center justify-between animate-fade ${availability === 'available' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                <div className="flex items-center gap-3">
                  {availability === 'available' ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-red-500" />}
                  <span className="font-bold text-sm">
                    {searchQuery}.tnxbd.top is {availability === 'available' ? 'Available!' : 'Already taken.'}
                  </span>
                </div>
                {availability === 'available' && (
                  <button onClick={onStart} className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-all">
                    Claim Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-24 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Server className="text-emerald-500" />}
            title="Professional DNS"
            desc="Manage A, CNAME, MX, and TXT records with a clean, intuitive control panel."
          />
          <FeatureCard 
            icon={<Shield className="text-blue-500" />}
            title="Auto SSL & Security"
            desc="Every subdomain gets an enterprise-grade SSL certificate and DDoS protection."
          />
          <FeatureCard 
            icon={<ArrowRight className="text-orange-500" />}
            title="URL Forwarding"
            desc="Redirect your subdomain to any external URL with a single click."
          />
        </div>
      </section>

      <footer className="py-16 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2.5 opacity-30 mb-6 grayscale">
          <Globe size={20} />
          <span className="font-black tracking-tighter text-xl">TnxBD INFRA</span>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">&copy; 2024 Global Edge Network</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="p-10 rounded-[3rem] bg-[#FDFDFD] border border-slate-100 hover:shadow-2xl hover:shadow-slate-100 transition-all hover:-translate-y-2 group">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-2xl font-black mb-4 tracking-tight">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
