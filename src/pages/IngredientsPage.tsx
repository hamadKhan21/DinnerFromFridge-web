import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilterChips } from '../components/FilterChips'
import { IngredientChip } from '../components/IngredientChip'
import { PageHeader } from '../components/PageHeader'
import { useApp } from '../context/AppContext'

export function IngredientsPage() {
  const {
    ingredients,
    addIngredient,
    removeIngredient,
    updateIngredient,
    tonightFilters,
    setTonightFilters,
  } = useApp()
  const [draft, setDraft] = useState('')
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Your ingredients" back />
      <div className="px-6 py-5">
        <p className="text-sm text-muted">Tap a chip to mark Use soon. Add or remove before finding dinners.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {ingredients.map((ing, i) => (
            <IngredientChip
              key={`${ing.name}-${i}`}
              label={ing.name}
              useSoon={ing.useSoon}
              onToggleSoon={() => updateIngredient(i, { useSoon: !ing.useSoon })}
              onRemove={() => removeIngredient(i)}
            />
          ))}
          {!ingredients.length ? <p className="text-sm text-muted">No ingredients yet.</p> : null}
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addIngredient(draft)
            setDraft('')
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add ingredient…"
            className="flex-1 rounded-xl border border-terracotta/20 bg-white px-3 py-2 outline-none focus:border-terracotta"
          />
          <button type="submit" className="rounded-xl bg-terracotta px-4 py-2 font-semibold text-white">
            Add
          </button>
        </form>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-muted">Tonight filters</p>
          <FilterChips filters={tonightFilters} onChange={setTonightFilters} />
        </div>

        <button
          type="button"
          disabled={!ingredients.length}
          onClick={() => navigate('/suggestions')}
          className="mt-8 w-full rounded-2xl bg-terracotta px-5 py-4 font-bold text-white disabled:opacity-40"
        >
          Find tonight&apos;s dinners
        </button>
      </div>
    </div>
  )
}
