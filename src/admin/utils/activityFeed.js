// Shared by Dashboard's "Recent activity" card and the Topbar's notification
// bell — both want the same "what's actually happened lately" feed, just
// rendered differently.

export function timeAgo(dateInput) {
  const date = new Date(dateInput)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Merges registrations, donations, and stories into one feed, newest first.
// Partners is left out on purpose — PartnerContext has no timestamp, so
// there's no real "when" to sort it by.
export function buildActivityFeed(registrations, donations, stories, limit = 4) {
  const items = []

  registrations.forEach((r) => {
    if (!r.createdAt) return
    items.push({
      id: `reg-${r.id}`,
      text: `New registration for "${r.eventTitle ?? 'an event'}"`,
      to: '/admin/registrations',
      type: 'registration',
      ts: r.createdAt,
    })
  })

  donations.forEach((d) => {
    if (!d.createdAt) return
    items.push({
      id: `don-${d.id}`,
      text: `${d.currency} ${d.amount.toLocaleString()} donation ${
        d.status === 'Pending' ? 'initiated' : 'received'
      } from ${d.name}`,
      to: '/admin/donations',
      type: 'donation',
      ts: d.createdAt,
    })
  })

  stories.forEach((s) => {
    const ts = s.updated ?? s.date
    if (!ts) return
    items.push({
      id: `story-${s.id}`,
      text: `Story updated: "${s.title}"`,
      to: '/admin/stories',
      type: 'story',
      ts,
    })
  })

  return items
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, limit)
    .map((item) => ({ ...item, time: timeAgo(item.ts) }))
}
