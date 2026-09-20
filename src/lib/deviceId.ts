const KEY = 'dff_device_id'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(KEY)
    if (existing && existing.length > 8) return existing
    const id = uuid()
    localStorage.setItem(KEY, id)
    return id
  } catch {
    return uuid()
  }
}
