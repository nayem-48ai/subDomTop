
import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import ProfilePage from './components/ProfilePage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'landing' | 'dashboard' | 'auth' | 'profile'>('landing');

  useEffect(() => {
    // Detect multi-tenant view
    const params = new URLSearchParams(window.location.search);
    const site = params.get('site');
    
    if (site) {
      setView('profile');
      setLoading(false);
    } else {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        // Robust navigation: if logged in and on landing/auth, go to dashboard
        if (currentUser && (view === 'auth' || view === 'landing')) {
          setView('dashboard');
        }
      });
      return () => unsubscribe();
    }
  }, [view]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505]">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-[9px] font-black text-slate-700 tracking-[0.4em] uppercase">Initializing Edge</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'profile':
        return <ProfilePage onBack={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('site');
          window.history.pushState({}, '', url);
          setView(user ? 'dashboard' : 'landing');
        }} />;
      case 'auth':
        return <Auth onBack={() => setView('landing')} />;
      case 'dashboard':
        return user ? <Dashboard user={user} onLogout={() => setView('landing')} /> : <Auth onBack={() => setView('landing')} />;
      case 'landing':
      default:
        return <LandingPage onStart={() => user ? setView('dashboard') : setView('auth')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {renderContent()}
    </div>
  );
};

export default App;
