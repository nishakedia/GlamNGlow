const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** 4500 → "₹4,500" */
export function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return inr.format(amount);
}

/** 90 → "1 hr 30 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** 1.234 → "1.2 km", 0.4 → "400 m" */
export function formatDistance(km: number | null | undefined): string | null {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** 4.8, 212 → "4.8 (212)" */
export function formatRating(avg: number, count: number): string {
  if (count === 0) return 'New';
  return `${Number(avg).toFixed(1)} (${count > 999 ? `${(count / 1000).toFixed(1)}k` : count})`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/** Time-of-day greeting for the Home header. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "+91 98765 43210" → "+919876543210"; accepts 10-digit Indian numbers. */
export function normalizeIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}
