
import React, { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, Timestamp, getDoc, updateDoc } from 'firebase/firestore';
import { 
  getDNSRecords, 
  createDNSRecord, 
  deleteDNSRecord, 
  DNSRecord 
} from '../services/cloudflare';
import { 
  Menu, X, Globe, Plus, Trash2, ShieldCheck, 
  Activity, Server, Database, Info, Share2, 
  User as UserIcon, CheckCircle, Save, LogOut,
  ExternalLink, Clock, Loader2, ArrowLeft,
  Settings, Key, Smartphone, Link as LinkIcon, AlertCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface Props {
  user: User;
  onLogout: () => void;
}

interface SubdomainEntry {
  id: string;
  name: string;
  status: string;
  userId: string;
  forwardingUrl?: string;
  createdAt: any;
  role?: 'user' | 'admin';
}

const Dashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'domains' | 'dns' | 'forwarding' | 'profile'>('domains');
  const [subdomains, setSubdomains] = useState<SubdomainEntry[]>([]);
  const [selectedSub, setSelectedSub] = useState<SubdomainEntry | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [profile, setProfile] = useState({ displayName: '', bio: '' });
  const [newSubName, setNewSubName] = useState('');
  const [forwardingInput, setForwardingInput] = useState('');
  
  const [newRecord, setNewRecord] = useState<Partial<DNSRecord>>({
    type: 'A',
    content: '',
    proxied: true
  });

  useEffect(() => {
    fetchUserData();
    fetchUserSubdomains();
  }, [user]);

  const fetchUserData = async () => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      setProfile({
        displayName: userDoc.data().displayName || '',
        bio: userDoc.data().bio || ''
      });
    }
  };

  const fetchUserSubdomains = async () => {
    try {
      const q = query(collection(db, "subdomains"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const list: SubdomainEntry[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as SubdomainEntry));
      setSubdomains(list);
    } catch (e) {
      toast.error("Failed to sync domains");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const handle = newSubName.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      const subRef = doc(db, "subdomains", handle);
      const snap = await getDoc(subRef);
      if (snap.exists()) throw new Error("This name is already claimed.");

      // Initial CNAME point to our edge proxy
      await createDNSRecord({
        type: 'CNAME',
        name: `${handle}.tnxbd.top`,
        content: 'cname.vercel-dns.com',
        ttl: 1,
        proxied: true
      });

      await setDoc(subRef, {
        name: handle,
        userId: user.uid,
        status: 'active',
        createdAt: Timestamp.now()
      });

      toast.success("Domain successfully claimed!");
      setNewSubName('');
      setShowAddModal(false);
      fetchUserSubdomains();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveForwarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "subdomains", selectedSub.id), {
        forwardingUrl: forwardingInput.trim()
      });
      toast.success("Redirect rule updated");
      fetchUserSubdomains();
    } catch (e) {
      toast.error("Failed to update redirect");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadDNS = async (sub: SubdomainEntry) => {
    setSelectedSub(sub);
    setForwardingInput(sub.forwardingUrl || '');
    setActiveTab('dns');
    setIsSidebarOpen(false);
    fetchDNS(sub.name);
  };

  const fetchDNS = async (name: string) => {
    try {
      const records = await getDNSRecords(name);
      setDnsRecords(records);
    } catch (e) {
      toast.error("Cloudflare sync failed");
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !newRecord.content) return;
    setIsProcessing(true);
    try {
      await createDNSRecord({
        type: newRecord.type as any,
        name: `${selectedSub.name}.tnxbd.top`,
        content: newRecord.content as string,
        ttl: 1,
        proxied: newRecord.proxied ?? true
      });
      toast.success("DNS record published");
      setNewRecord({ type: 'A', content: '', proxied: true });
      fetchDNS(selectedSub.name);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Permanently delete this record?")) return;
    try {
      await deleteDNSRecord(id);
      toast.success("Record purged");
      if (selectedSub) fetchDNS(selectedSub.name);
    } catch (e) {
      toast.error("Purge failed");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "users", user.uid), profile);
      toast.success("Profile saved");
    } catch (e) {
      toast.error("Save failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-800 font-sans">
      <Toaster position="top-right" />
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-5 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Globe className="text-white w-4 h-4" strokeWidth={3} />
          </div>
          <span className="font-extrabold tracking-tight">TnxBD</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Globe className="text-white w-5 h-5" strokeWidth={3} />
            </div>
            <span className="text-xl font-black tracking-tighter">TnxBD Cloud</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 pt-6 md:pt-0">
          <SideItem active={activeTab === 'domains'} onClick={() => {setActiveTab('domains'); setIsSidebarOpen(false)}} icon={<Server size={18} />} label="My Nodes" />
          <SideItem active={activeTab === 'dns'} onClick={() => selectedSub ? (setActiveTab('dns'), setIsSidebarOpen(false)) : toast.error("Select a domain")} icon={<Database size={18} />} label="DNS Records" disabled={!selectedSub} />
          <SideItem active={activeTab === 'forwarding'} onClick={() => selectedSub ? (setActiveTab('forwarding'), setIsSidebarOpen(false)) : toast.error("Select a domain")} icon={<LinkIcon size={18} />} label="URL Forward" disabled={!selectedSub} />
          <SideItem active={activeTab === 'profile'} onClick={() => {setActiveTab('profile'); setIsSidebarOpen(false)}} icon={<UserIcon size={18} />} label="Identity Editor" />
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 mb-4 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs font-black">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Premium Plan</p>
            </div>
          </div>
          <button onClick={() => signOut(auth).then(onLogout)} className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-red-500 transition-all text-xs font-bold group">
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          {/* DOMAINS TAB */}
          {activeTab === 'domains' && (
            <div className="animate-fade">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Infrastructure</h1>
                  <p className="text-slate-500 font-medium">Claim and manage professional namespaces on tnxbd.top.</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
                  <Plus size={20} strokeWidth={3} /> Claim Handle
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                <StatCard icon={<Globe className="text-emerald-500" />} label="Active Nodes" val={subdomains.length} />
                <StatCard icon={<Activity className="text-blue-500" />} label="Avg Latency" val="14ms" />
                <StatCard icon={<CheckCircle className="text-orange-500" />} label="SSL Ready" val="100%" />
              </div>

              <div className="grid gap-4">
                {subdomains.map(sub => (
                  <div key={sub.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between group hover:border-emerald-200 hover:shadow-2xl hover:shadow-slate-100 transition-all">
                    <div className="flex items-center gap-5 mb-4 sm:mb-0">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                        <Globe size={28} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{sub.name}.tnxbd.top</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle size={10} className="text-emerald-500" /> Edge Active
                          </span>
                          {sub.forwardingUrl && (
                            <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                              <LinkIcon size={10} /> Redirecting
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => loadDNS(sub)} className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all">Manage Node</button>
                      <a href={`?site=${sub.name}`} target="_blank" className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><ExternalLink size={18} /></a>
                    </div>
                  </div>
                ))}
                {subdomains.length === 0 && (
                  <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
                    <Globe size={40} className="mx-auto text-slate-200 mb-6" />
                    <p className="text-slate-400 font-bold mb-4">You have not claimed any handles yet.</p>
                    <button onClick={() => setShowAddModal(true)} className="text-emerald-500 font-black uppercase text-xs tracking-widest hover:underline">Get Started →</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DNS TAB */}
          {activeTab === 'dns' && selectedSub && (
            <div className="animate-fade">
               <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-100">
                 <button onClick={() => setActiveTab('domains')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all"><ArrowLeft size={20} /></button>
                 <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedSub.name}.tnxbd.top</h2>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Zone Control Panel • Cloudflare Edge</p>
                 </div>
               </div>

               {/* New Record Form */}
               <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 bg-white rounded-[2.5rem] border border-slate-100 mb-8 shadow-xl shadow-slate-50">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Record Type</label>
                    <select 
                      value={newRecord.type}
                      onChange={e => setNewRecord({...newRecord, type: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all appearance-none"
                    >
                      <option value="A">A (Address)</option>
                      <option value="CNAME">CNAME (Alias)</option>
                      <option value="MX">MX (Mail Server)</option>
                      <option value="TXT">TXT (Verification)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Value / Content</label>
                    <input 
                      placeholder="IP Address or Destination Host" required
                      value={newRecord.content}
                      onChange={e => setNewRecord({...newRecord, content: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-mono focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" disabled={isProcessing} className="w-full h-[54px] bg-slate-900 text-white font-black rounded-xl text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-slate-100">
                      {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={3} />} Add Record
                    </button>
                  </div>
               </form>

               {/* Records Table */}
               <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-50">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead>
                       <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                         <th className="px-8 py-5">Type</th>
                         <th className="px-8 py-5">Hostname</th>
                         <th className="px-8 py-5">Content</th>
                         <th className="px-8 py-5 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {dnsRecords.map(rec => (
                         <tr key={rec.id} className="hover:bg-slate-50/30 transition-colors">
                           <td className="px-8 py-6"><span className="px-3 py-1 bg-emerald-50 text-[10px] font-black text-emerald-600 rounded-lg">{rec.type}</span></td>
                           <td className="px-8 py-6 font-bold text-slate-900">{rec.name}</td>
                           <td className="px-8 py-6 font-mono text-slate-400 text-xs truncate max-w-[200px]">{rec.content}</td>
                           <td className="px-8 py-6 text-right">
                             <button onClick={() => handleDeleteRecord(rec.id!)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                           </td>
                         </tr>
                       ))}
                       {dnsRecords.length === 0 && (
                         <tr><td colSpan={4} className="py-24 text-center text-slate-300 font-bold">No active records in this zone.</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}

          {/* FORWARDING TAB */}
          {activeTab === 'forwarding' && selectedSub && (
            <div className="animate-fade">
               <div className="flex items-center gap-6 mb-12">
                 <button onClick={() => setActiveTab('domains')} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all"><ArrowLeft size={20} /></button>
                 <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">URL Forwarding</h2>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global Redirect Engine</p>
                 </div>
               </div>

               <div className="max-w-2xl bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-50">
                 <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                   <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                   <p className="text-blue-800 text-sm font-medium leading-relaxed">
                     Redirect all traffic from <span className="font-bold underline">{selectedSub.name}.tnxbd.top</span> to any external URL. 
                     Note: DNS A/CNAME records may take precedence depending on edge configuration.
                   </p>
                 </div>

                 <form onSubmit={handleSaveForwarding} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination URL</label>
                     <div className="relative">
                       <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <input 
                         type="url"
                         placeholder="https://example.com/profile"
                         value={forwardingInput}
                         onChange={(e) => setForwardingInput(e.target.value)}
                         className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                       />
                     </div>
                   </div>
                   <button type="submit" disabled={isProcessing} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-100 active:scale-95 flex items-center justify-center gap-3">
                     {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Update Forwarding
                   </button>
                 </form>
               </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="animate-fade">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-12">Public Identity</h1>
              <form onSubmit={handleUpdateProfile} className="max-w-2xl">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-50 space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Identity</label>
                    <input 
                      value={profile.displayName}
                      onChange={e => setProfile({...profile, displayName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all"
                      placeholder="e.g. Satoshi Nakamoto"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Short Bio</label>
                    <textarea 
                      rows={4}
                      value={profile.bio}
                      onChange={e => setProfile({...profile, bio: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-bold text-slate-600 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all resize-none"
                      placeholder="Share your aesthetic mission..."
                    />
                  </div>
                  <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <CheckCircle size={14} className="text-emerald-500" /> Identity Sync Active
                    </div>
                    <button type="submit" disabled={isProcessing} className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-100 active:scale-95 flex items-center justify-center gap-3">
                      {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Save Identity
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* Claim Handle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade">
          <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 p-2 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Plus size={32} strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Claim Handle</h3>
              <p className="text-slate-400 text-sm font-bold mt-2">Choose your unique namespace on the cluster.</p>
            </div>
            <form onSubmit={handleRegisterSubdomain} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Handle Name</label>
                <div className="flex bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:border-emerald-500 transition-all">
                  <input 
                    autoFocus required
                    value={newSubName}
                    onChange={e => setNewSubName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 bg-transparent px-6 py-5 font-bold text-slate-900 outline-none"
                    placeholder="my-handle"
                  />
                  <div className="bg-slate-100 px-6 flex items-center text-slate-500 font-black text-xs border-l border-slate-200">.tnxbd.top</div>
                </div>
              </div>
              <button type="submit" disabled={isProcessing} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-100 active:scale-95">
                {isProcessing ? "Provisioning Handle..." : "Initialize Node"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SideItem = ({ active, icon, label, onClick, disabled }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`
      flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all font-bold group relative
      ${active ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
      ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}
    `}
  >
    <span className={`${active ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</span>
    <span className="text-sm tracking-tight">{label}</span>
    {active && <div className="absolute right-4 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
  </button>
);

const StatCard = ({ label, val, icon }: any) => (
  <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-50 hover:translate-y-[-4px] transition-all">
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
    <p className="text-3xl font-black text-slate-900 tracking-tighter">{val}</p>
  </div>
);

export default Dashboard;
