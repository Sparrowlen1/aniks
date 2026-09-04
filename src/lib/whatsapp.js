export const WHATSAPP_NUMBER = '254702839983'

export function whatsappUrl(message = '') {
  return `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
