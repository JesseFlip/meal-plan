import { useState, useEffect, useRef } from 'react'
import type { Slot } from '../hooks/usePlanSync'
import type { FoodOption } from '../hooks/useFoodOptions'
import { useFoodOptionsContext } from '../contexts/FoodOptionsContext'
import { useTranslation } from '../hooks/useTranslation'

type Props = {
  slot: Slot
  onUpdate: (patch: Partial<Slot>) => void
  isPending: boolean
  onCopyToTomorrow?: () => void
  showLock?: boolean
  isLocked?: boolean
  onToggleLock?: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onDrop?: () => void
  isDragging?: boolean
  isDropTarget?: boolean
}

// Separate component for food selection dropdown with "Add new" functionality
function FoodSelect({
  label,
  value,
  onChange,
  options,
  onAddNew,
  placeholder,
  t
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: FoodOption[]
  onAddNew: (name: string) => void
  placeholder: string
  t: (key: any) => string
}) {
  const [showAddNew, setShowAddNew] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  if (showAddNew) {
    return (
      <div className="space-y-1">
        <label className="text-[10px] text-stone-600 font-medium">{label} ({t('meal.addNew')})</label>
        <div className="flex gap-1">
          <input
            type="text"
            autoFocus
            placeholder={`${t('meal.newItem')} ${label.toLowerCase()}...`}
            className="flex-1 px-2 py-1.5 text-xs border border-amber-300 rounded"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newItemName.trim()) {
                e.preventDefault()
                onAddNew(newItemName.trim())
                onChange(newItemName.trim())
                setShowAddNew(false)
                setNewItemName('')
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                setShowAddNew(false)
                setNewItemName('')
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (newItemName.trim()) {
                onAddNew(newItemName.trim())
                onChange(newItemName.trim())
                setShowAddNew(false)
                setNewItemName('')
              }
            }}
            className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            {t('meal.addButton')}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddNew(false)
              setNewItemName('')
            }}
            className="px-2 py-1 text-xs bg-stone-300 text-stone-700 rounded hover:bg-stone-400"
          >
            {t('meal.cancel')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] text-stone-600 font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === '__ADD_NEW__') {
            setShowAddNew(true)
          } else {
            onChange(e.target.value)
          }
        }}
        className="w-full px-2 py-1.5 text-xs border border-amber-300 rounded bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.name}>
            {opt.name}
          </option>
        ))}
        <option value="__ADD_NEW__">+ {t('meal.addNew')} {label.toLowerCase()}</option>
      </select>
    </div>
  )
}

const API = import.meta.env.VITE_API_URL || ''

const getHouseholdId = (): string | null => {
  return localStorage.getItem('fridgeplan.householdId')
}

const getHeaders = async () => {
  const householdId = getHouseholdId()
  return {
    'Content-Type': 'application/json',
    'X-Household-ID': householdId || ''
  }
}

