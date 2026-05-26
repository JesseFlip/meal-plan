import { MealCell } from './MealCell'
import type { Slot } from '../hooks/usePlanSync'
import type { MealHistoryItem } from '../hooks/useMealHistory'
import { useCompliance } from '../hooks/useCompliance'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const SLOTS = ['Breakfast', 'Lunch', 'Dinner']

type Props = {
  slots: Slot[]
  onUpdate: (id: number, patch: Partial<Slot>) => void
  pendingSlotIds: Set<number>
  mealHistory: MealHistoryItem[]
}

export function PlanGrid({ slots, onUpdate, pendingSlotIds, mealHistory }: Props) {
  const { compliance, toggleDay } = useCompliance()
  const getSlot = (day: number, slot: number) =>
    slots.find(s => s.day === day && s.slot === slot)

  const isCompliant = (day: number) =>
    compliance.find(c => c.day === day)?.compliant || false

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-x-auto">
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
                        mealHistory={mealHistory}
                      />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
