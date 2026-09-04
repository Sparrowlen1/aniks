import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  fetchRegistrations,
  fetchApplications,
  fetchDonations,
  fetchWhatsAppInbox,
  fetchWhatsAppBroadcasts,
  normalizeDonation,
} from '../../lib/api'

const READ_KEY = 'anika_admin_notifications_read'
const DISMISSED_KEY = 'anika_admin_notifications_dismissed'
const POLL_MS = 45000
const MAX_NOTIFICATIONS = 20

function readSetFromStorage(key) {
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}
function persistSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set].slice(-500)))
  } catch {
    // quota errors — read/dismissed state just won't survive a refresh
  }
}

function getTimestamp(row) {
  const raw = row?.updated_at ?? row?.updatedAt ?? row?.created_at ?? row?.createdAt ?? row?.created ?? row?.date ?? null
  const t = raw ? new Date(raw).getTime() : NaN
  return Number.isNaN(t) ? 0 : t
}

export function timeAgo(timestamp) {
  if (!timestamp) return ''
  const diffMs = Date.now() - timestamp
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function donationText(row) {
  const d = normalizeDonation(row)
  const method = d.method === 'mpesa' ? 'M-Pesa' : d.method.charAt(0).toUpperCase() + d.method.slice(1)
  return `${method} donation of ${d.currency} ${d.amount.toLocaleString()} received`
}
// NOTE: eventTitle confirmed real (Registrations.jsx uses it).
// applicantName/name for applications is still a guess — adjust if wrong.
function registrationText(r) {
  return `New registration for "${r.eventTitle ?? r.title ?? r.event ?? 'an event'}"`
}
function applicationText(a) {
  return `New application from ${a.applicantName ?? a.name ?? 'a new applicant'}`
}
// NOTE: uses inbox thread createdAt as a stand-in for last-message time —
// no separate "last message at" field is available from the API.
function inboxNotificationText(c) {
  if (c.intent === 'escalation' && !c.resolved) {
    return `AI escalated a conversation with ${c.name ?? c.phone ?? 'a contact'} — needs a human reply`
  }
  return `New WhatsApp message from ${c.name ?? c.phone ?? 'a contact'}`
}
function broadcastText(b) {
  return `Broadcast sent: "${b.title}" to ${b.recipients ?? 0} recipients`
}

function countUnread(prefix, items) {
  return items.filter((n) => n.id.startsWith(prefix) && !n.read).length
}
function badgesFrom(items, whatsappInboxUnread) {
  return {
    registrations: countUnread('registration-', items),
    applications: countUnread('application-', items),
    donations: countUnread('donation-', items),
    whatsappInboxUnread,
  }
}

// --- Shared module-level store — one poll for Sidebar + Topbar ---
let state = { badges: {}, notifications: [] }
let listeners = new Set()
let intervalId = null
let started = false
let readSet = readSetFromStorage(READ_KEY)
let dismissedSet = readSetFromStorage(DISMISSED_KEY)

function notifyListeners() {
  listeners.forEach((l) => l(state))
}

async function loadOnce() {
  try {
    const [registrationsRes, applicationsRes, donationsRes, inboxRes, broadcastsRes] = await Promise.all([
      fetchRegistrations(),
      fetchApplications(),
      fetchDonations(),
      fetchWhatsAppInbox(),
      fetchWhatsAppBroadcasts(),
    ])

    const registrations = registrationsRes.rows || []
    const applications = applicationsRes.rows || []
    const donations = donationsRes.rows || []
    const inbox = inboxRes.rows || []
    const broadcasts = broadcastsRes.rows || []
    const unreadInboxTotal = inbox.reduce((sum, c) => sum + (c.unread || 0), 0)

    const fullItems = [
      ...registrations.map((r) => ({
        id: `registration-${r.id}`,
        text: registrationText(r),
        to: '/admin/registrations',
        ts: getTimestamp(r),
      })),
      ...applications.map((a) => ({
        id: `application-${a.id}`,
        text: applicationText(a),
        to: '/admin/applications',
        ts: getTimestamp(a),
      })),
      ...donations.map((d) => ({
        id: `donation-${d.id}`,
        text: donationText(d),
        to: '/admin/donations',
        ts: getTimestamp(d),
      })),
      ...inbox
        .filter((c) => (c.unread || 0) > 0 || (c.intent === 'escalation' && !c.resolved))
        .map((c) => ({
          id: `whatsapp-${c.id}`,
          text: inboxNotificationText(c),
          to: '/admin/whatsapp/inbox',
          ts: getTimestamp(c),
        })),
      ...broadcasts.map((b) => ({
        id: `broadcast-${b.id}`,
        text: broadcastText(b),
        to: '/admin/whatsapp/broadcast',
        ts: getTimestamp(b),
      })),
    ]
      .filter((n) => n.ts > 0 && !dismissedSet.has(n.id))
      .sort((a, b) => b.ts - a.ts)
      .map((n) => ({ ...n, time: timeAgo(n.ts), read: readSet.has(n.id) }))

    state = {
      badges: badgesFrom(fullItems, unreadInboxTotal),
      notifications: fullItems.slice(0, MAX_NOTIFICATIONS),
    }
    notifyListeners()
  } catch {
    // network hiccup — keep last good state, retry next tick
  }
}

function ensureStarted() {
  if (started) return
  started = true
  loadOnce()
  intervalId = setInterval(loadOnce, POLL_MS)
}

function stopIfNoListeners() {
  if (listeners.size === 0 && intervalId) {
    clearInterval(intervalId)
    intervalId = null
    started = false
  }
}

// Visiting a section's page marks that section's notifications read —
// e.g. landing on /admin/applications clears application items.
function markReadForPath(pathname) {
  const toMark = state.notifications.filter((n) => !n.read && pathname.startsWith(n.to))
  if (toMark.length === 0) return
  toMark.forEach((n) => readSet.add(n.id))
  persistSet(READ_KEY, readSet)
  const notifications = state.notifications.map((n) =>
    pathname.startsWith(n.to) ? { ...n, read: true } : n
  )
  state = { badges: badgesFrom(notifications, state.badges.whatsappInboxUnread), notifications }
  notifyListeners()
}

export function useAdminNotifications() {
  const [local, setLocal] = useState(state)
  const location = useLocation()

  useEffect(() => {
    listeners.add(setLocal)
    ensureStarted()
    setLocal(state)
    return () => {
      listeners.delete(setLocal)
      stopIfNoListeners()
    }
  }, [])

  useEffect(() => {
    markReadForPath(location.pathname)
  }, [location.pathname])

  const markRead = useCallback((id) => {
    readSet.add(id)
    persistSet(READ_KEY, readSet)
    const notifications = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    state = { badges: badgesFrom(notifications, state.badges.whatsappInboxUnread), notifications }
    notifyListeners()
  }, [])

  const markAllRead = useCallback(() => {
    state.notifications.forEach((n) => readSet.add(n.id))
    persistSet(READ_KEY, readSet)
    const notifications = state.notifications.map((n) => ({ ...n, read: true }))
    state = { badges: badgesFrom(notifications, state.badges.whatsappInboxUnread), notifications }
    notifyListeners()
  }, [])

  // Removes notifications outright — won't reappear on next poll unless
  // it's a genuinely new record.
  const clearAll = useCallback(() => {
    state.notifications.forEach((n) => dismissedSet.add(n.id))
    persistSet(DISMISSED_KEY, dismissedSet)
    state = { badges: badgesFrom([], state.badges.whatsappInboxUnread), notifications: [] }
    notifyListeners()
  }, [])

  const unreadCount = local.notifications.filter((n) => !n.read).length

  return { badges: local.badges, notifications: local.notifications, unreadCount, markRead, markAllRead, clearAll }
}