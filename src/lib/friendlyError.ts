import { ApiError, PaywallError, type ApiErrorKind } from '../api/types'

const KNOWN: ApiErrorKind[] = [
  'busy',
  'unavailable',
  'bad_image',
  'quota_exceeded',
  'rate_limited',
  'offline',
  'not_found',
  'generic',
]

/** Map a server JSON body + status to a stable, user-safe kind. */
export function kindFromResponse(status: number, map: Record<string, unknown>): ApiErrorKind {
  const err = typeof map.error === 'string' ? map.error.trim().toLowerCase() : ''
  const code = typeof map.code === 'string' ? map.code.trim().toUpperCase() : ''
  if ((KNOWN as string[]).includes(err)) return err as ApiErrorKind
  if (code === 'PAYWALL' || status === 402) return 'quota_exceeded'
  if (code === 'RATE_LIMIT' || status === 429) return 'rate_limited'
  if (code === 'BAD_IMAGE' || status === 422) return 'bad_image'
  if (status === 404) return 'not_found'
  if (code === 'GEMINI_ERROR' || code === 'EMPTY_MEALS' || status === 502 || status === 503 || status === 504) {
    return 'busy'
  }
  if (status >= 500) return 'unavailable'
  return 'generic'
}

/** Classify any thrown value into a user-safe kind. Never exposes raw text. */
export function errorKind(e: unknown): ApiErrorKind {
  if (e instanceof ApiError) return e.kind
  if (e instanceof PaywallError) return 'quota_exceeded'
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline'
  // fetch() network failures: "Failed to fetch" (Chrome), "Load failed" (Safari), NetworkError (Firefox)
  if (e instanceof TypeError) return 'offline'
  const msg = e instanceof Error ? e.message.toLowerCase() : ''
  if (
    msg.includes('could not read') ||
    msg.includes('decode') ||
    msg.includes('empty image') ||
    msg.includes('empty jpeg') ||
    msg.includes('heic') ||
    msg.includes('unsupported')
  ) {
    return 'bad_image'
  }
  return 'generic'
}

/** i18n key for a kind (see src/i18n/errorStrings.ts). */
export function errorKey(kindOrError: ApiErrorKind | unknown): string {
  const kind =
    typeof kindOrError === 'string' && (KNOWN as string[]).includes(kindOrError)
      ? (kindOrError as ApiErrorKind)
      : errorKind(kindOrError)
  return `err.${kind}`
}

/** Kinds where "Try again" is likely to help. */
export function isRetryable(kind: ApiErrorKind): boolean {
  return kind === 'busy' || kind === 'unavailable' || kind === 'offline' || kind === 'rate_limited' || kind === 'generic'
}
