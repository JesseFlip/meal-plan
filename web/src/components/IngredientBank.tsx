import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { useFoodOptionsContext } from '../contexts/FoodOptionsContext'
import type { FoodOption } from '../hooks/useFoodOptions'

type Category = 'proteins' | 'veggies' | 'carbs' | 'fats'

function IngredientCategory({
  title,
  items,
  onAdd,
  onDelete,
  placeholder,
  colorClass,
}: {
  title: string
  items: FoodOption[]
  onAdd: (name: string) => void
  onDelete: (id: number) => void
  placeholder: string
  colorClass: string
}) {
  const [newItem, setNewItem] = useState('')
  const { t } = useTranslation()

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim())
      setNewItem('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-6">
      <h3 className={`text-lg font-bold ${colorClass} mb-4`}>{title}</h3>

      {/* Add new item */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {t('ingredients.add')}
        </button>
      </div>

      {/* List of items */}
      {items.length === 0 ? (
        <p className="text-sm text-stone-400 dark:text-stone-500 italic text-center py-4">
          {t('ingredients.empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-3 py-2 bg-stone-50 dark:bg-stone-700/50 rounded-lg group hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <span className="text-sm text-stone-900 dark:text-stone-100">{item.name}</span>
              <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-opacity"
                aria-label={`Delete ${item.name}`}
              >
                {t('ingredients.delete')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function IngredientBank() {
  const { t } = useTranslation()
  const {
    proteins,
    veggies,
    carbs,
    fats,
    addProtein,
    addVeggie,
    addCarb,
    addFat,
    deleteProtein,
    deleteVeggie,
    deleteCarb,
    deleteFat,
  } = useFoodOptionsContext()

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
          {t('ingredients.title')}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          {t('ingredients.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IngredientCategory
          title={t('ingredients.proteins')}
          items={proteins}
          onAdd={addProtein}
          onDelete={deleteProtein}
          placeholder={t('ingredients.addPlaceholder')}
          colorClass="text-blue-700 dark:text-blue-400"
        />

        <IngredientCategory
          title={t('ingredients.veggies')}
          items={veggies}
          onAdd={addVeggie}
          onDelete={deleteVeggie}
          placeholder={t('ingredients.addPlaceholder')}
          colorClass="text-green-700 dark:text-green-400"
        />

        <IngredientCategory
          title={t('ingredients.carbs')}
          items={carbs}
          onAdd={addCarb}
          onDelete={deleteCarb}
          placeholder={t('ingredients.addPlaceholder')}
          colorClass="text-orange-700 dark:text-orange-400"
        />

        <IngredientCategory
          title={t('ingredients.fats')}
          items={fats}
          onAdd={addFat}
          onDelete={deleteFat}
          placeholder={t('ingredients.addPlaceholder')}
          colorClass="text-purple-700 dark:text-purple-400"
        />
      </div>
    </div>
  )
}
