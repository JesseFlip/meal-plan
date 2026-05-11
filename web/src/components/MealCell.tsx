import { useState, useEffect } from 'react'
import type { Slot } from '../hooks/usePlanSync'

type Props = {
  slot: Slot
  onUpdate: (patch: Partial<Slot>) => void
  isPending: boolean
}

export function MealCell({ slot, onUpdate, isPending }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(slot.text)

  // Keep local state in sync if server pushes an update while not editing
  useEffect(() => {
    if (!editing) setText(slot.text)
  }, [slot.text, editing])

  const save = () => {
    setEditing(false)
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
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        className="w-full min-h-[88px] sm:min-h-[100px] p-3 text-sm bg-amber-50 outline-none resize-none border-2 border-amber-400 rounded-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            save()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
      />
    )
  }

  const fasting = slot.state === 'fasting'

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
