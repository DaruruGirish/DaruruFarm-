import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle,
  LayoutDashboard,
  Bug,
  Bot,
  Droplets,
  MapIcon,
  IndianRupee,
  ClipboardList,
  ListTodo,
  ImageIcon,
  FileText,
  Eye,
  EyeOff,
  HelpCircle,
  Leaf,
  Sparkles,
  CloudSun,
  ArrowRight,
  Crown,
} from 'lucide-react';
import { BrandLogo, BRAND_NAME, BRAND_TAGLINE } from './BrandMark';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { FREE_FEATURES, FREE_TRIAL_DAYS, PREMIUM_FEATURES, PREMIUM_PRICE_INR } from '../plans';
import { loadRazorpay } from './PricingPlans';

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (overrideConfig?: { prompt?: string }) => void };
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Google sign-in')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google sign-in'));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
}

const GoogleMark = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 2.9.7 3.6 1.4l2.4-2.4C16.7 3.9 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.6-3.6 8.6-8.8 0-.6-.1-1-.2-1.5H12z"
    />
    <path fill="#34A853" d="M3 12c0-1.5.4-2.9 1.1-4.1l3.1 2.4C6.8 11 6.5 11.5 6.5 12s.3 1 .7 1.7l-3.1 2.4C3.4 14.9 3 13.5 3 12z" opacity=".01" />
    <path
      fill="#FBBC05"
      d="M12 6.2c1.8 0 2.9.7 3.6 1.4l2.4-2.4C16.7 3.9 14.6 3 12 3 9.2 3 6.8 4.3 5.4 6.4l3.1 2.4C9.2 7.4 10.5 6.2 12 6.2z"
      opacity=".01"
    />
    <path
      fill="#4285F4"
      d="M12 21c2.4 0 4.5-.8 6-2.2l-2.9-2.3c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8l-3.1 2.4C5.4 19.1 8.4 21 12 21z"
      opacity=".01"
    />
    <path
      fill="#4285F4"
      d="M23.5 12.2c0-.7-.1-1.2-.2-1.7H12v3.4h6.4c-.3 1.4-1.1 2.5-2.2 3.3l2.9 2.3c1.7-1.6 2.9-3.9 2.9-7.3z"
    />
    <path
      fill="#34A853"
      d="M12 23c3.2 0 5.9-1.1 7.9-2.9l-2.9-2.3c-1 .7-2.3 1.2-3.8 1.2-2.9 0-5.4-2-6.3-4.6l-3.2 2.4C5.6 20.5 8.5 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.7 14.4c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L2.5 7.6C1.8 9 1.4 10.4 1.4 12s.4 3 1.1 4.4l3.2-2z"
    />
    <path
      fill="#EA4335"
      d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 8.5 1 5.6 3.5 4.4 6.6l3.2 2.4C8.5 7.4 10.1 5.4 12 5.4z"
    />
  </svg>
);

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

const HIGHLIGHT_FEATURES = [
  {
    icon: Droplets,
    title: 'Pesticide logs',
    badge: 'Premium',
    description:
      'Record every spray with pesticide name, quantity, and spray time. Date is saved automatically.',
  },
  {
    icon: Bug,
    title: 'Disease detection',
    badge: 'Premium',
    description:
      'Log field outbreaks by hand and track high-confidence photo detections when the new model is connected.',
  },
  {
    icon: LayoutDashboard,
    title: 'AI analysis',
    badge: 'Core',
    description:
      'See acres, plants, active diseases, and monthly spend at a glance. Charts for expenses, rainfall vs humidity, wind vs temperature, and a 7-day farm forecast.',
  },
  {
    icon: Bot,
    title: 'AI chatbot',
    badge: 'Premium',
    description:
      'Ask questions about your spend, active diseases, irrigation, water use, and recent activities. Answers are drawn from your logs and weather telemetry.',
  },
] as const;

