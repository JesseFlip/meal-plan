import { useState, useEffect } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import type { Slot } from '../hooks/usePlanSync'

const API = import.meta.env.VITE_API_URL || ''

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const SLOTS = ['Breakfast', 'Lunch', 'Dinner']

type GeneratedMeal = {
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner'
  protein: string
  veggie: string
  carb_or_fat: string
  description: string
}

type MealWithSelection = GeneratedMeal & {
  selected: boolean
  targetSlotId: number | null
}

type AvailableIngredients = {
  proteins: string[]
  veggies: string[]
  carbs: string[]
  fats: string[]
}

type Props = {
  onClose: () => void
  slots: Slot[]
  onUpdate: (id: number, patch: Partial<Slot>) => void
}

const getHouseholdId = (): string | null => {
  return localStorage.getItem('fridgeplan.householdId')
}

export function MealGenerator({ onClose, slots, onUpdate }: Props) {
  const { t } = useTranslation()
  const [numMeals, setNumMeals] = useState(7)
  const [dietaryPreferences, setDietaryPreferences] = useState('')
  const [loading, setLoading] = useState(false)
  const [meals, setMeals] = useState<MealWithSelection[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showIngredients, setShowIngredients] = useState(false)
  const [ingredients, setIngredients] = useState<AvailableIngredients>({
    proteins: [],
    veggies: [],
    carbs: [],
    fats: []
  })

  // Fetch available ingredients on mount
  useEffect(() => {
    const fetchIngredients = async () => {
      const householdId = getHouseholdId()
      if (!householdId) return

      try {
        const [proteins, veggies, carbs, fats] = await Promise.all([
          fetch(`${API}/api/proteins`, {
            headers: { 'X-Household-ID': householdId }
          }).then(r => r.json()),
          fetch(`${API}/api/veggies`, {
            headers: { 'X-Household-ID': householdId }
          }).then(r => r.json()),
          fetch(`${API}/api/carbs`, {
            headers: { 'X-Household-ID': householdId }
          }).then(r => r.json()),
          fetch(`${API}/api/fats`, {
            headers: { 'X-Household-ID': householdId }
          }).then(r => r.json())
        ])

        setIngredients({
          proteins: proteins.map((p: any) => p.name),
          veggies: veggies.map((v: any) => v.name),
          carbs: carbs.map((c: any) => c.name),
          fats: fats.map((f: any) => f.name)
        })
      } catch (err) {
        console.error('Failed to fetch ingredients:', err)
      }
    }

    fetchIngredients()
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    const householdId = getHouseholdId()
    if (!householdId) {
      setError('No household ID found')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API}/api/meals/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Household-ID': householdId,
        },
        body: JSON.stringify({
          num_meals: numMeals,
          dietary_preferences: dietaryPreferences,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to generate meals')
      }

      const data = await response.json()
      setMeals((data.meals || []).map((meal: GeneratedMeal) => ({
        ...meal,
        selected: false,
        targetSlotId: null
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate meals')
    } finally {
      setLoading(false)
    }
  }

  const toggleMealSelection = (index: number) => {
    setMeals(meals.map((meal, i) =>
      i === index ? { ...meal, selected: !meal.selected } : meal
    ))
  }

  const setMealSlot = (index: number, slotId: number | null) => {
    setMeals(meals.map((meal, i) =>
      i === index ? { ...meal, targetSlotId: slotId } : meal
    ))
  }

  const getSlotLabel = (slot: Slot) => {
    return `${DAYS[slot.day]} - ${SLOTS[slot.slot]}`
  }

  const handleApplySelected = () => {
    const selectedMeals = meals.filter(m => m.selected && m.targetSlotId !== null)

    selectedMeals.forEach(meal => {
      if (meal.targetSlotId !== null) {
        onUpdate(meal.targetSlotId, {
          protein: meal.protein,
          veggie: meal.veggie,
          carb_or_fat: meal.carb_or_fat,
          state: 'planned'
        })
      }
    })

    if (selectedMeals.length > 0) {
      onClose()
    }
  }

  const selectedCount = meals.filter(m => m.selected).length
  const readyToApply = meals.filter(m => m.selected && m.targetSlotId !== null).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {t('mealGenerator.title')}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {t('mealGenerator.subtitle')}
            </p>
          </div>
          {meals.length > 0 && (
            <div className="mx-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {selectedCount} selected · {readyToApply} ready to apply
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!meals.length ? (
            <div className="space-y-6">
              {/* Available Ingredients Section */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <button
                  onClick={() => setShowIngredients(!showIngredients)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Available Ingredients
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      AI will use these ingredients to create meal suggestions
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-blue-700 dark:text-blue-300 transition-transform ${showIngredients ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showIngredients && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">PROTEINS</h4>
                      <div className="flex flex-wrap gap-1">
                        {ingredients.proteins.map(p => (
                          <span key={p} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-green-800 dark:text-green-200 mb-2">VEGGIES</h4>
                      <div className="flex flex-wrap gap-1">
                        {ingredients.veggies.map(v => (
                          <span key={v} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-orange-800 dark:text-orange-200 mb-2">CARBS</h4>
                      <div className="flex flex-wrap gap-1">
                        {ingredients.carbs.map(c => (
                          <span key={c} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-purple-800 dark:text-purple-200 mb-2">FATS</h4>
                      <div className="flex flex-wrap gap-1">
                        {ingredients.fats.map(f => (
                          <span key={f} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  {t('mealGenerator.numMeals')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="21"
                  value={numMeals}
                  onChange={(e) => setNumMeals(parseInt(e.target.value) || 7)}
                  className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  {t('mealGenerator.dietaryPreferences')}
                </label>
                <textarea
                  value={dietaryPreferences}
                  onChange={(e) => setDietaryPreferences(e.target.value)}
                  placeholder={t('mealGenerator.dietaryPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? t('mealGenerator.generating') : t('mealGenerator.generate')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {t('mealGenerator.generatedMeals')}
                </h3>
                <button
                  onClick={() => setMeals([])}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
                >
                  {t('mealGenerator.generateNew')}
                </button>
              </div>

              <div className="grid gap-4">
                {meals.map((meal, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg transition-all ${
                      meal.selected
                        ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={meal.selected}
                          onChange={() => toggleMealSelection(index)}
                          className="w-5 h-5 rounded border-stone-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Meal Details */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
                          {meal.name}
                        </h4>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                          {meal.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            {meal.protein}
                          </span>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                            {meal.veggie}
                          </span>
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                            {meal.carb_or_fat}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded capitalize">
                            {meal.meal_type}
                          </span>
                        </div>
                      </div>

                      {/* Slot Selector */}
                      <div className="w-48">
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                          Apply to:
                        </label>
                        <select
                          value={meal.targetSlotId || ''}
                          onChange={(e) => setMealSlot(index, e.target.value ? parseInt(e.target.value) : null)}
                          disabled={!meal.selected}
                          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select slot...</option>
                          {slots.map(slot => (
                            <option key={slot.id} value={slot.id}>
                              {getSlotLabel(slot)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Apply Button */}
        {meals.length > 0 && (
          <div className="p-6 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {readyToApply === 0
                  ? 'Select meals and choose time slots to apply them'
                  : `Ready to apply ${readyToApply} meal${readyToApply !== 1 ? 's' : ''}`
                }
              </p>
              <button
                onClick={handleApplySelected}
                disabled={readyToApply === 0}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                Apply Selected ({readyToApply})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
