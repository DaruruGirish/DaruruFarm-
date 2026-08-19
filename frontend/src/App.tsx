import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Toaster } from 'sonner';
import { BrandLogo, BRAND_NAME, BRAND_TAGLINE } from './components/BrandMark';

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
    sessionStorage.removeItem('daruru_location_prompt_skipped');
    setToken(null);
  };

  if (initializing) {
    return (
      <div className="w-full min-h-screen bg-[#f3efe4] flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} />
          <div>
            <p className="text-zinc-900 text-sm font-bold tracking-tight">{BRAND_NAME}</p>
            <p className="text-zinc-500 text-xs font-medium">{BRAND_TAGLINE}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        theme="light" 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#fffdf8',
            border: '1px solid rgba(44, 74, 42, 0.12)',
            color: '#243026',
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
