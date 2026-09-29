import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { setPendingScan } from '../lib/pendingScan'

/** Big camera button — opens the rear camera on phones (capture=environment), then runs the scan. */
export function SnapButton({ label, hint, className }: { label: string; hint?: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setPendingScan(f)
          e.target.value = ''
          navigate('/capture')
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={
          className ??
          'flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-lg font-extrabold text-terracotta-dark shadow-lg active:scale-[0.99]'
        }
      >
        <span className="text-3xl" aria-hidden>
          📸
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span>{label}</span>
          {hint ? <span className="text-xs font-semibold text-muted">{hint}</span> : null}
        </span>
      </button>
    </>
  )
}
