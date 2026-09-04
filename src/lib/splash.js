let splashDone = false
const listeners = new Set()

export function markSplashDone() {
  if (splashDone) return
  splashDone = true
  listeners.forEach((fn) => fn())
  listeners.clear()
}

export function onSplashDone(callback) {
  if (splashDone) {
    callback()
    return () => {}
  }
  listeners.add(callback)
  return () => listeners.delete(callback)
}
