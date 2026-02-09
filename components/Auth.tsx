
import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Mail, Lock, Sparkles, Loader2, AlertCircle, RefreshCcw, Globe } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const Auth: React.FC<Props> = ({ onBack }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{msg: string, code?: string} | null>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
             setError({ msg: "User not found. Join the network today.", code: 'signup_hint' });
          } else { throw err; }
        }
      } else if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: userCredential.user.email?.split('@')[0],
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      } else {
        await sendPasswordResetEmail(auth, email);
        setMessage('Reset instructions sent to your email.');
      }
    } catch (err: any) {
      setError({ msg: err.message.replace('Firebase:', '').trim() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] px-4 py-12 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20">
            <Globe className="text-white w-8 h-8" strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {mode === 'login' ? 'Console Login' : mode === 'signup' ? 'Claim Identity' : 'Secure Reset'}
          </h2>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-100 relative">
          <button onClick={onBack} className="group flex items-center gap-2 text-slate-400 hover:text-emerald-500 mb-10 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Home</span>
          </button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-5 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-start gap-4">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-red-700 text-sm font-bold leading-snug">{error.msg}</p>
                  {error.code === 'signup_hint' && (
                    <button type="button" onClick={() => {setMode('signup'); setError(null)}} className="text-red-900 text-[10px] font-black underline mt-2 uppercase tracking-widest">Create New Account</button>
                  )}
                </div>
              </div>
            )}
            
            {message && (
              <div className="p-5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm rounded-[1.5rem] font-bold flex items-center gap-4 animate-in zoom-in duration-300">
                <Sparkles size={20} className="text-emerald-500" />
                {message}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-200"
                  placeholder="admin@tnxbd.top"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-200"
                    placeholder="••••••••"
                  />
                </div>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('reset')} className="text-[9px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest mt-2 ml-auto block">Forgot Access Key?</button>
                )}
              </div>
            )}

            <button 
              disabled={isLoading}
              type="submit" 
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-100 hover:shadow-emerald-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Enter Console' : mode === 'signup' ? 'Initialize Network' : 'Request Access')}
            </button>
          </form>

          <div className="mt-12 text-center">
            {mode === 'login' ? (
              <button onClick={() => setMode('signup')} className="text-xs font-black text-slate-400 hover:text-emerald-500 transition-colors uppercase tracking-widest">Join the Edge Cluster →</button>
            ) : (
              <button onClick={() => setMode('login')} className="text-xs font-black text-slate-400 hover:text-emerald-500 transition-colors uppercase tracking-widest">Return to Base Console →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
