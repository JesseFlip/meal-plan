import { useState, useEffect, useRef } from 'react'
import type { Slot } from '../hooks/usePlanSync'
import type { FoodOption } from '../hooks/useFoodOptions'
import { useFoodOptionsContext } from '../contexts/FoodOptionsContext'
import { useTranslation } from '../hooks/useTranslation'

type Props = {
  slot: Slot
  onUpdate: (patch: Partial<Slot>) => void
  isPending: boolean
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

export function MealCell({ slot, onUpdate, isPending }: Props) {
  const [editing, setEditing] = useState(false)
  const [protein, setProtein] = useState(slot.protein || '')
  const [veggie, setVeggie] = useState(slot.veggie || '')
  const [carbOrFat, setCarbOrFat] = useState(slot.carb_or_fat || '')

  const { t } = useTranslation()
  const { proteins, veggies, carbs, fats, addProtein, addVeggie, addCarb, addFat } = useFoodOptionsContext()

  const containerRef = useRef<HTMLDivElement>(null)

  // Keep local state in sync if server pushes an update while not editing
  useEffect(() => {
    if (!editing) {
      setProtein(slot.protein || '')
      setVeggie(slot.veggie || '')
      setCarbOrFat(slot.carb_or_fat || '')
    }
  }, [slot.protein, slot.veggie, slot.carb_or_fat, editing])

  const save = () => {
    setEditing(false)
    // Only update if something changed
    if (protein === slot.protein && veggie === slot.veggie && carbOrFat === slot.carb_or_fat) {
      return
    }
    onUpdate({
      protein: protein.trim(),
      veggie: veggie.trim(),
      carb_or_fat: carbOrFat.trim(),
      state: 'planned'
    })
  }

  const cancel = () => {
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
  }, [editing, protein, veggie, carbOrFat])

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
          {guidelines && (
            <div className="text-[10px] text-amber-700 font-medium mb-1 px-1 py-0.5 bg-amber-100/50 rounded">
              {guidelines}
            </div>
          )}

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

  return (
    <div className="relative">
      <button
        onClick={() => setEditing(true)}
        className={`w-full min-h-[88px] sm:min-h-[100px] p-3 text-left hover:bg-amber-50 active:bg-amber-100 transition-colors ${
          fasting ? 'bg-stone-50' : ''
        }`}
      >
        {hasContent ? (
          <div className="space-y-1">
            {slot.protein && (
              <div className="text-xs">
                <span className="text-stone-500 font-medium">{t('meal.protein')}:</span>{' '}
                <span className="handwritten">{slot.protein}</span>
              </div>
            )}
            {slot.veggie && (
              <div className="text-xs">
                <span className="text-stone-500 font-medium">{t('meal.veggie')}:</span>{' '}
                <span className="handwritten">{slot.veggie}</span>
              </div>
            )}
            {slot.carb_or_fat && (
              <div className="text-xs">
                <span className="text-stone-500 font-medium">{isDinner ? t('meal.fat') : t('meal.carb')}:</span>{' '}
                <span className="handwritten">{slot.carb_or_fat}</span>
              </div>
            )}
            {slot.text && !slot.protein && !slot.veggie && !slot.carb_or_fat && (
              <span className={fasting ? 'text-stone-400 italic text-sm' : 'handwritten'}>
                {slot.text}
              </span>
            )}
          </div>
        ) : (
          <span className="text-stone-300 text-xs">{t('meal.addCell')}</span>
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
