import { useState } from 'react'
import { MealCell } from './MealCell'
import { MealGenerator } from './MealGenerator'
import type { Slot } from '../hooks/usePlanSync'
import { useCompliance } from '../hooks/useCompliance'
import { useTranslation } from '../hooks/useTranslation'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const SLOTS = ['Breakfast', 'Lunch', 'Dinner']

type Props = {
  slots: Slot[]
  onUpdate: (id: number, patch: Partial<Slot>) => void
  pendingSlotIds: Set<number>
}

export function PlanGrid({ slots, onUpdate, pendingSlotIds }: Props) {
  const { t } = useTranslation()
  const { compliance, toggleDay } = useCompliance()
  const [showMealGenerator, setShowMealGenerator] = useState(false)

  const getSlot = (day: number, slot: number) =>
    slots.find(s => s.day === day && s.slot === slot)

  const isCompliant = (day: number) =>
    compliance.find(c => c.day === day)?.compliant || false

  return (
    <>
      {showMealGenerator && (
        <MealGenerator
          onClose={() => setShowMealGenerator(false)}
          slots={slots}
          onUpdate={onUpdate}
        />
      )}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-stone-900 text-stone-400 p-3 text-xs font-medium w-24 sm:w-28"></th>
              {DAYS.map((d, idx) => (
                <th
                  key={d}
                  className="bg-stone-900 text-white p-3 text-xs font-bold tracking-widest text-center min-w-[120px] sm:min-w-[140px]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span>{d}</span>
                    <button
                      onClick={() => toggleDay(idx)}
                      className="text-2xl hover:scale-110 transition-transform"
                      title={isCompliant(idx) ? "Ate as planned! Click to unmark" : "Click to mark as compliant"}
                    >
                      {isCompliant(idx) ? '😊' : '⚪'}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slotName, slotIdx) => (
              <tr key={slotName}>
                <th className="bg-stone-50 border-r border-stone-200 p-3 text-xs font-semibold text-stone-600 text-left uppercase tracking-wide align-top">
                  {slotName}
                </th>
                {DAYS.map((_, dayIdx) => {
                  const slot = getSlot(dayIdx, slotIdx)
                  return (
                    <td
                      key={dayIdx}
                      className="border border-stone-200 p-0 align-top"
                    >
                      {slot && (
                        <MealCell
                          slot={slot}
                          onUpdate={(patch) => onUpdate(slot.id, patch)}
                          isPending={pendingSlotIds.has(slot.id)}
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* AI Meal Generator Button */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
          <button
            onClick={() => setShowMealGenerator(true)}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
            {t('mealGenerator.openGenerator')}
          </button>
        </div>
      </div>
    </>
  )
}
