/* ============================================================
   ANIKA local persistence store (demo mode)
   When the backend API is unavailable, submissions are stored
   here in the browser so the full flow still works end-to-end.
   ============================================================ */

const STORAGE_KEY = 'anika_db_v2';

function uid() {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function seed() {
  const now = Date.now();
  return {
    registrations: [],
    applications: [
      {
        id: uid(),
        name: 'Brian Otieno',
        phone: '+254 701 222 333',
        type: 'alliance',
        org: 'Lake Arts Collective',
        note: 'Interested in cross-border residencies.',
        whatsAppInbox: [],
        whatsAppBroadcasts: [],
        resolved: true,
        optedOut: false,
        messages: [
          { from: 'them', text: 'Can I make a one-time donation via M-Pesa?', time: 'Yesterday 18:00' },
          { from: 'me', text: 'Yes! Tap Donate on the site and choose M-Pesa you will get an instant receipt.', time: 'Yesterday 18:20' },
        ],
        createdAt: new Date(now - 86400000).toISOString(),
      },
    ],
    whatsAppBroadcasts: [
      {
        id: uid(),
        title: 'Event reminder: Sema-Anika Forum',
        audience: 'Opted-in registrants',
        channel: 'Web + WhatsApp',
        recipients: 98,
        date: 'Today 09:00',
        status: 'Sent',
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'Pan-African Arts Alliance member call',
        audience: 'Alliance contacts',
        channel: 'WhatsApp',
        recipients: 214,
        date: 'Yesterday 18:00',
        status: 'Delivered',
        createdAt: new Date(now - 86400000).toISOString(),
      },
      {
        id: uid(),
        title: 'Community broadcast: campaign dispatch',
        audience: 'All opted-in',
        channel: 'WhatsApp',
        recipients: 321,
        date: '2 days ago',
        status: 'Sent',
        createdAt: new Date(now - 86400000 * 2).toISOString(),
      },
    ],
    team: [
      { id: uid(), name: 'Jennifer Kosencha', email: 'jennifer@anikainitiative.org', role: 'leadership', status: 'Active', createdAt: new Date(now - 86400000 * 60).toISOString() },
      { id: uid(), name: 'Brian', email: 'brian@anikainitiative.org', role: 'comms', status: 'Active', createdAt: new Date(now - 86400000 * 55).toISOString() },
      { id: uid(), name: 'Lynn', email: 'lynn@anikainitiative.org', role: 'programs', status: 'Active', createdAt: new Date(now - 86400000 * 55).toISOString() },
      { id: uid(), name: 'James', email: 'james@anikainitiative.org', role: 'programs', status: 'Active', createdAt: new Date(now - 86400000 * 55).toISOString() },
      { id: uid(), name: 'Daniel', email: 'daniel@anikainitiative.org', role: 'comms', status: 'Active', createdAt: new Date(now - 86400000 * 55).toISOString() },
    ],
    whatsAppSettings: [
      {
        id: uid(),
        key: 'assistant',
        menuEnabled: true,
        greeting:
          'Hello! Welcome to ANIKA Initiative. Reply with a number:\n1) Upcoming events\n2) How to apply\n3) How to donate\n4) Talk to a human',
        answers: {
          events: 'Our next events are posted on anikainitiative.com/events. Sema-Anika Forum is coming up soon, want me to share the registration link?',
          apply: 'You can apply to the Pan-African Arts Alliance at anikainitiative.com/alliance. Reply ALLIANCE and I will guide you through it.',
          donate: 'You can support ANIKA at anikainitiative.com/donate with M-Pesa or card. Every donation gets an instant receipt.',
          human: 'Switching you to a member of the ANIKA team now. Someone will reply here shortly.',
          default: "Sorry, I did not quite catch that. Reply 1 for events, 2 to apply, 3 to donate, or 4 to talk to a human.",
        },
        flows: {
          confirmRegistration: true,
          sendReminder24h: true,
          sendFeedback24h: true,
          humanEscalation: true,
          optOut: true,
        },
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function loadDB() {
  const fresh = seed();
  const restored = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* corrupted storage fall through to fresh seed */
    }
    return null;
  })();
  // Migrate: merge fresh seed collections so older stored DBs gain new
  // collections (events, whatsAppInbox, whatsAppBroadcasts) without
  // discarding existing saved records.
  const db = restored || {};
  Object.keys(fresh).forEach((key) => {
    if (!(key in db)) db[key] = fresh[key];
  });
  if (!restored) saveDB(db);
  return db;
}

export function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function addRecord(type, payload) {
  const db = loadDB();
  const record = { id: uid(), createdAt: new Date().toISOString(), ...payload };
  db[type] = [record, ...(db[type] || [])];
  saveDB(db);
  return record;
}

export function updateRecord(type, id, patch) {
  const db = loadDB();
  const list = db[type] || [];
  db[type] = list.map((r) => (r.id === id ? { ...r, ...patch } : r));
  saveDB(db);
  return db[type].find((r) => r.id === id);
}

export function deleteRecord(type, id) {
  const db = loadDB();
  db[type] = (db[type] || []).filter((r) => r.id !== id);
  saveDB(db);
}

export function getRecords(type) {
  return loadDB()[type] || [];
}

export function getMetrics() {
  const db = loadDB();
  const donations = db.donations || [];
  const totalDonated = donations.reduce(
    (sum, d) => sum + (d.currency === 'KES' ? d.amount / 130 : d.amount),
    0,
  );
  return {
    registrations: (db.registrations || []).length,
    applications: (db.applications || []).length,
    donations: donations.length,
    inquiries: (db.inquiries || []).length,
    events: (db.events || []).length,
    whatsAppInbox: (db.whatsAppInbox || []).length,
    whatsAppBroadcasts: (db.whatsAppBroadcasts || []).length,
    whatsAppSettings: (db.whatsAppSettings || []).length,
    totalDonated: Math.round(totalDonated * 100) / 100,
    waOptIns: (db.registrations || []).filter((r) => r.consent).length,
  };
}
