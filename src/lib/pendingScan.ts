/** Hand a camera photo picked on Home to the Capture page (in-memory, same tab). */
let pending: File | null = null

export function setPendingScan(file: File | null) {
  pending = file
}

export function takePendingScan(): File | null {
  const f = pending
  pending = null
  return f
}