export function MealCell({ slot, onUpdate, isPending, onCopyToTomorrow, showLock, isLocked, onToggleLock, onDragStart, onDragEnd, onDrop, isDragging, isDropTarget }: Props) {
  const [editing, setEditing] = useState(false)
  const [entryMode, setEntryMode] = useState<'simple' | 'detailed'>('simple')
  const [mealName, setMealName] = useState(slot.text || '')
  const [protein, setProtein] = useState(slot.protein || '')
  const [veggie, setVeggie] = useState(slot.veggie || '')
  const [carbOrFat, setCarbOrFat] = useState(slot.carb_or_fat || '')

  const { t } = useTranslation()
  const { proteins, veggies, carbs, fats, addProtein, addVeggie, addCarb, addFat } = useFoodOptionsContext()

  const addToGroceryList = async (ingredientName: string) => {
    if (!ingredientName.trim()) return
    try {
      const headers = await getHeaders()
      await fetch(`${API}/api/groceries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: ingredientName.trim(), store: 'Other' })
      })
      // Dispatch event to refresh grocery list
      window.dispatchEvent(new Event('fridgeplan.groceriesChanged'))
    } catch (e) {
      console.warn('Failed to add to grocery list:', e)
    }
  }

  const containerRef = useRef<HTMLDivElement>(null)

  // Keep local state in sync if server pushes an update while not editing
  useEffect(() => {
    if (!editing) {
      setMealName(slot.text || '')
      setProtein(slot.protein || '')
      setVeggie(slot.veggie || '')
      setCarbOrFat(slot.carb_or_fat || '')
      // Auto-detect which mode to use based on existing data
      if (slot.text && !slot.protein && !slot.veggie && !slot.carb_or_fat) {
        setEntryMode('simple')
      } else if (slot.protein || slot.veggie || slot.carb_or_fat) {
        setEntryMode('detailed')
      }
    }
  }, [slot.text, slot.protein, slot.veggie, slot.carb_or_fat, editing])

  const save = () => {
    setEditing(false)

    if (entryMode === 'simple') {
      // Simple mode: just save meal name, clear detailed fields
      if (mealName.trim() === slot.text && !slot.protein && !slot.veggie && !slot.carb_or_fat) {
        return // Nothing changed
      }
      onUpdate({
        text: mealName.trim(),
        protein: '',
        veggie: '',
        carb_or_fat: '',
        state: 'planned',
      })
    } else {
      // Detailed mode: save components, clear meal name
      if (protein === slot.protein && veggie === slot.veggie && carbOrFat === slot.carb_or_fat && !slot.text) {
        return // Nothing changed
      }
      onUpdate({
        text: '',
        protein: protein.trim(),
        veggie: veggie.trim(),
        carb_or_fat: carbOrFat.trim(),
        state: 'planned',
      })
    }
  }

  const cancel = () => {
    setMealName(slot.text || '')
    setProtein(slot.protein || '')
    setVeggie(slot.veggie || '')
    setCarbOrFat(slot.carb_or_fat || '')
    setEditing(false)
  }

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        save()
      }
    }

    if (editing) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editing, mealName, protein, veggie, carbOrFat])

  const isDinner = slot.slot === 2
  const thirdFieldLabel = isDinner ? t('meal.fat') : t('meal.carb')
  const thirdFieldOptions = isDinner ? fats : carbs
  const thirdFieldValue = carbOrFat
  const setThirdFieldValue = setCarbOrFat
  const addThirdFieldOption = isDinner ? addFat : addCarb

  if (editing) {
    const guidelines = getGuidelines()
    return (
      <div ref={containerRef} className="relative">
        <div className="space-y-3 p-3 bg-amber-50 border-2 border-amber-400">
          {/* Mode Toggle */}
          <div className="flex gap-1 bg-white rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setEntryMode('simple')}
              className={`flex-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                entryMode === 'simple'
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t('meal.modeSimple')}
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('detailed')}
              className={`flex-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                entryMode === 'detailed'
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t('meal.modeDetailed')}
            </button>
          </div>

          {guidelines && entryMode === 'detailed' && (
            <div className="text-[10px] text-amber-700 font-medium mb-1 px-1 py-0.5 bg-amber-100/50 rounded">
              {guidelines}
            </div>
          )}

          {entryMode === 'simple' ? (
            /* Simple Mode: Just meal name */
            <div className="space-y-1">
              <label className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">{t('meal.mealName')}</label>
              <input
                type="text"
                autoFocus
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    save()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    cancel()
                  }
                }}
                placeholder={t('meal.mealNamePlaceholder')}
                className="w-full px-2 py-1.5 text-xs border border-amber-300 rounded bg-white"
              />
            </div>
          ) : (
            /* Detailed Mode: Protein, veggie, carb/fat */
            <div className="space-y-2">
              <FoodSelect
                label={t('meal.protein')}
                value={protein}
                onChange={setProtein}
                options={proteins}
                onAddNew={addProtein}
                placeholder={t('meal.selectProtein')}
                t={t}
              />

              <FoodSelect
                label={t('meal.veggie')}
                value={veggie}
                onChange={setVeggie}
                options={veggies}
                onAddNew={addVeggie}
                placeholder={t('meal.selectVeggie')}
                t={t}
              />

              <FoodSelect
                label={thirdFieldLabel}
                value={thirdFieldValue}
                onChange={setThirdFieldValue}
                options={thirdFieldOptions}
                onAddNew={addThirdFieldOption}
                placeholder={isDinner ? t('meal.selectFat') : t('meal.selectCarb')}
                t={t}
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={cancel}
              className="px-3 py-1 text-xs bg-stone-200 hover:bg-stone-300 rounded"
            >
              {t('meal.cancel')}
            </button>
            <button
              type="button"
              onClick={save}
              className="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded"
            >
              {t('meal.save')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fasting = slot.state === 'fasting'

  // Nutritional guidelines based on meal slot
  function getGuidelines() {
    if (slot.slot === 0 || slot.slot === 1) {
      // Breakfast & Lunch
      return t('meal.guidelineBreakfastLunch')
    } else if (slot.slot === 2) {
      // Dinner
      return t('meal.guidelineDinner')
    }
    return ''
  }

  const hasContent = slot.protein || slot.veggie || slot.carb_or_fat || slot.text

  const cycleMealType = (e: React.MouseEvent) => {
    e.stopPropagation()
    const types: Array<'regular' | 'smoothie' | 'cheat'> = ['regular', 'smoothie', 'cheat']
    const currentIndex = types.indexOf(slot.meal_type || 'regular')
    const nextType = types[(currentIndex + 1) % types.length]
    onUpdate({ meal_type: nextType })
  }

  const getMealTypeDisplay = () => {
    if (!slot.meal_type || slot.meal_type === 'regular') return null
    if (slot.meal_type === 'smoothie') return { emoji: '🥤', label: 'Smoothie', color: 'bg-purple-100 text-purple-700 border-purple-300' }
    if (slot.meal_type === 'cheat') return { emoji: '🍰', label: 'Cheat', color: 'bg-pink-100 text-pink-700 border-pink-300' }
    return null
  }

  const mealTypeDisplay = getMealTypeDisplay()

  return (
    <div
      className={`relative group ${isDragging ? 'opacity-50' : ''} ${isDropTarget ? 'ring-2 ring-amber-500' : ''}`}
      draggable={!!(hasContent && !editing)}
      onDragStart={(e) => {
        if (onDragStart) {
          e.dataTransfer.effectAllowed = 'copyMove'
          onDragStart()
        }
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={(e) => {
        e.preventDefault()
        if (onDrop) onDrop()
      }}
    >
      {/* Drag Handle */}
      {hasContent && !editing && (
        <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 cursor-move">
          <svg className="w-4 h-4 text-stone-400" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
        </div>
      )}
      {/* Meal Type Indicator */}
      {mealTypeDisplay && (
        <button
          onClick={cycleMealType}
          className={`absolute top-1 left-1 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${mealTypeDisplay.color} hover:scale-110 transition-transform shadow-sm`}
          title={`Click to change (currently: ${mealTypeDisplay.label})`}
        >
          {mealTypeDisplay.emoji} {mealTypeDisplay.label}
        </button>
      )}
      {/* Meal Type Selector (when no type set or hovering) */}
      {!mealTypeDisplay && hasContent && (
        <button
          onClick={cycleMealType}
          className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 transition-all"
          title="Set meal type (Smoothie/Cheat)"
        >
          + Type
        </button>
      )}
      <button
        onClick={() => setEditing(true)}
        className={`w-full min-h-[100px] sm:min-h-[100px] p-3 sm:p-3 text-left hover:bg-amber-50 active:bg-amber-100 transition-colors touch-manipulation ${
          fasting ? 'bg-stone-50' : ''
        }`}
      >
        {hasContent ? (
          <div className="space-y-1">
            {/* Show meal name if in simple mode */}
            {slot.text && !slot.protein && !slot.veggie && !slot.carb_or_fat && (
              <div className={fasting ? 'text-stone-400 italic text-sm' : 'handwritten text-sm font-medium'}>
                {slot.text}
              </div>
            )}

            {/* Show detailed breakdown if available */}
            {slot.protein && (
              <div className="text-xs flex items-baseline gap-1 overflow-hidden group/ingredient">
                <span className="text-stone-500 dark:text-stone-400 font-medium text-[10px] flex-shrink-0">{t('meal.protein')}:</span>
                <span className="handwritten truncate flex-1">{slot.protein}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addToGroceryList(slot.protein)
                  }}
                  className="opacity-0 group-hover/ingredient:opacity-100 flex-shrink-0 w-4 h-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center text-[10px] transition-opacity"
                  title="Add to grocery list"
                  aria-label="Add to grocery list"
                >
                  +
                </button>
              </div>
            )}
            {slot.veggie && (
              <div className="text-xs flex items-baseline gap-1 overflow-hidden group/ingredient">
                <span className="text-stone-500 dark:text-stone-400 font-medium text-[10px] flex-shrink-0">{t('meal.veggie')}:</span>
                <span className="handwritten truncate flex-1">{slot.veggie}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addToGroceryList(slot.veggie)
                  }}
                  className="opacity-0 group-hover/ingredient:opacity-100 flex-shrink-0 w-4 h-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center text-[10px] transition-opacity"
                  title="Add to grocery list"
                  aria-label="Add to grocery list"
                >
                  +
                </button>
              </div>
            )}
            {slot.carb_or_fat && (
              <div className="text-xs flex items-baseline gap-1 overflow-hidden group/ingredient">
                <span className="text-stone-500 dark:text-stone-400 font-medium text-[10px] flex-shrink-0">{isDinner ? t('meal.fat') : t('meal.carb')}:</span>
                <span className="handwritten truncate flex-1">{slot.carb_or_fat}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addToGroceryList(slot.carb_or_fat)
                  }}
                  className="opacity-0 group-hover/ingredient:opacity-100 flex-shrink-0 w-4 h-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center text-[10px] transition-opacity"
                  title="Add to grocery list"
                  aria-label="Add to grocery list"
                >
                  +
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="text-stone-300 dark:text-stone-600 text-xs">{t('meal.addCell')}</span>
        )}
      </button>
      {/* Rating buttons - Better touch targets on mobile */}
      {hasContent && !fasting && (
        <div className="absolute bottom-1 right-1 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ rating: slot.rating === 'good' ? '' : 'good' })
            }}
            className={`w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded transition-all touch-manipulation ${
              slot.rating === 'good'
                ? 'bg-green-100 border-2 border-green-500 scale-110'
                : 'bg-white/80 border border-stone-200 opacity-0 group-hover:opacity-100 hover:bg-green-50 hover:border-green-300'
            }`}
            title="Mark as good"
            aria-label="Mark as good"
          >
            <span className="text-base sm:text-sm">😊</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ rating: slot.rating === 'bad' ? '' : 'bad' })
            }}
            className={`w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded transition-all touch-manipulation ${
              slot.rating === 'bad'
                ? 'bg-red-100 border-2 border-red-500 scale-110'
                : 'bg-white/80 border border-stone-200 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-300'
            }`}
            title="Mark as bad"
            aria-label="Mark as bad"
          >
            <span className="text-base sm:text-sm">☹️</span>
          </button>
        </div>
      )}
      {/* Copy to tomorrow button - Better touch target on mobile */}
      {hasContent && !fasting && onCopyToTomorrow && slot.day < 6 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCopyToTomorrow()
          }}
          className="absolute top-1 right-1 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded bg-white/80 hover:bg-amber-100 border border-stone-200 hover:border-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm touch-manipulation"
          title="Copy to tomorrow"
          aria-label="Copy to tomorrow"
        >
          <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}
      {isPending && (
        <span
          className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-amber-400"
          aria-hidden="true"
        />
      )}
      {/* Lock Icon for Randomizer */}
      {showLock && onToggleLock && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock()
          }}
          className={`absolute bottom-1 left-1 w-6 h-6 flex items-center justify-center rounded transition-all ${
            isLocked
              ? 'bg-purple-100 border-2 border-purple-500 text-purple-700'
              : 'bg-white/80 border border-stone-200 text-stone-400 hover:border-purple-300 hover:text-purple-500'
          }`}
          title={isLocked ? 'Locked (won\'t randomize)' : 'Unlocked (will randomize)'}
          aria-label={isLocked ? 'Unlock meal' : 'Lock meal'}
        >
          {isLocked ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}
