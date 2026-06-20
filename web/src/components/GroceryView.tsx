import { useState } from 'react'
import { useGroceries, GroceryItem } from '../hooks/useGroceries'

const STORES = ['Costco', 'Central Market', 'Trader Joes', 'Tom Thumb', 'Whole Foods', 'Target', 'La Michocana', 'Other']

export function GroceryView() {
  const { items, loading, addGrocery, toggleGrocery, deleteGrocery, clearBought, syncGroceries } = useGroceries()
  const [newItemName, setNewItemName] = useState('')
  const [selectedStore, setSelectedStore] = useState('Other')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return
    addGrocery(newItemName.trim(), selectedStore)
    setNewItemName('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
      </div>
    )
  }

  const groupedItems = STORES.reduce((acc, store) => {
    acc[store] = items.filter(item => item.store === store)
    return acc
  }, {} as Record<string, GroceryItem[]>)

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleAdd} className="space-y-3">
        <div className="relative">
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
        </div>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-2xl px-6 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all text-base text-stone-700"
        >
          {STORES.map(store => (
            <option key={store} value={store}>{store}</option>
          ))}
        </select>
      </form>

      <div className="space-y-6">
        {STORES.map(store => {
          const storeItems = groupedItems[store]
          if (storeItems.length === 0) return null

          return (
            <section key={store} className="space-y-3">
              <h3 className="text-xs font-bold tracking-widest text-stone-400 uppercase px-1">
                {store}
              </h3>
              <div className="bg-white border border-stone-100 rounded-2xl shadow-sm divide-y divide-stone-50 overflow-hidden">
                {storeItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-5 py-4 hover:bg-stone-50 transition-colors group"
                  >
                    <button
                      onClick={() => toggleGrocery(item.id, !item.bought)}
                      className="flex-1 flex items-center gap-4 text-left"
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
                    <button
                      onClick={() => deleteGrocery(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                      aria-label="Delete item"
                      title="Delete item"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
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
