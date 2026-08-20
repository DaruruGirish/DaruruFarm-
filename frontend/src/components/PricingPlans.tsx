import React, { useState } from 'react';
import { Check, Crown, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { FREE_FEATURES, PREMIUM_FEATURES, PREMIUM_PRICE_INR, isPremiumActive } from '../plans';

interface PricingPlansProps {
  token: string;
  profile: { name?: string | null; email?: string | null; plan?: string | null; premiumUntil?: string | null } | null;
  onSubscribed: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay="checkout"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load payment checkout.')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = 'checkout';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load payment checkout.'));
    document.body.appendChild(script);
  });
}

export { loadRazorpay };

export const PremiumGate: React.FC<{
  locked: boolean;
  onUpgrade: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ locked, onUpgrade, title, children }) => {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative rounded-2xl overflow-hidden min-h-[280px]">
      <div className="pointer-events-none select-none blur-[1.5px] opacity-50">{children}</div>
      <div className="absolute inset-0 bg-[#f3efe4]/75 flex items-center justify-center p-4">
        <div className="glass-card border border-zinc-200 rounded-2xl p-5 max-w-sm text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Lock className="w-4 h-4 text-emerald-800" />
          </div>
          <p className="text-sm font-bold text-zinc-900">{title}</p>
          <p className="text-xs text-zinc-500">Included in Premium for ₹{PREMIUM_PRICE_INR.toLocaleString('en-IN')} per year.</p>
          <button type="button" className="df-btn df-btn-primary w-full text-xs" onClick={onUpgrade}>
            <Crown className="w-3.5 h-3.5" /> View Premium plan
          </button>
        </div>
      </div>
    </div>
  );
};

export const PricingPlans: React.FC<PricingPlansProps> = ({ token, profile, onSubscribed }) => {
  const premium = isPremiumActive(profile);
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    try {
      const orderRes = await fetch('/api/auth/billing/order', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const order = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) throw new Error(order.message || 'Could not start payment.');
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
          prefill: order.prefill || { name: profile?.name, email: profile?.email },
          theme: { color: '#3d6b38' },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch('/api/auth/billing/verify', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(response),
              });
              const data = await verifyRes.json().catch(() => ({}));
              if (!verifyRes.ok) throw new Error(data.message || 'Payment succeeded but Premium could not be activated.');
              toast.success(`Premium is active until ${new Date(data.premiumUntil).toLocaleDateString()}`);
              onSubscribed();
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
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Plans</h1>
        <p className="text-zinc-500 text-sm font-medium mt-1">
          Free covers day-to-day records. Premium unlocks disease photos, weather risk, extra holdings, and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl border border-zinc-200 p-6 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Starter</p>
            <h2 className="text-xl font-bold text-zinc-900 mt-1">Free</h2>
            <p className="text-3xl font-extrabold text-zinc-900 mt-2">₹0 <span className="text-sm font-semibold text-zinc-500">/ year</span></p>
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
                <Check className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500">{premium ? 'You currently have Premium, which includes everything in Free.' : 'This is your current plan.'}</p>
        </div>

        <div className="glass-card rounded-2xl border-2 border-emerald-700 p-6 space-y-5 relative">
          <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-full">
            Recommended
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Premium
            </p>
            <h2 className="text-xl font-bold text-zinc-900 mt-1">Daruru Premium</h2>
            <p className="text-3xl font-extrabold text-zinc-900 mt-2">
              ₹{PREMIUM_PRICE_INR.toLocaleString('en-IN')} <span className="text-sm font-semibold text-zinc-500">/ year</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">Billed once a year. About ₹{Math.round(PREMIUM_PRICE_INR / 12)} per month.</p>
          </div>
          <ul className="space-y-3">
            {PREMIUM_FEATURES.map((item) => (
              <li key={item.name} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                <span>
                  <span className="text-sm font-semibold text-zinc-900">{item.name}</span>
                  <span className="block text-xs text-zinc-500">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {premium ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-950">
              Premium is active
              {profile?.premiumUntil ? ` until ${new Date(profile.premiumUntil).toLocaleDateString()}` : ''}.
            </div>
          ) : (
            <>
              <button type="button" disabled={paying} className="df-btn df-btn-primary w-full" onClick={pay}>
                <Crown className="w-4 h-4" />
                {paying ? 'Opening checkout…' : `Pay ₹${PREMIUM_PRICE_INR.toLocaleString('en-IN')} / year`}
              </button>
              <p className="text-[11px] text-zinc-500 text-center">Pay with UPI, cards, or netbanking. Premium starts after the payment succeeds.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
