export const PREMIUM_PRICE_INR = 3000;

export const COMPLIMENTARY_PREMIUM_EMAILS = ['darurubunny@gmail.com'];

export const FREE_FEATURES = [
  '1 farm holding',
  'Daily work logs',
  'Expense ledger',
  'To-do list',
  'Basic analysis (acres, plants, July spend)',
  'Help & support tickets',
] as const;

export const PREMIUM_FEATURES = [
  { name: 'Unlimited farm holdings', detail: 'Register every block and orchard, not just one.' },
  { name: 'Photo disease analysis', detail: 'Check leaf and fruit photos with the trained crop model.' },
  { name: 'High-confidence detections', detail: 'Results above 85% appear as active diseases on Analysis.' },
  { name: 'Weather outbreak risk', detail: 'Score risk from rainfall, humidity, and temperature.' },
  { name: 'Location telemetry', detail: 'Save farm coordinates for weather and future APIs.' },
  { name: 'Pesticide spray logs', detail: 'Record product, quantity, time, and holding for each spray.' },
  { name: 'Soil and pH lab PDFs', detail: 'Upload reports on Analysis and open them in the app.' },
  { name: 'Gallery with photo check', detail: 'Store field photos and run analysis from the gallery.' },
  { name: 'AI assistant', detail: 'Ask questions against your logs, expenses, and weather.' },
  { name: 'Multi-holding filters', detail: 'Filter logs, diseases, and photos by farm.' },
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
