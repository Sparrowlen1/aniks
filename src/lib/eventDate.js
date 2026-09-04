/**
 * Event dates come from a free-text admin field ("Sat, 12 Sep 2026"), so
 * they're not guaranteed to be in a format JS's Date parser accepts —
 * ordinal suffixes ("12th") in particular make it return Invalid Date.
 * Strip them before parsing so naturally-typed dates still work.
 */
export function parseEventDate(value) {
  if (!value) return new Date(NaN)
  const cleaned = String(value).replace(/(\d+)(st|nd|rd|th)\b/gi, '$1')
  return new Date(cleaned)
}

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Formats a Date as "Sat, 12 Sep 2026" — the display string stored/shown everywhere on site. */
export function formatEventDateDisplay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

/** Converts a stored display-string date to the "YYYY-MM-DD" shape <input type="date"> needs. */
export function toISODateInput(value) {
  const d = parseEventDate(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Converts an <input type="date"> value ("YYYY-MM-DD") back to the display-string format. */
export function fromISODateInput(isoValue) {
  if (!isoValue) return ''
  const [y, m, d] = isoValue.split('-').map(Number)
  if (!y || !m || !d) return ''
  return formatEventDateDisplay(new Date(y, m - 1, d))
}
