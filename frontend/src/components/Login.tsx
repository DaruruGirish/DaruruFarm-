import React, { useState } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, AlertCircle, CheckCircle, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL } from '../config';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const url = isLoginMode
      ? `${API_URL}/auth/login`
      : `${API_URL}/auth/register`;

    const body = isLoginMode
      ? { email, password }
      : { name, email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (isLoginMode) {
        toast.success('Welcome back to Daruru Farm');
        onLoginSuccess(data.accessToken);
      } else {
        toast.success('Account created successfully. Please sign in.');
        setSuccess('Account created successfully! Please sign in.');
        setIsLoginMode(true);
        setName('');
        setPassword('');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Connection failed. Ensure backend is running.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setSuccess(null);
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="w-full min-h-screen bg-[#05060b] flex items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] glass-panel p-8 rounded-2xl relative border-gradient shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-indigo-400/5 flex items-center justify-center border border-indigo-500/30 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <Sprout className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            {isLoginMode ? 'Daruru Farm' : 'Create an Account'}
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            {isLoginMode ? 'Sign in to access your agricultural cockpit' : 'Get started with enterprise farm telemetry'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400 leading-normal"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-400 leading-normal"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence initial={false} mode="popLayout">
            {!isLoginMode && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Full Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                  <input
                    type="text"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLoginMode}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 text-zinc-500 w-4 h-4" />
              <input
                type="email"
                className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Password</label>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 text-zinc-500 w-4 h-4" />
              <input
                type="password"
                className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative mt-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm py-2.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
            ) : isLoginMode ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-900/60 text-center text-xs text-zinc-500 font-medium">
          <span>{isLoginMode ? "Don't have an account? " : "Already have an account? "}</span>
          <button
            type="button"
            onClick={toggleMode}
            className="text-zinc-300 hover:text-white font-semibold transition-colors duration-150 cursor-pointer"
          >
            {isLoginMode ? 'Sign up here' : 'Sign in here'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
