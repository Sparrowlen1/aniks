import { useOutletContext } from 'react-router-dom'

// Neutral UI shape matches Contacts/Donations/Partners/Settings/Stories, but the
// accent slots (green/red/orange/blue) use ANIKA's actual brand colors, not the
// approximated hexes those pages picked — coral, anika-green, gold, anika-blue.
export const lightColors = {
  bg: '#fafaf8',
  border: '#e8e5df',
  text: '#1c1a17',
  muted: '#8c8579',
  panel: '#ffffff',
  panelAlt: '#faf8f2',
  green: '#389A51',
  red: '#EB4C47',
  orange: '#E8A850',
  blue: '#3A7599',
  buttonBg: '#1c1a17',
  buttonText: '#ffffff',
  inputBg: '#ffffff',
  inputPlaceholder: '#8c8579',
}

export const darkColors = {
  bg: '#1a1a1a',
  border: '#3a3a3a',
  text: '#f0f0f0',
  muted: '#aaaaaa',
  panel: '#2a2a2a',
  panelAlt: '#242424',
  green: '#389A51',
  red: '#EB4C47',
  orange: '#E8A850',
  blue: '#3A7599',
  buttonBg: '#f0f0f0',
  buttonText: '#1a1a1a',
  inputBg: '#2a2a2a',
  inputPlaceholder: '#aaaaaa',
}

export const AVATAR_COLORS = ['#c0392b', '#2f4a6b', '#b3760c', '#2d7a43', '#6b4a8a']

export function initials(name) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

export function avatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function useAdminColors() {
  const { theme } = useOutletContext()
  return theme === 'dark' ? darkColors : lightColors
}
