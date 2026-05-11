import { MealCell } from './MealCell'
import type { Slot } from '../hooks/usePlanSync'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const SLOTS = ['Breakfast', 'Lunch', 'Dinner']

type Props = {
  slots: Slot[]
  onUpdate: (id: number, patch: Partial<Slot>) => void
  pendingSlotIds: Set<number>
}

export function PlanGrid({ slots, onUpdate, pendingSlotIds }: Props) {
  const getSlot = (day: number, slot: number) =>
    slots.find(s => s.day === day && s.slot === slot)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="bg-stone-900 text-stone-400 p-3 text-xs font-medium w-24 sm:w-28"></th>
            {DAYS.map(d => (
              <th
                key={d}
                className="bg-stone-900 text-white p-3 text-xs font-bold tracking-widest text-center min-w-[120px] sm:min-w-[140px]"
              >
                {d}
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
    </div>
  )
}
