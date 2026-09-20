export function IngredientChip({
  label,
  useSoon,
  onToggleSoon,
  onRemove,
}: {
  label: string
  useSoon?: boolean
  onToggleSoon?: () => void
  onRemove?: () => void
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
        useSoon ? 'bg-terracotta/20 text-terracotta-dark' : 'bg-chip text-ink'
      }`}
    >
      {onToggleSoon ? (
        <button type="button" onClick={onToggleSoon} className="font-medium" title="Toggle use soon">
          {useSoon ? '⏳ ' : ''}
          {label}
        </button>
      ) : (
        label
      )}
      {onRemove ? (
        <button type="button" onClick={onRemove} className="ml-1 text-muted hover:text-ink" aria-label="Remove">
          ×
        </button>
      ) : null}
    </span>
  )
}
