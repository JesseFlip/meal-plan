import { useState, useEffect, useRef } from 'react'
import type { Slot } from '../hooks/usePlanSync'
import type { MealHistoryItem } from '../hooks/useMealHistory'

type Props = {
  slot: Slot
  onUpdate: (patch: Partial<Slot>) => void
  isPending: boolean
  mealHistory: MealHistoryItem[]
}

export function MealCell({ slot, onUpdate, isPending, mealHistory }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(slot.text)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Keep local state in sync if server pushes an update while not editing
  useEffect(() => {
    if (!editing) setText(slot.text)
  }, [slot.text, editing])

  const save = () => {
    setEditing(false)
    setShowDropdown(false)
    const trimmed = text.trim()
    if (trimmed === slot.text) return
    const isFasting = /^fast(ing)?$/i.test(trimmed)
    onUpdate({
      text: trimmed,
      state: isFasting ? 'fasting' : 'planned'
    })
  }

  const cancel = () => {
    setText(slot.text)
    setEditing(false)
    setShowDropdown(false)
  }

  const selectMeal = (mealName: string) => {
    setText(mealName)
    setShowDropdown(false)
    setTimeout(save, 0)
  }

  // Filter meals based on current input
  const filteredMeals = mealHistory.filter(m =>
    m.meal_name.toLowerCase().includes(text.toLowerCase())
  ).slice(0, 8)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        save()
      }
    }

    if (editing && showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editing, showDropdown, text])

  if (editing) {
    const guidelines = getGuidelines()
    return (
      <div className="relative">
        <div className="space-y-2 p-3 bg-amber-50 border-2 border-amber-400">
          {guidelines && (
            <div className="text-[10px] text-amber-700 font-medium mb-1 px-1 py-0.5 bg-amber-100/50 rounded">
              {guidelines}
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            autoFocus
            placeholder="Type or select a meal..."
            className="w-full p-2 text-sm bg-white outline-none border border-amber-300 rounded"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={(e) => {
              // Delay to allow dropdown click to register
              if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
                save()
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                save()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                cancel()
              }
              if (e.key === 'ArrowDown' && filteredMeals.length > 0) {
                e.preventDefault()
                setShowDropdown(true)
                const firstButton = dropdownRef.current?.querySelector('button')
                firstButton?.focus()
              }
            }}
          />
        </div>
        {showDropdown && filteredMeals.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 bg-white border border-stone-200 shadow-lg max-h-48 overflow-y-auto z-50"
          >
            {filteredMeals.map((meal, idx) => (
              <button
                key={idx}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-amber-50 text-sm border-b border-stone-100 last:border-b-0"
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectMeal(meal.meal_name)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    selectMeal(meal.meal_name)
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    inputRef.current?.focus()
                  }
                }}
              >
                {meal.meal_name}
                {meal.use_count > 1 && (
                  <span className="ml-2 text-xs text-stone-400">({meal.use_count}×)</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const fasting = slot.state === 'fasting'

  // Nutritional guidelines based on meal slot
  function getGuidelines() {
    if (slot.slot === 0 || slot.slot === 1) {
      // Breakfast & Lunch
      return 'Include: lean protein + green leafy veggies + low-starch carb'
    } else if (slot.slot === 2) {
      // Dinner
      return 'Include: lean protein + green leafy veggies + healthy fat'
    }
    return ''
  }

  return (
    <div className="relative">
      <button
        onClick={() => setEditing(true)}
        className={`w-full min-h-[88px] sm:min-h-[100px] p-3 text-left hover:bg-amber-50 active:bg-amber-100 transition-colors ${
          fasting ? 'bg-stone-50' : ''
        }`}
      >
        {slot.text ? (
          <span className={fasting ? 'text-stone-400 italic text-sm' : 'handwritten'}>
            {slot.text}
          </span>
        ) : (
          <span className="text-stone-300 text-xs">+ add</span>
        )}
      </button>
      {isPending && (
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"
          aria-hidden="true"
        />
      )}
    </div>
  )
}
