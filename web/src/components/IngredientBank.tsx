import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import { useFoodOptionsContext } from '../contexts/FoodOptionsContext'
import type { FoodOption } from '../hooks/useFoodOptions'

type Category = 'proteins' | 'veggies' | 'carbs' | 'fats'

// Nutrition Framework 2.0 Template
const NUTRITION_FRAMEWORK_2_0 = {
  proteins: [
    'Chicken Breast',
    'Ground Beef (96/4)',
    'Egg Whites',
    'Greek Yogurt (0%)',
    'White Fish',
    'Whey Protein',
    'Casein Protein',
    'Pork Tenderloin',
    'Turkey Sausage',
    'Edamame',
    'Cottage Cheese',
    'Ground Turkey',
    'Turkey Pepperoni'
  ],
  veggies: [
    'Spinach',
    'Broccoli',
    'Asparagus',
    'Carrots',
    'Squash',
    'Beets',
    'Mixed Greens',
    'Cherry Tomatoes',
    'Cucumbers',
    'Cauliflower',
    'Bell Peppers',
    'Kale'
  ],
  carbs: [
    'Sweet Potatoes',
    'Jasmine Rice',
    'Brown Rice',
    'Oats',
    'Ezekiel Bread',
    'Cream of Rice',
    'Sourdough Bread',
    'Banana',
    'Rice Cakes',
    'Cauliflower Crust',
    'Low-Carb Tortilla'
  ],
  fats: [
    'Avocado',
    'Almonds',
    'Walnuts',
    'Olive Oil',
    'Goat Cheese',
    'Macadamia Nut Oil',
    'Chia Seeds',
    'Flax Seeds',
    'Ghee'
  ]
}

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
    clearAll,
    loadTemplate
  } = useFoodOptionsContext()

  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadTemplate = async () => {
    if (selectedTemplate === 'nutrition-framework-2.0') {
      setIsLoading(true)
      await loadTemplate(NUTRITION_FRAMEWORK_2_0)
      setIsLoading(false)
      setSelectedTemplate('')
    }
  }

  const handleClearAll = async () => {
    if (window.confirm(t('ingredients.confirmClear'))) {
      setIsLoading(true)
      await clearAll()
      setIsLoading(false)
    }
  }

  const totalIngredients = proteins.length + veggies.length + carbs.length + fats.length

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

      {/* Template Controls */}
      <div className="mb-6 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              {t('ingredients.templates')}
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{t('ingredients.template.none')}</option>
              <option value="nutrition-framework-2.0">{t('ingredients.template.nutritionFramework')}</option>
            </select>
          </div>

          <div className="flex gap-2 sm:items-end">
            <button
              onClick={handleLoadTemplate}
              disabled={!selectedTemplate || isLoading}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-stone-300 disabled:to-stone-300 dark:disabled:from-stone-700 dark:disabled:to-stone-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? '...' : t('ingredients.loadTemplate')}
            </button>

            <button
              onClick={handleClearAll}
              disabled={totalIngredients === 0 || isLoading}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {t('ingredients.clearAll')}
            </button>
          </div>
        </div>

        {/* Info text */}
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-3">
          {totalIngredients > 0 && (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {totalIngredients} {totalIngredients === 1 ? 'ingredient' : 'ingredients'}
            </span>
          )}
          {selectedTemplate === 'nutrition-framework-2.0' && (
            <span className="ml-2">
              • High-Performance & Adherence framework with 40+ optimized foods
            </span>
          )}
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
