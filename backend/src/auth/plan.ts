export const PREMIUM_PRICE_INR = 5000;
export const PREMIUM_PERIOD_MONTHS = 12;
/** New accounts get Premium access for this many days, then premium features lock. */
export const FREE_TRIAL_DAYS = 2;

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
    'Photo disease analysis (new model coming next)',
    'High-confidence disease tracking',
    'Location-based weather telemetry',
    'Pesticide spray logs',
    'Soil and pH PDF lab reports',
    'Farm gallery',
    'AI assistant on your farm records',
    'Multi-holding filters',
    'Inspector (view-only) logins',
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

export function freeTrialUntilFromNow(): Date {
  const until = new Date();
  until.setDate(until.getDate() + FREE_TRIAL_DAYS);
  return until;
}

export const PREMIUM_AMOUNT_PAISE = PREMIUM_PRICE_INR * 100;
