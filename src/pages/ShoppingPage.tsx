import { useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'

function formatItem(name: string, quantity?: string | null, unit?: string | null): string {
  const qty = quantity?.trim()
  const u = unit?.trim()
  if (qty && u) return `${qty} ${u} ${name}`
  if (qty) return `${qty} ${name}`
  return name
}

function buildQuery(lines: string[], maxLen = 180): string {
  let q = lines.join(', ')
  if (q.length > maxLen) q = `${q.slice(0, maxLen - 1)}…`
  return q
}

export function ShoppingPage() {
  const { shopping, addShopping, toggleShopping, removeShopping, clearShoppingChecked } = useApp()
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)

  const unchecked = useMemo(() => shopping.filter((s) => !s.checked), [shopping])
  const lines = useMemo(
    () => unchecked.map((s) => formatItem(s.name, s.quantity, s.unit)),
    [unchecked],
  )
  const query = useMemo(() => buildQuery(lines), [lines])

  const copyList = async () => {
    if (!lines.length) return
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const openShop = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="shopping-page">
      <PageHeader title="Shopping list" back />
      <div className="px-4 py-4">
        <form
          className="flex gap-2 print:hidden"
          onSubmit={(e) => {
            e.preventDefault()
            addShopping(draft)
            setDraft('')
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add item…"
            className="flex-1 rounded-xl border border-terracotta/20 bg-white px-3 py-2 outline-none focus:border-terracotta"
          />
          <button type="submit" className="rounded-xl bg-terracotta px-4 py-2 font-semibold text-white">
            Add
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            disabled={!lines.length}
            onClick={() => void copyList()}
            className="rounded-xl border border-terracotta/30 bg-white px-3 py-2 text-sm font-semibold text-ink disabled:opacity-40"
          >
            {copied ? 'Copied!' : 'Copy list'}
          </button>
          <button
            type="button"
            disabled={!shopping.length}
            onClick={() => window.print()}
            className="rounded-xl border border-terracotta/30 bg-white px-3 py-2 text-sm font-semibold text-ink disabled:opacity-40"
          >
            Print
          </button>
        </div>

        {lines.length > 0 ? (
          <div className="mt-3 print:hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Shop online</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full bg-chip px-3 py-1.5 text-sm font-medium text-ink"
                onClick={() =>
                  openShop(`https://www.instacart.com/store/search/${encodeURIComponent(query)}`)
                }
              >
                Open in Instacart
              </button>
              <button
                type="button"
                className="rounded-full bg-chip px-3 py-1.5 text-sm font-medium text-ink"
                onClick={() =>
                  openShop(`https://www.google.com/search?q=${encodeURIComponent(`Amazon Fresh ${query}`)}`)
                }
              >
                Open in Amazon Fresh
              </button>
              <button
                type="button"
                className="rounded-full bg-chip px-3 py-1.5 text-sm font-medium text-ink"
                onClick={() =>
                  openShop(
                    `https://www.google.com/search?q=${encodeURIComponent(`Walmart grocery ${query}`)}`,
                  )
                }
              >
                Open in Walmart grocery
              </button>
            </div>
          </div>
        ) : null}

        {shopping.some((s) => s.checked) ? (
          <button
            type="button"
            onClick={clearShoppingChecked}
            className="mt-3 text-sm text-muted underline print:hidden"
          >
            Clear checked
          </button>
        ) : null}

        <ul className="mt-4 space-y-2">
          {shopping.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-terracotta/10 bg-white px-3 py-2"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleShopping(item.id)}
                className="print:hidden"
              />
              <span className={`flex-1 ${item.checked ? 'text-muted line-through' : ''}`}>
                {item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''} · ` : ''}
                {item.name}
              </span>
              <button
                type="button"
                onClick={() => removeShopping(item.id)}
                className="text-muted print:hidden"
              >
                ×
              </button>
            </li>
          ))}
          {!shopping.length ? <p className="text-center text-muted">List is empty.</p> : null}
        </ul>
      </div>
    </div>
  )
}
