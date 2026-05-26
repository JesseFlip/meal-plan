import { useState } from 'react'
import { useGroceries, GroceryItem } from '../hooks/useGroceries'

export function GroceryView() {
  const { items, loading, addGrocery, toggleGrocery, clearBought, syncGroceries } = useGroceries()
  const [newItemName, setNewItemName] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return
    addGrocery(newItemName.trim())
    setNewItemName('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
      </div>
    )
  }

  const categories = ['Produce', 'Protein', 'Dairy', 'Pantry', 'Other']
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = items.filter(item => item.category === cat)
    return acc
  }, {} as Record<string, GroceryItem[]>)

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleAdd} className="relative">
        <input
          type="text"
          placeholder="Add something to the list..."
          className="w-full bg-white border border-stone-200 rounded-2xl px-6 py-4 pr-16 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all text-lg placeholder:text-stone-300"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-stone-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-stone-800 transition-colors"
          aria-label="Add item"
        >
          <span className="text-xl">+</span>
        </button>
      </form>

      <div className="space-y-6">
        {categories.map(cat => {
          const catItems = groupedItems[cat]
          if (catItems.length === 0) return null

          return (
            <section key={cat} className="space-y-3">
              <h3 className="text-xs font-bold tracking-widest text-stone-400 uppercase px-1">
                {cat}
              </h3>
              <div className="bg-white border border-stone-100 rounded-2xl shadow-sm divide-y divide-stone-50 overflow-hidden">
                {catItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleGrocery(item.id, !item.bought)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors text-left group"
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      item.bought 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'border-stone-200 group-hover:border-stone-300'
                    }`}>
                      {item.bought && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-lg transition-all ${
                      item.bought ? 'text-stone-300 line-through' : 'text-stone-700'
                    }`}>
                      {item.name}
                    </span>
                    {item.is_derived && (
                      <span className="ml-auto text-[10px] font-bold text-stone-300 uppercase tracking-tighter bg-stone-50 px-1.5 py-0.5 rounded">
                        From Plan
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-4 gap-4">
        <button
          onClick={syncGroceries}
          className="flex-1 px-6 py-3 rounded-xl bg-stone-100 text-stone-600 font-semibold text-sm hover:bg-stone-200 transition-colors"
        >
          Refresh from Plan
        </button>
        <button
          onClick={clearBought}
          className="flex-1 px-6 py-3 rounded-xl border border-stone-200 text-stone-400 font-semibold text-sm hover:text-stone-600 hover:border-stone-300 transition-all"
        >
          Clear Bought
        </button>
      </div>
    </div>
  )
}