const PLATFORM_FEATURES = [
  {
    icon: MapIcon,
    title: 'Holdings',
    description: 'Register every block with location, acres, and tree counts. Geocode the orchard for weather and telemetry.',
  },
  {
    icon: IndianRupee,
    title: 'Expenses',
    description: 'Track fertiliser, labour, diesel, equipment, and every rupee spent across the season.',
  },
  {
    icon: ClipboardList,
    title: 'Daily logs',
    description: 'Log irrigation, spraying, harvest, labour, and field work as it happens.',
  },
  {
    icon: ListTodo,
    title: 'To-do',
    description: 'Plan upcoming jobs with due dates, notes, and per-farm assignments—then tick them off.',
  },
  {
    icon: ImageIcon,
    title: 'Gallery',
    description: 'Store field photos by holding with captions. A visual record of the orchard over time.',
  },
  {
    icon: FileText,
    title: 'Lab reports',
    description: 'Upload soil and pH PDFs on Analysis and open them without leaving the app.',
  },
  {
    icon: CloudSun,
    title: 'Weather telemetry',
    description: 'Morning and evening snapshots at 10:00 AM and 6:00 PM IST, cached from Open-Meteo at each farm location.',
  },
  {
    icon: Eye,
    title: 'Inspector access',
    description: 'Premium: share read-only viewer logins so auditors and advisors can review records without editing.',
  },
  {
    icon: HelpCircle,
    title: 'Help & support',
    description: 'Raise tickets in-app. Premium includes priority replies on farm operations questions.',
  },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ENQUIRY_EMAIL = 'darurugirish@gmail.com';

const inputClassName =
  'w-full bg-[#e9e0cf]/55 backdrop-blur-sm border border-emerald-900/16 focus:border-emerald-700 focus:bg-[#e9e0cf]/70 focus:ring-1 focus:ring-emerald-700/15 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-500/80 outline-none transition-all duration-200';

const signInInputClassName =
  'w-full bg-[#1a221c] border border-white/12 focus:border-emerald-400/45 focus:bg-[#1f2921] focus:ring-1 focus:ring-emerald-400/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/35 outline-none transition-all duration-200';

const signInPasswordInputClassName =
  'w-full bg-[#1a221c] border border-white/12 focus:border-emerald-400/45 focus:bg-[#1f2921] focus:ring-1 focus:ring-emerald-400/20 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/35 outline-none transition-all duration-200';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [signInAs, setSignInAs] = useState<'owner' | 'inspector'>('owner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBuyPremium, setShowBuyPremium] = useState(false);
  const [showFreeTrial, setShowFreeTrial] = useState(false);
  const [buyName, setBuyName] = useState('');
  const [buyEmail, setBuyEmail] = useState('');
  const [buyPassword, setBuyPassword] = useState('');
  const [buying, setBuying] = useState(false);
  const [trialName, setTrialName] = useState('');
  const [trialEmail, setTrialEmail] = useState('');
  const [trialPassword, setTrialPassword] = useState('');
  const [startingTrial, setStartingTrial] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquirySubject, setEnquirySubject] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquirySending, setEnquirySending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleStartFreeTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = trialEmail.trim().toLowerCase();
    if (!trialName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (!trialPassword || trialPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setStartingTrial(true);
    try {
      const res = await fetch('/api/auth/free-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trialName.trim(),
          email: normalizedEmail,
          password: trialPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not start your free trial.');
      if (!data.accessToken) throw new Error('Trial started, but sign-in token was missing. Please sign in.');
      toast.success(
        data.premiumUntil
          ? `Premium trial active until ${new Date(data.premiumUntil).toLocaleString()}`
          : `${FREE_TRIAL_DAYS}-day Premium trial started`,
      );
      setShowFreeTrial(false);
      onLoginSuccess(data.accessToken);
    } catch (err: any) {
      toast.error(err.message || 'Could not start your free trial.');
    } finally {
      setStartingTrial(false);
    }
  };

  const handleBuyPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = buyEmail.trim().toLowerCase();
    if (!buyName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (!buyPassword || buyPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setBuying(true);
    try {
      const orderRes = await fetch('/api/auth/billing/guest-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: buyName.trim(),
          email: normalizedEmail,
          password: buyPassword,
        }),
      });
      const order = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) throw new Error(order.message || 'Could not start Premium checkout.');
      await loadRazorpay();

      await new Promise<void>((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error('Payment checkout did not load.'));
          return;
        }
        const checkout = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: order.name || 'Daruru Farms',
          description: order.description,
          order_id: order.orderId,
          prefill: order.prefill || { name: buyName.trim(), email: normalizedEmail },
          theme: { color: '#3d6b38' },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch('/api/auth/billing/guest-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });
              const data = await verifyRes.json().catch(() => ({}));
              if (!verifyRes.ok) throw new Error(data.message || 'Payment succeeded but Premium could not be activated.');
              if (!data.accessToken) throw new Error('Premium activated, but sign-in token was missing. Please sign in.');
              toast.success(
                data.premiumUntil
                  ? `Premium is active until ${new Date(data.premiumUntil).toLocaleDateString()}`
                  : 'Premium is active',
              );
              setShowBuyPremium(false);
              onLoginSuccess(data.accessToken);
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled.')),
          },
        });
        checkout.on('payment.failed', (response) => {
          reject(new Error(response?.error?.description || 'Payment failed.'));
        });
        checkout.open();
      });
    } catch (err: any) {
      if (err?.message && err.message !== 'Payment cancelled.') {
        toast.error(err.message || 'Could not complete payment.');
      } else if (err?.message === 'Payment cancelled.') {
        toast.message('Payment was closed before it finished.');
      }
    } finally {
      setBuying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password) {
      setError('Password is required');
      return;
    }

    const isInspectorSignIn = isLoginMode && signInAs === 'inspector';

    if (isInspectorSignIn) {
      const loginId = email.trim();
      if (!loginId) {
        setError('Username or name is required');
        return;
      }
    } else {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        setError('Email is required');
        return;
      }
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        setError('Enter a valid email address');
        return;
      }
      if (!isLoginMode && !name.trim()) {
        setError('Full name is required');
        return;
      }
    }

    setLoading(true);

    const url = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const body = isInspectorSignIn
      ? { email: email.trim(), username: email.trim(), password }
      : isLoginMode
        ? { email: email.trim().toLowerCase(), password }
        : { name: name.trim(), email: email.trim().toLowerCase(), password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let data: any = {};
      const responseText = await response.text();
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText || `Request failed with status ${response.status}` };
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      if (isLoginMode) {
        toast.success(isInspectorSignIn ? 'Inspector access granted' : 'Welcome back to Daruru Farm');
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
    setSignInAs('owner');
    setError(null);
    setSuccess(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleGoogleSignIn = async () => {
    if (signInAs === 'inspector') {
      toast.message('Inspector access uses a username and password from the farm owner.');
      return;
    }
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to the frontend env.');
      return;
    }

    setError(null);
    setGoogleLoading(true);
    try {
      await loadGoogleIdentityScript();
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google sign-in did not load.');
      }

      await new Promise<void>((resolve, reject) => {
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (response) => {
            try {
              if (response.error || !response.access_token) {
                reject(new Error(response.error_description || response.error || 'Google sign-in was cancelled.'));
                return;
              }
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: response.access_token }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(data.message || 'Google sign-in failed.');
              }
              if (!data.accessToken) {
                throw new Error('Sign-in succeeded but no access token was returned.');
              }
              toast.success('Welcome back to Daruru Farm');
              onLoginSuccess(data.accessToken);
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
          error_callback: (err) => {
            reject(new Error(err?.message || 'Google sign-in was closed.'));
          },
        });
        client.requestAccessToken({ prompt: 'select_account' });
      });
    } catch (err: any) {
      const message = err?.message || 'Google sign-in failed.';
      if (!/cancel|closed|popup/i.test(message)) {
        setError(message);
        toast.error(message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = enquiryName.trim();
    const trimmedEmail = enquiryEmail.trim().toLowerCase();
    const trimmedSubject = enquirySubject.trim();
    const trimmedMessage = enquiryMessage.trim();
    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      toast.error('Name, email, subject, and message are required');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      toast.error('Enter a valid email address');
      return;
    }

    setEnquirySending(true);
    try {
      const response = await fetch('/api/contact/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          subject: trimmedSubject,
          message: trimmedMessage,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Could not send your message.');
      }
      toast.success('Message sent. We will reply by email.');
      setShowEnquiry(false);
      setEnquiryName('');
      setEnquiryEmail('');
      setEnquirySubject('');
      setEnquiryMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Could not send your message.');
    } finally {
      setEnquirySending(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#e9e0cf] relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,107,56,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(169,89,52,0.08),transparent_24%)] pointer-events-none" />

      <section className="relative z-10 h-[78vh] min-h-[520px] max-h-[760px] w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover object-center"
          src="/login-background.mp4"
          style={{ filter: 'contrast(1.06) saturate(1.1) brightness(1.08)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/28 to-black/42" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/18" />

        <div className="relative z-10 h-full flex flex-col px-4 sm:px-6 lg:px-10 xl:px-14 py-5 sm:py-7">
          <header className="flex items-start justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <BrandLogo size={56} className="border-white/20" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm">{BRAND_NAME}</h1>
                <p className="text-base text-emerald-100/90 font-medium italic">{BRAND_TAGLINE}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEnquiryName(name);
                setEnquiryEmail(email);
                setShowEnquiry(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-black/40 hover:text-white backdrop-blur-sm transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Need help?
            </button>
          </header>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-4 sm:left-6 lg:left-10 xl:left-14 bottom-5 sm:bottom-7 lg:bottom-8 right-4 lg:right-[460px] text-white max-w-xl z-10 pointer-events-none"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-[1.85rem] xl:text-3xl font-bold tracking-tight leading-[1.15] drop-shadow-sm">
              Smart decisions.
              <br />
              Healthier farms.
            </h2>
            <p className="mt-3 max-w-md text-xs sm:text-sm text-white/88 leading-relaxed drop-shadow-sm">
              Manage your farm with real-time insights, disease detection, pesticide tracking, and AI guidance — all in one place.
            </p>
            <div className="mt-4 h-1 w-12 rounded-full bg-[#b42318]" />
          </motion.div>

          <div className="w-full max-w-[380px] mx-auto mt-8 lg:mt-0 lg:mx-0 lg:fixed lg:right-3 xl:right-5 2xl:right-8 lg:top-[42%] lg:-translate-y-1/2 lg:z-30">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
              >
              <div className="rounded-[24px] border border-white/15 bg-[#111811]/48 backdrop-blur-md pt-6 pb-6 px-5 sm:px-6 shadow-[0_32px_80px_-40px_rgba(8,16,10,0.55)] w-full max-h-[min(560px,72vh)] overflow-y-auto flex flex-col justify-center">
                <div className="mb-4">
                  <p className="text-base sm:text-lg font-bold text-white inline-flex items-center gap-2">
                    {isLoginMode ? 'Welcome back' : 'Create account'}
                    {isLoginMode && <Leaf className="w-4 h-4 text-emerald-400" />}
                  </p>
                  <p className="text-xs sm:text-sm text-white/65 mt-1">
                    {isLoginMode
                      ? signInAs === 'inspector'
                        ? 'View farm records without editing anything.'
                        : `Sign in to your ${BRAND_NAME} account`
                      : 'Create your Daruru Farms account.'}
                  </p>

                  {isLoginMode && (
                    <div className="mt-3 flex rounded-xl border border-white/12 bg-black/30 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSignInAs('owner');
                          setError(null);
                        }}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors ${
                          signInAs === 'owner' ? 'bg-emerald-700 text-white' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        Farm owner
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignInAs('inspector');
                          setError(null);
                        }}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors ${
                          signInAs === 'inspector' ? 'bg-emerald-700 text-white' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspector (view only)
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-400/25 flex items-start gap-2.5 text-xs text-red-200 leading-normal"
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
                      className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-400/25 flex items-start gap-2.5 text-xs text-emerald-100 leading-normal"
                    >
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <AnimatePresence initial={false} mode="popLayout">
                    {!isLoginMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <label className="text-xs font-semibold text-white/70">
                          Full name <span className="text-red-400/90">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <User className="absolute left-3.5 text-white/45 w-4 h-4" />
                          <input
                            type="text"
                            className={signInInputClassName}
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70">
                      {isLoginMode && signInAs === 'inspector' ? (
                        <>Username or name <span className="text-red-400/90">*</span></>
                      ) : (
                        <>Email address <span className="text-red-400/90">*</span></>
                      )}
                    </label>
                    <div className="relative flex items-center">
                      {isLoginMode && signInAs === 'inspector' ? (
                        <User className="absolute left-3.5 text-white/45 w-4 h-4" />
                      ) : (
                        <Mail className="absolute left-3.5 text-white/45 w-4 h-4" />
                      )}
                      <input
                        type={isLoginMode && signInAs === 'inspector' ? 'text' : 'email'}
                        autoComplete={isLoginMode && signInAs === 'inspector' ? 'username' : 'email'}
                        className={signInInputClassName}
                        placeholder={isLoginMode && signInAs === 'inspector' ? 'bun or dr.rao' : 'you@example.com'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    {isLoginMode && signInAs === 'inspector' && (
                      <p className="text-[11px] text-white/50">Use the username or display name given by the farm owner.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70">
                      Password <span className="text-red-400/90">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 text-white/45 w-4 h-4" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                        className={signInPasswordInputClassName}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((open) => !open)}
                        className="absolute right-3.5 text-white/45 hover:text-white/80"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative mt-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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

                {!(isLoginMode && signInAs === 'inspector') && (
                  <>
                    <div className="my-3.5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/12" />
                      <span className="text-[11px] uppercase tracking-wider text-white/45">or</span>
                      <div className="h-px flex-1 bg-white/12" />
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading || googleLoading}
                      className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-black/25 hover:bg-black/40 text-white text-sm font-semibold py-2.5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {googleLoading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <GoogleMark />
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>
                  </>
                )}

                <div className="mt-5 text-center text-xs text-white/60 font-medium">
                  <span>{isLoginMode ? "Don't have an account? " : 'Already have an account? '}</span>
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-emerald-300 hover:text-emerald-200 font-semibold transition-colors duration-150 cursor-pointer"
                  >
                    {isLoginMode ? 'Sign up here' : 'Sign in here'}
                  </button>
                </div>
              </div>
              </motion.div>
            </div>
        </div>
      </section>

      <div className="relative z-10">
        <div className="px-4 sm:px-6 lg:px-10 xl:px-12 py-6 lg:py-8 pb-4 space-y-10 max-w-6xl lg:pr-[460px] xl:pr-[480px] lg:pl-16 xl:pl-20">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-900">Highlighted capabilities</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {HIGHLIGHT_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-emerald-900/12 bg-[#f3efe4]/16 backdrop-blur-[2px] p-5 sm:p-6 hover:border-emerald-800/25 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5 text-emerald-800" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-zinc-900">{feature.title}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-900/8 text-emerald-900 border border-emerald-900/15">
                            {feature.badge}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pl-4 sm:pl-6 lg:pl-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-6">Everything inside the platform</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-x-10 sm:gap-y-7">
              {PLATFORM_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-start gap-4 rounded-xl px-3 py-3.5">
                    <Icon className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-base font-semibold text-zinc-800">{feature.title}</p>
                      <p className="text-sm text-zinc-500 leading-relaxed mt-1.5">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="max-w-2xl mx-auto w-full">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3 text-center">Plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-900/12 bg-[#f5edde]/50 backdrop-blur-sm p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900/75">Free</p>
                <p className="mt-1 text-sm font-bold text-zinc-900">Start with one farm</p>
                <ul className="mt-2.5 space-y-1">
                  {FREE_FEATURES.slice(0, 5).map((item) => (
                    <li key={item} className="text-xs text-zinc-600 leading-snug">• {item}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setTrialName(name);
                    setTrialEmail(email);
                    setTrialPassword('');
                    setShowFreeTrial(true);
                  }}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-800/25 bg-white/50 hover:bg-white/80 text-emerald-900 text-xs font-semibold py-2.5 transition-colors"
                >
                  Try {FREE_TRIAL_DAYS}-day free trial
                </button>
                <p className="mt-2 text-[11px] text-zinc-500">
                  Create your account and unlock all Premium features for {FREE_TRIAL_DAYS} days. After that, Premium
                  features lock until you upgrade.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-800/20 bg-[#f0e8d6]/55 backdrop-blur-sm p-4">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-emerald-800" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900/75">Premium</p>
                </div>
                <p className="mt-1 text-sm font-bold text-zinc-900">
                  ₹{PREMIUM_PRICE_INR.toLocaleString('en-IN')} <span className="text-xs font-medium text-zinc-500">/ year</span>
                </p>
                <div className="mt-2.5 space-y-2.5">
                  {PREMIUM_FEATURES.slice(0, 4).map((f) => (
                    <div key={f.name} className="rounded-lg border border-emerald-900/10 bg-white/40 px-3 py-2">
                      <p className="text-xs font-bold text-zinc-900">{f.name}</p>
                      <p className="text-[11px] text-zinc-600 leading-snug mt-0.5">{f.detail}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBuyName(name);
                    setBuyEmail(email);
                    setBuyPassword('');
                    setShowBuyPremium(true);
                  }}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold py-2.5 transition-colors"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Access Premium
                </button>
                <p className="mt-2 text-[11px] text-zinc-500">
                  Pay now with UPI, card, or netbanking. We create your account and open Premium as soon as payment succeeds.
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-emerald-900/10 bg-[#f5edde]/45 backdrop-blur-sm p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-zinc-800">Inquire about the platform</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  Walkthrough or plan questions? Send a message here, or email{' '}
                  <a href={`mailto:${ENQUIRY_EMAIL}`} className="text-emerald-800 font-semibold hover:underline">
                    {ENQUIRY_EMAIL}
                  </a>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEnquiryName(name);
                  setEnquiryEmail(email);
                  setShowEnquiry(true);
                }}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full border border-emerald-900/12 bg-[#fbf7ee]/70 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-[#fbf7ee]"
              >
                Send message
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <footer className="w-full pt-10 pb-8 px-4 text-center text-[11px] text-zinc-500">
          <p>
            Enquiries:{' '}
            <a href={`mailto:${ENQUIRY_EMAIL}`} className="text-emerald-800 font-medium hover:underline">
              {ENQUIRY_EMAIL}
            </a>
          </p>
          <p className="mt-1">© {new Date().getFullYear()} DaruruFarm. All rights reserved.</p>
        </footer>
      </div>

      <AnimatePresence>
        {showBuyPremium && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm"
            onClick={() => !buying && setShowBuyPremium(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-md rounded-2xl border border-emerald-950/12 bg-[#f6efe3] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 inline-flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> Premium
                  </p>
                  <h2 className="text-lg font-bold text-zinc-900 mt-1">
                    Buy Premium · ₹{PREMIUM_PRICE_INR.toLocaleString('en-IN')}/year
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1">
                    New email creates your account. Existing email needs your password, then checkout opens.
                  </p>
                </div>
              </div>

              <form onSubmit={handleBuyPremium} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Full name</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                    <input
                      type="text"
                      className={inputClassName}
                      placeholder="Your name"
                      value={buyName}
                      onChange={(e) => setBuyName(e.target.value)}
                      required
                      disabled={buying}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Email</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                    <input
                      type="email"
                      className={inputClassName}
                      placeholder="you@example.com"
                      value={buyEmail}
                      onChange={(e) => setBuyEmail(e.target.value)}
                      required
                      disabled={buying}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                    <input
                      type="password"
                      className={inputClassName}
                      placeholder="At least 6 characters"
                      value={buyPassword}
                      onChange={(e) => setBuyPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={buying}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={buying}
                    onClick={() => setShowBuyPremium(false)}
                    className="flex-1 rounded-xl border border-emerald-900/12 bg-white/50 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-white/80 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={buying}
                    className="flex-[1.4] rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {buying ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Pay ₹{PREMIUM_PRICE_INR.toLocaleString('en-IN')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFreeTrial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm"
            onClick={() => !startingTrial && setShowFreeTrial(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-md rounded-2xl border border-emerald-950/12 bg-[#f6efe3] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Free trial</p>
                <h2 className="text-lg font-bold text-zinc-900 mt-1">
                  Try Premium for {FREE_TRIAL_DAYS} days
                </h2>
                <p className="text-xs text-zinc-600 mt-1">
                  Create your account now. All Premium features stay unlocked for {FREE_TRIAL_DAYS} days, then they
                  lock until you upgrade.
                </p>
              </div>

              <form onSubmit={handleStartFreeTrial} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Full name</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                    <input
                      type="text"
                      className={inputClassName}
                      placeholder="Your name"
                      value={trialName}
                      onChange={(e) => setTrialName(e.target.value)}
                      required
                      disabled={startingTrial}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Email</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                    <input
                      type="email"
                      className={inputClassName}
                      placeholder="you@example.com"
                      value={trialEmail}
                      onChange={(e) => setTrialEmail(e.target.value)}
                      required
                      disabled={startingTrial}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 text-zinc-500 w-4 h-4" />
                    <input
                      type="password"
                      className={inputClassName}
                      placeholder="At least 6 characters"
                      value={trialPassword}
                      onChange={(e) => setTrialPassword(e.target.value)}
                      required
                      disabled={startingTrial}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={startingTrial}
                    onClick={() => setShowFreeTrial(false)}
                    className="flex-1 rounded-xl border border-emerald-900/12 bg-white/50 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-white/80 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={startingTrial}
                    className="flex-[1.4] rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {startingTrial ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Start {FREE_TRIAL_DAYS}-day trial</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEnquiry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm"
            onClick={() => !enquirySending && setShowEnquiry(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-md rounded-2xl border border-emerald-950/12 bg-[#f6efe3] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-zinc-900">Send a message</h2>
              <p className="text-xs text-zinc-600 mt-1">
                Ask about a walkthrough or a plan. We will reply to the email you enter.
              </p>

              <form onSubmit={handleEnquirySubmit} className="mt-4 space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Full name</label>
                  <input
                    type="text"
                    className={inputClassName.replace('pl-10 ', 'pl-4 ')}
                    placeholder="Your name"
                    value={enquiryName}
                    onChange={(e) => setEnquiryName(e.target.value)}
                    required
                    disabled={enquirySending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Email</label>
                  <input
                    type="email"
                    className={inputClassName.replace('pl-10 ', 'pl-4 ')}
                    placeholder="you@example.com"
                    value={enquiryEmail}
                    onChange={(e) => setEnquiryEmail(e.target.value)}
                    required
                    disabled={enquirySending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Subject</label>
                  <input
                    type="text"
                    className={inputClassName.replace('pl-10 ', 'pl-4 ')}
                    placeholder="Walkthrough, Premium, or another question"
                    value={enquirySubject}
                    onChange={(e) => setEnquirySubject(e.target.value)}
                    required
                    disabled={enquirySending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">Message</label>
                  <textarea
                    className="w-full min-h-[110px] bg-[#e9e0cf]/55 backdrop-blur-sm border border-emerald-900/16 focus:border-emerald-700 focus:bg-[#e9e0cf]/70 focus:ring-1 focus:ring-emerald-700/15 rounded-lg py-2.5 px-4 text-sm text-zinc-900 placeholder-zinc-500/80 outline-none resize-y"
                    placeholder="How can we help?"
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    required
                    disabled={enquirySending}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={enquirySending}
                    onClick={() => setShowEnquiry(false)}
                    className="flex-1 rounded-xl border border-emerald-900/12 bg-white/50 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-white/80 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enquirySending}
                    className="flex-[1.4] rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white py-2.5 text-xs font-semibold disabled:opacity-50"
                  >
                    {enquirySending ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
