import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Toaster } from 'sonner';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check if there is an active session token in localStorage
    const savedToken = localStorage.getItem('daruru_token');
    if (savedToken) {
      setToken(savedToken);
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('daruru_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('daruru_token');
    setToken(null);
  };

  if (initializing) {
    return (
      <div className="w-full min-h-screen bg-[#08090d] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-medium tracking-wide">Syncing farm telemetry...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        theme="dark" 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(10, 11, 16, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#f4f4f5',
            backdropFilter: 'blur(8px)',
          }
        }} 
      />
      {token ? (
        <Dashboard token={token} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;
