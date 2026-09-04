/* Date helpers for event display/sorting */

export function formatEventDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function isUpcoming(iso) {
  return new Date(iso).getTime() > Date.now();
}

export function sortByDate(events) {
  return [...events].sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
}
