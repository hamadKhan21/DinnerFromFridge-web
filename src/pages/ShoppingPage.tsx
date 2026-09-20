import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'

export function ShoppingPage() {
  const { shopping, addShopping, toggleShopping, removeShopping, clearShoppingChecked } = useApp()
  const [draft, setDraft] = useState('')

  return (
    <div>
      <PageHeader title="Shopping list" back />
      <div className="px-4 py-4">
        <form
          className="flex gap-2"
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

        {shopping.some((s) => s.checked) ? (
          <button type="button" onClick={clearShoppingChecked} className="mt-3 text-sm text-muted underline">
            Clear checked
          </button>
        ) : null}

        <ul className="mt-4 space-y-2">
          {shopping.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 border border-terracotta/10">
              <input type="checkbox" checked={item.checked} onChange={() => toggleShopping(item.id)} />
              <span className={`flex-1 ${item.checked ? 'text-muted line-through' : ''}`}>
                {item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''} · ` : ''}
                {item.name}
              </span>
              <button type="button" onClick={() => removeShopping(item.id)} className="text-muted">
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
