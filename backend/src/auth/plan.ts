export const PREMIUM_PRICE_INR = 3000;
export const PREMIUM_PERIOD_MONTHS = 12;

/** Owner / demo accounts that always keep Premium. */
export const COMPLIMENTARY_PREMIUM_EMAILS = ['darurubunny@gmail.com'];

export function isComplimentaryPremiumEmail(email?: string | null): boolean {
  if (!email) return false;
  return COMPLIMENTARY_PREMIUM_EMAILS.includes(email.trim().toLowerCase());
}

export const PLAN_FEATURES = {
  free: [
    '1 farm holding',
    'Daily work logs',
    'Expense ledger',
    'To-do list',
    'Basic analysis (acres, plants, July spend)',
    'Help & support tickets',
  ],
  premium: [
    'Unlimited farm holdings',
    'Photo disease analysis (leaf and fruit)',
    'High-confidence disease tracking',
    'Weather outbreak risk',
    'Location-based weather telemetry',
    'Pesticide spray logs',
    'Soil and pH PDF lab reports',
    'Farm gallery with analyze-from-photo',
    'AI assistant on your farm records',
    'Multi-holding filters',
    'Priority support',
  ],
};

export function userHasPremium(user?: {
  email?: string | null;
  plan?: string | null;
  premiumUntil?: Date | string | null;
} | null): boolean {
  if (!user) return false;
  if (isComplimentaryPremiumEmail(user.email)) return true;
  if ((user.plan || 'free') !== 'premium') return false;
  if (!user.premiumUntil) return true;
  return new Date(user.premiumUntil).getTime() > Date.now();
}

export function premiumUntilFromNow(): Date {
  return premiumUntilFrom(new Date());
}

export function premiumUntilFrom(start: Date): Date {
  const until = new Date(start);
  until.setMonth(until.getMonth() + PREMIUM_PERIOD_MONTHS);
  return until;
}

export const PREMIUM_AMOUNT_PAISE = PREMIUM_PRICE_INR * 100;
