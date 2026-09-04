const PHONE_PATTERN = /^\+?[1-9]\d{6,14}$/;

export const COUNTRY_CODES = [
  { code: '254', country: 'Kenya' },
  { code: '233', country: 'Ghana' },
  { code: '255', country: 'Tanzania' },
  { code: '256', country: 'Uganda' },
  { code: '27', country: 'South Africa' },
  { code: '234', country: 'Nigeria' },
  { code: '250', country: 'Rwanda' },
  { code: '251', country: 'Ethiopia' },
  { code: '44', country: 'United Kingdom' },
  { code: '1', country: 'United States / Canada' },
];

export function sanitizePhoneInput(value) {
  const input = String(value ?? '').replace(/[^0-9+().\s-]/g, '');
  let digitCount = 0;
  return [...input].filter((character) => {
    if (!/\d/.test(character)) return true;
    digitCount += 1;
    return digitCount <= 11;
  }).join('');
}

export function sanitizeLocalPhoneInput(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 9);
}

export function composePhone(countryCode, localNumber) {
  const local = sanitizeLocalPhoneInput(localNumber);
  return local ? `+${countryCode}${local}` : '';
}

export function normalizePhone(value) {
  const raw = String(value ?? '').trim();
  const digits = raw.replace(/[\s().-]/g, '');
  if (!/^\+?\d+$/.test(digits)) return null;
  const normalized = digits.startsWith('+') ? digits : `+${digits}`;
  return PHONE_PATTERN.test(normalized) ? normalized : null;
}

export function isValidPhone(value) {
  return Boolean(normalizePhone(value));
}

export function phoneError(value) {
  if (!String(value ?? '').trim()) return 'Phone number is required.';
  return 'Enter a valid international phone number, including the country code (for example +254712345678).';
}
