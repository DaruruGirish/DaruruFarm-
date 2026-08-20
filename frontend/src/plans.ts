export const PREMIUM_PRICE_INR = 5000;
export const FREE_TRIAL_DAYS = 2;

export const COMPLIMENTARY_PREMIUM_EMAILS = ['darurubunny@gmail.com'];

export const FREE_FEATURES = [
  '1 farm holding',
  'Daily work logs',
  'Expense ledger',
  'To-do list',
  'Basic analysis (acres, plants, July spend)',
  'Help & support tickets',
  `${FREE_TRIAL_DAYS}-day Premium trial on signup`,
] as const;
export const PREMIUM_FEATURES = [
  { name: 'Unlimited farm holdings', detail: 'Register every block and orchard, not just one.' },
  { name: 'Photo disease analysis', detail: 'A new crop photo model will be connected here. Outbreaks can still be logged by hand.' },
  { name: 'High-confidence detections', detail: 'Results above 85% appear as active diseases on Analysis.' },
  { name: 'Location telemetry', detail: 'Save farm coordinates for weather and future APIs.' },
  { name: 'Pesticide spray logs', detail: 'Record pesticide name, quantity, and spray time. Date is saved automatically.' },
  { name: 'Soil and pH lab PDFs', detail: 'Upload reports on Analysis and open them in the app.' },
  { name: 'Farm gallery', detail: 'Store field photos. Photo analysis will use the new model when it is connected.' },
  { name: 'AI assistant', detail: 'Ask questions against your logs, expenses, and weather.' },
  { name: 'Multi-holding filters', detail: 'Filter logs, diseases, and photos by farm.' },
  { name: 'Inspector logins', detail: 'Share read-only usernames with a doctor or agronomist so they can review records without editing.' },
  { name: 'Priority support', detail: 'Faster replies on Help & Support tickets.' },
] as const;

export function isPremiumActive(profile?: {
  email?: string | null;
  plan?: string | null;
  premiumUntil?: string | null;
} | null): boolean {
  if (!profile) return false;
  if (profile.email && COMPLIMENTARY_PREMIUM_EMAILS.includes(profile.email.trim().toLowerCase())) {
    return true;
  }
  if ((profile.plan || 'free') !== 'premium') return false;
  if (!profile.premiumUntil) return true;
  return new Date(profile.premiumUntil).getTime() > Date.now();
}
