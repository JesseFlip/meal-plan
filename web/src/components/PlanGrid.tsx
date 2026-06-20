import { useState, lazy, Suspense } from 'react'
import { MealCell } from './MealCell'
import type { Slot } from '../hooks/usePlanSync'
import { useTranslation } from '../hooks/useTranslation'
import { useFoodOptionsContext } from '../contexts/FoodOptionsContext'

// Lazy load MealGenerator since it's a heavy modal only shown on demand
const MealGenerator = lazy(() => import('./MealGenerator').then(m => ({ default: m.MealGenerator })))

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SLOTS = ['Breakfast', 'Lunch', 'Dinner']

type Props = {
  slots: Slot[]
  onUpdate: (id: number, patch: Partial<Slot>) => void
  pendingSlotIds: Set<number>
}

export function PlanGrid({ slots, onUpdate, pendingSlotIds }: Props) {
  const { t } = useTranslation()
  const [showMealGenerator, setShowMealGenerator] = useState(false)
  const [lockedSlots, setLockedSlots] = useState<Set<number>>(new Set())
  const [showRandomizer, setShowRandomizer] = useState(false)
  const [draggedSlot, setDraggedSlot] = useState<Slot | null>(null)
  const [dropAction, setDropAction] = useState<'move' | 'copy' | null>(null)
  const [showDropModal, setShowDropModal] = useState(false)
  const [targetSlotId, setTargetSlotId] = useState<number | null>(null)
  const { proteins, veggies, carbs, fats } = useFoodOptionsContext()

  const getSlot = (day: number, slot: number) =>
    slots.find(s => s.day === day && s.slot === slot)

  // Auto-calculate day compliance based on meal ratings
  const getDayStatus = (day: number): '😊' | '😐' | '☹️' | '⚪' => {
    const daySlots = slots.filter(s => s.day === day)
    const goodMeals = daySlots.filter(s => s.rating === 'good').length
    const badMeals = daySlots.filter(s => s.rating === 'bad').length
    const totalMeals = daySlots.length

    // All meals rated good = happy
    if (goodMeals === totalMeals && totalMeals > 0) return '😊'
    // Any bad meals = sad
    if (badMeals > 0) return '☹️'
    // Some good, but not all = neutral
    if (goodMeals > 0) return '😐'
    // No ratings yet = empty
    return '⚪'
  }

  const copyToTomorrow = (currentSlot: Slot) => {
    const nextDay = (currentSlot.day + 1) % 7
    const targetSlot = getSlot(nextDay, currentSlot.slot)

    if (targetSlot) {
      onUpdate(targetSlot.id, {
        protein: currentSlot.protein,
        veggie: currentSlot.veggie,
        carb_or_fat: currentSlot.carb_or_fat,
        state: 'planned',
      })
    }
  }

  const randomizeSlots = () => {
    slots.forEach(slot => {
      // Skip locked slots or slots with content
      if (lockedSlots.has(slot.id)) return
      if (slot.protein || slot.veggie || slot.carb_or_fat || slot.text) return

      // Randomly select ingredients
      const randomProtein = proteins.length > 0 ? proteins[Math.floor(Math.random() * proteins.length)].name : ''
      const randomVeggie = veggies.length > 0 ? veggies[Math.floor(Math.random() * veggies.length)].name : ''

      // Use carbs for breakfast/lunch (slot 0,1), fats for dinner (slot 2)
      const isDinner = slot.slot === 2
      const thirdOptions = isDinner ? fats : carbs
      const randomThird = thirdOptions.length > 0 ? thirdOptions[Math.floor(Math.random() * thirdOptions.length)].name : ''

      onUpdate(slot.id, {
        protein: randomProtein,
        veggie: randomVeggie,
        carb_or_fat: randomThird,
        state: 'planned'
      })
    })
  }

  const toggleLock = (slotId: number) => {
    setLockedSlots(prev => {
      const newLocks = new Set(prev)
      if (newLocks.has(slotId)) {
        newLocks.delete(slotId)
      } else {
        newLocks.add(slotId)
      }
      return newLocks
    })
  }

  const handleDragStart = (slot: Slot) => {
    setDraggedSlot(slot)
  }

  const handleDragEnd = () => {
    setDraggedSlot(null)
  }

  const handleDrop = (targetSlot: Slot) => {
    if (!draggedSlot || draggedSlot.id === targetSlot.id) {
      setDraggedSlot(null)
      return
    }

    // Show modal to choose move or copy
    setTargetSlotId(targetSlot.id)
    setShowDropModal(true)
  }

  const executeDrop = (action: 'move' | 'copy') => {
    if (!draggedSlot || !targetSlotId) return

    const targetSlot = slots.find(s => s.id === targetSlotId)
    if (!targetSlot) return

    // Copy meal data to target
    onUpdate(targetSlotId, {
      protein: draggedSlot.protein,
      veggie: draggedSlot.veggie,
      carb_or_fat: draggedSlot.carb_or_fat,
      text: draggedSlot.text,
      meal_type: draggedSlot.meal_type,
      state: 'planned'
    })

    // If move, clear the source
    if (action === 'move') {
      onUpdate(draggedSlot.id, {
        protein: '',
        veggie: '',
        carb_or_fat: '',
        text: '',
        meal_type: 'regular',
        state: 'planned',
        rating: ''
      })
    }

    // Reset state
    setShowDropModal(false)
    setTargetSlotId(null)
    setDraggedSlot(null)
  }

  return (
    <>
      {showMealGenerator && (
        <Suspense fallback={null}>
          <MealGenerator
            onClose={() => setShowMealGenerator(false)}
            slots={slots}
            onUpdate={onUpdate}
          />
        </Suspense>
      )}

      {/* Drop Action Modal */}
      {showDropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-2xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-3">
              Move or Copy?
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
              Do you want to move this meal or copy it?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => executeDrop('copy')}
                className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors"
              >
                📋 Copy
              </button>
              <button
                onClick={() => executeDrop('move')}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                ➡️ Move
              </button>
            </div>
            <button
              onClick={() => {
                setShowDropModal(false)
                setTargetSlotId(null)
                setDraggedSlot(null)
              }}
              className="w-full mt-3 px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Desktop: Grid Layout */}
      <div className="hidden lg:block bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="flex border-b border-stone-200 dark:border-stone-700 bg-stone-900">
          <div className="w-24 flex-shrink-0" />
          {DAYS.map((day, idx) => (
            <div key={day} className="flex-1 min-w-[140px] p-3 text-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-white text-xs font-bold tracking-widest">{day}</span>
                <div className="text-2xl" title="Auto-calculated from meal ratings">
                  {getDayStatus(idx)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {SLOTS.map((slotName, slotIdx) => (
          <div key={slotName} className="flex border-b border-stone-200 dark:border-stone-700 last:border-b-0">
            <div className="w-24 flex-shrink-0 bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-700 p-3 flex items-start">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
                {slotName}
              </span>
            </div>
            <div className="flex-1 flex">
              {DAYS.map((_, dayIdx) => {
                const slot = getSlot(dayIdx, slotIdx)
                return (
                  <div
                    key={dayIdx}
                    className="flex-1 min-w-[140px] border-r border-stone-200 dark:border-stone-700 last:border-r-0"
                  >
                    {slot && (
                      <MealCell
                        slot={slot}
                        onUpdate={(patch) => onUpdate(slot.id, patch)}
                        isPending={pendingSlotIds.has(slot.id)}
                        onCopyToTomorrow={() => copyToTomorrow(slot)}
                        showLock={showRandomizer}
                        isLocked={lockedSlots.has(slot.id)}
                        onToggleLock={() => toggleLock(slot.id)}
                        onDragStart={() => handleDragStart(slot)}
                        onDragEnd={handleDragEnd}
                        onDrop={() => handleDrop(slot)}
                        isDragging={draggedSlot?.id === slot.id}
                        isDropTarget={false}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile/Tablet: Card Layout */}
      <div className="lg:hidden flex flex-col gap-4">
        {DAYS.map((day, dayIdx) => (
          <div
            key={day}
            className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden"
          >
            {/* Day Header */}
            <div className="bg-stone-900 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-bold tracking-wide">{DAYS_FULL[dayIdx]}</span>
                <span className="text-2xl">{getDayStatus(dayIdx)}</span>
              </div>
            </div>

            {/* Meals for this day */}
            <div className="divide-y divide-stone-200 dark:divide-stone-700">
              {SLOTS.map((slotName, slotIdx) => {
                const slot = getSlot(dayIdx, slotIdx)
                return (
                  <div key={slotName} className="flex flex-col sm:flex-row">
                    <div className="sm:w-32 flex-shrink-0 bg-stone-50 dark:bg-stone-900 px-4 py-3 flex items-center sm:border-r border-stone-200 dark:border-stone-700">
                      <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
                        {slotName}
                      </span>
                    </div>
                    <div className="flex-1">
                      {slot && (
                        <MealCell
                          slot={slot}
                          onUpdate={(patch) => onUpdate(slot.id, patch)}
                          isPending={pendingSlotIds.has(slot.id)}
                          onCopyToTomorrow={dayIdx < 6 ? () => copyToTomorrow(slot) : undefined}
                          showLock={showRandomizer}
                          isLocked={lockedSlots.has(slot.id)}
                          onToggleLock={() => toggleLock(slot.id)}
                          onDragStart={() => handleDragStart(slot)}
                          onDragEnd={handleDragEnd}
                          onDrop={() => handleDrop(slot)}
                          isDragging={draggedSlot?.id === slot.id}
                          isDropTarget={false}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Meal Tools Section */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        {/* Randomize Button */}
        <button
          onClick={() => setShowRandomizer(!showRandomizer)}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow hover:shadow-md ${
            showRandomizer
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          🎲 {showRandomizer ? 'Cancel Randomize' : 'Randomize Empty Meals'}
        </button>

        {showRandomizer && (
          <button
            onClick={randomizeSlots}
            className="flex-1 sm:flex-none px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all shadow hover:shadow-md"
          >
            ✨ Fill Unlocked Meals
          </button>
        )}

        {/* AI Meal Generator Button */}
        <button
          onClick={() => setShowMealGenerator(true)}
          className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 group-hover:scale-110 transition-transform"
          >
            <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
          </svg>
          <span className="text-base">{t('mealGenerator.openGenerator')}</span>
        </button>
      </div>
    </>
  )
}
