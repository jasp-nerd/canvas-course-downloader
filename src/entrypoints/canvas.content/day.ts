const DAY_MS = 86_400_000;

const startOfDay = (t: number) => new Date(t).setHours(0, 0, 0, 0);

/** When something happened, as a short phrase: "today", "yesterday", "Tue", "May 3", "Dec 30, 2025". */
export function shortDay(at: number, now = Date.now()): string {
  // Rounded: days around a clock change are 23 or 25 hours long.
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  const date = new Date(at);
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
